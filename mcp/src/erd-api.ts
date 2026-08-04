/**
 * Thin PAT client for Public API v1 (`/api/v1/**`).
 * Env: ERD_API_URL (default http://127.0.0.1:9502), ERD_PAT (required).
 */

export type ErdApiConfig = {
  baseUrl: string;
  pat: string;
};

export class ErdApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body?: unknown,
  ) {
    super(message);
    this.name = 'ErdApiError';
  }
}

type ApiEnvelope<T> = {
  code?: number;
  msg?: string;
  data?: T;
};

export function loadConfigFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): ErdApiConfig {
  const baseUrl = (env.ERD_API_URL ?? 'http://127.0.0.1:9502').replace(
    /\/+$/,
    '',
  );
  const pat = env.ERD_PAT ?? env.ERD_API_TOKEN ?? '';
  if (!pat) {
    throw new Error(
      'Missing ERD_PAT (or ERD_API_TOKEN). Mint via POST /auth/personal-access-tokens',
    );
  }
  if (!pat.startsWith('erd_pat_')) {
    throw new Error('ERD_PAT must start with erd_pat_ (session JWT is not accepted on /api/v1)');
  }
  return { baseUrl, pat };
}

export class ErdApiClient {
  constructor(private readonly config: ErdApiConfig) {}

  async me(): Promise<unknown> {
    return this.get('/api/v1/me');
  }

  async listProjects(page = 1, size = 20): Promise<unknown> {
    const q = new URLSearchParams({
      page: String(page),
      size: String(size),
    });
    return this.get(`/api/v1/projects?${q}`);
  }

  async getProject(projectId: string): Promise<unknown> {
    return this.get(`/api/v1/projects/${encodeURIComponent(projectId)}`);
  }

  async listVersions(
    projectId: string,
    opts: { page?: number; size?: number; dbKey?: string } = {},
  ): Promise<unknown> {
    const q = new URLSearchParams({
      page: String(opts.page ?? 1),
      size: String(opts.size ?? 20),
    });
    if (opts.dbKey) {
      q.set('dbKey', opts.dbKey);
    }
    return this.get(
      `/api/v1/projects/${encodeURIComponent(projectId)}/versions?${q}`,
    );
  }

  async getVersion(projectId: string, versionId: string): Promise<unknown> {
    return this.get(
      `/api/v1/projects/${encodeURIComponent(projectId)}/versions/${encodeURIComponent(versionId)}`,
    );
  }

  private async get(path: string): Promise<unknown> {
    const url = `${this.config.baseUrl}${path}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.config.pat}`,
        Accept: 'application/json',
      },
    });
    const text = await res.text();
    let json: unknown;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      throw new ErdApiError(
        `Non-JSON response HTTP ${res.status}`,
        res.status,
        text.slice(0, 500),
      );
    }
    if (!res.ok) {
      const msg =
        (json as ApiEnvelope<unknown>)?.msg ??
        `HTTP ${res.status} ${res.statusText}`;
      throw new ErdApiError(String(msg), res.status, json);
    }
    const env = json as ApiEnvelope<unknown>;
    if (typeof env?.code === 'number' && env.code !== 200) {
      throw new ErdApiError(env.msg ?? `API code ${env.code}`, env.code, json);
    }
    return env?.data !== undefined ? env.data : json;
  }
}

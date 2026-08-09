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

export type CreateVersionInput = {
  dbKey: string;
  version: string;
  versionDesc: string;
  projectJSON: Record<string, unknown>;
  tag?: string;
  versionDate?: string;
  baseVersion?: boolean;
  changes?: unknown[];
};

export type UpdateProjectInput = {
  projectName?: string;
  name?: string;
  description?: string;
  tags?: string;
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

  /** Requires PAT scope versions:write + project membership. */
  async createVersion(
    projectId: string,
    body: CreateVersionInput,
  ): Promise<unknown> {
    return this.post(
      `/api/v1/projects/${encodeURIComponent(projectId)}/versions`,
      body,
    );
  }

  /** Requires PAT scope projects:write + project membership. */
  async updateProject(
    projectId: string,
    body: UpdateProjectInput,
  ): Promise<unknown> {
    return this.patch(
      `/api/v1/projects/${encodeURIComponent(projectId)}`,
      body,
    );
  }

  /** Requires PAT scope projects:write + project membership. */
  async putProjectJson(
    projectId: string,
    projectJSON: Record<string, unknown>,
  ): Promise<unknown> {
    return this.put(
      `/api/v1/projects/${encodeURIComponent(projectId)}/projectJSON`,
      { projectJSON },
    );
  }

  async listCatalogTemplates(
    opts: { q?: string; tag?: string; sort?: string; page?: number; size?: number } = {},
  ): Promise<unknown> {
    const q = new URLSearchParams({
      page: String(opts.page ?? 1),
      size: String(opts.size ?? 20),
    });
    if (opts.q) q.set('q', opts.q);
    if (opts.tag) q.set('tag', opts.tag);
    if (opts.sort) q.set('sort', opts.sort);
    return this.get(`/api/v1/catalog/templates?${q}`);
  }

  async getCatalogTemplate(templateId: string): Promise<unknown> {
    return this.get(`/api/v1/catalog/templates/${encodeURIComponent(templateId)}`);
  }

  async installCatalogTemplate(templateId: string): Promise<unknown> {
    return this.post(
      `/api/v1/catalog/templates/${encodeURIComponent(templateId)}/install`,
      {},
    );
  }

  async getCatalogCreator(handle: string): Promise<unknown> {
    return this.get(`/api/v1/catalog/creators/${encodeURIComponent(handle)}`);
  }

  private async get(path: string): Promise<unknown> {
    return this.request('GET', path);
  }

  private async post(path: string, body: unknown): Promise<unknown> {
    return this.request('POST', path, body);
  }

  private async put(path: string, body: unknown): Promise<unknown> {
    return this.request('PUT', path, body);
  }

  private async patch(path: string, body: unknown): Promise<unknown> {
    return this.request('PATCH', path, body);
  }

  private async request(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<unknown> {
    const url = `${this.config.baseUrl}${path}`;
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.config.pat}`,
      Accept: 'application/json',
    };
    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }
    const res = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
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
      const env = json as ApiEnvelope<unknown>;
      const code =
        typeof env?.code === 'number' && env.code !== 0 ? env.code : res.status;
      const msg = env?.msg ?? `HTTP ${res.status} ${res.statusText}`;
      throw new ErdApiError(String(msg), code, json);
    }
    const env = json as ApiEnvelope<unknown>;
    if (typeof env?.code === 'number' && env.code !== 200) {
      throw new ErdApiError(env.msg ?? `API code ${env.code}`, env.code, json);
    }
    return env?.data !== undefined ? env.data : json;
  }
}

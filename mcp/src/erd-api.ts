/**
 * Thin PAT client for Public API v1 (`/api/v1/**`).
 * Env: ERD_API_URL (default http://127.0.0.1:9502), ERD_PAT (required for API tools;
 * empty PAT still boots so Glama/tools/list introspection can run).
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

/** Shown on tools/call when boot succeeded without a usable PAT. */
export const MISSING_PAT_MESSAGE =
  'Missing ERD_PAT. Mint a personal access token in ERD Online (Account settings → Personal access tokens: https://www.erdonline.com/account/settings?selectKey=personalAccessTokens), then set env ERD_PAT in mcp.json. The Cursor install-link uses placeholder erd_pat_… — that is not a token; never put a live PAT in a URL. Guide: https://doc.erdonline.com/docs/guide/api-and-mcp/';

export function isUnusablePat(pat: string | undefined): boolean {
  const t = (pat ?? '').trim();
  if (!t) return true;
  if (t === 'erd_pat_…' || t === 'erd_pat_...') return true;
  if (/^erd_pat_[.…]+$/.test(t)) return true;
  return false;
}

export const EMPTY_PROJECTS_HINT =
  'No projects yet. Create one in the ERD Online designer (https://www.erdonline.com/) — the official Demo share is not a PAT. Then ask list_projects and get_project_schema. Do not generate an ER diagram from a sentence. Guide: https://doc.erdonline.com/docs/guide/api-and-mcp/';

export const REJECTED_PAT_HINT =
  'Remint at https://www.erdonline.com/account/settings?selectKey=personalAccessTokens (Demo share is not a PAT). Guide: https://doc.erdonline.com/docs/guide/api-and-mcp/';

/** Public list uses `items`; tolerate `records` if a proxy rewrites the page. */
export function attachEmptyProjectsHint(data: unknown): unknown {
  if (!data || typeof data !== 'object') return data;
  const o = data as { items?: unknown; records?: unknown; total?: number };
  const list = Array.isArray(o.items)
    ? o.items
    : Array.isArray(o.records)
      ? o.records
      : undefined;
  const empty =
    (list !== undefined && list.length === 0) ||
    (list === undefined && o.total === 0);
  if (!empty) return data;
  return { ...o, hint: EMPTY_PROJECTS_HINT };
}

export const CREATE_VERSION_HUMAN_HINT =
  'Ask the human to open this version in the ERD Online designer, read the diff, and confirm or roll back. API success is not human approval. Do not call put_project_json. Do not generate a new ER diagram.';

export function attachCreateVersionHint(data: unknown): unknown {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { result: data, hint: CREATE_VERSION_HUMAN_HINT };
  }
  return { ...(data as Record<string, unknown>), hint: CREATE_VERSION_HUMAN_HINT };
}

export function loadConfigFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): ErdApiConfig {
  const baseUrl = (env.ERD_API_URL ?? 'http://127.0.0.1:9502').replace(
    /\/+$/,
    '',
  );
  const pat = env.ERD_PAT ?? env.ERD_API_TOKEN ?? '';
  if (pat && !pat.startsWith('erd_pat_')) {
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
    if (isUnusablePat(this.config.pat)) {
      throw new ErdApiError(MISSING_PAT_MESSAGE, 401);
    }
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
      const unauthorized = res.status === 401 || res.status === 403 || code === 401 || code === 403;
      throw new ErdApiError(
        unauthorized ? `${msg}. ${REJECTED_PAT_HINT}` : String(msg),
        code,
        json,
      );
    }
    const env = json as ApiEnvelope<unknown>;
    if (typeof env?.code === 'number' && env.code !== 200) {
      throw new ErdApiError(env.msg ?? `API code ${env.code}`, env.code, json);
    }
    return env?.data !== undefined ? env.data : json;
  }
}

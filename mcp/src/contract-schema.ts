/**
 * Contract reads over an approved projectJSON snapshot (no live DB, no SQL).
 * Progressive disclosure: list tables first, describe one table on demand.
 * Shape reference: docs/data-format.md (modules[].entities[] / associations[]).
 */

export type ContractEntity = {
  title?: string;
  name?: string;
  chnname?: string;
  remark?: string;
  fields?: ContractField[];
};

export type ContractField = {
  name?: string;
  chnname?: string;
  type?: string;
  typeName?: string;
  dataType?: string;
  remark?: string;
  pk?: boolean;
  notNull?: boolean;
  autoIncrement?: boolean;
  defaultValue?: string;
};

export type ContractAssociation = {
  relation?: string;
  from?: { entity?: string; field?: string };
  to?: { entity?: string; field?: string };
  constraintName?: string;
  deleteRule?: string;
  updateRule?: string;
};

type ContractModule = {
  name?: string;
  chnname?: string;
  entities?: ContractEntity[];
  associations?: ContractAssociation[];
};

/** API views serialize as `projectJson`; older clients used `projectJSON`. */
export function extractProjectJson(
  detail: unknown,
): Record<string, unknown> | undefined {
  if (!detail || typeof detail !== 'object') return undefined;
  const d = detail as Record<string, unknown>;
  const pj = d.projectJSON ?? d.projectJson;
  if (pj && typeof pj === 'object' && !Array.isArray(pj)) {
    return pj as Record<string, unknown>;
  }
  return undefined;
}

function modulesOf(projectJSON: Record<string, unknown>): ContractModule[] {
  const mods = (projectJSON as { modules?: unknown }).modules;
  return Array.isArray(mods) ? (mods as ContractModule[]) : [];
}

function entityKey(e: ContractEntity): string {
  return String(e.title ?? e.name ?? '');
}

export type TableSummary = {
  module: string;
  moduleName?: string;
  title: string;
  chnname?: string;
  fieldCount: number;
};

export function listContractTables(
  projectJSON: Record<string, unknown>,
): TableSummary[] {
  const out: TableSummary[] = [];
  for (const m of modulesOf(projectJSON)) {
    for (const e of m.entities ?? []) {
      const title = entityKey(e);
      if (!title) continue;
      out.push({
        module: String(m.name ?? ''),
        moduleName: m.chnname ? String(m.chnname) : undefined,
        title,
        chnname: e.chnname ? String(e.chnname) : undefined,
        fieldCount: Array.isArray(e.fields) ? e.fields.length : 0,
      });
    }
  }
  return out;
}

function summarizeField(f: ContractField) {
  return {
    name: String(f.name ?? ''),
    chnname: f.chnname ? String(f.chnname) : undefined,
    dataType: f.dataType ?? f.typeName ?? f.type ?? undefined,
    pk: f.pk === true ? true : undefined,
    notNull: f.notNull === true ? true : undefined,
    defaultValue: f.defaultValue ?? undefined,
    remark: f.remark ? String(f.remark) : undefined,
  };
}

function summarizeAssociation(a: ContractAssociation) {
  return {
    relation: a.relation ?? undefined,
    fromEntity: a.from?.entity ?? undefined,
    fromField: a.from?.field ?? undefined,
    toEntity: a.to?.entity ?? undefined,
    toField: a.to?.field ?? undefined,
    constraintName: a.constraintName ?? undefined,
    deleteRule: a.deleteRule ?? undefined,
    updateRule: a.updateRule ?? undefined,
  };
}

function suggestTables(
  projectJSON: Record<string, unknown>,
  query: string,
  limit = 5,
): string[] {
  const q = query.trim().toLowerCase();
  const all = listContractTables(projectJSON);
  if (!q) return all.slice(0, limit).map((t) => t.title);
  const tokens = q.split(/[^a-z0-9]+/).filter((t) => t.length >= 2);
  const scored = all
    .map((t) => {
      const title = t.title.toLowerCase();
      const chn = (t.chnname ?? '').toLowerCase();
      let score = -1;
      if (title === q || chn === q) score = 4;
      else if (title.startsWith(q)) score = 3;
      else if (title.includes(q) || chn.includes(q)) score = 2;
      else if (tokens.some((tok) => title.includes(tok))) score = 1;
      return { title: t.title, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
  return scored.slice(0, limit).map((s) => s.title);
}

export type DescribeTableResult =
  | {
      found: true;
      module: string;
      title: string;
      chnname?: string;
      remark?: string;
      fields: ReturnType<typeof summarizeField>[];
      foreignKeys: {
        outbound: ReturnType<typeof summarizeAssociation>[];
        inbound: ReturnType<typeof summarizeAssociation>[];
      };
    }
  | { found: false; query: string; suggestions: string[] };

/**
 * Exact (case-insensitive) match on entity title/name; otherwise
 * `found:false` + suggestions so the agent corrects itself instead of
 * inventing columns.
 */
export function describeContractTable(
  projectJSON: Record<string, unknown>,
  table: string,
): DescribeTableResult {
  const q = table.trim().toLowerCase();
  for (const m of modulesOf(projectJSON)) {
    const entities = m.entities ?? [];
    const hit = entities.find((e) => entityKey(e).toLowerCase() === q);
    if (!hit) continue;
    const title = entityKey(hit);
    const associations = m.associations ?? [];
    const outbound = associations
      .filter((a) => (a.from?.entity ?? '').toLowerCase() === q)
      .map(summarizeAssociation);
    const inbound = associations
      .filter((a) => (a.to?.entity ?? '').toLowerCase() === q)
      .map(summarizeAssociation);
    return {
      found: true,
      module: String(m.name ?? ''),
      title,
      chnname: hit.chnname ? String(hit.chnname) : undefined,
      remark: hit.remark ? String(hit.remark) : undefined,
      fields: (hit.fields ?? []).map(summarizeField),
      foreignKeys: { outbound, inbound },
    };
  }
  return {
    found: false,
    query: table,
    suggestions: suggestTables(projectJSON, table),
  };
}

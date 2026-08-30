import {
  extractProjectJson,
  type ContractEntity,
  type ContractField,
} from './contract-schema.js';

type VersionDetail = Record<string, unknown>;

type ModuleLike = {
  entities?: ContractEntity[];
};

type DiffValue = string | number | boolean | null;

type PropertyChange = {
  property: string;
  from: DiffValue;
  to: DiffValue;
};

type RenameCandidate = {
  from: string;
  to: string;
  confidence: 'high' | 'medium';
  reason: string;
};

type ColumnSummary = {
  name: string;
  type?: string;
  comment?: string;
};

type TableSummary = {
  name: string;
  comment?: string;
};

const FIELD_PROPERTIES = [
  'chnname',
  'remark',
  'type',
  'typeName',
  'dataType',
  'pk',
  'notNull',
  'autoIncrement',
  'defaultValue',
] as const;

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function modulesOf(projectJSON: Record<string, unknown>): ModuleLike[] {
  const modules = projectJSON.modules;
  return Array.isArray(modules) ? (modules as ModuleLike[]) : [];
}

function entityName(entity: ContractEntity): string {
  return String(entity.title ?? entity.name ?? '').trim();
}

function entitiesOf(projectJSON: Record<string, unknown>): ContractEntity[] {
  return modulesOf(projectJSON).flatMap((module) => module.entities ?? []);
}

function tableSummary(entity: ContractEntity): TableSummary {
  const comment = String(entity.remark ?? entity.chnname ?? '').trim();
  return {
    name: entityName(entity),
    ...(comment ? { comment } : {}),
  };
}

function fieldType(field: ContractField): string | undefined {
  const value = field.dataType ?? field.typeName ?? field.type;
  const normalized = value == null ? '' : String(value).trim();
  return normalized || undefined;
}

function columnSummary(field: ContractField): ColumnSummary {
  const comment = String(field.remark ?? field.chnname ?? '').trim();
  return {
    name: String(field.name ?? '').trim(),
    ...(fieldType(field) ? { type: fieldType(field) } : {}),
    ...(comment ? { comment } : {}),
  };
}

function comparable(value: unknown): DiffValue {
  if (
    typeof value === 'string'
    || typeof value === 'number'
    || typeof value === 'boolean'
    || value === null
  ) {
    return value;
  }
  return value === undefined ? null : JSON.stringify(value);
}

function fieldFingerprint(field: ContractField): string {
  return JSON.stringify({
    type: fieldType(field) ?? '',
    pk: field.pk === true,
    notNull: field.notNull === true,
    autoIncrement: field.autoIncrement === true,
    defaultValue: field.defaultValue ?? null,
  });
}

function tableFingerprint(entity: ContractEntity): string {
  return JSON.stringify(
    (entity.fields ?? [])
      .filter((field) => field.name)
      .map((field) => ({
        name: String(field.name).toLowerCase(),
        shape: fieldFingerprint(field),
      }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  );
}

function pairUniqueFingerprints<T>(
  removed: T[],
  added: T[],
  nameOf: (item: T) => string,
  fingerprintOf: (item: T) => string,
  reason: string,
): RenameCandidate[] {
  const candidates: RenameCandidate[] = [];
  for (const before of removed) {
    const fingerprint = fingerprintOf(before);
    const matchingAfter = added.filter(
      (after) => fingerprintOf(after) === fingerprint,
    );
    const matchingBefore = removed.filter(
      (item) => fingerprintOf(item) === fingerprint,
    );
    if (matchingAfter.length === 1 && matchingBefore.length === 1) {
      candidates.push({
        from: nameOf(before),
        to: nameOf(matchingAfter[0]),
        confidence: 'high',
        reason,
      });
    }
  }
  return candidates;
}

function versionIdentity(detail: VersionDetail, requestedId: string) {
  return {
    id: String(detail.id ?? requestedId),
    label: detail.version == null ? undefined : String(detail.version),
  };
}

/**
 * Semantic, review-oriented diff. Rename results are candidates because
 * projectJSON has no stable table/column ids across renames.
 */
export function diffVersionDetails(
  fromDetail: unknown,
  toDetail: unknown,
  fromVersionId: string,
  toVersionId: string,
) {
  const from = asObject(fromDetail);
  const to = asObject(toDetail);
  const fromJSON = extractProjectJson(from);
  const toJSON = extractProjectJson(to);
  if (!fromJSON || !toJSON) {
    throw new Error('Both version responses must contain projectJSON snapshots');
  }

  const beforeEntities = entitiesOf(fromJSON).filter(entityName);
  const afterEntities = entitiesOf(toJSON).filter(entityName);
  const beforeByName = new Map(beforeEntities.map((entity) => [entityName(entity), entity]));
  const afterByName = new Map(afterEntities.map((entity) => [entityName(entity), entity]));
  const removedTables = beforeEntities.filter((entity) => !afterByName.has(entityName(entity)));
  const addedTables = afterEntities.filter((entity) => !beforeByName.has(entityName(entity)));
  const tableRenameCandidates = pairUniqueFingerprints(
    removedTables,
    addedTables,
    entityName,
    tableFingerprint,
    'identical column names and structural shapes',
  );

  const changed = [];
  for (const [tableName, beforeTable] of beforeByName) {
    const afterTable = afterByName.get(tableName);
    if (!afterTable) continue;
    const beforeFields = (beforeTable.fields ?? []).filter((field) => field.name);
    const afterFields = (afterTable.fields ?? []).filter((field) => field.name);
    const beforeFieldsByName = new Map(
      beforeFields.map((field) => [String(field.name), field]),
    );
    const afterFieldsByName = new Map(
      afterFields.map((field) => [String(field.name), field]),
    );
    const removedFields = beforeFields.filter(
      (field) => !afterFieldsByName.has(String(field.name)),
    );
    const addedFields = afterFields.filter(
      (field) => !beforeFieldsByName.has(String(field.name)),
    );
    const modified = [];
    for (const [fieldName, beforeField] of beforeFieldsByName) {
      const afterField = afterFieldsByName.get(fieldName);
      if (!afterField) continue;
      const changes: PropertyChange[] = [];
      for (const property of FIELD_PROPERTIES) {
        if (
          JSON.stringify(beforeField[property] ?? null)
          !== JSON.stringify(afterField[property] ?? null)
        ) {
          changes.push({
            property,
            from: comparable(beforeField[property]),
            to: comparable(afterField[property]),
          });
        }
      }
      if (changes.length > 0) modified.push({ name: fieldName, changes });
    }
    const metadataChanges: PropertyChange[] = [];
    for (const property of ['chnname', 'remark'] as const) {
      if (
        JSON.stringify(beforeTable[property] ?? null)
        !== JSON.stringify(afterTable[property] ?? null)
      ) {
        metadataChanges.push({
          property,
          from: comparable(beforeTable[property]),
          to: comparable(afterTable[property]),
        });
      }
    }
    const renameCandidates = pairUniqueFingerprints(
      removedFields,
      addedFields,
      (field) => String(field.name),
      fieldFingerprint,
      'identical type, key, nullability, auto-increment, and default shape',
    );
    if (
      removedFields.length
      || addedFields.length
      || modified.length
      || metadataChanges.length
    ) {
      changed.push({
        table: tableName,
        columns: {
          added: addedFields.map(columnSummary),
          removed: removedFields.map(columnSummary),
          renameCandidates,
          modified,
        },
        metadataChanges,
      });
    }
  }

  const addedColumnCount = changed.reduce(
    (total, table) => total + table.columns.added.length,
    0,
  );
  const removedColumnCount = changed.reduce(
    (total, table) => total + table.columns.removed.length,
    0,
  );
  const modifiedColumnCount = changed.reduce(
    (total, table) => total + table.columns.modified.length,
    0,
  );

  return {
    fromVersion: versionIdentity(from, fromVersionId),
    toVersion: versionIdentity(to, toVersionId),
    summary: {
      tablesAdded: addedTables.length,
      tablesRemoved: removedTables.length,
      tablesChanged: changed.length,
      columnsAdded: addedColumnCount,
      columnsRemoved: removedColumnCount,
      columnsModified: modifiedColumnCount,
    },
    tables: {
      added: addedTables.map(tableSummary),
      removed: removedTables.map(tableSummary),
      renameCandidates: tableRenameCandidates,
      changed,
    },
    note:
      'renameCandidates are structural hints for human review, not confirmed renames. API success is not approval.',
  };
}

type DraftDialect = 'mysql' | 'postgresql' | 'sqlserver' | 'oracle';

function quoteIdentifier(identifier: string, dialect: DraftDialect): string {
  if (dialect === 'mysql') return `\`${identifier.replace(/`/g, '``')}\``;
  if (dialect === 'sqlserver') return `[${identifier.replace(/]/g, ']]')}]`;
  return `"${identifier.replace(/"/g, '""')}"`;
}

function fallbackType(dialect: DraftDialect): string {
  return dialect === 'oracle' ? 'VARCHAR2(255)' : 'VARCHAR(255)';
}

function renderColumn(field: ContractField, dialect: DraftDialect): string {
  const name = String(field.name ?? '').trim();
  const parts = [
    quoteIdentifier(name, dialect),
    fieldType(field) ?? fallbackType(dialect),
  ];
  if (field.autoIncrement === true) {
    if (dialect === 'mysql') parts.push('AUTO_INCREMENT');
    if (dialect === 'postgresql') parts.push('GENERATED BY DEFAULT AS IDENTITY');
    if (dialect === 'sqlserver') parts.push('IDENTITY(1,1)');
    if (dialect === 'oracle') parts.push('GENERATED BY DEFAULT AS IDENTITY');
  }
  if (field.notNull === true || field.pk === true) parts.push('NOT NULL');
  if (field.defaultValue != null && String(field.defaultValue).trim()) {
    parts.push('DEFAULT', String(field.defaultValue).trim());
  }
  return parts.join(' ');
}

/**
 * Conservative CREATE TABLE preview from one immutable saved version.
 * It deliberately does not connect to a database or execute SQL.
 */
export function draftDdlFromVersion(
  detail: unknown,
  requestedVersionId: string,
  dialect: DraftDialect,
  requestedTable?: string,
) {
  const version = asObject(detail);
  const projectJSON = extractProjectJson(version);
  if (!projectJSON) {
    throw new Error('Version response must contain a projectJSON snapshot');
  }
  const versionLabel = String(version.version ?? '').trim();
  if (!versionLabel) {
    throw new Error('DDL drafts require a named saved version');
  }
  const allEntities = entitiesOf(projectJSON).filter(entityName);
  const entities = requestedTable
    ? allEntities.filter(
        (entity) => entityName(entity).toLowerCase() === requestedTable.toLowerCase(),
      )
    : allEntities;
  if (requestedTable && entities.length === 0) {
    throw new Error(`Table "${requestedTable}" is not present in this version`);
  }
  const statements = entities.map((entity) => {
    const fields = (entity.fields ?? []).filter((field) => field.name);
    const lines = fields.map((field) => `  ${renderColumn(field, dialect)}`);
    const primaryKeys = fields
      .filter((field) => field.pk === true)
      .map((field) => quoteIdentifier(String(field.name), dialect));
    if (primaryKeys.length) {
      lines.push(`  PRIMARY KEY (${primaryKeys.join(', ')})`);
    }
    return `CREATE TABLE ${quoteIdentifier(entityName(entity), dialect)} (\n${lines.join(',\n')}\n);`;
  });
  return {
    version: versionIdentity(version, requestedVersionId),
    source: 'saved-version-snapshot',
    dialect,
    previewOnly: true,
    executed: false,
    statementCount: statements.length,
    ddl: statements.join('\n\n'),
    warnings: [
      'Preview only: ERD Online MCP never connects to a database and never executes SQL.',
      'Review dialect-specific types, indexes, foreign keys, checks, and deployment safety before using this draft.',
      'A saved version is not proof of human approval; enforce approval in your merge workflow.',
    ],
  };
}

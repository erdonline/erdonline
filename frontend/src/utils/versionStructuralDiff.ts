/**
 * A 层全量 structural diff：工作区 projectJSON ↔ 版本基线（ADR-0022 切片 3）。
 * 覆盖 modules（entities/fields/indexes）、associations、diagrams、profile、dataTypeDomains。
 */

import _ from 'lodash';

export type VersionStructuralChange = {
  type: 'entity' | 'field' | 'index' | 'association' | 'diagram' | 'profile' | 'datatype' | 'module';
  name: string;
  opt: 'add' | 'delete' | 'update';
  changeData?: string;
};

export type ProjectJSONForDiff = {
  modules?: ModuleForDiff[];
  profile?: Record<string, unknown>;
  dataTypeDomains?: DataTypeDomainsForDiff;
};

type ModuleForDiff = {
  name?: string;
  chnname?: string;
  entities?: EntityForDiff[];
  associations?: AssociationForDiff[];
  diagrams?: DiagramForDiff[];
  graphCanvas?: { nodes?: unknown[]; edges?: unknown[] };
};

type EntityForDiff = {
  title?: string;
  fields?: FieldForDiff[];
  indexs?: IndexForDiff[];
  [key: string]: unknown;
};

type FieldForDiff = { name?: string; [key: string]: unknown };
type IndexForDiff = { name?: string; fields?: string[]; [key: string]: unknown };

type AssociationForDiff = {
  relation?: string;
  from?: { entity?: string; field?: string };
  to?: { entity?: string; field?: string };
  constraintName?: string;
  deleteRule?: string;
  updateRule?: string;
};

type DiagramForDiff = {
  id?: string;
  name?: string;
  includeEntities?: string[];
  layout?: unknown;
  groups?: unknown[];
};

type DataTypeDomainsForDiff = {
  datatype?: Array<{ code?: string; [key: string]: unknown }>;
  database?: Array<{ code?: string; [key: string]: unknown }>;
};

/** profile 中影响建模的键；排除 dbs（ADR-0008 遗留槽位）与 erdPassword */
export const PROFILE_MODELING_KEYS = [
  'defaultFields',
  'defaultFieldsType',
  'sqlConfig',
  'wordTemplateConfig',
  'defaultDataSourceId',
  'tableLimit',
  'tableNameFormat',
] as const;

const FIELD_DIFF_SKIP = new Set(['typeName', 'dataType']);

function formatChangeData(before: unknown, after: unknown): string {
  return `${before}=>${after}`;
}

function getAllTables(dataSource: ProjectJSONForDiff): EntityForDiff[] {
  return (dataSource.modules || []).reduce<EntityForDiff[]>(
    (acc, mod) => acc.concat(mod.entities || []),
    [],
  );
}

function compareField(
  currentField: FieldForDiff,
  checkField: FieldForDiff,
  table: EntityForDiff,
): VersionStructuralChange[] {
  const changes: VersionStructuralChange[] = [];
  Object.keys(currentField).forEach((name) => {
    if (FIELD_DIFF_SKIP.has(name)) {
      return;
    }
    if (checkField[name] !== currentField[name]) {
      changes.push({
        type: 'field',
        name: `${table.title}.${currentField.name}.${name}`,
        opt: 'update',
        changeData: formatChangeData(checkField[name], currentField[name]),
      });
    }
  });
  return changes;
}

function compareIndex(
  currentIndex: IndexForDiff,
  checkIndex: IndexForDiff,
  table: EntityForDiff,
): VersionStructuralChange[] {
  const changes: VersionStructuralChange[] = [];
  Object.keys(currentIndex).forEach((name) => {
    if (checkIndex[name] !== currentIndex[name]) {
      changes.push({
        type: 'index',
        name: `${table.title}.${currentIndex.name}.${name}`,
        opt: 'update',
        changeData: formatChangeData(checkIndex[name], currentIndex[name]),
      });
    }
  });
  return changes;
}

function compareStringArray(
  currentFields: string[],
  checkFields: string[],
  title: string,
  indexName: string,
): VersionStructuralChange[] {
  const changes: VersionStructuralChange[] = [];
  currentFields.forEach((f) => {
    if (!checkFields.includes(f)) {
      changes.push({
        type: 'index',
        name: `${title}.${indexName}.fields.${f}`,
        opt: 'update',
        changeData: `addField=>${f}`,
      });
    }
  });
  checkFields.forEach((f) => {
    if (!currentFields.includes(f)) {
      changes.push({
        type: 'index',
        name: `${title}.${indexName}.fields.${f}`,
        opt: 'update',
        changeData: `deleteField=>${f}`,
      });
    }
  });
  return changes;
}

function compareIndexs(currentTable: EntityForDiff, checkTable: EntityForDiff): VersionStructuralChange[] {
  const changes: VersionStructuralChange[] = [];
  const currentIndexs = currentTable.indexs || [];
  const checkIndexs = checkTable.indexs || [];
  const checkIndexNames = checkIndexs.map((index) => index.name);
  const currentIndexNames = currentIndexs.map((index) => index.name);
  currentIndexs.forEach((cIndex) => {
    if (!checkIndexNames.includes(cIndex.name)) {
      changes.push({
        type: 'index',
        name: `${currentTable.title}.${cIndex.name}`,
        opt: 'add',
      });
    } else {
      const checkIndex = checkIndexs.find((c) => c.name === cIndex.name) || {};
      changes.push(
        ...compareIndex(
          _.omit(cIndex, ['fields']) as IndexForDiff,
          _.omit(checkIndex, ['fields']) as IndexForDiff,
          currentTable,
        ),
      );
      changes.push(
        ...compareStringArray(
          cIndex.fields || [],
          checkIndex.fields || [],
          currentTable.title || '',
          cIndex.name || '',
        ),
      );
    }
  });
  checkIndexs.forEach((cIndex) => {
    if (!currentIndexNames.includes(cIndex.name)) {
      changes.push({
        type: 'index',
        name: `${currentTable.title}.${cIndex.name}`,
        opt: 'delete',
      });
    }
  });
  return changes;
}

function compareEntity(currentTable: EntityForDiff, checkTable: EntityForDiff): VersionStructuralChange[] {
  const changes: VersionStructuralChange[] = [];
  Object.keys(currentTable).forEach((name) => {
    if (checkTable[name] !== currentTable[name]) {
      changes.push({
        type: 'entity',
        name: `${currentTable.title}.${name}`,
        opt: 'update',
        changeData: formatChangeData(checkTable[name], currentTable[name]),
      });
    }
  });
  return changes;
}

function compareTables(dataSource1: ProjectJSONForDiff, dataSource2: ProjectJSONForDiff): VersionStructuralChange[] {
  const changes: VersionStructuralChange[] = [];
  const currentTables = getAllTables(dataSource1);
  const checkTables = getAllTables(dataSource2);
  const checkTableNames = checkTables.map((e) => e.title);
  const currentTableNames = currentTables.map((e) => e.title);

  currentTables.forEach((table) => {
    if (checkTableNames.includes(table.title)) {
      const checkTable = checkTables.find((t) => t.title === table.title) || {};
      const checkFields = (checkTable.fields || []).filter((f) => f.name);
      const tableFields = (table.fields || []).filter((f) => f.name);
      const checkFieldsName = checkFields.map((f) => f.name);
      const tableFieldsName = tableFields.map((f) => f.name);
      tableFields.forEach((field) => {
        if (!checkFieldsName.includes(field.name)) {
          changes.push({
            type: 'field',
            name: `${table.title}.${field.name}`,
            opt: 'add',
          });
        } else {
          const checkField = checkFields.find((f) => f.name === field.name) || {};
          changes.push(...compareField(field, checkField, table));
        }
      });
      checkFields.forEach((field) => {
        if (!tableFieldsName.includes(field.name)) {
          changes.push({
            type: 'field',
            name: `${table.title}.${field.name}`,
            opt: 'delete',
          });
        }
      });
      changes.push(
        ...compareEntity(
          _.omit(table, ['fields', 'indexs', 'headers']) as EntityForDiff,
          _.omit(checkTable, ['fields', 'indexs']) as EntityForDiff,
        ),
      );
      changes.push(...compareIndexs(table, checkTable));
    } else {
      changes.push({
        type: 'entity',
        name: table.title || '',
        opt: 'add',
      });
    }
  });

  checkTables.forEach((table) => {
    if (!currentTableNames.includes(table.title)) {
      changes.push({
        type: 'entity',
        name: table.title || '',
        opt: 'delete',
      });
    }
  });

  return changes;
}

export function associationKey(assoc: AssociationForDiff): string {
  if (assoc.constraintName) {
    return assoc.constraintName;
  }
  const from = `${assoc.from?.entity}.${assoc.from?.field}`;
  const to = `${assoc.to?.entity}.${assoc.to?.field}`;
  return `${from}->${to}`;
}

function compareAssociations(
  moduleName: string,
  current: AssociationForDiff[],
  baseline: AssociationForDiff[],
): VersionStructuralChange[] {
  const changes: VersionStructuralChange[] = [];
  const baseMap = new Map(baseline.map((a) => [associationKey(a), a]));
  const curMap = new Map(current.map((a) => [associationKey(a), a]));

  curMap.forEach((assoc, key) => {
    const prefix = `${moduleName}.${key}`;
    if (!baseMap.has(key)) {
      changes.push({ type: 'association', name: prefix, opt: 'add' });
      return;
    }
    const base = baseMap.get(key)!;
    (['relation', 'deleteRule', 'updateRule', 'constraintName'] as const).forEach((prop) => {
      if (assoc[prop] !== base[prop]) {
        changes.push({
          type: 'association',
          name: `${prefix}.${prop}`,
          opt: 'update',
          changeData: formatChangeData(base[prop], assoc[prop]),
        });
      }
    });
    if (!_.isEqual(assoc.from, base.from)) {
      changes.push({
        type: 'association',
        name: `${prefix}.from`,
        opt: 'update',
        changeData: formatChangeData(JSON.stringify(base.from), JSON.stringify(assoc.from)),
      });
    }
    if (!_.isEqual(assoc.to, base.to)) {
      changes.push({
        type: 'association',
        name: `${prefix}.to`,
        opt: 'update',
        changeData: formatChangeData(JSON.stringify(base.to), JSON.stringify(assoc.to)),
      });
    }
  });

  baseMap.forEach((_assoc, key) => {
    if (!curMap.has(key)) {
      changes.push({ type: 'association', name: `${moduleName}.${key}`, opt: 'delete' });
    }
  });

  return changes;
}

function compareDiagrams(
  moduleName: string,
  current: DiagramForDiff[],
  baseline: DiagramForDiff[],
): VersionStructuralChange[] {
  const changes: VersionStructuralChange[] = [];
  const baseMap = new Map(
    baseline.filter((d) => d.id).map((d) => [d.id as string, d]),
  );
  const curMap = new Map(
    current.filter((d) => d.id).map((d) => [d.id as string, d]),
  );

  curMap.forEach((diagram, id) => {
    const prefix = `${moduleName}.${id}`;
    if (!baseMap.has(id)) {
      changes.push({ type: 'diagram', name: prefix, opt: 'add' });
      return;
    }
    const base = baseMap.get(id)!;
    if (diagram.name !== base.name) {
      changes.push({
        type: 'diagram',
        name: `${prefix}.name`,
        opt: 'update',
        changeData: formatChangeData(base.name, diagram.name),
      });
    }
    if (!_.isEqual(diagram.includeEntities, base.includeEntities)) {
      changes.push({
        type: 'diagram',
        name: `${prefix}.includeEntities`,
        opt: 'update',
        changeData: formatChangeData(
          JSON.stringify(base.includeEntities),
          JSON.stringify(diagram.includeEntities),
        ),
      });
    }
    if (!_.isEqual(diagram.layout, base.layout)) {
      changes.push({
        type: 'diagram',
        name: `${prefix}.layout`,
        opt: 'update',
        changeData: 'layout changed',
      });
    }
    if (!_.isEqual(diagram.groups, base.groups)) {
      changes.push({
        type: 'diagram',
        name: `${prefix}.groups`,
        opt: 'update',
        changeData: 'groups changed',
      });
    }
  });

  baseMap.forEach((_diagram, id) => {
    if (!curMap.has(id)) {
      changes.push({ type: 'diagram', name: `${moduleName}.${id}`, opt: 'delete' });
    }
  });

  return changes;
}

function compareGraphCanvas(
  moduleName: string,
  current: ModuleForDiff['graphCanvas'],
  baseline: ModuleForDiff['graphCanvas'],
): VersionStructuralChange[] {
  if (_.isEqual(current, baseline)) {
    return [];
  }
  if (!current && !baseline) {
    return [];
  }
  if (!baseline && current) {
    return [{ type: 'diagram', name: `${moduleName}.graphCanvas`, opt: 'add' }];
  }
  if (baseline && !current) {
    return [{ type: 'diagram', name: `${moduleName}.graphCanvas`, opt: 'delete' }];
  }
  return [{
    type: 'diagram',
    name: `${moduleName}.graphCanvas`,
    opt: 'update',
    changeData: 'graphCanvas changed',
  }];
}

function compareModules(dataSource1: ProjectJSONForDiff, dataSource2: ProjectJSONForDiff): VersionStructuralChange[] {
  const changes: VersionStructuralChange[] = [];
  const currentModules = dataSource1.modules || [];
  const baselineModules = dataSource2.modules || [];
  const baseByName = new Map(baselineModules.filter((m) => m.name).map((m) => [m.name as string, m]));
  const curByName = new Map(currentModules.filter((m) => m.name).map((m) => [m.name as string, m]));

  curByName.forEach((mod, name) => {
    if (!baseByName.has(name)) {
      changes.push({ type: 'module', name, opt: 'add' });
    } else {
      const base = baseByName.get(name)!;
      if (mod.chnname !== base.chnname) {
        changes.push({
          type: 'module',
          name: `${name}.chnname`,
          opt: 'update',
          changeData: formatChangeData(base.chnname, mod.chnname),
        });
      }
      changes.push(
        ...compareAssociations(name, mod.associations || [], base.associations || []),
      );
      const hasDiagrams = (mod.diagrams?.length || 0) > 0 || (base.diagrams?.length || 0) > 0;
      if (hasDiagrams) {
        changes.push(...compareDiagrams(name, mod.diagrams || [], base.diagrams || []));
      } else {
        changes.push(...compareGraphCanvas(name, mod.graphCanvas, base.graphCanvas));
      }
    }
  });

  baseByName.forEach((_mod, name) => {
    if (!curByName.has(name)) {
      changes.push({ type: 'module', name, opt: 'delete' });
    }
  });

  return changes;
}

function compareProfile(
  current: Record<string, unknown> | undefined,
  baseline: Record<string, unknown> | undefined,
): VersionStructuralChange[] {
  const changes: VersionStructuralChange[] = [];
  const cur = current || {};
  const base = baseline || {};

  PROFILE_MODELING_KEYS.forEach((key) => {
    if (!_.isEqual(cur[key], base[key])) {
      changes.push({
        type: 'profile',
        name: key,
        opt: base[key] === undefined ? 'add' : cur[key] === undefined ? 'delete' : 'update',
        changeData: base[key] === undefined || cur[key] === undefined
          ? undefined
          : 'profile changed',
      });
    }
  });

  return changes;
}

function compareDataTypeDomains(
  current: DataTypeDomainsForDiff | undefined,
  baseline: DataTypeDomainsForDiff | undefined,
): VersionStructuralChange[] {
  const changes: VersionStructuralChange[] = [];
  const cur = current || {};
  const base = baseline || {};

  const compareByCode = (
    items: Array<{ code?: string; [key: string]: unknown }> | undefined,
    baseItems: Array<{ code?: string; [key: string]: unknown }> | undefined,
    label: 'datatype' | 'database',
  ) => {
    const curList = items || [];
    const baseList = baseItems || [];
    const baseMap = new Map(baseList.filter((d) => d.code).map((d) => [d.code as string, d]));
    const curMap = new Map(curList.filter((d) => d.code).map((d) => [d.code as string, d]));

    curMap.forEach((item, code) => {
      if (!baseMap.has(code)) {
        changes.push({ type: 'datatype', name: `${label}.${code}`, opt: 'add' });
      } else if (!_.isEqual(item, baseMap.get(code))) {
        changes.push({
          type: 'datatype',
          name: `${label}.${code}`,
          opt: 'update',
          changeData: `${label} changed`,
        });
      }
    });
    baseMap.forEach((_item, code) => {
      if (!curMap.has(code)) {
        changes.push({ type: 'datatype', name: `${label}.${code}`, opt: 'delete' });
      }
    });
  };

  compareByCode(cur.datatype, base.datatype, 'datatype');
  compareByCode(cur.database, base.database, 'database');

  return changes;
}

/** 过滤展示/北极星噪声（与 showChanges 同源规则） */
export function filterNoiseChanges(changes: VersionStructuralChange[]): VersionStructuralChange[] {
  return changes.filter(
    (c) => !(
      c.type === 'field'
      && c.opt === 'update'
      && c.changeData
      && c.changeData.includes('undefined=>')
    ),
  );
}

/** ADR-0022：空 diff 的版本保存不计入北极星 */
export function hasMeaningfulVersionChanges(changes: VersionStructuralChange[]): boolean {
  return filterNoiseChanges(changes).length > 0;
}

/**
 * 当前 projectJSON 相对基线快照的全量 structural diff。
 * @param current 工作区（通常含完整 profile / dataTypeDomains）
 * @param baseline 版本基线快照（缺省键按空处理）
 */
export function checkVersionStructuralDiff(
  current: ProjectJSONForDiff,
  baseline: ProjectJSONForDiff,
): VersionStructuralChange[] {
  const normalizedCurrent: ProjectJSONForDiff = {
    modules: current?.modules || [],
    profile: current?.profile || {},
    dataTypeDomains: current?.dataTypeDomains || {},
  };
  const normalizedBaseline: ProjectJSONForDiff = {
    modules: baseline?.modules || [],
    profile: baseline?.profile || {},
    dataTypeDomains: baseline?.dataTypeDomains || {},
  };

  return [
    ...compareTables(normalizedCurrent, normalizedBaseline),
    ...compareModules(normalizedCurrent, normalizedBaseline),
    ...compareProfile(
      normalizedCurrent.profile as Record<string, unknown>,
      normalizedBaseline.profile as Record<string, unknown>,
    ),
    ...compareDataTypeDomains(normalizedCurrent.dataTypeDomains, normalizedBaseline.dataTypeDomains),
  ];
}

/** 版本保存时写入 db_change 的 projectJSON 快照（含建模相关 profile / domains） */
export function snapshotProjectJSONForVersion(projectJSON: ProjectJSONForDiff | null | undefined): ProjectJSONForDiff {
  const pj = projectJSON || {};
  const profile = pj.profile || {};
  const modelingProfile: Record<string, unknown> = {};
  PROFILE_MODELING_KEYS.forEach((key) => {
    if (profile[key] !== undefined) {
      modelingProfile[key] = profile[key];
    }
  });
  return {
    modules: pj.modules || [],
    profile: modelingProfile,
    dataTypeDomains: pj.dataTypeDomains || {},
  };
}

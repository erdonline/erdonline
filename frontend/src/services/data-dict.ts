import { GET, POST, EDIT, DEL } from '@/services/crud';

export type DataDictScopeType = 'platform' | 'group' | 'user';

export type DataDictField = {
  name: string;
  chnname?: string;
  type?: string;
  typeName?: string;
  dataType?: string;
  remark?: string;
  pk?: boolean;
  notNull?: boolean;
  autoIncrement?: boolean;
  relationNoShow?: boolean;
  defaultValue?: string;
  uiHint?: string;
  dictRef?: string;
};

export type DataDictEnum = {
  name: string;
  code: string;
  kind?: 'enum';
  values?: Array<{ name: string; chnname?: string }>;
  apply?: Record<string, { type?: string }>;
};

export type DataDictInfo = {
  fields?: DataDictField[];
  enums?: DataDictEnum[];
};

export type DataDictTreeNode = {
  id: string;
  title: string;
  parentId?: string;
  isLeaf?: boolean;
  dictCode?: string;
  description?: string;
  dictInfo?: DataDictInfo;
  scopeType?: DataDictScopeType;
  scopeId?: string;
  readOnly?: boolean;
  children?: DataDictTreeNode[];
};

export type DataDictApplyResult = {
  dictId: string;
  dictCode?: string;
  title?: string;
  fields: DataDictField[];
  enums?: DataDictEnum[];
};

export type DataDictPayload = {
  id?: string;
  parentId?: string;
  isLeaf?: boolean;
  title: string;
  dictCode?: string;
  description?: string;
  dictInfo?: DataDictInfo;
  scopeType?: DataDictScopeType;
  scopeId?: string;
};

export async function fetchDataDictTree(params?: {
  title?: string;
  projectId?: string;
}): Promise<DataDictTreeNode[]> {
  const res = await GET('/dataDict/tree', params || {});
  return (res?.data as DataDictTreeNode[]) || [];
}

export async function applyDataDict(id: string): Promise<DataDictApplyResult> {
  const res = await POST(`/dataDict/${id}/apply`, {});
  return res?.data as DataDictApplyResult;
}

export async function createDataDict(payload: DataDictPayload) {
  // 无尾斜杠：后端映射 `/dataDict`；dev proxy 需匹配 `/dataDict`（见 proxy.ts）
  return POST('/dataDict', payload);
}

export async function updateDataDict(id: string, payload: DataDictPayload) {
  return EDIT(`/dataDict/${id}`, payload);
}

export async function deleteDataDict(id: string) {
  return DEL(`/dataDict/${id}`, {});
}

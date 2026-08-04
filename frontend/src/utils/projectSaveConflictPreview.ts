import {
  checkVersionStructuralDiff,
  filterNoiseChanges,
  snapshotProjectJSONForVersion,
  type ProjectJSONForDiff,
  type VersionStructuralChange,
} from '@/utils/versionStructuralDiff';
import type { VersionDiffItem } from '@/components/dialog/version/formatVersionDiffMarkdown';

const OPT_LABEL: Record<string, string> = {
  add: '新增',
  delete: '删除',
  update: '修改',
};

const TYPE_LABEL: Record<string, string> = {
  entity: '表',
  field: '字段',
  index: '索引',
  association: '关联',
  diagram: '关系图',
  profile: '项目配置',
  datatype: '数据类型',
  module: '模块',
};

let lastKnownServerProjectJSON: ProjectJSONForDiff | null = null;

/** 打开项目 / 成功 fetch 后缓存，409 预览 fetch 失败时作 fallback */
export function rememberServerProjectJSON(
  projectJSON: ProjectJSONForDiff | null | undefined,
): void {
  if (!projectJSON || typeof projectJSON !== 'object') {
    return;
  }
  lastKnownServerProjectJSON = snapshotProjectJSONForVersion(projectJSON);
}

export function getLastKnownServerProjectJSON(): ProjectJSONForDiff | null {
  return lastKnownServerProjectJSON;
}

export function structuralChangesToDiffItems(
  changes: VersionStructuralChange[],
): VersionDiffItem[] {
  return filterNoiseChanges(changes).map((c) => {
    const opt = OPT_LABEL[c.opt] || c.opt;
    const type = TYPE_LABEL[c.type] || c.type;
    let message = `${opt}${type}「${c.name}」`;
    if (c.changeData) {
      message += `：${c.changeData}`;
    }
    return {
      message,
      opt: c.opt,
      type: c.type,
      name: c.name,
      changeData: c.changeData,
    };
  });
}

/** 本地工作区相对服务端（或 last known）的结构化 diff */
export function diffLocalAgainstServer(
  localProjectJSON: ProjectJSONForDiff | null | undefined,
  serverProjectJSON: ProjectJSONForDiff | null | undefined,
): VersionDiffItem[] {
  if (!localProjectJSON || !serverProjectJSON) {
    return [];
  }
  const local = snapshotProjectJSONForVersion(localProjectJSON);
  const server = snapshotProjectJSONForVersion(serverProjectJSON);
  const changes = checkVersionStructuralDiff(local, server);
  return structuralChangesToDiffItems(changes);
}

export type ServerProjectSnapshotResult = {
  projectJSON: ProjectJSONForDiff | null;
  source: 'fetch' | 'lastKnown' | 'none';
};

/** 拉取服务端 projectJSON，不写入 store；失败时回退 last known */
export async function fetchServerProjectSnapshot(
  projectId: string,
): Promise<ServerProjectSnapshotResult> {
  try {
    const { default: request } = await import('@/utils/request');
    const res = (await request.get(`/ncnb/project/info/${projectId}`)) as {
      code?: number;
      data?: { projectJSON?: ProjectJSONForDiff };
    };
    if (res?.code === 200 && res.data?.projectJSON) {
      rememberServerProjectJSON(res.data.projectJSON);
      return {
        projectJSON: snapshotProjectJSONForVersion(res.data.projectJSON),
        source: 'fetch',
      };
    }
  } catch {
    // fall through to last known
  }
  const cached = getLastKnownServerProjectJSON();
  if (cached) {
    return { projectJSON: cached, source: 'lastKnown' };
  }
  return { projectJSON: null, source: 'none' };
}

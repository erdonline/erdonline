import type { GetState, SetState } from 'zustand';
import type { ProjectState } from '@/store/project/useProjectStore';
import produce from 'immer';
import { message } from 'antd';
import { Data, DatabasePoint, DataNull, DataUser } from '@icon-park/react';
import { erdColors } from '@/theme/tokens';
import type { PersistOpt } from '@/store/project/persistOpt';

/** 与 DesignLayout / Home·Group `brandFill` 同源；禁组件内硬编码 #DE2910 */
const brandFill = erdColors.brand;

/** 懒加载避免 unit 导入本 slice 时经 save→store 形成环 */
async function persistAndAck(
  project: ProjectLike,
  fallbackMsg: string,
): Promise<boolean> {
  const { persistProjectNow, ackManualPersist } = await import(
    '@/store/project/projectAutosave'
  );
  const saved = await persistProjectNow(project, fallbackMsg);
  if (saved) {
    ackManualPersist(true);
  }
  return saved;
}

export type IDataTypeDomainsSlice = Record<string, never>;

export interface IDataTypeDomainsDispatchSlice {
  /**
   * 追加逻辑类型；persist:true 时仅 saveProject code===200 写 store + 成功 toast。
   */
  addDatatype: (
    payload: Record<string, unknown>,
    opts?: PersistOpt,
  ) => boolean | Promise<boolean>;
  /**
   * 按 originalCode（缺省=payload.code）更新；persist:true 时仅 code===200 写 store。
   */
  updateDatatype: (
    payload: Record<string, unknown> & { originalCode?: string },
    opts?: PersistOpt,
  ) => boolean | Promise<boolean>;
  /**
   * 按 code 删除；persist:true 时仅 code===200 写 store + 成功 toast。
   */
  removeDatatype: (
    code: string,
    opts?: PersistOpt,
  ) => boolean | Promise<boolean>;
  updateAllDataTypes: (payload: unknown[]) => void;
  getDataTypeTree: () => unknown[];
}

type ProjectLike = NonNullable<ProjectState['project']>;

function datatypeList(project: ProjectLike | null | undefined): unknown[] {
  const list = project?.projectJSON?.dataTypeDomains?.datatype;
  return Array.isArray(list) ? list : [];
}

function duplicateIndex(
  list: unknown[],
  name: unknown,
  code: unknown,
  skipCode?: string,
): number {
  return list.findIndex((raw) => {
    const m = raw as { name?: unknown; code?: unknown };
    if (skipCode && m.code === skipCode) {
      return false;
    }
    return m.name === name || m.code === code;
  });
}

const DataTypeDomainsSlice = (
  set: SetState<ProjectState>,
  get: GetState<ProjectState>,
) => ({
  addDatatype: (payload: Record<string, unknown>, opts?: PersistOpt) => {
    const persist = !!opts?.persist;
    const project = get().project;
    if (!project?.projectJSON) {
      message.error('未打开项目');
      return persist ? Promise.resolve(false) : false;
    }

    const list = datatypeList(project);
    if (duplicateIndex(list, payload.name, payload.code) !== -1) {
      message.error(`名称[${String(payload.name)}] 或 代码[${String(payload.code)}] 已经存在`);
      return persist ? Promise.resolve(false) : false;
    }

    if (!persist) {
      set(
        produce((state: ProjectState) => {
          const domains = state.project.projectJSON.dataTypeDomains;
          if (!domains) {
            return;
          }
          if (!Array.isArray(domains.datatype)) {
            domains.datatype = [];
          }
          domains.datatype.push(payload);
          message.success('提交成功');
        }),
      );
      return true;
    }

    const next = produce(project, (draft: ProjectLike) => {
      if (!draft.projectJSON.dataTypeDomains) {
        draft.projectJSON.dataTypeDomains = { datatype: [], database: [] };
      }
      const domains = draft.projectJSON.dataTypeDomains;
      if (!Array.isArray(domains.datatype)) {
        domains.datatype = [];
      }
      domains.datatype.push(payload);
    });

    return (async () => {
      const saved = await persistAndAck(next, '数据类型保存失败');
      if (!saved) {
        return false;
      }
      set(
        produce((state: ProjectState) => {
          state.project.projectJSON = next.projectJSON;
        }),
      );
      message.success('提交成功');
      return true;
    })();
  },

  updateDatatype: (
    payload: Record<string, unknown> & { originalCode?: string },
    opts?: PersistOpt,
  ) => {
    const persist = !!opts?.persist;
    const project = get().project;
    if (!project?.projectJSON) {
      message.error('未打开项目');
      return persist ? Promise.resolve(false) : false;
    }

    const key = String(payload.originalCode ?? payload.code ?? '');
    const list = datatypeList(project);
    const idx = list.findIndex(
      (raw) => (raw as { code?: unknown }).code === key,
    );
    if (idx < 0) {
      message.error('数据类型不存在');
      return persist ? Promise.resolve(false) : false;
    }

    const { originalCode: _omit, ...rest } = payload;
    if (duplicateIndex(list, rest.name, rest.code, key) !== -1) {
      message.error(`名称[${String(rest.name)}] 或 代码[${String(rest.code)}] 已经存在`);
      return persist ? Promise.resolve(false) : false;
    }

    if (!persist) {
      set(
        produce((state: ProjectState) => {
          const domains = state.project.projectJSON.dataTypeDomains;
          if (!domains?.datatype?.[idx]) {
            return;
          }
          domains.datatype[idx] = rest;
          message.success('修改成功');
        }),
      );
      return true;
    }

    const next = produce(project, (draft: ProjectLike) => {
      const domains = draft.projectJSON.dataTypeDomains;
      if (!domains?.datatype?.[idx]) {
        return;
      }
      domains.datatype[idx] = rest;
    });

    return (async () => {
      const saved = await persistAndAck(next, '数据类型保存失败');
      if (!saved) {
        return false;
      }
      set(
        produce((state: ProjectState) => {
          state.project.projectJSON = next.projectJSON;
        }),
      );
      message.success('修改成功');
      return true;
    })();
  },

  removeDatatype: (code: string, opts?: PersistOpt) => {
    const persist = !!opts?.persist;
    const project = get().project;
    if (!project?.projectJSON) {
      message.error('未打开项目');
      return persist ? Promise.resolve(false) : false;
    }

    const list = datatypeList(project);
    if (!list.some((raw) => (raw as { code?: unknown }).code === code)) {
      message.error('数据类型不存在');
      return persist ? Promise.resolve(false) : false;
    }

    if (!persist) {
      set(
        produce((state: ProjectState) => {
          const domains = state.project.projectJSON.dataTypeDomains;
          if (!domains) {
            return;
          }
          domains.datatype = (domains.datatype || []).filter(
            (e: { code?: string }) => e.code !== code,
          );
        }),
      );
      return true;
    }

    const next = produce(project, (draft: ProjectLike) => {
      const domains = draft.projectJSON.dataTypeDomains;
      if (!domains) {
        return;
      }
      domains.datatype = (domains.datatype || []).filter(
        (e: { code?: string }) => e.code !== code,
      );
    });

    return (async () => {
      const saved = await persistAndAck(next, '数据类型保存失败');
      if (!saved) {
        return false;
      }
      set(
        produce((state: ProjectState) => {
          state.project.projectJSON = next.projectJSON;
        }),
      );
      message.success('删除成功');
      return true;
    })();
  },

  updateAllDataTypes: (payload: unknown[]) =>
    set(
      produce((state: ProjectState) => {
        if (!state.project.projectJSON.dataTypeDomains) {
          state.project.projectJSON.dataTypeDomains = {
            datatype: [],
            database: [],
          };
        }
        state.project.projectJSON.dataTypeDomains.datatype = payload;
      }),
    ),

  getDataTypeTree: () => {
    const dataTypes = get().project?.projectJSON?.dataTypeDomains?.datatype?.map(
      (datatype: { code?: string; name?: string }) => ({
        type: 'dataType',
        code: datatype.code,
        icon: (
          <DataNull
            theme="filled"
            size="13"
            fill={brandFill}
            strokeWidth={2}
          />
        ),
        title: datatype.name,
        isLeaf: true,
        key: `datatype${datatype.name}`,
      }),
    );
    const databases = get().project?.projectJSON?.dataTypeDomains?.database?.map(
      (database: { code?: string }) => ({
        type: 'database',
        code: database.code,
        icon: (
          <DatabasePoint
            theme="filled"
            size="13"
            fill={brandFill}
            strokeWidth={2}
          />
        ),
        title: database.code,
        isLeaf: true,
        key: `database${database.code}`,
      }),
    );

    return [
      {
        type: 'dataType',
        title: '数据字典',
        icon: (
          <DataUser
            theme="filled"
            size="18"
            fill={brandFill}
            strokeWidth={2}
          />
        ),
        code: '###menu###',
        isLeaf: false,
        key: `datatype###datatype`,
        children: dataTypes,
      },
      {
        type: 'database',
        code: '###menu###',
        title: '数据模板',
        icon: (
          <Data theme="filled" size="13" fill={brandFill} strokeWidth={2} />
        ),
        isLeaf: false,
        key: `database###database`,
        children: databases,
      },
    ];
  },
});

export default DataTypeDomainsSlice;

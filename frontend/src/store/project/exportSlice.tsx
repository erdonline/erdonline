import type { GetState, SetState } from 'zustand';
import type { ProjectState } from '@/store/project/useProjectStore';
import {message, Modal} from "antd";
import {saveImage} from "@/utils/relation2file";
import {generateMD} from "@/utils/markdown";
import * as File from "@/utils/file";
import * as cache from "@/utils/cache";
import request from "@/utils/request";
import { get as _get } from 'lodash-es';
import {generateHtml} from "@/utils/generatehtml";
import produce from "immer";
import dayjs from '@/utils/dayjs';
import {CONSTANT} from "@/utils/constant";
import {docxBlobFailureReason} from "@/utils/docxBlobGate";
import { storeFmt } from '@/store/storeIntl';
import {
  EXPORT_DDL_ALL_SEGMENTS,
  fetchExportDdl,
  type ExportDdlFilterKey,
} from "@/utils/ddlExportApi";
import {SNAPSHOT_DB_KEY} from "@/utils/versionConstants";

const WORD_EXPORT_BLOB_KEYS = {
  missing: 'store.export.word.missing',
  notBlob: 'store.export.word.notBlob',
  empty: 'store.export.word.empty',
  failDefault: 'store.export.word.failDefault',
  notDocx: 'store.export.word.notDocx',
} as const;

export type IExportSlice = {
  exportSliceState?: any;
}

export interface IExportDispatchSlice {
  setExportSliceState: (exportSlice: any) => void;
  exportFile: (type: string) => void;
  showExportMessage: () => void;
  onDBChange: (defaultDb: string) => void;
  onCustomTypeChange: (customType: any) => void;
  onExportTypeChange: (exportType: string) => void;
  initAllKeys: () => any;
  onSelectTableChange: (selectTable: []) => any;
  setExportData: () => Promise<void>;
  getExportData: () => any;
  /** @returns true 成功；false 失败（调用方据此保持对话框不关闭） */
  exportSQL: () => boolean;
}

const HTTP_REASON_KEYS: Record<number, string> = {
  400: 'store.export.http.400',
  401: 'store.export.http.401',
  403: 'store.export.http.403',
  404: 'store.export.http.404',
  500: 'store.export.http.500',
  502: 'store.export.http.502',
  503: 'store.export.http.503',
  504: 'store.export.http.504',
};

/** 统一导出失败文案：原因 + 重试引导（零静默失败） */
export function showExportFailure(type: string, reason: string) {
  const detail = reason?.trim() || storeFmt('store.export.unknownError');
  message.error(storeFmt('store.export.failed', { type, detail }));
}

type ExportRequestError = {
  message?: string;
  name?: string;
  data?: unknown;
  response?: { status?: number; statusText?: string };
};

async function resolveExportErrorReason(err: unknown): Promise<string> {
  const e = err as ExportRequestError;
  if (!e?.response) {
    return storeFmt('store.export.networkError');
  }
  const data = e.data;
  if (data instanceof Blob) {
    try {
      const text = await data.text();
      if (text) {
        const json = JSON.parse(text) as { msg?: string; message?: string };
        if (json?.msg || json?.message) {
          return (json.msg || json.message) as string;
        }
      }
    } catch {
      /* 非 JSON blob，走状态码 */
    }
  } else if (data && typeof data === 'object') {
    const body = data as { msg?: string; message?: string };
    if (body.msg || body.message) {
      return (body.msg || body.message) as string;
    }
  }
  const status = e.response?.status;
  if (status && HTTP_REASON_KEYS[status]) {
    return storeFmt(HTTP_REASON_KEYS[status]);
  }
  if (e.message && e.message !== 'http error') {
    return e.message;
  }
  return e.response?.statusText || storeFmt('store.export.unknownError');
}

/** 函数内格式化，供 docxBlobFailureReason 消费（ADR-0033） */
function wordExportBlobCopy() {
  return {
    missing: storeFmt(WORD_EXPORT_BLOB_KEYS.missing),
    notBlob: storeFmt(WORD_EXPORT_BLOB_KEYS.notBlob),
    empty: storeFmt(WORD_EXPORT_BLOB_KEYS.empty),
    failDefault: storeFmt(WORD_EXPORT_BLOB_KEYS.failDefault),
    notDocx: storeFmt(WORD_EXPORT_BLOB_KEYS.notDocx),
  };
}

/** 强制 reject，避免全局 errorHandler return 后 Promise resolve(undefined) 静默失败 */
function rethrowExportError(error: unknown): never {
  throw error;
}

const ExportSlice = (set: SetState<ProjectState>, get: GetState<ProjectState>) => ({
  setExportSliceState: (exportSlice: any) => set(produce(state => {
    state.exportSliceState = exportSlice;
  })),
  exportFile: (type: string) => {
    const {projectJSON, projectName: project} = get().project;
    const dataSource = JSON.parse(JSON.stringify(projectJSON));
    const columnOrder = [
      {code: 'chnname', value: '字段名', com: 'Input', relationNoShow: false},
      {code: 'name', value: '逻辑名(英文名)', com: 'Input', relationNoShow: false},
      {code: 'type', value: '类型', com: 'Select', relationNoShow: false},
      {code: 'dataType', value: '数据库类型', com: 'Text', relationNoShow: true},
      {code: 'remark', value: '说明', com: 'Input', relationNoShow: true},
      {code: 'pk', value: '主键', com: 'Checkbox', relationNoShow: false},
      {code: 'notNull', value: '非空', com: 'Checkbox', relationNoShow: true},
      {code: 'autoIncrement', value: '自增', com: 'Checkbox', relationNoShow: true},
      {code: 'defaultValue', value: '默认值', com: 'Input', relationNoShow: true},
      {code: 'relationNoShow', value: '关系图', com: 'Icon', relationNoShow: true},
      {code: 'uiHint', value: 'UI建议', com: 'Select', relationNoShow: true},
    ];
    if (type === 'Markdown') {
      get().dispatch.showExportMessage();
      saveImage(dataSource, columnOrder, (images: any) => {
        generateMD(dataSource, images, project, (data: any) => {
          File.save(data, `${project}.md`);
          Modal.destroyAll();
        });
      }, (err: unknown) => {
        Modal.destroyAll();
        const reason = err instanceof Error ? err.message : storeFmt('store.export.renderDiagramFailed');
        showExportFailure(type, reason);
      });
    } else if (type === 'Word' || type === 'PDF') {
      const postfix = type === 'Word' ? '.doc' : '.pdf';
      get().dispatch.showExportMessage();
      saveImage(dataSource, columnOrder, (images: any) => {
        const tempImages = Object.keys(images).reduce<Record<string, string>>((acc, key) => ({
          ...acc,
          [key]: images[key].replace('data:image/png;base64,', ''),
        }), {});
        const projectId = cache.getItem(CONSTANT.PROJECT_ID);
        const defaultDatabase = get().dispatch.getCurrentDBData();
        request.post('/ncnb/doc/gendocx', {
          method: 'POST',
          responseType: 'blob',
          errorHandler: rethrowExportError,
          data: {
            imgs: tempImages,
            projectId,
            type,
            doctpl: _get(dataSource, 'profile.wordTemplateConfig', ""),
            dbKey: defaultDatabase?.key || ''
          }
        }).then(async (res) => {
          if (type === 'Word') {
            // 与 downloadWordTemplate 同闸：非空 + ZIP(PK)；拒 JSON/空/垃圾 blob 假 .docx
            const reason = await docxBlobFailureReason(res, wordExportBlobCopy());
            if (reason) {
              Modal.destroyAll();
              showExportFailure(type, reason);
              return;
            }
            File.saveByBlob(res as Blob, `${project}${postfix}`);
            Modal.destroyAll();
            return;
          }
          // PDF 等：至少拒空体与 JSON 错误体（勿用 ZIP 闸，非 docx）
          if (!res) {
            Modal.destroyAll();
            showExportFailure(type, storeFmt(WORD_EXPORT_BLOB_KEYS.missing));
            return;
          }
          const blob = res as Blob;
          if (blob.size === 0) {
            Modal.destroyAll();
            showExportFailure(type, storeFmt(WORD_EXPORT_BLOB_KEYS.empty));
            return;
          }
          if (blob.type && blob.type.includes('json')) {
            Modal.destroyAll();
            try {
              const text = await blob.text();
              const json = JSON.parse(text) as { msg?: string; message?: string };
              showExportFailure(type, json.msg || json.message || storeFmt(WORD_EXPORT_BLOB_KEYS.failDefault));
            } catch {
              showExportFailure(type, storeFmt(WORD_EXPORT_BLOB_KEYS.failDefault));
            }
            return;
          }
          File.saveByBlob(res, `${project}${postfix}`);
          Modal.destroyAll();
        }).catch(async (err: unknown) => {
          Modal.destroyAll();
          const reason = await resolveExportErrorReason(err);
          showExportFailure(type, reason);
        });
      }, (err: unknown) => {
        Modal.destroyAll();
        const reason = err instanceof Error ? err.message : storeFmt('store.export.renderDiagramFailed');
        showExportFailure(type, reason);
      });
    } else if (type === 'Html') {
      get().dispatch.showExportMessage();
      saveImage(dataSource, columnOrder, (images: any) => {
        generateHtml(dataSource, images, project, (data: any) => {
          File.save(data, `${project}.html`);
          Modal.destroyAll();
        });
      }, (err: unknown) => {
        Modal.destroyAll();
        const reason = err instanceof Error ? err.message : storeFmt('store.export.renderDiagramFailed');
        showExportFailure(type, reason);
      });
    } else if (type === 'JSON') {
      try {
        const tempDataSource = {...dataSource};
        const originERDJson = JSON.stringify(tempDataSource, null, 2);
        const secret = get().dispatch.encrypt("AES", originERDJson);
        File.save(secret, `${project}.erd.json`);
      } catch (err: unknown) {
        const reason = err instanceof Error ? err.message : storeFmt('store.export.serializeFailed');
        showExportFailure(type, reason);
      }
    }
  },
  showExportMessage: () => {
    const {projectJSON: dataSource} = get().project;
    const allTable = (dataSource?.modules || []).reduce((a: any, b: any) => {
      return a.concat((b.entities || []).map((entity: any) => entity.title));
    }, []);
    if (allTable.length > 50) {
      Modal.warning({
        title: '导出提示',
        content: `当前导出的数据表较多， 共【${allTable.length}】张表，请耐心等待！导出完毕之前请勿关闭此窗口！`,
        okText: null,
        cancelText: null,
      });
    }else {
      Modal.warning({
        title: '导出提示',
        content: `正在导出， 共【${allTable.length}】张表，请耐心等待！导出完毕之前请勿关闭此窗口！`,
        okText: null,
        cancelText: null,
      });
    }
  },
  onDBChange: (defaultDb: string) => {
    get().dispatch.setExportSliceState({
      ...get().exportSliceState,
      defaultDb: defaultDb
    });
  },
  onExportTypeChange: (exportType: string) => {
    const allType = [
      'deleteTable',
      'createTable',
      'createIndex',
      'createTrigger',
      'createForeignKey',
      'updateComment',
    ];
    let customType = get().exportSliceState?.customType;
    // 如果是自定义的，之前选中过，按之前的算；没选中过，给个空的
    if (exportType === 'customer') {
      customType = [];
    } else {
      customType = allType;
    }

    get().dispatch.setExportSliceState({
      ...get().exportSliceState,
      exportType: exportType,
      customType: customType
    });
    get().dispatch.setExportData();
  },
  onCustomTypeChange: (customType: string) => {
    get().dispatch.setExportSliceState({
      ...get().exportSliceState,
      customType: customType
    });
    get().dispatch.setExportData();

  },
  initAllKeys: () => {
    const modules = get().project?.projectJSON?.modules;
    return (modules || []).map((m: any, i: number) => {
      return {
        title: `${m.name}-${m.chnname || ''}`,
        value: i,
        children: m.entities.map((e: any, j: number) => {
          return {
            title: `${e.title}`,
            value: `${i}-${j}`,
          }
        })
      }
    });
  },
  onSelectTableChange: (selectTable: []) => {
    get().dispatch.setExportSliceState({
      ...get().exportSliceState,
      selectTable: selectTable
    });
    get().dispatch.setExportData();
  },
  setExportData: async () => {
    const {projectJSON: dataSource} = get().project;
    const {defaultDb, selectTable, customType} = get()?.exportSliceState || {};
    const dialectCode = defaultDb || get()?.dispatch.getCurrentDBData()?.select || 'MYSQL';
    const entityTitles = selectTable?.length ? [...selectTable] : undefined;
    const filter: ExportDdlFilterKey[] = (customType?.length
      ? customType
      : EXPORT_DDL_ALL_SEGMENTS) as ExportDdlFilterKey[];

    get().dispatch.setExportSliceState({
      ...get().exportSliceState,
      exportDdlLoading: true,
      exportDdlError: undefined,
    });

    const dbKey = get().dispatch.getCurrentDBData()?.key || SNAPSHOT_DB_KEY;
    try {
      const {sql} = await fetchExportDdl({
        projectJSON: dataSource as Record<string, unknown>,
        dialectCode,
        filter,
        entityTitles,
        dbKey,
      });
      get().dispatch.setExportSliceState({
        ...get().exportSliceState,
        data: sql,
        exportDdlLoading: false,
        exportDdlError: undefined,
      });
    } catch (err: unknown) {
      const reason = err instanceof Error ? err.message : storeFmt('store.export.ddlGenerateFailed');
      get().dispatch.setExportSliceState({
        ...get().exportSliceState,
        data: '',
        exportDdlLoading: false,
        exportDdlError: reason,
      });
     message.error(storeFmt('store.export.ddlPreviewFailed', { reason }));
    }
  },
  getExportData: () => {
    return get().exportSliceState?.data || '';
  },
  exportSQL: () => {
    const data = get().exportSliceState?.data;
    if (data) {
      try {
        File.save(data, `${dayjs().format('YYYY-MM-D-h-mm-ss')}.sql`);
        message.success(storeFmt('store.export.success'));
        return true;
      } catch (err: unknown) {
        const reason = err instanceof Error ? err.message : storeFmt('store.export.fileWriteFailed');
        showExportFailure('DDL', reason);
        return false;
      }
    }
    showExportFailure('DDL', storeFmt('store.export.noSqlContent'));
    return false;
  }

});


export default ExportSlice;

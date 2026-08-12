import { Modal, message } from 'antd';
import { getIntl } from '@umijs/max';
import useVersionStore from '@/store/version/useVersionStore';
import { track } from '@/utils/analytics';

/** 与后端 ApiErrorCode.VERSION_SAVE_DUPLICATE 对齐 */
export const VERSION_SAVE_DUPLICATE_CODE = 409001;

export type VersionSaveResponse = {
  code?: number;
  msg?: string;
  message?: string;
};

export function isVersionSaveDuplicate(
  res: VersionSaveResponse | null | undefined,
): boolean {
  return res?.code === VERSION_SAVE_DUPLICATE_CODE;
}

let duplicateModalOpen = false;

/** 409001 可行动文案：刷新版本列表后改用更大版本号 */
export function showVersionSaveDuplicateModal(): void {
  if (duplicateModalOpen) {
    return;
  }
  duplicateModalOpen = true;
  Modal.warning({
    title: getIntl().formatMessage({ id: 'utils.versionConflict.title' }),
    content: getIntl().formatMessage({ id: 'utils.versionConflict.content' }),
    okText: getIntl().formatMessage({ id: 'utils.versionConflict.refresh' }),
    closable: true,
    maskClosable: false,
    onOk: () => {
      duplicateModalOpen = false;
      return refreshVersionListAfterDuplicate();
    },
    afterClose: () => {
      duplicateModalOpen = false;
    },
  });
}

export async function refreshVersionListAfterDuplicate(): Promise<void> {
  const store = useVersionStore.getState();
  const dbData = store.dispatch.getCurrentDBData();
  if (!dbData?.key) {
    message.error(getIntl().formatMessage({ id: 'utils.versionConflict.noDatasource' }));
    return;
  }
  await store.fetch(dbData, store.currentPage, store.pageSize);
  await store.dispatch.fetchVersionBaseline(dbData);
  message.info(getIntl().formatMessage({ id: 'utils.versionConflict.listRefreshed' }));
}

export function handleVersionSaveResponse(
  res: VersionSaveResponse | null | undefined,
): boolean {
  if (isVersionSaveDuplicate(res)) {
    showVersionSaveDuplicateModal();
    return false;
  }
  const ok = res?.code === 200;
  if (ok) {
    // 北极星漏斗事件：一次成功的版本保存
    track('version_save', { code: res?.code });
  }
  return ok;
}

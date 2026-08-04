import { Modal, message } from 'antd';
import useVersionStore from '@/store/version/useVersionStore';

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
    title: '版本号冲突',
    content:
      '该版本号已被其他窗口或协作者占用。请刷新版本列表后改用更大的版本号再保存。',
    okText: '刷新版本列表',
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
    message.error('未找到当前数据源');
    return;
  }
  await store.fetch(dbData, store.currentPage, store.pageSize);
  await store.dispatch.fetchVersionBaseline(dbData);
  message.info('已刷新版本列表');
}

export function handleVersionSaveResponse(
  res: VersionSaveResponse | null | undefined,
): boolean {
  if (isVersionSaveDuplicate(res)) {
    showVersionSaveDuplicateModal();
    return false;
  }
  return res?.code === 200;
}

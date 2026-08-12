import { message } from 'antd';
import { getIntl } from '@umijs/max';

/**
 * 审批类操作统一反馈：成功提示并刷新表；失败不静默。
 */
export async function runApprovalAction(
  request: Promise<{ code?: number; msg?: string; message?: string }>,
  actionRef: { current?: { reload?: (resetPage?: boolean) => void } } | undefined,
  successText: string,
): Promise<boolean> {
  try {
    const r = await request;
    if (r?.code === 200) {
      message.success(successText);
      actionRef?.current?.reload?.(false);
      return true;
    }
    message.error(
      r?.msg || r?.message || getIntl().formatMessage({ id: 'approvalModal.actionFailed' }),
    );
    return false;
  } catch (e: any) {
    message.error(
      e?.message || getIntl().formatMessage({ id: 'approvalModal.actionFailed' }),
    );
    return false;
  }
}

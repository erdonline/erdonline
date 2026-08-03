import { Modal } from 'antd';
import type { ModalFuncProps } from 'antd';

export type DestructiveConfirmOptions = Omit<
  ModalFuncProps,
  'keyboard' | 'autoFocusButton' | 'focusTriggerAfterClose'
>;

/**
 * Destructive Modal.confirm with keyboard loop defaults:
 * Esc closes; first focus on OK (destructive); focus returns to trigger.
 */
export function confirmDestructive(options: DestructiveConfirmOptions) {
  return Modal.confirm({
    ...options,
    keyboard: true,
    autoFocusButton: 'ok',
    focusTriggerAfterClose: true,
  });
}

/** Focus a stable tree row action trigger before confirm (menu item unmounts). */
export function focusTreeActionTrigger(
  nodeTitle: string,
  actionAriaLabel: string,
): void {
  const items = Array.from(
    document.querySelectorAll<HTMLElement>('[role="treeitem"]'),
  );
  const treeitem = items.find((el) => {
    const label = el.getAttribute('aria-label') || el.textContent || '';
    return label.includes(nodeTitle);
  });
  const trigger =
    treeitem?.querySelector<HTMLElement>(`[aria-label="${actionAriaLabel}"]`) ??
    document.querySelector<HTMLElement>(`[aria-label="${actionAriaLabel}"]`);
  trigger?.focus();
}

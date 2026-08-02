/** Controlled dialog mount for ProjectMenu (trigger lives in Menu items). */
export type MenuDialogControl = {
  /** Hide the default text Button trigger (menu item supplies the label). */
  hideTrigger?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

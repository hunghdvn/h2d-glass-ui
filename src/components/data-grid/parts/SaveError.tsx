import { Alert } from '../../alert/Alert';

/**
 * The alert of a save that was refused (spec phase 6 §3.6, §4.3 E2 "Lỗi khi lưu"): one `Alert` `error` with a
 * button that takes it away, between the toolbar and the frame. Its `role="alert"` is its announcement, so the
 * grid's region says nothing more. When it goes while the focus is in it (the button that took it away), the
 * focus goes to the place of the grid, never to the page.
 */
export function SaveError({
  message,
  onDismiss,
  dismissLabel,
  restoreFocus,
}: {
  message: string;
  /** Takes the alert away. */
  onDismiss: () => void;
  /** The name of that button (`labels.dismissError`). */
  dismissLabel: string;
  /** Gives the focus to the place of the grid. */
  restoreFocus: () => void;
}) {
  return (
    <Alert
      status="error"
      role="alert"
      labels={{ dismiss: dismissLabel }}
      onDismiss={(event) => {
        const held = event.currentTarget.closest('.flg-alert')?.contains(document.activeElement);
        onDismiss();
        if (held) restoreFocus();
      }}
    >
      {message}
    </Alert>
  );
}

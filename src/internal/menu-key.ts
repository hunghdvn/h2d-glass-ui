/** What a key event says of its key and the modifiers held with it. */
export interface MenuKeyEvent {
  key: string;
  shiftKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
  metaKey: boolean;
}

/**
 * Whether a key asks for the context menu of what has the focus: the ContextMenu key, or Shift+F10 held
 * with nothing else. Not every browser turns these keys into a `contextmenu` event, so a menu that
 * opens from them handles the keys itself (`ContextMenu`, the column menu of the DataGrid).
 */
export function isMenuKey(event: MenuKeyEvent): boolean {
  return (
    event.key === 'ContextMenu' ||
    (event.key === 'F10' && event.shiftKey && !event.ctrlKey && !event.altKey && !event.metaKey)
  );
}

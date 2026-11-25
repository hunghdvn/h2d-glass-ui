/* eslint-disable jsx-a11y/no-static-element-interactions -- the box only watches the focus and the pointer of the editor it holds, and keeps a press on its own padding from taking the focus; it is no control. */
import { useState } from 'react';
import type { FocusEvent, ReactNode, Ref } from 'react';
import { AlertCircleIcon } from '../../../internal/icons';
import { TooltipContent, TooltipRoot, TooltipTrigger } from '../../tooltip/Tooltip';

/**
 * The box of an editor in a cell (spec phase 6 §4.3 E2 "Ô có lỗi"). It holds the editor and, while the field is
 * refused, the icon at its end (`pointer-events: none`), the words hidden in the cell for the editor to be
 * described by (always there while invalid, so they are read on focus before any tooltip), and the same words in a
 * tooltip of the library, below the box and lined up with its start, which is open while the cell has the focus
 * within or the pointer is on it. The tooltip is controlled and never opens by its own triggers, so it says
 * what is the matter and not what the control is. The box is the tooltip's trigger and is out of the Tab order, so
 * a press on its own padding keeps the focus where it is. `Esc` closes the tooltip first (the Tooltip takes that key, as
 * a tooltip does), and the next `Esc` is the editor's: the tooltip is let go of for as long as the focus stays.
 */
export function EditorBox({
  message,
  errorId,
  boxRef,
  onSettle,
  children,
}: {
  /** Why the field is refused; `undefined` while it is not. */
  message: string | undefined;
  /** The id the hidden words have, which the editor is described by. */
  errorId: string;
  boxRef: Ref<HTMLDivElement>;
  /** Called when the focus leaves the box: the field is settled. */
  onSettle: (event: FocusEvent<HTMLDivElement>) => void;
  children: ReactNode;
}) {
  const [within, setWithin] = useState(false);
  const [over, setOver] = useState(false);
  const open = message !== undefined && (within || over);
  return (
    <TooltipRoot
      open={open}
      onOpenChange={(next) => {
        if (next) return;
        setWithin(false);
        setOver(false);
      }}
      describe={false}
    >
      <TooltipTrigger>
        <div
          ref={boxRef}
          className="flg-data-grid-editor"
          tabIndex={-1}
          onFocus={() => setWithin(true)}
          onBlur={(event: FocusEvent<HTMLDivElement>) => {
            if (!event.currentTarget.contains(event.relatedTarget)) setWithin(false);
            onSettle(event);
          }}
          onPointerEnter={() => setOver(true)}
          onPointerLeave={() => setOver(false)}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) event.preventDefault();
          }}
        >
          {children}
          {message === undefined ? null : (
            <>
              <AlertCircleIcon
                className="flg-data-grid-editor-alert"
                width={16}
                height={16}
                aria-hidden="true"
              />
              <span id={errorId} className="flg-visually-hidden">
                {message}
              </span>
            </>
          )}
        </div>
      </TooltipTrigger>
      {message === undefined ? null : (
        <TooltipContent side="bottom" align="start" sideOffset={6}>
          <span className="flg-data-grid-error-text">
            <AlertCircleIcon width={14} height={14} aria-hidden="true" />
            {message}
          </span>
        </TooltipContent>
      )}
    </TooltipRoot>
  );
}

/**
 * The words of a cell that a refused save named (`batch` mode), where the cell holds no editor: the value, the icon at the
 * end and the words hidden in the cell for it to be described by, and the same words in a tooltip below it while the
 * pointer is on it. The editor's box is no help here: it paints the field's colour and is the editor's own.
 */
export function CellFault({
  message,
  faultId,
  children,
}: {
  message: string;
  /** The id the hidden words have, which the cell is described by. */
  faultId: string;
  children: ReactNode;
}) {
  const [over, setOver] = useState(false);
  return (
    <TooltipRoot
      open={over}
      onOpenChange={(next) => {
        if (!next) setOver(false);
      }}
      describe={false}
    >
      <TooltipTrigger>
        <span
          className="flg-data-grid-fault"
          // A focusable box for the tooltip, out of the Tab order, that no press gives the focus to.
          tabIndex={-1}
          onMouseDown={(event) => event.preventDefault()}
          onPointerEnter={() => setOver(true)}
          onPointerLeave={() => setOver(false)}
        >
          <span className="flg-data-grid-fault-value">{children}</span>
          <AlertCircleIcon
            className="flg-data-grid-editor-alert"
            width={16}
            height={16}
            aria-hidden="true"
          />
          <span id={faultId} className="flg-visually-hidden">
            {message}
          </span>
        </span>
      </TooltipTrigger>
      <TooltipContent side="bottom" align="start" sideOffset={6}>
        <span className="flg-data-grid-error-text">
          <AlertCircleIcon width={14} height={14} aria-hidden="true" />
          {message}
        </span>
      </TooltipContent>
    </TooltipRoot>
  );
}

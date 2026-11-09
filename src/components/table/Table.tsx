'use client';

import { clsx } from 'clsx';
import { createContext, forwardRef, useContext, useId, useMemo, useRef, useState } from 'react';
import type { HTMLAttributes, MutableRefObject, TableHTMLAttributes } from 'react';
import { dataAttr } from '../../internal/data-attr';
import { mergeRefs } from '../../internal/merge-refs';
import { useIsoLayoutEffect } from '../../internal/use-iso-layout-effect';
import { useRequireName } from '../../internal/use-require-name';
import { useHeadHeight } from './use-head-height';
import { useScrollable } from './use-scrollable';

export type TableVariant = 'lined' | 'striped' | 'minimal';

export type TableProps = TableHTMLAttributes<HTMLTableElement> & {
  variant?: TableVariant;
  size?: 'sm' | 'md';
  /** Keeps the column headings at the top of the frame while the rows scroll. Needs a height on the frame. */
  stickyHeader?: boolean;
};

export type TableCaptionProps = Omit<HTMLAttributes<HTMLTableCaptionElement>, 'id'>;

/** What the Table gives its caption: the id the scroll frame is named by, and a way to say it is there. */
interface TableContextValue {
  captionId: string;
  setCaptionId: (id: string | undefined) => void;
  /** Read by the name warning, which runs in the same commit as the caption's layout effect. */
  captionRef: MutableRefObject<string | undefined>;
}

const TableContext = createContext<TableContextValue | null>(null);

/**
 * A table in a scroll frame, in one of three looks. The frame is the visible box, so what is about
 * that box goes on it: `className`, `style`, `hidden` (a hidden table leaves no empty frame behind)
 * and `dir` and `lang` (the `<table>` inherits both, and the frame's scroll start and scrollbar
 * follow `dir`). `ref` and every other prop (`id`, `aria-label`, `data-*`…) go on the `<table>`.
 * The frame always scrolls, which a sticky heading needs and a table wider than its room is given
 * before any script runs. Once it has something to scroll it is also a named region a keyboard can
 * reach, which only script can know, so that comes after the first layout. The library does not
 * sort, filter or page the data: it draws the table and says what is sorted.
 */
export const Table = forwardRef<HTMLTableElement, TableProps>(function Table(
  {
    variant = 'lined',
    size = 'md',
    stickyHeader = false,
    className,
    style,
    hidden,
    dir,
    lang,
    children,
    ...props
  },
  ref,
) {
  const captionId = useId();
  const [namedByCaption, setNamedByCaption] = useState<string | undefined>();
  const captionRef = useRef<string | undefined>(undefined);
  const frameRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const scrollable = useScrollable(frameRef, tableRef);
  // A frame that has the keyboard focus keeps its role, tab stop and name when the table stops
  // overflowing (the window was widened, the device turned): taking `tabindex` off the focused
  // element would drop the focus to the body and lose the person's place. It goes when the focus
  // leaves, if there is still nothing to scroll.
  const [focused, setFocused] = useState(false);
  useHeadHeight(frameRef, tableRef, stickyHeader);
  const mergedRef = useMemo(() => mergeRefs(ref, tableRef), [ref]);
  const given = { 'aria-label': props['aria-label'], 'aria-labelledby': props['aria-labelledby'] };
  useRequireName(given, 'Table', {
    active: scrollable,
    otherName: { description: 'render a TableCaption inside it', ref: captionRef },
  });
  const context = useMemo(
    () => ({ captionId, setCaptionId: setNamedByCaption, captionRef }),
    [captionId],
  );
  // The region is named by the caption when there is one, and otherwise by the name the table was
  // given, which stays on the table too.
  const name = namedByCaption ? { 'aria-labelledby': namedByCaption } : given;
  return (
    <TableContext.Provider value={context}>
      <div
        ref={frameRef}
        className={clsx('flg-table-frame', className)}
        style={style}
        hidden={hidden}
        dir={dir}
        lang={lang}
        data-variant={variant}
        data-size={size}
        data-sticky-header={dataAttr(stickyHeader)}
        onFocus={(event) => setFocused(event.target === event.currentTarget)}
        onBlur={(event) => event.target === event.currentTarget && setFocused(false)}
        {...(scrollable || focused ? { role: 'region', tabIndex: 0, ...name } : undefined)}
      >
        <table ref={mergedRef} className="flg-table" {...props}>
          {children}
        </table>
      </div>
    </TableContext.Provider>
  );
});

/**
 * The name of the table, shown above it. It must be the first child of the `Table`, like a
 * `<caption>`. It is a client part because the Table gives it the id that its scroll frame is named
 * by; a caption outside a Table is a plain caption.
 */
export const TableCaption = forwardRef<HTMLTableCaptionElement, TableCaptionProps>(
  function TableCaption({ className, ...props }, ref) {
    const context = useContext(TableContext);
    const setCaptionId = context?.setCaptionId;
    const captionRef = context?.captionRef;
    const id = context?.captionId;
    useIsoLayoutEffect(() => {
      if (!setCaptionId || !captionRef || id === undefined) return undefined;
      captionRef.current = id;
      setCaptionId(id);
      return () => {
        captionRef.current = undefined;
        setCaptionId(undefined);
      };
    }, [id, setCaptionId, captionRef]);
    return (
      <caption ref={ref} className={clsx('flg-table-caption', className)} {...props} id={id} />
    );
  },
);

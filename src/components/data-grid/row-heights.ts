import type { TableVariant } from '../table/Table';
import type { DataGridDensity } from './types';

/**
 * The height of a data row in pixels, by density and variant (spec §4.3). A row has no vertical
 * padding in the grid, so this is the whole of it: the tallest content it usually holds (an
 * Avatar `sm`, 24px) plus the padding a Table of that size has, plus the 1px rule of `lined`. It
 * is the one copy of the table: the grid writes it to the root as `--flg-data-grid-row-height`,
 * and the stylesheet reads it from there.
 */
export const ROW_HEIGHT: Readonly<Record<DataGridDensity, Readonly<Record<TableVariant, number>>>> =
  {
    compact: { lined: 31, striped: 30, minimal: 36 },
    standard: { lined: 41, striped: 40, minimal: 52 },
    comfortable: { lined: 49, striped: 48, minimal: 60 },
  };

/** The custom property of the root that holds the height of a group row, which the stylesheet reads. */
export const GROUP_ROW_HEIGHT_PROPERTY = '--flg-data-grid-group-row-height';

/**
 * The height of a group row: that of a data row of the same density and variant less 8px, so a band
 * is a little lower than the rows it holds (spec phase 6 §4.3 R1). It does not follow `rowHeight`: the
 * caller's height is for the rows of data. The stylesheet's own default is the `standard` `lined` one.
 */
export function groupRowHeight(density: DataGridDensity, variant: TableVariant): number {
  return ROW_HEIGHT[density][variant] - 8;
}

/**
 * The distance between the tops of two neighbouring rows: the height, and for `striped` the 2px
 * its rows are apart. What a virtual window multiplies by before it has measured a real one.
 */
export function rowPitch(height: number, variant: TableVariant): number {
  return variant === 'striped' ? height + 2 : height;
}

const DENSITIES = Object.keys(ROW_HEIGHT) as DataGridDensity[];
const VARIANTS: readonly TableVariant[] = ['lined', 'striped', 'minimal'];

// A value outside a union is the default; looking it up in the list narrows it without a cast.
export function resolveDensity(value: unknown): DataGridDensity {
  return DENSITIES.find((density) => density === value) ?? 'standard';
}

export function resolveVariant(value: unknown): TableVariant {
  return VARIANTS.find((variant) => variant === value) ?? 'lined';
}

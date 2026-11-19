/**
 * Joins ids for an attribute such as `aria-describedby`: the ones that are set, or `undefined` when
 * none is, so the attribute is left out rather than written empty.
 */
export function joinIds(...ids: Array<string | false | null | undefined>): string | undefined {
  return ids.filter(Boolean).join(' ') || undefined;
}

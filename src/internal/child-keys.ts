import type { Key } from 'react';

/**
 * One React key for each child of a list, from the keys the children came with (`null` for a child
 * with none). Own keys and index fallbacks live in different key spaces (`$` and `#`), and an own
 * key that repeats, such as one from another array, falls back to the index, so no two keys are
 * equal. A child keeps its own key when it has one, so that reordering keyed children preserves
 * each one's state and DOM node.
 */
export function childKeys(keys: readonly (Key | null)[]): string[] {
  const used = new Set<string>();
  return keys.map((own, index) => {
    const ownKey = own !== null ? '$' + own : null;
    const key = ownKey !== null && !used.has(ownKey) ? ownKey : '#' + index;
    used.add(key);
    return key;
  });
}

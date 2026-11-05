import { createContext, useContext } from 'react';

/** What a SegmentedControl tells each SegmentedControlItem inside it. */
export interface SegmentedControlContextValue {
  name: string;
  form: string | undefined;
  value: string | null | undefined;
  defaultValue: string | undefined;
  onValueChange: ((value: string) => void) | undefined;
  required: boolean | undefined;
  disabled: boolean | undefined;
  /** Counts an item's value while it is mounted, and returns what undoes the count. */
  register: (value: string) => () => void;
}

export const SegmentedControlContext = createContext<SegmentedControlContextValue | null>(null);

export function useSegmentedControlContext(): SegmentedControlContextValue | null {
  return useContext(SegmentedControlContext);
}

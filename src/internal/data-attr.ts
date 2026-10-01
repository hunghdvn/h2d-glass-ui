/** Value for a boolean data-attribute: present (`""`) when true, omitted when false. */
export function dataAttr(condition: boolean | undefined): '' | undefined {
  return condition ? '' : undefined;
}

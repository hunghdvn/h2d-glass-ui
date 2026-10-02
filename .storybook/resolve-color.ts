/** The computed `rgb(…)` value of a CSS colour, such as `var(--flg-danger)`, inside `host`'s theme. */
export function resolveColor(host: HTMLElement, value: string): string {
  const probe = document.createElement('span');
  probe.style.color = value;
  host.append(probe);
  const color = getComputedStyle(probe).color;
  probe.remove();
  return color;
}

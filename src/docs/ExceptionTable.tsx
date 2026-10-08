import { KNOWN_EXCEPTIONS } from '../../scripts/contrast-exceptions';
import { CHECKS, measure } from '../../scripts/lib/contrast';
import * as values from '../styles/theme/values';
import type { ThemeName } from '../styles/theme/values';

/** Spec §4.9 as a table, built from the same data the contrast check enforces. */
export function ExceptionTable() {
  const rows = [...new Set(KNOWN_EXCEPTIONS.map((exception) => exception.row))];
  const live = {
    light: measure(values, 'light', 'default'),
    dark: measure(values, 'dark', 'default'),
  };
  return (
    <table>
      <thead>
        <tr>
          <th scope="col">#</th>
          <th scope="col">Where</th>
          <th scope="col">Light</th>
          <th scope="col">Dark</th>
          <th scope="col">WCAG AA minimum</th>
          <th scope="col">WCAG criterion</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const entries = KNOWN_EXCEPTIONS.filter((exception) => exception.row === row);
          const first = entries[0];
          if (!first) return null;
          const checks = [...new Set(entries.map((exception) => exception.check))];
          const cell = (theme: ThemeName) => {
            const own = entries.filter((exception) => exception.theme === theme);
            if (own.length > 0) {
              // Two checks of one pair (a checkbox's fill and a tab's bar) give one number.
              const recorded = own.map((exception) => `${exception.recorded.toFixed(2)}:1`);
              return [...new Set(recorded)].join(' / ');
            }
            // No exception for this theme: show what it actually measures, so the docs stay exact.
            const lowest = Math.min(...checks.map((check) => live[theme][check]));
            return `meets AA (${lowest.toFixed(2)}:1)`;
          };
          return (
            <tr key={row}>
              <th scope="row">{row}</th>
              <td>{first.description}</td>
              <td>{cell('light')}</td>
              <td>{cell('dark')}</td>
              <td>{first.minimum ?? `${CHECKS[first.check]}:1`}</td>
              <td>{first.criterion}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

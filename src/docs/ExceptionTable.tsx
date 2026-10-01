import { KNOWN_EXCEPTIONS } from '../../scripts/contrast-exceptions';
import { CHECKS } from '../../scripts/lib/contrast';

/** Spec §4.9 as a table, built from the same data the contrast check enforces. */
export function ExceptionTable() {
  const rows = [...new Set(KNOWN_EXCEPTIONS.map((exception) => exception.row))];
  return (
    <table>
      <thead>
        <tr>
          <th scope="col">#</th>
          <th scope="col">Where</th>
          <th scope="col">Light</th>
          <th scope="col">Dark</th>
          <th scope="col">WCAG AA minimum</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const entries = KNOWN_EXCEPTIONS.filter((exception) => exception.row === row);
          const first = entries[0];
          if (!first) return null;
          const cell = (theme: 'light' | 'dark') =>
            entries
              .filter((exception) => exception.theme === theme)
              .map((exception) => `${exception.recorded.toFixed(2)}:1`)
              .join(' / ') || 'meets AA';
          return (
            <tr key={row}>
              <td>{row}</td>
              <td>{first.description}</td>
              <td>{cell('light')}</td>
              <td>{cell('dark')}</td>
              <td>{CHECKS[first.check]}:1</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

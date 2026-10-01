import type { TokenMap } from '../styles/theme/values';

export interface TokenTableProps {
  columns: Readonly<Record<string, TokenMap>>;
}

const MAX = 80;
const shorten = (value: string) => (value.length > MAX ? `${value.slice(0, MAX - 1)}…` : value);

/** One row per token name, one column per token map (for example light and dark). */
export function TokenTable({ columns }: TokenTableProps) {
  const headers = Object.keys(columns);
  const names = [...new Set(Object.values(columns).flatMap((map) => Object.keys(map)))];
  return (
    <table>
      <thead>
        <tr>
          <th scope="col">Token</th>
          {headers.map((header) => (
            <th key={header} scope="col">
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {names.map((name) => (
          <tr key={name}>
            <th scope="row">
              <code>--flg-{name}</code>
            </th>
            {headers.map((header) => {
              const value = columns[header]?.[name];
              return (
                <td key={header}>
                  {value === undefined ? '—' : <code title={value}>{shorten(value)}</code>}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

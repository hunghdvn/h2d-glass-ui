// A Server Component: the Select of phase 2, plan C, with its items written on the server, which the
// Select reads without rendering them. The Vite fixture renders the same markup on the client.
import { Field, Select, SelectGroup, SelectItem } from 'h2d-glass-ui';

export function Selects() {
  return (
    <form aria-label="Schedule" style={{ display: 'grid', gap: 12 }}>
      <Field label="Frequency" required>
        <Select name="frequency" defaultValue="weekly">
          <SelectGroup label="Frequency">
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
          </SelectGroup>
        </Select>
      </Field>
      <Field label="Departments">
        <Select multiple name="departments" defaultValue={['design']}>
          <SelectItem value="design">Design</SelectItem>
          <SelectItem value="marketing">Marketing</SelectItem>
        </Select>
      </Field>
    </form>
  );
}

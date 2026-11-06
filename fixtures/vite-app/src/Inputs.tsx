// The eight inputs of phase 3 in one form, with their values read back from FormData on submit. The
// Next.js fixture posts the same form to a Server Action; `vite preview` serves static files only, so
// this one reads the FormData in the browser instead.
import {
  Button,
  Calendar,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Combobox,
  ComboboxItem,
  DatePicker,
  Field,
  FileUpload,
  NumberInput,
  SegmentedControl,
  SegmentedControlItem,
  Slider,
  TagInput,
} from 'h2d-glass-ui';
import { useState, type FormEvent } from 'react';

const NAMES = ['budget', 'guests', 'view', 'city', 'tags', 'files', 'checkIn'];

export function Inputs() {
  const [submitted, setSubmitted] = useState('');
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const values: Record<string, string[]> = {};
    for (const name of NAMES) {
      values[name] = data.getAll(name).map((entry) => (entry instanceof File ? entry.name : entry));
    }
    setSubmitted(JSON.stringify(values));
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle>Book a room</CardTitle>
      </CardHeader>
      <CardContent>
        <form aria-label="Booking" onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
          <Field label="Budget">
            <Slider name="budget" defaultValue={[20, 80]} />
          </Field>
          <Field label="Guests">
            <NumberInput name="guests" defaultValue={2} min={1} max={10} />
          </Field>
          <Field label="View">
            <SegmentedControl name="view" defaultValue="grid">
              <SegmentedControlItem value="grid">Grid</SegmentedControlItem>
              <SegmentedControlItem value="list">List</SegmentedControlItem>
            </SegmentedControl>
          </Field>
          <Field label="City">
            <Combobox name="city" placeholder="Search a city…">
              <ComboboxItem value="hn">Hà Nội</ComboboxItem>
              <ComboboxItem value="dn">Đà Nẵng</ComboboxItem>
              <ComboboxItem value="hue">Huế</ComboboxItem>
            </Combobox>
          </Field>
          <Field label="Tags">
            <TagInput name="tags" placeholder="Add a tag…" />
          </Field>
          <Field label="Attachments">
            <FileUpload name="files" />
          </Field>
          <Field label="Check-in" description="Write it as mm/dd/yyyy.">
            <DatePicker name="checkIn" />
          </Field>
          <Button type="submit">Book</Button>
        </form>
        <output data-testid="submitted">{submitted}</output>
      </CardContent>
      <Calendar aria-label="Availability" />
    </Card>
  );
}

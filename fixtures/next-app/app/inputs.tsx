'use client';

// The eight inputs of phase 3 in one form, posted to a Server Action. The action's answer is shown
// in <output>, so the check can compare what the server received.
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
import { useActionState } from 'react';
import { book, type Booking } from './actions';

export function Inputs() {
  const [booking, action] = useActionState<Booking, FormData>(book, null);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Book a room</CardTitle>
      </CardHeader>
      <CardContent>
        <form aria-label="Booking" action={action} style={{ display: 'grid', gap: 12 }}>
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
        <output data-testid="submitted">{booking ? JSON.stringify(booking) : ''}</output>
      </CardContent>
      <Calendar aria-label="Availability" />
    </Card>
  );
}

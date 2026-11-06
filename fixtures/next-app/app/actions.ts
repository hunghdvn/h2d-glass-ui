'use server';

// The Server Action of the booking form. It returns plain data only: strings, an array and the names
// of the files, which is what a Server Action can send back to the client.
export type Booking = {
  budget: string[];
  guests: string;
  view: string;
  city: string;
  checkIn: string;
  tags: string[];
  files: string[];
} | null;

const text = (value: FormDataEntryValue | null) => (typeof value === 'string' ? value : '');

export async function book(_previous: Booking, formData: FormData): Promise<Booking> {
  return {
    budget: formData.getAll('budget').map(text),
    guests: text(formData.get('guests')),
    view: text(formData.get('view')),
    city: text(formData.get('city')),
    checkIn: text(formData.get('checkIn')),
    tags: formData.getAll('tags').map(text),
    files: formData.getAll('files').map((entry) => (entry instanceof File ? entry.name : '')),
  };
}

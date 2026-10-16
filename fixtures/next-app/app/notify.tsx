'use client';

// Plan E1: a toast shown while the Dialog is open. A Server Component cannot pass the click handler,
// so the button is a client component of the fixture's own.
import { Button, toast } from 'fl-glass-ui';

export function NotifyButton() {
  return (
    <Button variant="secondary" onClick={() => toast.success('Profile saved')}>
      Notify
    </Button>
  );
}

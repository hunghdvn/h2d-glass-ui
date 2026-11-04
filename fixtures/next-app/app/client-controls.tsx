'use client';

import { Checkbox, Field, Radio, RadioGroup } from 'h2d-glass-ui';
import { useEffect, useState } from 'react';

const CHANNELS = ['email', 'sms'];

// Controlled components inside a Client Component. `data-hydrated` tells the check that React has
// attached its event handlers.
export function ClientControls() {
  const [hydrated, setHydrated] = useState(false);
  const [channels, setChannels] = useState(['email']);
  const [period, setPeriod] = useState('monthly');
  useEffect(() => setHydrated(true), []);
  return (
    <section data-hydrated={hydrated ? '' : undefined} style={{ display: 'grid', gap: 12 }}>
      <Checkbox
        checked={channels.length === CHANNELS.length}
        indeterminate={channels.length === 1}
        onCheckedChange={(checked) => setChannels(checked ? CHANNELS : [])}
      >
        All channels
      </Checkbox>
      <Field label="Billing period">
        <RadioGroup value={period} onValueChange={setPeriod}>
          <Radio value="monthly">Monthly</Radio>
          <Radio value="yearly">Yearly</Radio>
        </RadioGroup>
      </Field>
    </section>
  );
}

// Every component of phase 1, rendered with React 18.3, the bottom of the supported range.
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Checkbox,
  Divider,
  Field,
  IconButton,
  Input,
  Radio,
  RadioGroup,
  Spinner,
  Surface,
  Switch,
  Textarea,
  Toaster,
} from 'fl-glass-ui';
import { useEffect, useState } from 'react';
import { Menus } from './Menus';
import { Navigation } from './Navigation';
import { Overlays } from './Overlays';
import { Selects } from './Selects';

const CHANNELS = ['email', 'sms'];

export function App() {
  const [hydrated, setHydrated] = useState(false);
  const [channels, setChannels] = useState(['email']);
  const [period, setPeriod] = useState('monthly');
  useEffect(() => setHydrated(true), []);
  return (
    <main
      data-hydrated={hydrated ? '' : undefined}
      style={{ display: 'grid', gap: 16, maxWidth: 420, margin: '32px auto' }}
    >
      <Surface style={{ padding: 16 }}>A surface.</Surface>
      <Card>
        <CardHeader>
          <CardTitle>Create an account</CardTitle>
          <CardDescription>Every component of phase 1 on one page.</CardDescription>
        </CardHeader>
        <CardContent style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Badge variant="accent">Pro</Badge>
            <Spinner label="Loading usage" />
            <Avatar src="/avatar.svg" alt="Image with a size" fallback="IS" />
            <Avatar src="/missing.png" alt="Missing image" fallback="MI" />
            <Avatar src="/no-size.svg" alt="Image without a size" fallback="NS" />
          </div>
          <Divider />
          <Field label="Email" description="We only use it to send sign-in links." required>
            <Input name="email" type="email" />
          </Field>
          <Field label="About you">
            <Textarea name="bio" />
          </Field>
          <Field label="Plan" description="Billed monthly.">
            <RadioGroup name="plan" defaultValue="pro" orientation="horizontal">
              <Radio value="free">Free</Radio>
              <Radio value="pro">Pro</Radio>
            </RadioGroup>
          </Field>
          <Checkbox name="terms">I accept the terms of service</Checkbox>
          <Switch name="news" defaultChecked>
            Product news by email
          </Switch>
        </CardContent>
        <CardFooter>
          <IconButton aria-label="Settings" variant="ghost">
            ⚙
          </IconButton>
          <Button>Create account</Button>
        </CardFooter>
      </Card>
      <section style={{ display: 'grid', gap: 12 }}>
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
      <Overlays />
      <Toaster />
      <Menus />
      <Selects />
      <Navigation />
    </main>
  );
}

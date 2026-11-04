// A Server Component: the server-safe components render here directly, and the client components
// are composed here too, the way an App Router page would use them.
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
} from 'h2d-glass-ui';
import { ClientControls } from './client-controls';
import { Menus } from './menus';
import { Navigation } from './navigation';
import { Overlays } from './overlays';
import { Selects } from './selects';

export default function Page() {
  return (
    <main style={{ display: 'grid', gap: 16, maxWidth: 420, margin: '32px auto' }}>
      <Surface style={{ padding: 16 }}>A surface rendered on the server.</Surface>
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
      <ClientControls />
      <Overlays />
      <Menus />
      <Selects />
      <Navigation />
    </main>
  );
}

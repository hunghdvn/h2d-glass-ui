import type { Meta, StoryObj } from '@storybook/react-vite';
import type { FormEvent } from 'react';
import { expect, fn, userEvent } from 'storybook/test';
import { MailIcon } from '../../.storybook/icons';
import { Button } from '../components/button/Button';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/card/Card';
import { Checkbox } from '../components/checkbox/Checkbox';
import { Field } from '../components/field/Field';
import { Input } from '../components/input/Input';
import { Radio } from '../components/radio-group/Radio';
import { RadioGroup } from '../components/radio-group/RadioGroup';
import { Switch } from '../components/switch/Switch';
import { Textarea } from '../components/textarea/Textarea';

interface SignUpFormProps {
  onSubmit: (values: Record<string, FormDataEntryValue>) => void;
}

function SignUpForm({ onSubmit }: SignUpFormProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(Object.fromEntries(new FormData(event.currentTarget)));
  };
  return (
    <Card style={{ width: 380 }}>
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>Start a 14-day trial. No card needed.</CardDescription>
      </CardHeader>
      <form
        aria-label="Create an account"
        onSubmit={handleSubmit}
        style={{ display: 'grid', gap: 14 }}
      >
        <Field label="Email" description="We only use it to send sign-in links." required>
          <Input
            name="email"
            type="email"
            placeholder="you@company.com"
            startContent={<MailIcon />}
          />
        </Field>
        <Field label="Password" required>
          <Input name="password" type="password" minLength={8} />
        </Field>
        <Field label="About you">
          <Textarea name="bio" placeholder="A few lines about you" />
        </Field>
        <Field label="Plan">
          <RadioGroup name="plan" defaultValue="pro" orientation="horizontal">
            <Radio value="free">Free</Radio>
            <Radio value="pro">Pro</Radio>
            <Radio value="team">Team</Radio>
          </RadioGroup>
        </Field>
        <Switch name="news" defaultChecked>
          Product news by email
        </Switch>
        <Checkbox name="terms" value="accepted" required>
          I accept the terms of service
        </Checkbox>
        <CardFooter>
          <Button variant="ghost" type="reset">
            Clear
          </Button>
          <Button type="submit">Create account</Button>
        </CardFooter>
      </form>
    </Card>
  );
}

const meta = {
  title: 'Examples/Sign-up form',
  component: SignUpForm,
  args: { onSubmit: fn() },
} satisfies Meta<typeof SignUpForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SignUp: Story = {
  play: async ({ canvas, args }) => {
    const form = canvas.getByRole('form', { name: 'Create an account' }) as HTMLFormElement;
    await expect(form.checkValidity()).toBe(false);

    await userEvent.type(canvas.getByRole('textbox', { name: 'Email' }), 'ann@example.com');
    await userEvent.type(canvas.getByLabelText(/^Password/), 'correct horse');
    await userEvent.click(canvas.getByRole('radio', { name: 'Team' }));
    await userEvent.click(canvas.getByRole('checkbox', { name: 'I accept the terms of service' }));
    await expect(form.checkValidity()).toBe(true);

    await userEvent.click(canvas.getByRole('button', { name: 'Create account' }));
    await expect(args.onSubmit).toHaveBeenCalledWith({
      email: 'ann@example.com',
      password: 'correct horse',
      bio: '',
      plan: 'team',
      news: 'on',
      terms: 'accepted',
    });
  },
};

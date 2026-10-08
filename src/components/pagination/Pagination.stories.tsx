import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Card } from '../card/Card';
import { Pagination } from './Pagination';

const meta = {
  title: 'Components/Pagination',
  component: Pagination,
  args: { count: 12, onPageChange: fn() },
} satisfies Meta<typeof Pagination>;

export default meta;
type Story = StoryObj<typeof meta>;

// The card the mockup puts the pages in (mockup G1).
const card = { padding: '10px 14px', width: 'fit-content' } as const;

export const Default: Story = {
  render: (args) => (
    <Card style={card}>
      <Pagination {...args} defaultPage={5} />
    </Card>
  ),
};

export const Buttons: Story = {
  tags: ['no-visual'],
  render: (args) => <Pagination {...args} count={5} />,
  play: async ({ canvas, args }) => {
    const previous = canvas.getByRole('button', { name: 'Previous page' });
    const next = canvas.getByRole('button', { name: 'Next page' });
    await expect(previous).toBeDisabled();
    // Tab skips the disabled previous button and reaches the first page.
    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: 'Page 1' })).toHaveFocus();
    await userEvent.click(next);
    await expect(args.onPageChange).toHaveBeenLastCalledWith(2);
    await expect(canvas.getByRole('button', { name: 'Page 2' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await userEvent.click(canvas.getByRole('button', { name: 'Page 5' }));
    await expect(next).toBeDisabled();
    await expect(previous).toBeEnabled();
    await userEvent.click(previous);
    await expect(args.onPageChange).toHaveBeenLastCalledWith(4);
  },
};

export const Links: Story = {
  tags: ['no-visual'],
  render: (args) => <Pagination {...args} getHref={(page) => `#page-${page}`} />,
  play: async ({ canvasElement, args }) => {
    const nav = within(canvasElement).getByRole('navigation', { name: 'Pagination' });
    const previous = within(nav).getByLabelText('Previous page');
    // At the first page the previous link has no href and takes no focus.
    await expect(previous).not.toHaveAttribute('href');
    await expect(previous).toHaveAttribute('aria-disabled', 'true');
    await userEvent.tab();
    await expect(within(nav).getByRole('link', { name: 'Page 1' })).toHaveFocus();
    // A link reports the page; the browser would then follow its href. Following it here would
    // take the test's own page away, so the story stops the navigation (the component does not).
    nav.addEventListener('click', (event) => event.preventDefault());
    const page3 = within(nav).getByRole('link', { name: 'Page 3' });
    await expect(page3).toHaveAttribute('href', '#page-3');
    await userEvent.click(page3);
    await expect(args.onPageChange).toHaveBeenLastCalledWith(3);
    await expect(within(nav).getByRole('link', { name: 'Previous page' })).toHaveAttribute(
      'href',
      '#page-2',
    );
  },
};

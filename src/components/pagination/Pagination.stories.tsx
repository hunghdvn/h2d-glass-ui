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
    // At an end the button does nothing, and still takes focus.
    await expect(previous).toHaveAttribute('aria-disabled', 'true');
    await userEvent.tab();
    await expect(previous).toHaveFocus();
    await userEvent.click(previous);
    await expect(args.onPageChange).not.toHaveBeenCalled();
    await userEvent.click(next);
    await expect(args.onPageChange).toHaveBeenLastCalledWith(2);
    await expect(canvas.getByRole('button', { name: 'Page 2' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    // The keyboard to the last page: Next keeps the focus there instead of dropping it.
    next.focus();
    await userEvent.keyboard('{Enter}{Enter}{Enter}');
    await expect(args.onPageChange).toHaveBeenLastCalledWith(5);
    await expect(next).toHaveAttribute('aria-disabled', 'true');
    await expect(next).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await expect(args.onPageChange).toHaveBeenCalledTimes(4);
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
    // It does so on the document, after the component has seen the click: a click cancelled before
    // then is left to whoever cancelled it.
    const stop = (event: Event) => event.preventDefault();
    canvasElement.ownerDocument.addEventListener('click', stop);
    try {
      const page3 = within(nav).getByRole('link', { name: 'Page 3' });
      await expect(page3).toHaveAttribute('href', '#page-3');
      await userEvent.click(page3);
      await expect(args.onPageChange).toHaveBeenLastCalledWith(3);
      await expect(within(nav).getByRole('link', { name: 'Previous page' })).toHaveAttribute(
        'href',
        '#page-2',
      );
    } finally {
      canvasElement.ownerDocument.removeEventListener('click', stop);
    }
  },
};

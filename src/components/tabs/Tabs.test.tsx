import { act, fireEvent, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetDevWarnings } from '../../internal/warn';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './Tabs';
import type { TabsProps } from './Tabs';

function Example(props: Omit<TabsProps, 'children'>) {
  return (
    <Tabs {...props}>
      <TabsList aria-label="Project">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="members">Members</TabsTrigger>
        <TabsTrigger value="billing" disabled>
          Billing
        </TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">Overview panel</TabsContent>
      <TabsContent value="members">Members panel</TabsContent>
      <TabsContent value="billing">Billing panel</TabsContent>
      <TabsContent value="settings">Settings panel</TabsContent>
    </Tabs>
  );
}

const tab = (name: string) => screen.getByRole('tab', { name });
const press = (key: string, init: Record<string, boolean> = {}) =>
  fireEvent.keyDown(document.activeElement ?? document.body, { key, ...init });

describe('Tabs', () => {
  beforeEach(() => resetDevWarnings());
  afterEach(() => vi.restoreAllMocks());

  it('ties every tab to its panel and shows only the selected panel', () => {
    render(<Example defaultValue="members" />);
    const list = screen.getByRole('tablist', { name: 'Project' });
    expect(list).toHaveAttribute('aria-orientation', 'horizontal');
    const members = tab('Members');
    expect(members).toHaveAttribute('aria-selected', 'true');
    expect(tab('Overview')).toHaveAttribute('aria-selected', 'false');
    const panel = screen.getByRole('tabpanel', { name: 'Members' });
    expect(members).toHaveAttribute('aria-controls', panel.id);
    expect(panel).toHaveTextContent('Members panel');
    expect(panel).toHaveAttribute('tabindex', '0');
    // The other panels stay mounted, hidden.
    expect(screen.getByText('Overview panel')).not.toBeVisible();
    expect(screen.getAllByRole('tabpanel', { hidden: true })).toHaveLength(4);
  });

  it('builds ids that stay single tokens whatever the value holds', () => {
    render(
      <Tabs defaultValue="Billing history">
        <TabsList aria-label="Account">
          <TabsTrigger value="Billing history">Billing history</TabsTrigger>
          <TabsTrigger value="Billing_history">Underscore</TabsTrigger>
        </TabsList>
        <TabsContent value="Billing history">History</TabsContent>
        <TabsContent value="Billing_history">Other</TabsContent>
      </Tabs>,
    );
    const first = tab('Billing history');
    const second = tab('Underscore');
    expect(first.getAttribute('aria-controls')).not.toMatch(/\s/);
    expect(first.id).not.toBe(second.id);
    expect(screen.getByRole('tabpanel', { name: 'Billing history' })).toHaveTextContent('History');
  });

  it('gives Tab to the selected tab only', () => {
    render(<Example defaultValue="members" />);
    expect(tab('Members')).toHaveAttribute('tabindex', '0');
    for (const name of ['Overview', 'Billing', 'Settings']) {
      expect(tab(name)).toHaveAttribute('tabindex', '-1');
    }
  });

  it('gives Tab to the first enabled tab when no enabled tab is selected', () => {
    const { rerender } = render(<Example />);
    expect(tab('Overview')).toHaveAttribute('tabindex', '0');
    rerender(<Example value="billing" onValueChange={() => {}} />);
    expect(tab('Overview')).toHaveAttribute('tabindex', '0');
    expect(tab('Billing')).toHaveAttribute('tabindex', '-1');
  });

  it('moves with the arrows, wraps at the ends and skips a disabled tab, selecting as it goes', () => {
    const onValueChange = vi.fn();
    render(<Example defaultValue="overview" onValueChange={onValueChange} />);
    act(() => tab('Overview').focus());
    press('ArrowRight');
    expect(tab('Members')).toHaveFocus();
    expect(tab('Members')).toHaveAttribute('aria-selected', 'true');
    press('ArrowRight');
    expect(tab('Settings')).toHaveFocus();
    press('ArrowRight');
    expect(tab('Overview')).toHaveFocus();
    press('ArrowLeft');
    expect(tab('Settings')).toHaveFocus();
    press('Home');
    expect(tab('Overview')).toHaveFocus();
    press('End');
    expect(tab('Settings')).toHaveFocus();
    expect(onValueChange.mock.calls.map(([value]) => value)).toEqual([
      'members',
      'settings',
      'overview',
      'settings',
      'overview',
      'settings',
    ]);
  });

  it('leaves the arrows of the other orientation and keys with Alt, Ctrl or Meta alone', () => {
    render(<Example defaultValue="overview" />);
    act(() => tab('Overview').focus());
    press('ArrowDown');
    press('ArrowRight', { ctrlKey: true });
    press('ArrowRight', { altKey: true });
    press('End', { metaKey: true });
    expect(tab('Overview')).toHaveFocus();
    expect(tab('Overview')).toHaveAttribute('aria-selected', 'true');
  });

  it('uses ↑ and ↓ when vertical', () => {
    render(<Example defaultValue="overview" orientation="vertical" />);
    expect(screen.getByRole('tablist')).toHaveAttribute('aria-orientation', 'vertical');
    act(() => tab('Overview').focus());
    press('ArrowDown');
    expect(tab('Members')).toHaveFocus();
    press('ArrowRight');
    expect(tab('Members')).toHaveFocus();
  });

  it('moves focus without selecting in manual mode, and selects on a click', () => {
    const onValueChange = vi.fn();
    render(
      <Example defaultValue="overview" activationMode="manual" onValueChange={onValueChange} />,
    );
    act(() => tab('Overview').focus());
    press('ArrowRight');
    expect(tab('Members')).toHaveFocus();
    expect(tab('Overview')).toHaveAttribute('aria-selected', 'true');
    expect(onValueChange).not.toHaveBeenCalled();
    // Enter and Space click a focused button.
    fireEvent.click(tab('Members'));
    expect(onValueChange).toHaveBeenCalledWith('members');
    expect(tab('Members')).toHaveAttribute('aria-selected', 'true');
  });

  it('reports a click on a controlled Tabs and keeps the value its parent gives', () => {
    const onValueChange = vi.fn();
    render(<Example value="overview" onValueChange={onValueChange} />);
    fireEvent.click(tab('Settings'));
    expect(onValueChange).toHaveBeenCalledWith('settings');
    expect(tab('Overview')).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Overview panel')).toBeVisible();
  });

  it('renders the selected panel on the server and hides the others', () => {
    const html = renderToString(<Example defaultValue="settings" />);
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const panels = Array.from(doc.querySelectorAll('[role="tabpanel"]'));
    expect(
      panels.filter((panel) => !panel.hasAttribute('hidden')).map((p) => p.textContent),
    ).toEqual(['Settings panel']);
    expect(doc.querySelector('[aria-selected="true"]')?.getAttribute('tabindex')).toBe('0');
  });

  it('warns when a part is rendered outside Tabs', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<TabsTrigger value="lost">Lost</TabsTrigger>);
    expect(warn).toHaveBeenCalledWith(
      '[fl-glass-ui] <TabsTrigger> must be rendered inside a <Tabs>.',
    );
  });
});

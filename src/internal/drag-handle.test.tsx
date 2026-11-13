import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { onHandleControl } from './drag-handle';

/** A press on `target` as the handle `currentTarget` hears it. */
const pressOn = (target: EventTarget, currentTarget: Element) =>
  onHandleControl({ target, currentTarget });

describe('onHandleControl', () => {
  it('is true for a control inside the handle, and for what is inside that control', () => {
    render(
      <div data-testid="handle">
        <button type="button">
          <span>Help</span>
        </button>
        <a href="#top">Top</a>
        <span role="button" tabIndex={0}>
          Focusable
        </span>
        <label>
          Label <input />
        </label>
      </div>,
    );
    const handle = screen.getByTestId('handle');
    for (const target of [
      screen.getByRole('button', { name: 'Help' }),
      screen.getByText('Help'),
      screen.getByText('Top'),
      screen.getByText('Focusable'),
      screen.getByText('Label'),
      screen.getByRole('textbox'),
    ]) {
      expect(pressOn(target, handle)).toBe(true);
    }
  });

  it('is false for the handle, for what is not a control, and for a control around the handle', () => {
    render(
      <button type="button">
        <span data-testid="handle">
          Edit order <span tabIndex={-1}>DH-1028</span>
        </span>
      </button>,
    );
    const handle = screen.getByTestId('handle');
    expect(pressOn(handle, handle)).toBe(false);
    expect(pressOn(screen.getByText('DH-1028'), handle)).toBe(false);
    expect(pressOn(document, handle)).toBe(false);
  });
});

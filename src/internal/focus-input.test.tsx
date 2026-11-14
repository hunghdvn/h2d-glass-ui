import { fireEvent, render, screen } from '@testing-library/react';
import { createPortal } from 'react-dom';
import { describe, expect, it } from 'vitest';
import { focusInput } from './focus-input';

const renderFrame = (disabled = false) =>
  render(
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div data-testid="frame" onMouseDown={focusInput}>
      <span>decoration</span>
      <button type="button">clear</button>
      <input aria-label="text" disabled={disabled} />
    </div>,
  );

describe('focusInput', () => {
  it('focuses the input on a press on the frame or a decorative part, and cancels the press', () => {
    renderFrame();
    expect(fireEvent.mouseDown(screen.getByTestId('frame'))).toBe(false);
    expect(screen.getByRole('textbox')).toHaveFocus();
    screen.getByRole('textbox').blur();
    expect(fireEvent.mouseDown(screen.getByText('decoration'))).toBe(false);
    expect(screen.getByRole('textbox')).toHaveFocus();
  });

  it('leaves a press on the input, on an interactive part, or by another button alone', () => {
    renderFrame();
    expect(fireEvent.mouseDown(screen.getByRole('textbox'))).toBe(true);
    expect(fireEvent.mouseDown(screen.getByRole('button'))).toBe(true);
    expect(fireEvent.mouseDown(screen.getByTestId('frame'), { button: 2 })).toBe(true);
    expect(screen.getByRole('textbox')).not.toHaveFocus();
  });

  it('does nothing when the input is disabled', () => {
    renderFrame(true);
    expect(fireEvent.mouseDown(screen.getByTestId('frame'))).toBe(true);
  });

  it('leaves alone a press on a part that a portal renders elsewhere, which is not the frame', () => {
    render(
      // eslint-disable-next-line jsx-a11y/no-static-element-interactions
      <div data-testid="frame" onMouseDown={focusInput}>
        <input aria-label="text" />
        {createPortal(<span>suggestions</span>, document.body)}
      </div>,
    );
    expect(fireEvent.mouseDown(screen.getByText('suggestions'))).toBe(true);
    expect(screen.getByRole('textbox')).not.toHaveFocus();
  });
});

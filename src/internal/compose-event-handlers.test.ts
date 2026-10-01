import { describe, expect, it, vi } from 'vitest';
import { composeEventHandlers } from './compose-event-handlers';

interface FakeEvent {
  defaultPrevented: boolean;
  preventDefault(): void;
}

const makeEvent = (): FakeEvent => {
  const event: FakeEvent = {
    defaultPrevented: false,
    preventDefault() {
      event.defaultPrevented = true;
    },
  };
  return event;
};

describe('composeEventHandlers', () => {
  it('calls the user handler before the internal one', () => {
    const calls: string[] = [];
    const handler = composeEventHandlers<FakeEvent>(
      () => calls.push('user'),
      () => calls.push('internal'),
    );
    handler(makeEvent());
    expect(calls).toEqual(['user', 'internal']);
  });

  it('skips the internal handler when the user handler prevents default', () => {
    const internal = vi.fn();
    const handler = composeEventHandlers<FakeEvent>((event) => event.preventDefault(), internal);
    handler(makeEvent());
    expect(internal).not.toHaveBeenCalled();
  });

  it('works when either handler is missing', () => {
    const internal = vi.fn();
    composeEventHandlers<FakeEvent>(undefined, internal)(makeEvent());
    expect(internal).toHaveBeenCalledOnce();
    expect(() => composeEventHandlers<FakeEvent>(vi.fn(), undefined)(makeEvent())).not.toThrow();
  });
});

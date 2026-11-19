import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createAutoScroll } from './auto-scroll';

// A frame clock the test drives by hand, and an element whose box is 100..500 across and 50..250
// down, so each case says where the pointer is and how many frames have passed.

const queue = new Map<number, FrameRequestCallback>();
let next = 1;
const runFrame = () => {
  const callbacks = [...queue.values()];
  queue.clear();
  for (const callback of callbacks) callback(0);
};

beforeEach(() => {
  queue.clear();
  next = 1;
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    queue.set(next, callback);
    return next++;
  });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => {
    queue.delete(id);
  });
});
afterEach(() => {
  vi.unstubAllGlobals();
});

function box() {
  const element = document.createElement('div');
  element.getBoundingClientRect = () =>
    ({ left: 100, right: 500, top: 50, bottom: 250, width: 400, height: 200 }) as DOMRect;
  element.scrollLeft = 200;
  element.scrollTop = 200;
  return element;
}

describe('createAutoScroll', () => {
  it('scrolls nothing while the pointer is 40px or more from every edge', () => {
    const element = box();
    const scroll = createAutoScroll(element, { axis: 'both' });
    scroll.update(300, 150);
    runFrame();
    expect(element.scrollLeft).toBe(200);
    expect(element.scrollTop).toBe(200);
    expect(queue.size).toBe(0);
    scroll.update(140, 90);
    runFrame();
    expect(element.scrollLeft).toBe(200);
    expect(element.scrollTop).toBe(200);
  });

  it('scrolls towards an edge by a share of 20px a frame that grows as the pointer nears it', () => {
    const element = box();
    const scroll = createAutoScroll(element, { axis: 'x' });
    // 20px from the left edge: half of the zone, so half the speed, 10px.
    scroll.update(120, 150);
    runFrame();
    expect(element.scrollLeft).toBe(190);
    // 10px from the right edge: three quarters, 15px.
    scroll.update(490, 150);
    runFrame();
    expect(element.scrollLeft).toBe(205);
    scroll.stop();
  });

  it('scrolls 20px a frame at the edge and beyond it', () => {
    const element = box();
    const scroll = createAutoScroll(element, { axis: 'x' });
    scroll.update(100, 150);
    runFrame();
    expect(element.scrollLeft).toBe(180);
    scroll.update(-300, 150);
    runFrame();
    expect(element.scrollLeft).toBe(160);
    scroll.update(500, 150);
    runFrame();
    expect(element.scrollLeft).toBe(180);
    scroll.update(900, 150);
    runFrame();
    expect(element.scrollLeft).toBe(200);
    scroll.stop();
  });

  it('keeps scrolling a frame at a time under a pointer that does not move', () => {
    const element = box();
    const scroll = createAutoScroll(element, { axis: 'x' });
    scroll.update(500, 150);
    runFrame();
    runFrame();
    runFrame();
    expect(element.scrollLeft).toBe(260);
    scroll.stop();
  });

  it('scrolls on the axis it is given and leaves the other', () => {
    const horizontal = box();
    createAutoScroll(horizontal, { axis: 'x' }).update(500, 250);
    runFrame();
    expect(horizontal.scrollLeft).toBe(220);
    expect(horizontal.scrollTop).toBe(200);

    const vertical = box();
    createAutoScroll(vertical, { axis: 'y' }).update(500, 250);
    runFrame();
    expect(vertical.scrollLeft).toBe(200);
    expect(vertical.scrollTop).toBe(220);

    const both = box();
    createAutoScroll(both, { axis: 'both' }).update(100, 50);
    runFrame();
    expect(both.scrollLeft).toBe(180);
    expect(both.scrollTop).toBe(180);
  });

  it('scrolls on both axes when it is not told', () => {
    const element = box();
    createAutoScroll(element).update(500, 250);
    runFrame();
    expect(element.scrollLeft).toBe(220);
    expect(element.scrollTop).toBe(220);
  });

  it('ends the loop when the pointer leaves the zones', () => {
    const element = box();
    const scroll = createAutoScroll(element, { axis: 'x' });
    scroll.update(500, 150);
    expect(queue.size).toBe(1);
    runFrame();
    scroll.update(300, 150);
    expect(queue.size).toBe(0);
    runFrame();
    expect(element.scrollLeft).toBe(220);
  });

  it('asks for one frame at a time, however often it is told where the pointer is', () => {
    const element = box();
    const scroll = createAutoScroll(element, { axis: 'x' });
    scroll.update(500, 150);
    scroll.update(499, 150);
    scroll.update(498, 150);
    expect(queue.size).toBe(1);
    scroll.stop();
  });

  it('stops: the frame it asked for is cancelled and nothing scrolls after', () => {
    const element = box();
    const scroll = createAutoScroll(element, { axis: 'x' });
    scroll.update(500, 150);
    expect(queue.size).toBe(1);
    scroll.stop();
    expect(queue.size).toBe(0);
    runFrame();
    expect(element.scrollLeft).toBe(200);
    // Told again after it stopped, it stays stopped until it is given a new pointer.
    scroll.stop();
  });
});

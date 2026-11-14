import { describe, expect, it } from 'vitest';
import { parseVisualDrag } from './visual-drag';

const STORY = 'components-dialog--dialog-movable-dragging';

describe('parseVisualDrag', () => {
  it.each([
    ['-112,-34', { dx: -112, dy: -34 }],
    ['40,0', { dx: 40, dy: 0 }],
    [' 12.5 , -3 ', { dx: 12.5, dy: -3 }],
  ])('reads %j', (value, drag) => {
    expect(parseVisualDrag(STORY, value)).toEqual(drag);
  });

  it.each([
    // An empty part would be read as 0, and a drag that never starts would be shot as dragged.
    ',',
    '12,',
    ',-34',
    ' , ',
    '',
    null,
    // Two parts exactly, each a plain signed number.
    '12',
    '1,2,3',
    '+5,3',
    '1e3,2',
    '0x10,5',
    '12px,3',
    'Infinity,0',
    'NaN,0',
    '.5,1',
  ])('rejects %j, naming the story and the value', (value) => {
    expect(() => parseVisualDrag(STORY, value)).toThrow(
      `${STORY}: data-visual-drag must be "dx,dy", two signed numbers, not ${JSON.stringify(value)}.`,
    );
  });
});

import { describe, expect, it } from 'vitest';
import * as api from './index';

describe('public API', () => {
  it('exports exactly the documented components and nothing internal', () => {
    expect(Object.keys(api).sort()).toEqual([
      'Avatar',
      'Badge',
      'Button',
      'Card',
      'CardContent',
      'CardDescription',
      'CardFooter',
      'CardHeader',
      'CardTitle',
      'Divider',
      'IconButton',
      'Spinner',
      'Surface',
    ]);
  });
});

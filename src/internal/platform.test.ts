import { render } from '@testing-library/react';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { isApplePlatform, useApplePlatform } from './platform';

/** Sets the two places the platform is read from; `undefined` removes the property. */
function platform(userAgentData: string | undefined, legacy: string): void {
  vi.stubGlobal('navigator', {
    ...(userAgentData === undefined ? {} : { userAgentData: { platform: userAgentData } }),
    platform: legacy,
  });
}

describe('isApplePlatform', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it.each(['macOS', 'MacIntel', 'iPhone', 'iPad', 'iPod'])('is true for %s', (name) => {
    platform(undefined, name);
    expect(isApplePlatform()).toBe(true);
  });

  it.each(['Win32', 'Linux x86_64', 'Android', ''])('is false for "%s"', (name) => {
    platform(undefined, name);
    expect(isApplePlatform()).toBe(false);
  });

  it('prefers userAgentData.platform to navigator.platform', () => {
    platform('macOS', 'Win32');
    expect(isApplePlatform()).toBe(true);
    platform('Windows', 'MacIntel');
    expect(isApplePlatform()).toBe(false);
  });

  it('is false when the browser says nothing', () => {
    vi.stubGlobal('navigator', {});
    expect(isApplePlatform()).toBe(false);
  });
});

describe('useApplePlatform', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function Probe() {
    return createElement('output', null, String(useApplePlatform()));
  }

  it('is not known on the server, and is the platform once the page is there', () => {
    platform(undefined, 'MacIntel');
    expect(renderToString(createElement(Probe))).toBe('<output>undefined</output>');
    expect(render(createElement(Probe)).container.textContent).toBe('true');
  });
});

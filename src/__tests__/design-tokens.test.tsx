// @vitest-environment node
import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

let css = '';

beforeAll(() => {
  css = readFileSync(join(process.cwd(), 'src/styles/design-tokens.css'), 'utf-8');
});

const has = (token: string) => css.includes(token);

describe('Elevation tokens', () => {
  it.each([0, 1, 2, 3, 4, 5])('--elevation-%i definido', (n) => {
    expect(has(`--elevation-${n}`)).toBe(true);
  });
  it.each(['rest', 'hover', 'active', 'dialog', 'dropdown'])(
    '--card-elevation-%s definido',
    (v) => expect(has(`--card-elevation-${v}`)).toBe(true),
  );
});

describe('Motion tokens', () => {
  it.each(['instant', 'fast', 'normal', 'slow', 'slower'])(
    '--motion-duration-%s definido',
    (d) => expect(has(`--motion-duration-${d}`)).toBe(true),
  );
  it.each(['linear', 'in', 'out', 'in-out', 'spring', 'bounce'])(
    '--motion-easing-%s definido',
    (e) => expect(has(`--motion-easing-${e}`)).toBe(true),
  );
  it('--motion-scale-active definido', () => expect(has('--motion-scale-active')).toBe(true));
  it('--motion-scale-hover definido',  () => expect(has('--motion-scale-hover')).toBe(true));
});

describe('Typography tokens', () => {
  it.each(['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl'])(
    '--text-%s definido',
    (s) => expect(has(`--text-${s}`)).toBe(true),
  );
  it.each(['none', 'tight', 'normal', 'relaxed', 'loose'])(
    '--leading-%s definido',
    (l) => expect(has(`--leading-${l}`)).toBe(true),
  );
  it.each(['tighter', 'tight', 'normal', 'wide', 'wider'])(
    '--tracking-%s definido',
    (t) => expect(has(`--tracking-${t}`)).toBe(true),
  );
});

describe('Spacing tokens', () => {
  it.each([0, 1, 2, 3, 4, 5, 6, 8, 10])(
    '--space-%i definido',
    (n) => expect(has(`--space-${n}`)).toBe(true),
  );
});

describe('Density tokens', () => {
  it.each(['padding', 'gap', 'input-height', 'table-cell', 'selected'])(
    '--density-%s definido',
    (d) => expect(has(`--density-${d}`)).toBe(true),
  );
});

describe('Sidebar tokens', () => {
  it('--sidebar-width definido',    () => expect(has('--sidebar-width')).toBe(true));
  it('--sidebar-position definido', () => expect(has('--sidebar-position')).toBe(true));
});

describe('File integrity', () => {
  it('archivo no vacio', () => expect(css.length).toBeGreaterThan(500));
  it('contiene al menos 40 custom properties', () => {
    expect((css.match(/--[\w-]+:/g) ?? []).length).toBeGreaterThanOrEqual(40);
  });
  it('llaves balanceadas', () => {
    expect((css.match(/{/g) ?? []).length).toBe((css.match(/}/g) ?? []).length);
  });
});

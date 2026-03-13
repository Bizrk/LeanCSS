import postcss from 'postcss';
import { describe, it, expect } from 'vitest';
import leancss from '../src/index';

async function run(input: string, output: string, opts = {}) {
  let result = await postcss([leancss(opts)]).process(input, { from: undefined });
  expect(result.css).toEqual(output);
  expect(result.warnings()).toHaveLength(0);
}

async function runError(input: string, errorMessage: string) {
  await expect(async () => {
    await postcss([leancss()]).process(input, { from: undefined });
  }).rejects.toThrowError(errorMessage);
}

describe('LeanCSS Validation', () => {
  it('removes @set statements from output', async () => {
    await run('@set a { color: red; } .b { color: blue; }', '.b { color: blue; }');
  });

  it('fails on duplicate set names', async () => {
    await runError(
      '@set panel { }\n@set panel { }',
      'Duplicate @set definition for "panel"'
    );
  });

  it('fails when nesting @set inside @set', async () => {
    await runError(
      '@set parent { @set child { color: red; } }',
      '@set cannot be nested inside another @set.'
    );
  });

  it('allows media queries inside @set', async () => {
    await run(
      '@set responsive { color: red; @media (min-width: 0) { color: blue; } } .btn { @lift responsive; }',
      '.btn { color: red; @media (min-width: 0) { color: blue; } }'
    );
  });

  it('allows nested selectors inside @set', async () => {
    await run(
      '@set button { color: red; &:hover { color: blue; } } .btn { @lift button; }',
      '.btn { color: red; &:hover { color: blue; } }'
    );
  });
  
  it('expands @lift inside nested selectors', async () => {
    await run(
      '@set blue { color: blue; } @set button { color: red; &:hover { @lift blue; } } .btn { @lift button; }',
      '.btn { color: red; &:hover { color: blue; } }'
    );
  });

  it('fails on circular alias reference', async () => {
    await runError(
      '@set a { @lift b; } @set b { @lift a; } .btn { @lift a; }',
      'Circular alias reference detected: a -> b -> a'
    );
  });

  it('fails on unknown set in rule context', async () => {
    await runError(
      '.btn { @lift missing; }',
      'Unknown set "missing" referenced in @lift'
    );
  });
});

describe('LeanCSS Expansion', () => {
  it('expands a single simple set into a rule', async () => {
    await run(
      '@set inline-flex { display: inline-flex; } .btn { @lift inline-flex; }',
      '.btn { display: inline-flex; }'
    );
  });

  it('expands multiple sets in one @lift', async () => {
    await run(
      '@set a { color: red; } @set b { bg: blue; } .btn { @lift a b; }',
      '.btn { color: red; bg: blue; }'
    );
  });

  it('expands alias sets correctly', async () => {
    await run(
      '@set a { color: red; } @set b { bg: blue; } @set ab { @lift a b; } .btn { @lift ab; }',
      '.btn { color: red; bg: blue; }'
    );
  });

  it('preserves existing declarations and order', async () => {
    await run(
      '@set text-sm { font-size: 14px; } @set text-base { font-size: 16px; } .btn { color: black; @lift text-sm text-base; font-weight: bold; }',
      '.btn { color: black; font-size: 14px; font-size: 16px; font-weight: bold; }'
    );
  });

  it('works correctly inside nested @layer', async () => {
    await run(
      `
      @layer utilities {
        @set a { color: red; }
      }
      @layer components {
        .btn { @lift a; }
      }
      `,
      `
      @layer utilities {
      }
      @layer components {
        .btn { color: red; }
      }
      `
    );
  });
});

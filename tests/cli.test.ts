import { describe, it, expect } from 'vitest';
import postcss from 'postcss';
import { parseLeanCss } from '../src/core/parseLeanCss';
import { SymbolIndex } from '../src/core/symbolIndex';
import { trimUnusedPatterns } from '../src/core/transforms/trimUnusedPatterns';
import { flattenLiftStatements } from '../src/core/transforms/flattenLiftStatements';

describe('CLI Core Utils', () => {
  it('parses and identifies 0-ref, 1-ref, and multi-ref patterns', () => {
    const css = `
      @set unused-set { color: red; }
      @drop single-use { color: blue; }
      @set multi-use { color: green; }

      .box {
        @lift single-use multi-use;
      }

      .circle {
        @lift multi-use;
      }
    `;
    const root = postcss.parse(css);
    const parsed = parseLeanCss(root, 'test.css');
    
    const index = new SymbolIndex();
    index.addSymbols(parsed.symbols);
    index.addUsages(parsed.usages);

    expect(index.getUsageCount('unused-set')).toBe(0);
    expect(index.getUsageCount('single-use')).toBe(1);
    expect(index.getUsageCount('multi-use')).toBe(2);
  });

  it('trims unused patterns', () => {
    const css = `
      @set unused-set { color: red; }
      @set used-set { color: blue; }
      .box { @lift used-set; }
    `;
    const root = postcss.parse(css);
    const parsed = parseLeanCss(root, 'test.css');
    const index = new SymbolIndex();
    index.addSymbols(parsed.symbols);
    index.addUsages(parsed.usages);

    trimUnusedPatterns(root, { index, singleUse: false });

    const output = root.toString();
    expect(output).not.toContain('unused-set');
    expect(output).toContain('used-set');
    expect(output).toContain('@lift used-set');
  });

  it('trims single-use patterns when singleUse flag is active', () => {
    const css = `
      @set single-use { color: red; }
      @set multi-use { color: blue; }

      .box1 { @lift single-use multi-use; }
      .box2 { @lift multi-use; }
    `;
    const root = postcss.parse(css);
    const parsed = parseLeanCss(root, 'test.css');
    const index = new SymbolIndex();
    index.addSymbols(parsed.symbols);
    index.addUsages(parsed.usages);

    trimUnusedPatterns(root, { index, singleUse: true });

    const output = root.toString();
    expect(output).not.toContain('@set single-use');
    expect(output).toContain('color: red;');
    expect(output).toContain('@lift multi-use');
    expect(output).toContain('@set multi-use');
  });

  it('flattens lift statements horizontally', () => {
    const css = `
      @set color-layer { color: red; }
      @set space-layer { padding: 1rem; }
      .box {
        @lift color-layer space-layer;
      }
    `;
    const root = postcss.parse(css);
    const parsed = parseLeanCss(root, 'test.css');
    const index = new SymbolIndex();
    index.addSymbols(parsed.symbols);
    index.addUsages(parsed.usages);

    flattenLiftStatements(root, { index, clean: true });

    const output = root.toString();
    expect(output).not.toContain('@set color-layer');
    expect(output).not.toContain('@set space-layer');
    expect(output).not.toContain('@lift');
    expect(output).toContain('color: red;');
    expect(output).toContain('padding: 1rem;');
  });
});

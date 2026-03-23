import type { Root } from 'postcss';
import type { LeanCssSymbol, LeanCssLiftUsage } from '../types/leancss';

export interface ParsedLeanCss {
  symbols: LeanCssSymbol[];
  usages: LeanCssLiftUsage[];
}

export function parseLeanCss(root: Root, filePath: string): ParsedLeanCss {
  const symbols: LeanCssSymbol[] = [];
  const usages: LeanCssLiftUsage[] = [];

  root.walkAtRules(/^(set|drop)$/, (atRule) => {
    const name = atRule.params.trim();
    if (!name) return;
    
    symbols.push({
      name,
      kind: atRule.name as 'set' | 'drop',
      filePath,
      node: atRule,
    });
  });

  root.walkAtRules('lift', (atRule) => {
    const names = atRule.params.split(/\s+/).filter(Boolean);
    if (names.length === 0) return;

    usages.push({
      filePath,
      node: atRule,
      names,
    });
  });

  return { symbols, usages };
}

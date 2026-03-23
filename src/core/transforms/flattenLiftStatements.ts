import type { Root } from 'postcss';
import type { SymbolIndex } from '../symbolIndex';
import { resolveLiftChain } from '../resolveLiftChain';

export interface FlattenOptions {
  index: SymbolIndex;
  clean?: boolean;
}

export function flattenLiftStatements(root: Root, options: FlattenOptions) {
  const { index, clean } = options;

  root.walkAtRules('lift', (atRule) => {
    const names = atRule.params.split(/\s+/).filter(Boolean);
    const resolved = resolveLiftChain(names, index, atRule);
    atRule.replaceWith(...resolved.map(n => n.clone()));
  });

  if (clean) {
    root.walkAtRules(/^(set|drop)$/, (atRule) => {
      atRule.remove();
    });
  }
}

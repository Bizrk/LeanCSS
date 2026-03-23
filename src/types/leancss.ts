import type { AtRule } from 'postcss';

export type LeanCssSymbolKind = 'set' | 'drop';

export interface LeanCssSymbol {
  name: string;
  kind: LeanCssSymbolKind;
  filePath: string;
  node: AtRule;
}

export interface LeanCssLiftUsage {
  filePath: string;
  node: AtRule;
  names: string[];
}

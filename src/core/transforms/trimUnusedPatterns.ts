import type { Root, Node } from 'postcss';
import type { SymbolIndex } from '../symbolIndex';
import { resolveLiftChain } from '../resolveLiftChain';

export interface TrimOptions {
  index: SymbolIndex;
  singleUse: boolean;
}

export function trimUnusedPatterns(root: Root, options: TrimOptions) {
  const { index, singleUse } = options;

  // 1. Flatten single-use patterns if enabled
  if (singleUse) {
    root.walkAtRules('lift', (atRule) => {
      const names = atRule.params.split(/\s+/).filter(Boolean);
      let needsFlattening = false;
      for (const name of names) {
        if (index.getUsageCount(name) === 1) {
          needsFlattening = true;
          break;
        }
      }

      if (!needsFlattening) return;

      const nodesToInsert: Node[] = [];

      for (const name of names) {
        if (index.getUsageCount(name) === 1) {
          const resolved = resolveLiftChain([name], index, atRule);
          nodesToInsert.push(...resolved.map(n => n.clone()));
        } else {
          const newLift = atRule.clone({ params: name });
          nodesToInsert.push(newLift);
        }
      }
      atRule.replaceWith(...nodesToInsert);
    });
  }

  // 2. Remove unused sets and (optionally) flattened ones
  root.walkAtRules(/^(set|drop)$/, (atRule) => {
    const name = atRule.params.trim();
    if (!name) return;

    const count = index.getUsageCount(name);

    if (count === 0) {
      atRule.remove();
    } else if (singleUse && count === 1) {
      atRule.remove();
    }
  });
}

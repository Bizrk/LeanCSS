import type { Node, AtRule } from 'postcss';
import type { SymbolIndex } from './symbolIndex';

export function resolveLiftChain(
  names: string[],
  index: SymbolIndex,
  originNode: Node,
  resolutionChain: string[] = []
): Node[] {
  const expanded: Node[] = [];

  for (const name of names) {
    const symbol = index.getSymbol(name);
    
    if (!symbol) {
      throw originNode.error(`Unknown set "${name}" referenced in @lift`);
    }

    if (resolutionChain.includes(name)) {
      const chain = [...resolutionChain, name].join(' -> ');
      throw originNode.error(`Circular alias reference detected: ${chain}`);
    }

    const currentChain = [...resolutionChain, name];

    const childExpanded = expandNodes(symbol.node.nodes || [], index, currentChain);
    expanded.push(...childExpanded);
  }

  return expanded;
}

function expandNodes(nodes: Node[], index: SymbolIndex, currentChain: string[]): Node[] {
  const expanded: Node[] = [];
  for (const node of nodes) {
    if (node.type === 'atrule' && (node as AtRule).name === 'lift') {
      const refs = (node as AtRule).params.split(/\s+/).filter(Boolean);
      const refExpanded = resolveLiftChain(refs, index, node, currentChain);
      expanded.push(...refExpanded);
    } else {
      const clone = node.clone();
      if ('nodes' in clone && Array.isArray((clone as any).nodes)) {
        const children = [...(clone as any).nodes];
        (clone as any).removeAll();
        (clone as any).append(...expandNodes(children, index, currentChain));
      }
      expanded.push(clone);
    }
  }
  return expanded;
}

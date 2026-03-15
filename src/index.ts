import type { PluginCreator, Root, AtRule, Declaration, Result, Node } from 'postcss';
import { Rule } from 'postcss';

interface LeanCssOptions {
  // Add any options here if needed later
}

interface SetDefinition {
  name: string;
  sourceFile: string | undefined;
  node: AtRule;
  isAlias: boolean;
  resolvedNodes?: Node[];
}

const leancss: PluginCreator<LeanCssOptions> = (opts = {}) => {
  return {
    postcssPlugin: 'leancss',
    Once(root: Root, { result }: { result: Result }) {
      const sets = new Map<string, SetDefinition>();

      // 1. Collect and Validate sets
      root.walkAtRules(/^(set|drop)$/, (atRule) => {
        const name = atRule.params.trim();

        if (!name) {
          atRule.warn(result, `Missing name for @${atRule.name}`);
          return;
        }

        if (sets.has(name)) {
          throw atRule.error(`Duplicate @${atRule.name} definition for "${name}"`);
        }

        let isAlias = false;

        // Validate contents
        atRule.walk((node: Node) => {
          if (node.type === 'atrule' && (node as AtRule).name === 'lift') {
            isAlias = true;
          } else if (node.type === 'atrule' && ((node as AtRule).name === 'set' || (node as AtRule).name === 'drop')) {
            throw node.error(`@${(node as AtRule).name} cannot be nested inside another @set or @drop.`);
          }
        });

        sets.set(name, {
          name,
          sourceFile: atRule.source?.input.file,
          node: atRule,
          isAlias
        });
      });
      
      // 3. Resolve aliases
      function resolveSet(name: string, resolutionChain: string[], originNode: Node): Node[] {
        const setDef = sets.get(name);
        
        if (!setDef) {
          throw originNode.error(`Unknown set "${name}" referenced in @lift`);
        }

        // Cache hit
        if (setDef.resolvedNodes) {
          return setDef.resolvedNodes;
        }

        // Circular detection
        if (resolutionChain.includes(name)) {
          const chain = [...resolutionChain, name].join(' -> ');
          throw originNode.error(`Circular alias reference detected: ${chain}`);
        }

        const currentChain = [...resolutionChain, name];
        
        function expandNodes(nodes: Node[]): Node[] {
          const expanded: Node[] = [];
          for (const node of nodes) {
            if (node.type === 'atrule' && (node as AtRule).name === 'lift') {
              const refs = (node as AtRule).params.split(/\s+/).filter(Boolean);
              for (const ref of refs) {
                const refExpanded = resolveSet(ref, currentChain, node);
                for (const expandedNode of refExpanded) {
                  expanded.push(expandedNode.clone());
                }
              }
            } else {
              const clone = node.clone();
              if ('nodes' in clone && Array.isArray((clone as any).nodes)) {
                const children = [...(clone as any).nodes];
                (clone as any).removeAll();
                (clone as any).append(...expandNodes(children));
              }
              expanded.push(clone);
            }
          }
          return expanded;
        }

        const resolved = expandNodes(setDef.node.nodes || []);
        setDef.resolvedNodes = resolved;
        return resolved;
      }

      // Resolve all sets eagerly (or could be done lazily when expanding selector-level @lift)
      for (const [name, setDef] of sets.entries()) {
        if (!setDef.resolvedNodes) {
          resolveSet(name, [], setDef.node);
        }
      }
      
      // 4. Expand selector-level @lift
      root.walkAtRules('lift', (atRule) => {
        // Ignore @lift inside @set or @drop
        let parent = atRule.parent;
        let inSet = false;
        while (parent) {
          if (parent.type === 'atrule' && ((parent as AtRule).name === 'set' || (parent as AtRule).name === 'drop')) {
            inSet = true;
            break;
          }
          parent = parent.parent as any;
        }

        if (inSet) return;

        if (atRule.parent?.type !== 'rule') {
          throw atRule.error(`@lift is only allowed inside standard rules, @set, or @drop blocks in v1.`);
        }

        const refs = atRule.params.split(/\s+/).filter(Boolean);
        const nodesToInsert: Node[] = [];
        
        for (const ref of refs) {
          const setDef = sets.get(ref);
          if (!setDef) {
            throw atRule.error(`Unknown set "${ref}" referenced in @lift`);
          }
          for (const node of setDef.resolvedNodes!) {
            nodesToInsert.push(node.clone());
          }
        }

        atRule.replaceWith(...nodesToInsert);
      });
      // 5. Remove @set definitions and resolve @drop
      root.walkAtRules(/^(set|drop)$/, (atRule) => {
        if (atRule.name === 'drop') {
          const name = atRule.params.trim();
          const setDef = sets.get(name);
          
          if (setDef && setDef.resolvedNodes) {
             const rule = new Rule({ selector: `.${name}`, source: atRule.source });
             for (const node of setDef.resolvedNodes) {
               rule.append(node.clone());
             }
             atRule.replaceWith(rule);
          } else {
             atRule.remove();
          }
        } else {
          atRule.remove();
        }
      });
    }
  };
};

leancss.postcss = true;
export default leancss;

import type { PluginCreator, Root, AtRule, Declaration, Result, Node } from 'postcss';

interface LeanCssOptions {
  // Add any options here if needed later
}

interface SetDefinition {
  name: string;
  sourceFile: string | undefined;
  node: AtRule;
  isAlias: boolean;
  resolvedDeclarations: Declaration[];
}

const leancss: PluginCreator<LeanCssOptions> = (opts = {}) => {
  return {
    postcssPlugin: 'leancss',
    Once(root: Root, { result }: { result: Result }) {
      const sets = new Map<string, SetDefinition>();

      // 1. Collect and Validate sets
      root.walkAtRules('set', (atRule) => {
        const name = atRule.params.trim();

        if (!name) {
          atRule.warn(result, 'Missing name for @set');
          return;
        }

        if (sets.has(name)) {
          throw atRule.error(`Duplicate @set definition for "${name}"`);
        }

        let isAlias = false;

        // Validate contents
        atRule.walk((node: Node) => {
          if (node.type === 'atrule') {
            const atNode = node as AtRule;
            if (atNode.name !== 'lift') {
              throw node.error(`Unsupported at-rule @${atNode.name} inside @set. Only @lift is allowed.`);
            }
            isAlias = true;
          } else if (node.type === 'rule') {
            throw node.error(`Nested selectors are not supported inside @set in v1.`);
          } else if (node.type !== 'decl' && node.type !== 'comment') {
            throw node.error(`Unsupported node type "${node.type}" inside @set.`);
          }
        });

        sets.set(name, {
          name,
          sourceFile: atRule.source?.input.file,
          node: atRule,
          isAlias,
          resolvedDeclarations: [] // Will be populated in resolution phase
        });
      });
      
      // 3. Resolve aliases
      function resolveSet(name: string, resolutionChain: string[], originNode: Node): Declaration[] {
        const setDef = sets.get(name);
        
        if (!setDef) {
          throw originNode.error(`Unknown set "${name}" referenced in @lift`);
        }

        // Cache hit
        if (setDef.resolvedDeclarations.length > 0) {
          return setDef.resolvedDeclarations;
        }

        // It might be empty, let's distinguish between empty resolution and unresolved by adding a flag or just always resolving. 
        // Circular detection
        if (resolutionChain.includes(name)) {
          const chain = [...resolutionChain, name].join(' -> ');
          throw originNode.error(`Circular alias reference detected: ${chain}`);
        }

        const currentChain = [...resolutionChain, name];
        const resolved: Declaration[] = [];

        setDef.node.walk((node) => {
          if (node.type === 'decl') {
            resolved.push(node.clone());
          } else if (node.type === 'atrule') {
            const atNode = node as AtRule;
            if (atNode.name === 'lift') {
              const refs = atNode.params.split(/\s+/).filter(Boolean);
              for (const ref of refs) {
                const expanded = resolveSet(ref, currentChain, atNode);
                for (const decl of expanded) {
                  resolved.push(decl.clone());
                }
              }
            }
          }
        });

        setDef.resolvedDeclarations = resolved;
        return resolved;
      }

      // Resolve all sets eagerly (or could be done lazily when expanding selector-level @lift)
      for (const [name, setDef] of sets.entries()) {
        if (setDef.resolvedDeclarations.length === 0) {
          resolveSet(name, [], setDef.node);
        }
      }
      
      // 4. Expand selector-level @lift
      root.walkAtRules('lift', (atRule) => {
        // Ignore @lift inside @set
        let parent = atRule.parent;
        let inSet = false;
        while (parent) {
          if (parent.type === 'atrule' && (parent as AtRule).name === 'set') {
            inSet = true;
            break;
          }
          parent = parent.parent as any;
        }

        if (inSet) return;

        if (atRule.parent?.type !== 'rule') {
          throw atRule.error(`@lift is only allowed inside standard rules or @set blocks in v1.`);
        }

        const refs = atRule.params.split(/\s+/).filter(Boolean);
        const declsToInsert: Declaration[] = [];
        
        for (const ref of refs) {
          const setDef = sets.get(ref);
          if (!setDef) {
            throw atRule.error(`Unknown set "${ref}" referenced in @lift`);
          }
          for (const decl of setDef.resolvedDeclarations) {
            declsToInsert.push(decl.clone());
          }
        }

        atRule.replaceWith(...declsToInsert);
      });
      // 5. Remove @set definitions
      root.walkAtRules('set', (atRule) => {
        atRule.remove();
      });
    }
  };
};

leancss.postcss = true;
export default leancss;

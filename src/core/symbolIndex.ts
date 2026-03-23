import type { LeanCssSymbol, LeanCssLiftUsage } from '../types/leancss';

export class SymbolIndex {
  private symbols = new Map<string, LeanCssSymbol>();
  private usageCounts = new Map<string, number>();
  public usages: LeanCssLiftUsage[] = [];

  addSymbols(symbols: LeanCssSymbol[]) {
    for (const sym of symbols) {
      if (this.symbols.has(sym.name)) {
        throw new Error(`Duplicate LeanCSS definition for "${sym.name}" found in ${sym.filePath}`);
      }
      this.symbols.set(sym.name, sym);
      if (!this.usageCounts.has(sym.name)) {
        this.usageCounts.set(sym.name, 0); // Initialize count
      }
    }
  }

  addUsages(usages: LeanCssLiftUsage[]) {
    for (const usage of usages) {
      this.usages.push(usage);
      for (const name of usage.names) {
        const currentCount = this.usageCounts.get(name) || 0;
        this.usageCounts.set(name, currentCount + 1);
      }
    }
  }

  getSymbol(name: string): LeanCssSymbol | undefined {
    return this.symbols.get(name);
  }

  getUsageCount(name: string): number {
    return this.usageCounts.get(name) || 0;
  }

  getAllSymbols(): LeanCssSymbol[] {
    return Array.from(this.symbols.values());
  }
}

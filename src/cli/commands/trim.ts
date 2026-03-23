import fs from 'fs/promises';
import path from 'path';
import fg from 'fast-glob';
import postcss from 'postcss';
import { parseLeanCss } from '../../core/parseLeanCss';
import { SymbolIndex } from '../../core/symbolIndex';
import { trimUnusedPatterns } from '../../core/transforms/trimUnusedPatterns';

export interface TrimCommandOptions {
  write: boolean;
  singleUse: boolean;
  files: string;
}

export async function runTrim(options: TrimCommandOptions) {
  const filePaths = await fg(options.files, { absolute: true });
  
  if (filePaths.length === 0) {
    console.log(`No files found matching ${options.files}`);
    return;
  }

  const index = new SymbolIndex();
  const fileAsts = new Map<string, postcss.Root>();

  // Parse all files
  for (const filePath of filePaths) {
    const css = await fs.readFile(filePath, 'utf-8');
    const root = postcss.parse(css, { from: filePath });
    fileAsts.set(filePath, root);
    
    const parsed = parseLeanCss(root, filePath);
    try {
      index.addSymbols(parsed.symbols);
      index.addUsages(parsed.usages);
    } catch (err: any) {
      console.error(err.message);
      process.exit(1);
    }
  }

  // Report
  const allSymbols = index.getAllSymbols();
  const unused = allSymbols.filter(s => index.getUsageCount(s.name) === 0);
  const single = allSymbols.filter(s => index.getUsageCount(s.name) === 1);

  console.log('LeanCSS Trim Report\n');
  
  if (unused.length > 0) {
    console.log('Unused patterns:');
    unused.forEach(s => {
      const relPath = path.relative(process.cwd(), s.filePath);
      console.log(`- ${s.name} (${s.kind}) in ${relPath}`);
    });
    console.log('');
  } else {
    console.log('No unused patterns found.\n');
  }

  if (single.length > 0) {
    console.log('Single-use patterns:');
    single.forEach(s => {
      const relPath = path.relative(process.cwd(), s.filePath);
      console.log(`- ${s.name} (${s.kind}) used 1 time in ${relPath}`);
    });
    console.log('');
  }

  if (!options.write) {
    console.log('No files changed. Re-run with --write to apply changes.');
    return;
  }

  // Apply transforms
  let filesChanged = 0;
  for (const [filePath, root] of fileAsts.entries()) {
    const cssBefore = root.toString();
    trimUnusedPatterns(root, { index, singleUse: options.singleUse });
    const cssAfter = root.toString();

    if (cssBefore !== cssAfter) {
      await fs.writeFile(filePath, cssAfter, 'utf-8');
      filesChanged++;
    }
  }

  console.log(`Trimmed patterns in ${filesChanged} files.`);
}

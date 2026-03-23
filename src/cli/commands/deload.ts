import fs from 'fs/promises';
import path from 'path';
import fg from 'fast-glob';
import postcss from 'postcss';
import { parseLeanCss } from '../../core/parseLeanCss';
import { SymbolIndex } from '../../core/symbolIndex';
import { flattenLiftStatements } from '../../core/transforms/flattenLiftStatements';

export interface DeloadCommandOptions {
  write: boolean;
  clean: boolean;
  files: string;
}

export async function runDeload(options: DeloadCommandOptions) {
  const filePaths = await fg(options.files, { absolute: true });
  
  if (filePaths.length === 0) {
    console.log(`No files found matching ${options.files}`);
    return;
  }

  const index = new SymbolIndex();
  const fileAsts = new Map<string, postcss.Root>();

  // Parse files
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

  console.log(`Found ${index.usages.length} @lift statements across ${filePaths.length} files.`);

  if (!options.write) {
    console.log('Preview mode. Re-run with --write to apply changes.');
    return;
  }

  let filesChanged = 0;
  for (const [filePath, root] of fileAsts.entries()) {
    const cssBefore = root.toString();
    
    try {
      flattenLiftStatements(root, { index, clean: options.clean });
    } catch (err: any) {
      console.error(`Error resolving lifts in ${path.relative(process.cwd(), filePath)}:`, err.message);
      process.exit(1);
    }

    const cssAfter = root.toString();

    if (cssBefore !== cssAfter) {
      await fs.writeFile(filePath, cssAfter, 'utf-8');
      filesChanged++;
    }
  }

  console.log(`Deload complete. Updated ${filesChanged} files.`);
}

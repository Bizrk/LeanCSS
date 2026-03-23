#!/usr/bin/env node
import { runTrim } from './commands/trim';
import { runDeload } from './commands/deload';

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command !== 'trim' && command !== 'deload') {
    console.error(`Unknown command: ${command}`);
    console.log(`Supported commands: trim, deload`);
    process.exit(1);
  }

  const write = args.includes('--write');
  const dryRun = args.includes('--dry-run');
  const singleUse = args.includes('--single-use');
  const clean = args.includes('--clean');

  const isWrite = write && !dryRun;

  let files = 'src/**/*.css';
  const filesIndex = args.indexOf('--files');
  if (filesIndex !== -1 && args[filesIndex + 1]) {
    files = args[filesIndex + 1];
  }

  try {
    if (command === 'trim') {
      await runTrim({ write: isWrite, singleUse, files });
    } else if (command === 'deload') {
      await runDeload({ write: isWrite, clean, files });
    }
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();

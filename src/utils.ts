import { existsSync, copyFileSync } from 'fs';
import isRoot from 'path-is-root';
import rimraf from 'rimraf';
import { join, dirname } from 'path';
import signale from 'signale';

export class ConfigError extends Error {
  public scope: string[] = [];

  constructor(msg: string, scope: (string | undefined)[]) {
    super(msg);
    this.scope = scope.filter(Boolean) as string[];
  }
}

export const getExistPath = (cwd: string, paths: string[], opts: { relative?: boolean } = {}) => {
  const exists: { absolute: string; relative: string }[] = [];
  paths.forEach(path => {
    const absPath = join(cwd, path);
    if (existsSync(absPath)) {
      exists.push({ absolute: absPath, relative: path });
    }
  });

  if (!exists.length) {
    return false;
  }

  return opts.relative ? exists[0].relative : exists[0].absolute;
};

export const getEntryPath = (cwd: string, paths: string[]) => {
  const exist = getExistPath(cwd, paths, { relative: true });
  return exist;
};

export function generateTsConfig(cwd: string) {
  const tsConfigPath = getExistPath(cwd, ['tsconfig.json']);
  if (tsConfigPath) {
    return true;
  }

  let currentPath = cwd;

  let topTsConfigPath = '';
  while (!topTsConfigPath && !isRoot(cwd)) {
    const p = getExistPath(currentPath, ['tsconfig.json']);
    if (p) {
      topTsConfigPath = p;
    }
    currentPath = dirname(currentPath);
  }

  if (!topTsConfigPath) {
    return;
  }
  copyFileSync(topTsConfigPath, join(cwd, 'tsconfig.json'));

  process.on('SIGINT', () => {
    process.exit(1);
  });
  process.on('exit', () => {
    signale.scope('EXIT').note('exit: rm tsconfig.json');
    rimraf.sync(join(cwd, 'tsconfig.json'));
  });

  return false;
}

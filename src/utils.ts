import assert from 'assert';
import { copyFileSync, existsSync, readFileSync } from 'fs';
import { basename, dirname, extname, join } from 'path';
import isRoot from 'path-is-root';
import rimraf from 'rimraf';
import { Signale } from 'signale';
import { ENTRY_DIRS, ENTRY_FILES, ROLLUP_OUPUT_DIR } from './constants';
import { BundleType, IBuildOpts, IFormattedBuildConf, IPackage, IUmd } from './types';

export interface IPath {
  abs: string;
  relative: string;
}

export const getExistPath = (
  cwd: string,
  paths: string[],
  opts: { relative?: boolean } = {},
): string | undefined => {
  // eslint-disable-next-line no-restricted-syntax
  for (const path of paths) {
    const absPath = join(cwd, path);
    if (existsSync(absPath)) {
      return opts.relative ? path : absPath;
    }
  }
  return undefined;
};

export const getEntry = (conf: IFormattedBuildConf, opts: IBuildOpts, dir?: boolean): string => {
  const { cwd } = opts;
  const entry = conf.entry || getExistPath(cwd, dir ? ENTRY_DIRS : ENTRY_FILES, { relative: true });
  assert.ok(entry, 'entry must be exit!');

  return entry as string;
};

export const getOutput = (
  type: BundleType,
  conf: IFormattedBuildConf,
  opts: IBuildOpts,
  outputDir: string = ROLLUP_OUPUT_DIR,
): string => {
  const dir = outputDir !== 'dist';
  const entry = getEntry(conf, opts, dir);
  const name =
    (conf[type] && (conf[type] as IUmd).name) || basename(entry).replace(extname(entry), '');

  return `${outputDir}/${name}.${type}.js`;
};

export function getPackageJson(cwd: string): IPackage {
  const pkgPath = join(cwd, 'package.json');
  const pkg: IPackage = JSON.parse(readFileSync(pkgPath, 'utf-8'));
  return pkg;
}

// eslint-disable-next-line import/no-mutable-exports, prefer-const
export const ctr = { signale: new Signale() };

export function generateTsConfig(opts: IBuildOpts) {
  ctr.signale.info('generate tsconfig.json');
  const { cwd } = opts;

  const tsConfigPath = getExistPath(cwd, ['tsconfig.json']);
  if (tsConfigPath) {
    return false;
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
    assert.ok(topTsConfigPath, 'Tsconfig.json must be exit.');
    return;
  }
  copyFileSync(topTsConfigPath, join(cwd, 'tsconfig.json'));

  process.on('SIGINT', () => {
    ctr.signale.scope('exit').note('exit: rm tsconfig.json');
    rimraf.sync(join(cwd, 'tsconfig.json'));
    process.exit(0);
  });
  process.on('exit', () => {
    ctr.signale.scope('exit').note('exit: rm tsconfig.json');
    rimraf.sync(join(cwd, 'tsconfig.json'));
  });

  return false;
}

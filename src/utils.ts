import assert from 'assert';
import { copyFileSync, existsSync, readFileSync } from 'fs';
import { basename, dirname, extname, join } from 'path';
import isRoot from 'path-is-root';
import rimraf from 'rimraf';
import si, { DefaultMethods, Signale } from 'signale';
import { ENTREY_DIRS, ENTRY_FILES } from './constants';
import { BundleType, IBuildOpts, IFormattedBuildConf, IPackage } from './types';

export function getEntry(conf: IFormattedBuildConf, opts: IBuildOpts, dir?: boolean) {
  if (conf.entry) {
    return conf.entry;
  }
  const entryPath = getExistFilePath({ cwd: opts.cwd, files: dir ? ENTREY_DIRS : ENTRY_FILES });
  assert.ok(entryPath, 'entry must be exit!');
  return (entryPath as IFilePath).relative;
}

export function getExport(
  type: BundleType,
  conf: IFormattedBuildConf,
  opts: IBuildOpts,
  dir: string = 'dist',
) {
  const entry = getEntry(conf, opts);
  const fname = basename(entry).replace(extname(entry), '');
  return `${dir}/${(conf[type] && (conf[type] as any).name) || fname}.${type}.js`;
}

export function getPackageJson(cwd: string): IPackage {
  const pkgPath = join(cwd, 'package.json');
  const pkg: IPackage = JSON.parse(readFileSync(pkgPath, 'utf-8'));
  return pkg;
}

export interface IFilePath {
  abs: string;
  relative: string;
}

export function getExistFilePath({
  cwd,
  files,
}: {
  cwd: string;
  files: string[];
}): IFilePath | null {
  for (const file of files) {
    const absPath = join(cwd, file);
    if (existsSync(absPath)) {
      return {
        relative: file,
        abs: absPath,
      };
    }
  }
  return null;
}

export const signale: Signale & {
  init: (pkg?: IPackage) => void;
  changeType: (str: string) => void;
  name?: string;
  type?: BundleType | 'package.json' | '';
} = {
  name: '',
  type: '',
  init(pkg?: IPackage) {
    this.name = (pkg && pkg.name) || '';
    types.forEach(t => {
      this[t] = (message: any) => si[t](`[${this.name}] [${this.type}] ${message}`);
    });
  },
} as any;
const types: DefaultMethods[] = [
  'info',
  'success',
  'start',
  'error',
  'complete',
  'watch',
  'note',
  'await',
];

export function generateTsConfig(opts: IBuildOpts) {
  const { cwd } = opts;

  const tsConfigPath = getExistFilePath({ cwd, files: ['tsconfig.json'] });
  if (tsConfigPath) {
    return false;
  }

  let currentPath = cwd;

  let topTsConfigPath: string = '';
  while (!topTsConfigPath && !isRoot(cwd)) {
    const p = getExistFilePath({ cwd: currentPath, files: ['tsconfig.json'] });
    if (p) {
      topTsConfigPath = p.abs;
    }
    currentPath = dirname(currentPath);
  }

  if (!topTsConfigPath) {
    assert.ok(topTsConfigPath, 'Tsconfig.json must be exit.');
    return;
  }
  copyFileSync(topTsConfigPath, join(cwd, 'tsconfig.json'));

  if (opts.watch) {
    process.on('SIGINT', () => {
      signale.note('SIGINT: rm tsconfig.json');
      rimraf.sync(join(cwd, 'tsconfig.json'));
    });
  } else {
    process.on('exit', () => {
      rimraf.sync(join(cwd, 'tsconfig.json'));
    });
  }

  return false;
}

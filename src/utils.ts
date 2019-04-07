import assert from 'assert';
import { copyFileSync, existsSync, readFileSync, statSync } from 'fs';
import { basename, dirname, extname, join } from 'path';
import isRoot from 'path-is-root';
import rimraf from 'rimraf';
import si, { DefaultMethods, Signale } from 'signale';
import { ENTRY_DIRS, ENTRY_FILES, ROLLUP_OUPUT_DIR } from './constants';
import { BundleType, IBuildOpts, IFormattedBuildConf, IPackage } from './types';

export interface IPath {
  abs: string;
  relative: string;
}

export function getExistPath({
  cwd,
  files,
  dir,
}: {
  cwd: string;
  files: string[];
  dir?: boolean;
}): IPath | undefined {
  for (const file of files) {
    const absPath = join(cwd, file);
    if (existsSync(absPath)) {
      const stat = statSync(absPath);
      if ((dir && stat.isDirectory()) || (!dir && stat.isFile())) {
        return { relative: file, abs: absPath };
      }
    }
  }
  return;
}

export function getEntry(conf: IFormattedBuildConf, opts: IBuildOpts, dir?: boolean) {
  const entryPath =
    conf.entry || getExistPath({ cwd: opts.cwd, files: dir ? ENTRY_DIRS : ENTRY_FILES, dir });
  assert.ok(entryPath, 'entry must be exit!');
  const entry = entryPath as IPath;

  return entry.relative;
}

export function getOutput(
  type: BundleType,
  conf: IFormattedBuildConf,
  opts: IBuildOpts,
  outputDir: string = ROLLUP_OUPUT_DIR,
) {
  const dir = outputDir !== 'dist';
  const entry = getEntry(conf, opts, dir);
  const name =
    (conf[type] && (conf[type] as any).name) || basename(entry).replace(extname(entry), '');

  return `${outputDir}/${name}.${type}.js`;
}

export function getPackageJson(cwd: string): IPackage {
  const pkgPath = join(cwd, 'package.json');
  const pkg: IPackage = JSON.parse(readFileSync(pkgPath, 'utf-8'));
  return pkg;
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
  'warn',
  'await',
];

export function generateTsConfig(opts: IBuildOpts) {
  signale.info('generate tsconfig.json');
  const { cwd } = opts;

  const tsConfigPath = getExistPath({ cwd, files: ['tsconfig.json'] });
  if (tsConfigPath) {
    return false;
  }

  let currentPath = cwd;

  let topTsConfigPath: string = '';
  while (!topTsConfigPath && !isRoot(cwd)) {
    const p = getExistPath({ cwd: currentPath, files: ['tsconfig.json'] });
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

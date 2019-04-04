import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import prettier from 'prettier';
import si, { DefaultMethods, Signale } from 'signale';
import sort from 'sort-package-json';
import { BundleType, IPackage } from './types';

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

export const signale: Signale & { init: (pkg?: IPackage) => void } = {
  init(pkg?: IPackage) {
    const prefix = pkg && pkg.name ? `[${pkg.name}] ` : '';
    types.forEach(t => {
      this[t] = (message: any) => si[t](`${prefix}${message}`);
    });
  },
} as any;
const types: DefaultMethods[] = ['info', 'success', 'start', 'error', 'complete', 'watch'];

let updated: any = {};

export function registerUpdate(cwd: string, type: BundleType, f: string) {
  updated[cwd] = updated[cwd] || {};
  updated[cwd][type] = f;
}

export function updatePackage(cwd: string) {
  const pkg = getPackageJson(cwd);
  const info = updated[cwd];
  // delete pkg.main;
  delete pkg['umd:main'];
  delete pkg.module;
  delete pkg['jsnext:main'];
  delete pkg.browser;
  delete pkg.sideEffects;
  if (info) {
    const { esm, cjs, umd } = info;
    pkg.main = umd || cjs || esm || pkg.main;
    pkg['umd:main'] = umd;
    pkg.module = esm;
    // pkg.source = esm || cjs || umd;
    pkg['jsnext:main'] = esm;
    pkg.browser = umd;
    // if (umd) {
    //   pkg.unpkg = umd;
    // }
    if (esm) {
      pkg.sideEffects = true;
    }

    if (esm || umd || cjs) {
      pkg.types = (esm || umd || cjs).replace(/\.(esm|umd|cjs)\.js/, '.d.ts');
    }
  }
  writeFileSync(
    join(cwd, 'package.json'),
    prettier.format(JSON.stringify(sort(pkg)), { parser: 'json', printWidth: 1 }),
    { encoding: 'utf8' },
  );
  signale.info('Updated Package.json');
  updated = {};
}

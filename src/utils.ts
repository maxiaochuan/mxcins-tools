import si, { Signale, DefaultMethods } from 'signale';
import * as prettier from 'prettier';
import { join } from 'path';
import sort from 'sort-package-json';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { IPackage, ModuleFormat } from './types';

interface IGetExistFileOpts {
  cwd: string;
  files: string[];
}

export const signale: Signale = {} as any;
const types: DefaultMethods[] = ['info', 'success', 'start', 'error', 'complete', 'watch'];
export function registerPrefix(pkg?: IPackage) {
  const prefix = pkg && pkg.name ? `[${pkg.name}] ` : '';
  types.forEach(t => {
    signale[t] = (message: any) => si[t](`${prefix}${message}`);
  });
}

// registerPrefix();

export function getPackage(cwd: string): IPackage {
  const pkgPath = join(cwd, 'package.json');
  return JSON.parse(readFileSync(pkgPath, 'utf-8'));
}

export function getExistFile({ cwd, files }: IGetExistFileOpts) {
  for (const file of files) {
    const absPath = join(cwd, file);
    if (existsSync(absPath)) {
      return {
        relative: file,
        abs: absPath,
      };
    }
  }
}

let updated: any = {};

export function registerUpdate(cwd: string, type: ModuleFormat, f: string) {
  updated[cwd] = updated[cwd] || {};
  updated[cwd][type] = f;
}

export function updatePackage(cwd: string) {
  const pkg = getPackage(cwd);
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

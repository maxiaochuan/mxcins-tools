import si, { Signale, DefaultMethods } from 'signale';
import { join } from 'path';
import { existsSync, readFileSync } from 'fs';
import { IPackage } from './types';

interface IGetExistFileOpts {
  cwd: string;
  files: string[];
}

export const signale: Signale = {} as any;
const types: DefaultMethods[] = ['info', 'success', 'start', 'error', 'complete', 'watch'];

export function registerPrefix(pkg: IPackage) {
  const prefix = pkg.name ? `[${pkg.name}] ` : '';
  types.forEach(t => {
    signale[t] = (message: any) => si[t](`${prefix}${message}`);
  });
}

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

import signale, { DefaultMethods } from 'signale';
import { join } from 'path';
import { existsSync, readFileSync } from 'fs';
import { IPackage } from './types';

interface IGetExistFileOpts {
  cwd: string;
  files: string[];
}

export type Print = (type: DefaultMethods, msg: any) => void;

export function createPrint(pkg: IPackage) {
  const prefix = pkg.name ? `[${pkg.name}] ` : '';
  const print: Print = (type, msg) => {
    // return signale[type]({ prefix, message:msg});
    return signale[type](`${prefix}${msg}`);
  };
  return print;
}

export function getPackage(cwd: string) {
  const pkgPath = join(cwd, 'package.json');
  const pkg: IPackage = JSON.parse(readFileSync(pkgPath, 'utf-8'));
  return pkg;
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

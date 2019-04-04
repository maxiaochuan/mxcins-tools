import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { IPackage } from './types';

export function getPackageJson(cwd: string): IPackage {
  const pkgPath = join(cwd, 'package.json');
  const pkg: IPackage = JSON.parse(readFileSync(pkgPath, 'utf-8'));
  return pkg;
}

export interface IFilePath {
  abs: string;
  relative: string;
}

export function getExistFile({ cwd, files }: { cwd: string; files: string[] }): IFilePath | null {
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

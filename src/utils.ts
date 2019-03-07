import { join } from 'path';
import { existsSync } from 'fs';

interface IGetExistFileOpts {
  cwd: string;
  files: string[];
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

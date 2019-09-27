import { existsSync } from 'fs';
import { join } from 'path';

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

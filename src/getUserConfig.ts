import { getExistFile } from './utils';
import { IConfig } from './types';
import { CONFIG_FILES } from './const';

interface IGetUserConfigOpts {
  cwd: string;
}

const d = <T>(o: any): T => o.default || o;

export default function getUserConfig(opts: IGetUserConfigOpts): IConfig {
  const { cwd } = opts;
  const file = getExistFile({ cwd, files: CONFIG_FILES });
  if (file) {
    const config = d(require(file.abs));
    return config;
  }
  return {};
}

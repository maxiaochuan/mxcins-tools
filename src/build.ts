import { join } from 'path';
import signale from 'signale';
import { getUserConfig } from './getUserConfig';
import { IPackageJSON } from './types';

interface IBundleOpts {
  cwd: string;
  watch: boolean;
  update: boolean;
}

export default async (opts: IBundleOpts) => {
  try {
    const { cwd } = opts;
    // eslint-disable-next-line import/no-dynamic-require
    const pkg: IPackageJSON = require(join(cwd, 'package'));
    const conf = getUserConfig(opts.cwd, pkg);

    signale.info(conf);
  } catch (error) {
    signale.scope(error.scope).error(error.message);
  }
};

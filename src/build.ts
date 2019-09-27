import { join } from 'path';
import signale from 'signale';
import { getUserConfig } from './getUserConfig';
import { IPackageJSON } from './types';

import rollup from './rollup';

interface IBuildOpts {
  cwd: string;
  watch: boolean;
  update: boolean;
}

export default async (opts: IBuildOpts) => {
  const { cwd, watch } = opts;
  const pkg: IPackageJSON = require(join(cwd, 'package'));
  try {
    /**
     * get config
     */
    const conf = getUserConfig(opts.cwd, pkg);

    if (conf.esm) {
      await rollup({ cwd, type: 'esm', conf, pkg, watch });
    }
  } catch (error) {
    console.error(error);
    signale.scope(error.scope || 'Build').error(error.message);
  }
};

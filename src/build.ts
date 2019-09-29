import { join } from 'path';
import signale from 'signale';
import { getUserConfig } from './getUserConfig';
import { IPackageJSON } from './types';

import rollup from './rollup';
import gulp from './gulp';

interface IBuildOpts {
  cwd: string;
  watch: boolean;
  package: boolean;
}

/**
 * 
 */
export default async (opts: IBuildOpts) => {
  const { cwd, watch } = opts;
  const pkg: IPackageJSON = require(join(cwd, 'package'));
  try {
    /**
     * get config
     */
    const conf = getUserConfig(opts.cwd, pkg);

    if (conf.esm) {
      if (conf.esm.type === 'single') {
        await rollup({ cwd, type: 'esm', conf, pkg, watch });
      }
      if (conf.esm.type === 'multiple') {
        await gulp({ cwd, type: 'esm', conf, pkg, watch });
      }
    }
  } catch (error) {
    if (error.scope) {
      signale.scope(...error.scope || 'Build').error(error.message);
    } else {
      console.log('e', error);
      process.exit(1);
    }
  }
};

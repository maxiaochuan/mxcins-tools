import { join } from 'path';
import signale from 'signale';
import { getUserConfig } from './getUserConfig';
import { IPackageJSON, IBuildOpts, IOutput } from './types';

import rollup from './rollup';
import gulp from './gulp';
import updatePackageJSON from './package';

/**
 *
 */
export default async (opts: IBuildOpts) => {
  const { cwd, watch } = opts;
  const output: IOutput = {};
  const pkg: IPackageJSON = require(join(cwd, 'package'));
  try {
    /**
     * get config
     */
    const conf = getUserConfig(opts.cwd, pkg);

    if (conf.esm) {
      if (conf.esm.type === 'single') {
        output.esm = await rollup({ cwd, type: 'esm', conf, pkg, watch });
      }
      if (conf.esm.type === 'multiple') {
        output.esm = await gulp({ cwd, type: 'esm', conf, pkg, watch });
      }
    }

    if (conf.cjs) {
      if (conf.cjs.type === 'single') {
        output.cjs = await rollup({ cwd, type: 'cjs', conf, pkg, watch });
      }
      if (conf.cjs.type === 'multiple') {
        output.cjs = await gulp({ cwd, type: 'cjs', conf, pkg, watch });
      }
    }

    if (conf.umd) {
      output.umd = await rollup({ cwd, type: 'umd', conf, pkg, watch });
    }

    if (opts.package) {
      updatePackageJSON(output, pkg, opts);
    }
  } catch (error) {
    if (error.scope) {
      signale.scope(...(error.scope || 'Build')).error(error.message);
    } else {
      // eslint-disable-next-line no-console
      console.log('e', error);
      process.exit(1);
    }
  }
};

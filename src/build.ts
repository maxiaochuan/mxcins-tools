import getUserConfig from './getUserConfig';
import { IBuildOpts } from './types';
import { getPackageJson, signale } from './utils';

import babel from './babel';
import gulp from './gulp';
import rollup from './rollup';

export default async function build(opts: IBuildOpts) {
  try {
    /**
     * 获取 package.json
     */
    const pkg = getPackageJson(opts.cwd);
    /**
     * 初始化 signale
     */
    signale.init(pkg);

    const conf = getUserConfig(pkg, opts);

    if (conf.esm) {
      signale.type = 'esm';
      signale.start('Building Start.');
      if (conf.esm.type === 'single') {
        await rollup('esm', conf, opts);
      } else if (conf.esm.type === 'multiple') {
        await babel('esm', conf, opts);
      } else if (conf.esm.type === 'dynamic') {
        await gulp('esm', conf, opts);
      }
      signale.complete('Building Complete.\n\n');
    }

    if (conf.cjs) {
      signale.type = 'cjs';
      signale.start('Building Start.');
      if (conf.cjs.type === 'single') {
        await rollup('cjs', conf, opts);
      } else if (conf.cjs.type === 'multiple') {
        await babel('cjs', conf, opts);
      }
      signale.complete('Building Complete.\n\n');
    }

    if (conf.umd) {
      signale.type = 'umd';
      signale.start('Building Start.');
      if (conf.umd.type === 'single') {
        await rollup('umd', conf, opts);
      }
      signale.complete('Building Complete.\n\n');
    }
  } catch (error) {
    // tslint:disable-next-line:no-console
    console.log(error);
    signale.error(error);
  }
}

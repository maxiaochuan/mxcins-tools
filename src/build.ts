import getUserConfig from './getUserConfig';
import { IBuildOpts } from './types';
import { getPackageJson, signale } from './utils';

import babel from './babel';
import rollup from './rollup';

export default async function build(opts: IBuildOpts) {
  try {
    const pkg = getPackageJson(opts.cwd);
    signale.init(pkg);

    const conf = getUserConfig(pkg, opts);

    if (conf.esm) {
      signale.start(`[esm] Building...`);
      if (conf.esm.type === 'singular') {
        await rollup('esm', conf, opts);
      } else if (conf.esm.type === 'plural') {
        await babel('esm', conf, opts);
      } else if (conf.esm.type === 'dynamic') {
        signale.note('//TODO: dynamic');
      }
      signale.complete('[esm] building complete.');
    }

    if (conf.cjs) {
      signale.start(`[cjs] Building...`);
      if (conf.cjs.type === 'singular') {
        await rollup('cjs', conf, opts);
      } else if (conf.cjs.type === 'plural') {
        await babel('esm', conf, opts);
      }
      signale.complete('[cjs] building complete.');
    }

    if (conf.umd) {
      signale.start(`[umd] Building...`);
      if (conf.umd.type === 'singular') {
        await rollup('umd', conf, opts);
      }
      signale.complete('[umd] building complete.');
    }
  } catch (error) {
    signale.error(error);
  }
}

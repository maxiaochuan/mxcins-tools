import { join } from 'path';
import signale from 'signale';
import assert from 'assert';
import { readdirSync, existsSync, createReadStream, createWriteStream } from 'fs';
import rimraf from 'rimraf';
import { getUserConfig } from './getUserConfig';
import { IPackageJSON, IBuildOpts, IOutput } from './types';

import rollup from './rollup';
import gulp from './gulp';
import updatePackageJSON from './package';

/**
 *
 */
const build = async (opts: IBuildOpts) => {
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

async function buildForLerna(opts: IBuildOpts) {
  // const { cwd } = opts;
  try {
    const isTs = existsSync(join(opts.cwd, 'tsconfig.json'));
    const pkgs = readdirSync(join(opts.cwd, 'packages'));
    // eslint-disable-next-line no-restricted-syntax
    for (const pkg of pkgs) {
      const pkgPath = join(opts.cwd, 'packages', pkg);
      assert.ok(
        existsSync(join(pkgPath, 'package.json')),
        `package.json not found in packages/${pkg}`,
      );
      process.chdir(pkgPath);
      if (isTs && !existsSync(join(pkgPath, 'tsconfig.json'))) {
        createReadStream(join(opts.cwd, 'tsconfig.json')).pipe(
          createWriteStream(join(pkgPath, 'tsconfig.json')),
        );
        // eslint-disable-next-line no-loop-func
        // process.on('SIGINT', () => {
        //   signale.scope('EXIT').note('exit: rm tsconfig.json');
        //   rimraf.sync(join(pkgPath, 'tsconfig.json'));
        //   process.exit(0);
        // });
        process.on('exit', () => {
          signale.scope('EXIT').note('exit: rm tsconfig.json');
          rimraf.sync(join(pkgPath, 'tsconfig.json'));
          process.exit(0);
        });
      }
      // eslint-disable-next-line no-await-in-loop
      await build({
        ...opts,
        cwd: pkgPath,
        // root: cwd,
      });
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  }
}

export default async function(opts: IBuildOpts) {
  const useLerna = existsSync(join(opts.cwd, 'lerna.json'));
  if (useLerna) {
    await buildForLerna(opts);
  } else {
    await build(opts);
  }
}

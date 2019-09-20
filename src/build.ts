import assert from 'assert';
import { existsSync, readdirSync } from 'fs';
import { join } from 'path';
import rimraf from 'rimraf';

import getUserConfig from './getUserConfig';
import { IBuildOpts } from './types';
import { getPackageJson, ctr } from './utils';

import babel from './babel';
import gulp from './gulp';
import rollup from './rollup';
import update from './update';

async function build(opts: IBuildOpts) {
  try {
    /**
     * 获取 package.json
     */
    const pkg = getPackageJson(opts.cwd);
    /**
     * 初始化 signale
     */
    ctr.signale = ctr.signale.scope(pkg.name);

    const conf = getUserConfig(pkg, opts);


    if (!conf) {
      ctr.signale.warn('Config file does not exist, skip project!\n\n');
      return;
    }

    // 2019-04-05 18:14:16 fix bug 多种构建会被删除 所以移动到上层
    rimraf.sync(join(opts.cwd, 'dist'));

    if (conf.esm) {
      ctr.signale = ctr.signale.scope(pkg.name, 'esm');
      const { signale } = ctr;
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
      ctr.signale = ctr.signale.scope(pkg.name, 'cjs');
      const { signale } = ctr;
      signale.start('Building Start.');
      if (conf.cjs.type === 'single') {
        await rollup('cjs', conf, opts);
      } else if (conf.cjs.type === 'multiple') {
        await babel('cjs', conf, opts);
      }
      signale.complete('Building Complete.\n\n');
    }

    if (conf.umd) {
      ctr.signale = ctr.signale.scope(pkg.name, 'umd');
      const { signale } = ctr;
      if (conf.umd.type === 'single') {
        await rollup('umd', conf, opts);
      }
      signale.complete('Building Complete.\n\n');
    }

    if (opts.update) {
      update(pkg, conf, opts);
    }
  } catch (error) {
    // tslint:disable-next-line:no-console
    ctr.signale.error(error);
  }
}

async function buildForLerna(opts: IBuildOpts) {
  const { cwd } = opts;
  try {
    // const config = getUserConfig(opts);
    const pkgs = readdirSync(join(opts.cwd, 'packages'));
    // eslint-disable-next-line no-restricted-syntax
    for (const pkg of pkgs) {
      const pkgPath = join(opts.cwd, 'packages', pkg);
      assert.ok(
        existsSync(join(pkgPath, 'package.json')),
        `package.json not found in packages/${pkg}`,
      );
      process.chdir(pkgPath);
      // eslint-disable-next-line no-await-in-loop
      await build({
        ...opts,
        cwd: pkgPath,
        root: cwd,
      });
    }
  } catch (e) {
    ctr.signale.fatal(e);
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

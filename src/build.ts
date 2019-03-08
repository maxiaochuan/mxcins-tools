import { join } from 'path';
import { readdirSync, existsSync } from 'fs';
import * as assert from 'assert';
import rimraf from 'rimraf';
import registerBabel from './registerBabel';
import getUserConfig from './getUserConfig';
import { IEsm, ICjs, IUmd, IOpts } from './types';
import { getPackage, signale, registerPrefix, updatePackage } from './utils';
import { CONFIG_FILES } from './const';
import rollup from './rollup';
import babel from './babel';

export async function build(opts: IOpts) {
  const { cwd, watch } = opts;

  try {
    const pkg = getPackage(cwd);
    // 注册 log prefix;
    registerPrefix(pkg);

    // 注册babel 读取配置文件
    registerBabel({ cwd, only: CONFIG_FILES });

    // 获取配置
    const config = getUserConfig(opts);

    // 清除 dist
    signale.info('Clean dist directory');
    rimraf.sync(join(cwd, 'dist'));

    if (config.esm) {
      const esm = config.esm as IEsm;
      signale.start(`[esm] Build with ${esm.type}.`);
      if (esm.type === 'rollup') {
        await rollup({ cwd, watch, type: 'esm', config });
      } else {
        await babel({ cwd, watch, type: 'esm', config });
      }
      signale.complete('[cjs] building complete.');
    }

    if (config.cjs) {
      const cjs = config.cjs as ICjs;
      signale.start(`[cjs] Build with ${cjs.type}.`);
      if (cjs.type === 'rollup') {
        await rollup({ cwd, watch, type: 'cjs', config });
      } else {
        await babel({ cwd, watch, type: 'cjs', config });
      }
      signale.complete('[cjs] building complete.');
    }

    if (config.umd) {
      const umd = config.umd as IUmd;
      signale.start(`[umd] Build with ${umd.type}.`);
      await rollup({ cwd, watch, type: 'umd', config });
      signale.complete('[umd] building complete.');
    }

    updatePackage(cwd);
  } catch (e) {
    signale.error(e);
  }
}

export async function buildForLerna(opts: IOpts) {
  const { cwd } = opts;
  try {
    registerBabel({ cwd, only: CONFIG_FILES });
    // const config = getUserConfig(opts);
    const pkgs = readdirSync(join(opts.cwd, 'packages'));
    for (const pkg of pkgs) {
      const pkgPath = join(opts.cwd, 'packages', pkg);
      assert.ok(
        existsSync(join(pkgPath, 'package.json')),
        `package.json not found in packages/${pkg}`,
      );
      process.chdir(pkgPath);
      await build({
        ...opts,
        cwd: pkgPath,
        config: {},
      });
    }
  } catch (e) {
    signale.error(e);
  }
}

export default async function(opts: IOpts) {
  const useLerna = existsSync(join(opts.cwd, 'lerna.json'));
  if (useLerna) {
    await buildForLerna(opts);
  } else {
    await build(opts);
  }
}

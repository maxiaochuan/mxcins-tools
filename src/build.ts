import { join } from 'path';
import { readdirSync, existsSync } from 'fs';
import * as assert from 'assert';
import signale from 'signale';
import rimraf from 'rimraf';
import registerBabel from './registerBabel';
import getUserConfig from './getUserConfig';
import { CONFIG_FILES } from './const';
import rollup from './rollup';
import { IEsm, ICjs, IUmd, IOpts } from './types';
import { getPackage, createPrint } from './utils';

export async function build(opts: IOpts) {
  const { cwd, watch } = opts;

  try {
    const pkg = getPackage(cwd);
    const print = createPrint(pkg);

    // 注册babel 读取配置文件
    registerBabel({ cwd, only: CONFIG_FILES });

    // 获取配置
    const config = getUserConfig(opts);

    // 清除 dist
    print('info', 'Clean dist directory');
    rimraf.sync(join(cwd, 'dist'));

    if (config.esm) {
      print('start', 'Build esm starting.');
      const esm = config.esm as IEsm;
      if (esm.type === 'rollup') {
        await rollup({ cwd, watch, type: 'esm', config, print });
      }
      print('complete', 'Build esm complete.');
    }

    if (config.cjs) {
      print('start', 'Build cjs starting.');
      const cjs = config.cjs as ICjs;
      if (cjs.type === 'rollup') {
        await rollup({ cwd, watch, type: 'cjs', config, print });
      }
      print('complete', 'Build cjs complete.');
    }

    if (config.umd) {
      print('start', 'Build umd starting.');
      const umd = config.umd as IUmd;
      if (umd.type === 'rollup') {
        await rollup({ cwd, watch, type: 'umd', config, print });
      }
      print('complete', 'Build umd complete.');
    }
    print('success', 'All build success.');
  } catch (e) {
    signale.error(e);
  }
}

export async function buildForLerna(opts: IOpts) {
  const { cwd } = opts;
  try {
    registerBabel({ cwd, only: CONFIG_FILES });
    const config = getUserConfig(opts);
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
        config: getUserConfig({ ...opts, config }),
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

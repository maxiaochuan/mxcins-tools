// tslint:disable:no-unused-expression
import { writeFileSync } from 'fs';
import { join } from 'path';
import prettier from 'prettier';
import sort from 'sort-package-json';
import { TYPE_FILES } from './constants';
import { IBuildOpts, IFormattedBuildConf, IPackage } from './types';
import { getExistPath, getOutput, signale } from './utils';

const MAYBE_OUTPUT_FILES = ['es/index.js', 'lib/index.js'];

function getMaybeOutput(cwd: string, files: string[]) {
  const maybe = getExistPath({ cwd, files });
  if (maybe) {
    return maybe.relative;
  }
  return;
}

export default function update(pkg: IPackage, conf: IFormattedBuildConf, opts: IBuildOpts) {
  try {
    signale.type = 'package.json';

    const infos: { esm?: string; cjs?: string; umd?: string } = {};
    if (conf.esm) {
      if (conf.esm.type === 'single') {
        infos.esm = getOutput('esm', conf, opts);
      } else if (conf.esm.type === 'multiple' || conf.esm.type === 'dynamic') {
        infos.esm = getMaybeOutput(opts.cwd, MAYBE_OUTPUT_FILES);
      }
    }
    if (conf.cjs) {
      if (conf.cjs.type === 'single') {
        infos.cjs = getOutput('cjs', conf, opts);
      } else if (conf.cjs.type === 'multiple') {
        infos.cjs = getMaybeOutput(opts.cwd, MAYBE_OUTPUT_FILES);
      }
    }
    if (conf.umd) {
      infos.umd = getOutput('umd', conf, opts);
    }

    const { umd, cjs, esm } = infos;
    // 2019-04-05 18:48:41 修改优先级 cjs > umd > pkg.main;
    (pkg.main = cjs || umd || pkg.main || esm) && signale.info(`main: ${pkg.main}`);
    (pkg['umd:main'] = umd) && signale.info(`umd:main: ${pkg['umd:main']}`);
    (pkg.module = esm) && signale.info(`module: ${pkg.module}`);
    // TODO: source
    (pkg['jsnext:main'] = esm) && signale.info(`jsnext:main: ${pkg['jsnext:main']}`);
    (pkg.browser = umd) && signale.info(`browser: ${pkg.browser}`);
    // TODO: unpkg
    if (esm) {
      (pkg.sideEffects = true) && signale.info('side effects: true');
    }

    const anyone = esm || umd || cjs;
    if (anyone) {
      const types = getExistPath({
        cwd: opts.cwd,
        files: [
          conf.types || anyone.replace(/\.(esm|umd|cjs)/, '').replace(/\.js/, '.d.ts'),
          ...TYPE_FILES,
        ],
      });
      if (types) {
        (pkg.types = types.relative) && signale.info(`types: ${pkg.types}`);
      }
    }
    writeFileSync(
      join(opts.cwd, 'package.json'),
      prettier.format(JSON.stringify(sort(pkg)), { parser: 'json', printWidth: 1 }),
      { encoding: 'utf8' },
    );
    signale.success('Update package.json complete.\n\n');
  } catch (error) {
    // tslint:disable-next-line:no-console
    console.error(error);
  }
}

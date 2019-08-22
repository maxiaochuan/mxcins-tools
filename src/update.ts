// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable no-unused-expressions */
import { writeFileSync } from 'fs';
import { join } from 'path';
import prettier from 'prettier';
import sort from 'sort-package-json';
import { TYPE_FILES } from './constants';
import { IBuildOpts, IFormattedBuildConf, IPackage } from './types';
import { getExistPath, getOutput, ctr } from './utils';

const MAYBE_OUTPUT_FILES = ['es/index.js', 'lib/index.js'];

const getMaybeOutput = (cwd: string, files: string[]) =>
  getExistPath(cwd, files, { relative: true });

export default function update(pkg: IPackage, conf: IFormattedBuildConf, opts: IBuildOpts) {
  try {
    const signale = ctr.signale.scope('package.json');

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
    const copy = { ...pkg };
    // 2019-08-14 10:00:00 修改优先级, 根据webpack的 mainFields https://webpack.js.org/configuration/resolve/#resolvemainfields
    (copy['jsnext:main'] = esm) && signale.info(`jsnext:main: ${copy['jsnext:main']}`);
    (copy.browser = esm) && signale.info(`browser: ${copy.browser}`);
    (copy.module = cjs || esm) && signale.info(`browser: ${copy.module}`);
    (copy.main = cjs || esm || umd) && signale.info(`main: ${copy.main}`);
    (copy['umd:main'] = umd) && signale.info(`umd:main: ${copy['umd:main']}`);
    // TODO: source
    // TODO: unpkg
    if (esm) {
      (copy.sideEffects = true) && signale.info('side effects: true');
    }

    const anyone = esm || umd || cjs;
    if (anyone) {
      const types = getExistPath(
        opts.cwd,
        [
          conf.types || anyone.replace(/\.(esm|umd|cjs)/, '').replace(/\.js/, '.d.ts'),
          ...TYPE_FILES,
        ],
        { relative: true },
      );
      if (types) {
        (copy.types = types) && signale.info(`types: ${copy.types}`);
      }
    }
    writeFileSync(
      join(opts.cwd, 'package.json'),
      prettier.format(JSON.stringify(sort(copy)), { parser: 'json', printWidth: 1 }),
      { encoding: 'utf8' },
    );
    signale.success('Update package.json complete.\n\n');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
  }
}

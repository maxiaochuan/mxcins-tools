// tslint:disable:no-unused-expression
import { writeFileSync } from 'fs';
import { join } from 'path';
import prettier from 'prettier';
import sort from 'sort-package-json';
import { TYPE_FILES } from './constants';
import getUserConfig from './getUserConfig';
import { IBuildOpts } from './types';
import { getExistFilePath, getExport, getPackageJson, signale } from './utils';

export default function update(opts: IBuildOpts) {
  try {
    const pkg = getPackageJson(opts.cwd);
    signale.init(pkg);
    signale.type = 'package.json';

    const conf = getUserConfig(pkg, opts);
    const infos: { esm?: string; cjs?: string; umd?: string } = {};
    if (conf.esm) {
      if (conf.esm.type === 'single') {
        infos.esm = getExport('esm', conf, opts);
      } else if (conf.esm.type === 'multiple' || conf.esm.type === 'dynamic') {
        infos.esm = getExport('esm', conf, opts, 'es');
      }
    }
    if (conf.cjs) {
      if (conf.cjs.type === 'single') {
        infos.cjs = getExport('cjs', conf, opts);
      } else if (conf.cjs.type === 'multiple') {
        infos.cjs = getExport('cjs', conf, opts, 'lib');
      }
    }
    if (conf.umd) {
      infos.umd = getExport('umd', conf, opts);
    }

    const { umd, cjs, esm } = infos;
    // 2019-04-05 18:48:41 修改优先级 cjs > umd > pkg.main;
    (pkg.main = cjs || umd || pkg.main || esm) && signale.info(`main: ${pkg.main}`);
    (pkg['umd:main'] = umd) && signale.info(`umd:main: ${pkg['umd:main']}`);
    (pkg.module = esm) && signale.info(`module: ${pkg.module}`);
    // pkg.source = esm || cjs || umd;
    (pkg['jsnext:main'] = esm) && signale.info(`jsnext:main: ${pkg['jsnext:main']}`);
    (pkg.browser = umd) && signale.info(`browser: ${pkg.browser}`);
    // if (umd) {
    //   pkg.unpkg = umd;
    // }
    if (esm) {
      (pkg.sideEffects = true) && signale.info('side effects: true');
    }

    const anyone = esm || umd || cjs;
    if (anyone) {
      // const typeFilePath = getExistFilePath({ cwd, files: [
      //   ...TYPE_FILES,
      // ] })
      const typeFilePath = getExistFilePath({
        cwd: opts.cwd,
        files: [
          ...(conf.types ? [conf.types] : []),
          anyone.replace(/\.(esm|umd|cjs)/, '').replace(/\.js/, '.d.ts'),
          ...TYPE_FILES,
        ],
      });
      (pkg.types = (typeFilePath && typeFilePath.relative) || undefined) &&
        signale.info(`types: ${pkg.types}`);
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

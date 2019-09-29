// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable no-unused-expressions */
import { writeFileSync } from 'fs';
import { join } from 'path';
import prettier from 'prettier';
import signale from 'signale';
import sort from 'sort-package-json';
import { TYPE_FILES } from './const';
import { IBuildOpts, IPackageJSON, IOutput } from './types';
import { getExistPath } from './utils';

// const MAYBE_OUTPUT_FILES = ['es/index.js', 'lib/index.js'];

// const getMaybeOutput = (cwd: string, files: string[]) =>
//   getExistPath(cwd, files, { relative: true });

export default function updatePackageJSON(output: IOutput, pkg: IPackageJSON, opts: IBuildOpts) {
  try {
    const print = signale.scope(pkg.name || '', 'package.json');

    const { umd, cjs, esm } = output;
    const copy = { ...pkg };
    // 2019-08-14 10:00:00 修改优先级, 根据webpack的 mainFields https://webpack.js.org/configuration/resolve/#resolvemainfields
    (copy['jsnext:main'] = esm) && print.info(`jsnext:main: ${copy['jsnext:main']}`);
    (copy.browser = esm) && print.info(`browser: ${copy.browser}`);
    (copy.module = cjs || esm) && print.info(`module: ${copy.module}`);
    (copy.main = cjs || esm || umd) && print.info(`main: ${copy.main}`);
    (copy['umd:main'] = umd) && print.info(`umd:main: ${copy['umd:main']}`);
    // TODO: source
    // TODO: unpkg
    if (esm) {
      (copy.sideEffects = true) && print.info('side effects: true');
    }

    const anyone = esm || umd || cjs;
    if (anyone) {
      const types = getExistPath(
        opts.cwd,
        [anyone.replace(/\.(esm|umd|cjs)/, '').replace(/\.js/, '.d.ts'), ...TYPE_FILES],
        { relative: true },
      );
      if (types) {
        (copy.types = types) && print.info(`types: ${copy.types}`);
      }
    }
    writeFileSync(
      join(opts.cwd, 'package.json'),
      prettier.format(JSON.stringify(sort(copy)), { parser: 'json', printWidth: 1 }),
      { encoding: 'utf8' },
    );
    print.complete('Update package.json complete.\n\n');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
  }
}

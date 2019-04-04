import assert from 'assert';
import { copyFileSync } from 'fs';
import { dirname, join } from 'path';
import isRoot from 'path-is-root';
import rimraf from 'rimraf';
import { rollup, watch } from 'rollup';
import getRollupConfig from './getRollupConfig';
import { BundleType, IBuildOpts, IFormattedBuildConf } from './types';
import { getExistFilePath, registerUpdate, signale } from './utils';

function generateTsConfig(opts: IBuildOpts) {
  const { cwd } = opts;

  const tsConfigPath = getExistFilePath({ cwd, files: ['tsconfig.json'] });
  if (tsConfigPath) {
    return false;
  }

  let currentPath = cwd;

  let topTsConfigPath: string = '';
  while (!topTsConfigPath && !isRoot(cwd)) {
    const p = getExistFilePath({ cwd: currentPath, files: ['tsconfig.json'] });
    if (p) {
      topTsConfigPath = p.abs;
    }
    currentPath = dirname(currentPath);
  }

  if (!topTsConfigPath) {
    assert.ok(topTsConfigPath, 'Tsconfig.json must be exit.');
    return;
  }
  copyFileSync(topTsConfigPath, join(cwd, 'tsconfig.json'));

  if (opts.watch) {
    process.on('SIGINT', () => {
      signale.note('SIGINT: rm tsconfig.json');
      rimraf.sync(join(cwd, 'tsconfig.json'));
    });
  } else {
    process.on('exit', () => {
      rimraf.sync(join(cwd, 'tsconfig.json'));
    });
  }

  return false;
}

export default async function build(type: BundleType, conf: IFormattedBuildConf, opts: IBuildOpts) {
  generateTsConfig(opts);
  const rollupConfig = getRollupConfig(type, conf, opts);

  if (opts.watch) {
    const watcher = watch([
      {
        ...rollupConfig,
        watch: {},
      },
    ]);
    signale.watch(`rollup.watching: [${type}]`);
    watcher.on('event', event => {
      if (event.error) {
        signale.error(event.error);
      } else {
        signale.info(`[${type}] file changed`);
      }
    });
  } else {
    const { output, ...input } = rollupConfig;
    signale.info(`rollup <- ${input.input}`);
    const bundle = await rollup(input);
    if (output) {
      await bundle.write(output);
      const f = (output.file as string).replace(`${opts.cwd}/`, '');
      registerUpdate(opts.cwd, type, f);
      signale.info(`rollup -> ${f}`);
    }
  }
}

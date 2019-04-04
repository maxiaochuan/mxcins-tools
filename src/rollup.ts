import assert from 'assert';
import { extname, join } from 'path';
import rimraf from 'rimraf';
import { rollup, watch } from 'rollup';
import { ENTRY_FILES } from './constants';
import getRollupConfig from './getRollupConfig';
import { BundleType, IBuildOpts, IFormattedBuildConf } from './types';
import { generateTsConfig, getExistFilePath, IFilePath, registerUpdate, signale } from './utils';

function getEntry(conf: IFormattedBuildConf, opts: IBuildOpts) {
  if (conf.entry) {
    return conf.entry;
  }
  const entryPath = getExistFilePath({ cwd: opts.cwd, files: ENTRY_FILES });

  assert.ok(entryPath, 'entry must be exit!');

  return (entryPath as IFilePath).relative;
}

export default async function build(type: BundleType, conf: IFormattedBuildConf, opts: IBuildOpts) {
  const entry = getEntry(conf, opts);
  const rollupConfig = getRollupConfig(type, entry, conf, opts);
  const isTs = ['.ts', '.tsx'].includes(extname(entry));

  if (isTs) {
    generateTsConfig(opts);
  }

  signale.info(`Clear dist directory`);
  const targetPath = join(opts.cwd, 'dist');
  rimraf.sync(targetPath);

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

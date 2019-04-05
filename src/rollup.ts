import { extname } from 'path';
import { rollup, watch } from 'rollup';
import getRollupConfig from './getRollupConfig';
import { BundleType, IBuildOpts, IFormattedBuildConf } from './types';
import { generateTsConfig, getEntry, signale } from './utils';

export default async function build(type: BundleType, conf: IFormattedBuildConf, opts: IBuildOpts) {
  const entry = getEntry(conf, opts);
  const rollupConfig = getRollupConfig(type, entry, conf, opts);
  const isTs = ['.ts', '.tsx'].includes(extname(entry));

  if (isTs) {
    generateTsConfig(opts);
  }

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
    signale.await(`rollup <- ${input.input}`);
    const bundle = await rollup(input);
    if (output) {
      await bundle.write(output);
      const f = (output.file as string).replace(`${opts.cwd}/`, '');
      signale.info(`rollup -> ${f}`);
    }
  }
}

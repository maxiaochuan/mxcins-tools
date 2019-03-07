import signale from 'signale';
import { rollup, watch } from 'rollup';
import { ModuleFormat, IFormattedConfig } from './types';
import getRollupConfig from './getRollupConfig';

interface IRollupOpts {
  cwd: string;
  watch?: boolean;
  type: ModuleFormat;
  config: IFormattedConfig;
}

export default async function build(opts: IRollupOpts) {
  const { cwd, type, config } = opts;

  const rollupConfig = getRollupConfig({ cwd, type, config });

  if (opts.watch) {
    const watcher = watch([
      {
        ...rollupConfig,
        watch: {},
      },
    ]);
    watcher.on('event', event => {
      if (event.error) {
        signale.error(event.error);
      } else {
        signale.info(`[${type}] file changed`);
      }
    });
  } else {
    const { output, ...input } = rollupConfig;
    const bundle = await rollup(input);
    if (output) {
      await bundle.write(output);
    }
  }
}

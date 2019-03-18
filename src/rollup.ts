import { rollup, watch } from 'rollup';
import { signale, registerUpdate } from './utils';
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
      const f = (output.file as string).replace(`${cwd}/`, '');
      registerUpdate(cwd, type, f);
      signale.info(`rollup -> ${f}`);
    }
  }
}

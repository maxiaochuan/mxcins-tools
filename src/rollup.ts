import signale from 'signale';
import { rollup, watch } from 'rollup';
import { ModuleFormat, IFormattedConfig } from './types';
import getRollupConfig from './getRollupConfig';
import { Print } from './utils';

interface IRollupOpts {
  cwd: string;
  print: Print;
  watch?: boolean;
  type: ModuleFormat;
  config: IFormattedConfig;
}

export default async function build(opts: IRollupOpts) {
  const { cwd, type, config, print } = opts;

  const rollupConfig = getRollupConfig({ cwd, type, config });

  if (opts.watch) {
    const watcher = watch([
      {
        ...rollupConfig,
        watch: {},
      },
    ]);
    print('watch', `rollup.watch`);
    watcher.on('event', event => {
      if (event.error) {
        signale.error(event.error);
      } else {
        print('info', `[${type}] file changed`);
      }
    });
  } else {
    const { output, ...input } = rollupConfig;
    print('info', `rollup <- ${input.input}`);
    const bundle = await rollup(input);
    if (output) {
      await bundle.write(output);
      print('info', `rollup -> ${(output.file as string).replace(`${cwd}/`, '')}`);
    }
  }
}

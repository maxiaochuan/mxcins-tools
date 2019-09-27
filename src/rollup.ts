import { extname } from 'path';
import signale from 'signale';
import { rollup, watch } from 'rollup';
import { BundleType, IRequiredConfig, IPackageJSON } from './types';
import { getRollupConfig } from './getRollupConfig';
import { getEntryPath } from './utils';
import { DEFAULT_ROLLUP_ENTRY_FILES } from './const';

interface IRollupOpts {
  cwd: string;
  watch?: boolean;
  type: BundleType;
  conf: IRequiredConfig;
  pkg: IPackageJSON;
}

const run = async (opts: IRollupOpts) => {
  const { cwd, type, pkg, conf } = opts;
  const entry = conf.entry || getEntryPath(cwd, DEFAULT_ROLLUP_ENTRY_FILES);
  const isTs = ['.ts', '.tsx'].includes(extname(entry));
  const print = signale.scope('Rollup', type.toUpperCase());

  const rollupConfig = getRollupConfig({ cwd, entry, type, isTs, pkg, conf });

  if (opts.watch) {
    const watcher = watch([
      {
        ...rollupConfig,
        watch: {},
      },
    ]);
    print.watch(`rollup.watching: [${type}]`);
    watcher.on('event', event => {
      if (event.error) {
        print.error(event.error);
      } else {
        print.info(`[${type}] file changed`);
      }
    });
  } else {
    const { output, ...input } = rollupConfig;
    print.await(`rollup <- ${input.input}`);
    const bundle = await rollup(input);
    if (output) {
      await bundle.write(output);
      const f = (output.file as string).replace(`${opts.cwd}/`, '');
      print.info(`rollup -> ${f}`);
    }
  }
};

export default run;

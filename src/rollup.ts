import { extname } from 'path';
import signale from 'signale';
import { rollup, watch } from 'rollup';
import { BundleType, IRequiredConfig, IPackageJSON } from './types';
import { getRollupConfig } from './getRollupConfig';
import { getEntryPath, ConfigError } from './utils';
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
  const scope = [pkg.name || '', type.toUpperCase(), (conf[type] as any).type.toUpperCase()];
  const print = signale.scope(...scope);

  const entry = conf.entry || getEntryPath(cwd, DEFAULT_ROLLUP_ENTRY_FILES);
  if (!entry) {
    throw new ConfigError('Entry file MUST be exist.', scope);
  }
  const isTs = ['.ts', '.tsx'].includes(extname(entry));
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
    print.start(`rollup <- ${(input.input as string).replace(`${opts.cwd}/`, '')}`);
    const bundle = await rollup(input);
    if (output) {
      await bundle.write(output);
      const f = (output.file as string).replace(`${opts.cwd}/`, '');
      print.complete(`rollup -> ${f}\n\n`);
    }
  }

  return ((rollupConfig.output && rollupConfig.output.file) || '').replace(`${opts.cwd}/`, '');
};

export default run;

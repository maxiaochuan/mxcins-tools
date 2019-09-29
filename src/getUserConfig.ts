// const Ajv = require('ajv');
import Ajv from 'ajv';
import { join } from 'path';
import Debug from 'debug';
import { EXTENSIONS, CONFIG_FILES } from './const';
import { getExistPath, ConfigError } from './utils';
import { IConfig, IPackageJSON, IRequiredConfig, BundleType } from './types';
import schema from './schema';

const debug = Debug('mxcins-tools:getUserConfig');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const d = <T>(o: any): T => o.default || o;

export const getUserConfig = (cwd: string, pkg: IPackageJSON, watch?: boolean): IRequiredConfig => {
  const path = getExistPath(cwd, CONFIG_FILES);
  if (!path) {
    throw new ConfigError('Config file is not exist, skip project!\n\n', [pkg.name, 'UserConfig']);
  }
  require('@babel/register')({
    presets: [
      require.resolve('@babel/preset-typescript'),
      [require.resolve('@babel/preset-env'), { targets: { node: 10 }, modules: 'auto' }],
    ],
    extensions: EXTENSIONS,
    only: CONFIG_FILES.map(f => join(cwd, f)),
  });

  // eslint-disable-next-line import/no-dynamic-require
  const conf: IConfig = d(require(path));

  /**
   * schema validate
   */
  const ajv = new Ajv({ allErrors: true });
  if (!ajv.validate(schema, conf)) {
    throw new ConfigError(
      (ajv.errors &&
        ajv.errors.map((e, i) => `${i + 1}. ${Object.values(e.params)} ${e.message}`).join('\n')) ||
        '',
      [pkg.name, 'UserConfig'],
    );
  }

  /**
   * runtime check
   */
  if (conf.runtimeHelpers && !(pkg.dependencies || {})['@babel/runtime']) {
    throw new ConfigError('@babel/runtime dependency is required to use runtimeHelpers', [
      pkg.name,
      'UserConfig',
    ]);
  }

  const hasCjs = !!conf.cjs;
  const hasUmd = !!conf.umd;

  const dev: BundleType = conf.dev || hasUmd ? 'umd' : hasCjs ? 'cjs' : 'esm';

  const ret: IRequiredConfig = {
    ...conf,
    esm:
      typeof conf.esm === 'boolean'
        ? { type: 'single' }
        : typeof conf.esm === 'string'
        ? { type: conf.esm }
        : conf.esm,
    cjs:
      typeof conf.cjs === 'boolean'
        ? { type: 'single' }
        : typeof conf.cjs === 'string'
        ? { type: conf.cjs }
        : conf.cjs,
    umd: conf.umd ? { type: 'single', ...conf.umd } : undefined,
  };

  debug('user config:\n%O', ret);

  if (watch && dev) {
    return ['esm', 'cjs', 'umd'].filter(t => t!== dev).reduce((prev, t) => {
      delete (prev as any)[t];
      return prev;
    }, {
      ...ret,
      [dev]: ret[dev],
    })
  }

  return ret;
};

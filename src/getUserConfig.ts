// const Ajv = require('ajv');
import Ajv from 'ajv';
import { join } from 'path';
import { EXTENSIONS, CONFIG_FILES } from './const';
import { getExistPath, ConfigError } from './utils';
import { IConfig, IPackageJSON, IRequiredConfig } from './types';
import schema from './schema';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const d = <T>(o: any): T => o.default || o;

export const getUserConfig = (cwd: string, pkg: IPackageJSON): IRequiredConfig => {
  const path = getExistPath(cwd, CONFIG_FILES);
  if (!path) {
    throw new ConfigError('UserConfig', 'Config file is not exist, skip project!\n\n');
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
      'UserConfig',
      (ajv.errors &&
        ajv.errors.map((e, i) => `${i + 1}. ${Object.values(e.params)} ${e.message}`).join('\n')) ||
        '',
    );
  }

  /**
   * runtime check
   */
  if (conf.runtimeHelpers && !(pkg.dependencies || {})['@babel/runtime']) {
    throw new ConfigError(
      'UserConfig',
      '@babel/runtime dependency is required to use runtimeHelpers',
    );
  }

  return {
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
    umd:
      typeof conf.umd === 'boolean'
        ? { type: 'single' }
        : typeof conf.umd === 'string'
        ? { type: conf.umd }
        : conf.umd,
  };
};

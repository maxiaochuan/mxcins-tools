// const Ajv = require('ajv');
import Ajv from 'ajv';
import assert from 'assert';
import signale from 'signale';
import { join } from 'path';
import { EXTENSIONS, CONFIG_FILES } from './const';
import { getExistPath } from './utils';
import { IConfig, IPackageJSON } from './types';
import schema from './schema';

class ConfigError extends Error {
  public scope = '';

  constructor(scope: string, msg: string) {
    super(msg);
    this.scope = scope;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const d = <T>(o: any): T => o.default || o;

export const getUserConfig = (cwd: string, pkg: IPackageJSON) => {
  const path = getExistPath(cwd, CONFIG_FILES);
  if (!path) {
    signale.warn('Config file is not exist, skip project!\n\n');
    return;
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
    const error = new ConfigError(
      'UserConfig',
      (ajv.errors &&
        ajv.errors.map((e, i) => `${i + 1}. ${Object.values(e.params)} ${e.message}`).join('\n')) ||
        '',
    );
    throw error;
  }

  /**
   * runtime check
   */
  if (conf.runtimeHelpers) {
    const dependencies = pkg.dependencies || {};
    assert.ok(
      dependencies['@babel/runtime'],
      '@babel/runtime dependency is required to use runtimeHelpers',
    );
  }

  return conf;
};

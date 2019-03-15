import { join } from 'path';
import { existsSync, readFileSync } from 'fs';
import merge from 'lodash.merge';
import * as assert from 'assert';
import { getExistFile } from './utils';
import { IOpts, IFormattedConfig } from './types';
import { CONFIG_FILES, ENTRY_FILES } from './const';

function getEntry({ cwd }: { cwd: string }) {
  const entry = getExistFile({ cwd, files: ENTRY_FILES });
  if (entry) {
    return entry.relative;
  }
}

const d = <T>(o: any): T => o.default || o;

export default function getUserConfig(opts: IOpts): IFormattedConfig {
  const { cwd } = opts;
  const file = getExistFile({ cwd, files: CONFIG_FILES });
  assert.ok(file || opts.config, 'config file must be exit');
  let config = opts.config || {};
  if (file) {
    config = merge(d(require(file.abs)), opts.config || {});
  }
  // check runtime
  if (config.runtimeHelpers) {
    const pkgPath = join(cwd, 'package.json');
    assert.ok(existsSync(pkgPath), `@babel/runtime dependency is required to use runtimeHelpers`);
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    assert.ok(
      (pkg.dependencies || {})['@babel/runtime'],
      `@babel/runtime dependency is required to use runtimeHelpers`,
    );
  }

  // get entry;
  // const entry = config.entry || getEntry({ cwd });
  // assert.ok(entry, 'entry must be exit!');

  return {
    entry: config.entry,
    esm: typeof config.esm === 'string' ? { type: config.esm } : config.esm,
    cjs: typeof config.cjs === 'string' ? { type: config.cjs } : config.cjs,
    umd: typeof config.umd === 'string' ? { type: config.umd, globals: {} } : config.umd,
    browserFiles: config.browserFiles || [],
    runtimeHelpers: config.runtimeHelpers || false,
    outputExports: config.outputExports || 'auto',
  };
}

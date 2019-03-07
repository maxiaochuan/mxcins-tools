import { join } from 'path';
import { existsSync, readFileSync } from 'fs';
import * as assert from 'assert';
import { getExistFile } from './utils';
import { IConfig } from './types';
import { CONFIG_FILES } from './const';

interface IGetUserConfigOpts {
  cwd: string;
}

const d = <T>(o: any): T => o.default || o;

export default function getUserConfig(opts: IGetUserConfigOpts): IConfig {
  const { cwd } = opts;
  const file = getExistFile({ cwd, files: CONFIG_FILES });
  if (file) {
    const config: IConfig = d(require(file.abs));

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
    return config;
  }
  return {};
}

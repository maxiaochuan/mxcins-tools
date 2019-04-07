import assert from 'assert';
import { join } from 'path';
import { CONFIG_FILES } from './constants';
import getBabelConfig from './getBabelConfig';
import { IBuildOpts, IConfig, IFormattedBuildConf, IPackage } from './types';
import { getExistPath } from './utils';

/**
 * 获取配置文件路径
 * @param opts
 */
export function getRcPath(opts: IBuildOpts) {
  const { cwd } = opts;

  const config = getBabelConfig({ target: 'node', type: 'cjs', typescript: true });

  require('@babel/register')({
    ...config,
    extensions: ['.es6', '.es', '.jsx', '.js', '.mjs', '.ts', '.tsx'],
    only: CONFIG_FILES.map(file => join(cwd, file)),
    babelrc: false,
    cache: false,
  });

  const filePath = getExistPath({ cwd, files: CONFIG_FILES });

  return filePath;
}

const d = <T>(o: any): T => o.default || o;

export default (pkg: IPackage, opts: IBuildOpts): IFormattedBuildConf | false => {
  const rcPath = getRcPath(opts);
  if (!rcPath) {
    return false;
  }
  const conf: IConfig = d(require(rcPath.abs));

  /**
   * Runtime Helper Check
   */
  if (conf.runtimeHelpers) {
    const dependencies: { [x: string]: string } = {};
    assert.ok(
      (pkg.dependencies || dependencies)['@babel/runtime'],
      `@babel/runtime dependency is required to use runtimeHelpers`,
    );
  }

  return {
    ...conf,
    esm: typeof conf.esm === 'string' ? { type: conf.esm } : conf.esm,
    cjs: typeof conf.cjs === 'string' ? { type: conf.cjs } : conf.cjs,
    umd: conf.umd,
    pkg,
  };
};

import { join, extname, basename } from 'path';
import signale from 'signale';
import typescript from 'rollup-plugin-typescript2';
import babel from 'rollup-plugin-babel';
import { BundleType, IFormattedConfig, ModuleFormat } from './types';
import { RollupOptions } from 'rollup';
import getBabelConfig from './getBabelConfig';

interface IGetRollupConfigOpts {
  cwd: string;
  type: ModuleFormat;
  config: IFormattedConfig;
}

interface IPackage {
  dependencies?: object;
  peerDependencies?: object;
}

export default function getRollupConfig(opts: IGetRollupConfigOpts): RollupOptions {
  const { cwd, type, config } = opts;

  // pkg
  const pkg: IPackage = require(join(cwd, 'package.json'));

  // ts
  const isTs = ['.ts', '.tsx'].includes(extname(config.entry));
  signale.debug('isTs: ', isTs);
  // babel
  const babelConfig = {
    ...getBabelConfig({
      target: 'browser',
      type,
      typescript: false,
    }),
    exclude: 'node_modules/**',
    babelrc: false,
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.es6', '.es', '.mjs'],
  };

  // 输入文件名称(默认值)
  const fname = basename(config.entry).replace(extname(config.entry), '');
  signale.info(`use entry for name: ${fname}`);

  const format = type;
  const external = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.peerDependencies || {}),
  ];

  const plugins = [
    ...(isTs
      ? [
          typescript({
            tsconfig: join(cwd, 'tsconfig.json'),
            tsconfigDefaults: {
              compilerOptions: {
                declaration: true,
              },
            },
            tsconfigOverride: {
              compilerOptions: {
                target: 'esnext',
              },
            },
          }),
        ]
      : []),
    babel(babelConfig),
  ];

  switch (type) {
    case 'esm':
      return {
        input: config.entry,
        external,
        plugins,
        output: {
          format,
          file: join(cwd, `dist/${(config.esm && config.esm.name) || fname}.esm.js`),
        },
      };
    default:
      throw new Error('rollup config type error');
  }
}

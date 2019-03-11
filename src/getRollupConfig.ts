import { join, extname, basename } from 'path';
import typescript from 'rollup-plugin-typescript2';
import nodeResolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel';
import { IFormattedConfig, ModuleFormat, IUmd } from './types';
import { RollupOptions, IsExternal } from 'rollup';
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

function generateExternal(pkg: IPackage, runtimeHelpers?: boolean): IsExternal {
  const names = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.peerDependencies || {}),
  ];

  if (runtimeHelpers) {
    names.push('@babel/runtime');
  }

  return id => names.some(name => id.includes(name));
}

export default function getRollupConfig(opts: IGetRollupConfigOpts): RollupOptions {
  const { cwd, type, config } = opts;

  // pkg
  const pkg: IPackage = require(join(cwd, 'package.json'));

  // input;
  const input = config.entry;
  // runtimeHelpers
  const runtimeHelpers = type === 'cjs' ? false : config.runtimeHelpers;

  // ts
  const isTs = ['.ts', '.tsx'].includes(extname(config.entry));
  // babel
  const babelConfig = {
    ...getBabelConfig({
      target: 'browser',
      type,
      typescript: false,
      runtimeHelpers,
    }),
    runtimeHelpers,
    exclude: 'node_modules/**',
    babelrc: false,
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.es6', '.es', '.mjs'],
  };

  // 输入文件名称(默认值)
  const fname = basename(config.entry).replace(extname(config.entry), '');

  const format = type;
  const external = generateExternal(pkg, runtimeHelpers);

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
        input,
        external,
        plugins,
        output: {
          format,
          file: join(cwd, `dist/${(config.esm && config.esm.name) || fname}.esm.js`),
        },
      };
    case 'cjs':
      return {
        input,
        external,
        plugins,
        output: {
          format,
          exports: config.outputExports,
          file: join(cwd, `dist/${(config.esm && config.esm.name) || fname}.cjs.js`),
        },
      };
    case 'umd':
      plugins.push(
        nodeResolve({
          jsnext: true,
        }),
        commonjs({
          include: /node_modules/,
        }),
      );
      return {
        input,
        external: [...Object.keys(pkg.peerDependencies || {})],
        plugins,
        output: {
          format,
          exports: config.outputExports,
          globals: (config.umd as IUmd).globals,
          name: (config.umd && config.umd.name) || fname,
          file: join(cwd, `dist/${(config.umd && config.umd.name) || fname}.umd.js`),
        },
      };
    default:
      throw new Error('rollup config type error');
  }
}

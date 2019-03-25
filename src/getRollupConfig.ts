import { join, extname, basename } from 'path';
import * as assert from 'assert';
import tempDir from 'temp-dir';
import typescript from 'rollup-plugin-typescript2';
import nodeResolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel';
import postcss from 'rollup-plugin-postcss';
import autoprefixer from 'autoprefixer';
import { IFormattedConfig, ModuleFormat, IUmd, IOpts } from './types';
import { RollupOptions, IsExternal } from 'rollup';
import getBabelConfig from './getBabelConfig';
import { getExistFile } from './utils';
import { ENTRY_FILES } from './const';

interface IGetRollupConfigOpts extends IOpts {
  type: ModuleFormat;
  config: IFormattedConfig;
}

interface IPackage {
  dependencies?: object;
  peerDependencies?: object;
}

function getEntry({ cwd }: { cwd: string }) {
  const entry = getExistFile({ cwd, files: ENTRY_FILES });
  if (entry) {
    return entry.relative;
  }
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

  // runtimeHelpers
  const runtimeHelpers = type === 'cjs' ? false : config.runtimeHelpers;

  // input;
  const entry = getEntry({ cwd }) || config.entry;
  assert.ok(entry, 'entry must be exit!');

  const input = entry as string;

  // ts
  const isTs = ['.ts', '.tsx'].includes(extname(input));
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
  const fname = basename(input).replace(extname(input), '');

  const format = type;
  const external = generateExternal(pkg, runtimeHelpers);

  const plugins = [
    postcss({
      extract: 'dist/styles.css',
      modules: false,
      namedExports: true,
      use: ['less'],
      plugins: [autoprefixer()],
    }),
    ...(isTs
      ? [
          typescript({
            cacheRoot: `${tempDir}/.rollup_plugin_typescript2_cache`,
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
        external: [
          ...Object.keys(pkg.peerDependencies || {}),
          /**
           * 2019-03-11 15:33:37 在打包umd 的时候 引入 d3   d3 pkg.module 使用esmodule
           * 如果 external 不加入d3 的话，只在globals加入 会出现先转换 的情况
           * 解决方案： 将 globals 加入到 external
           */
          ...Object.keys((config.umd as IUmd).globals || {}),
        ],
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

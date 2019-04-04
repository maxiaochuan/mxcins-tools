import assert from 'assert';
import autoprefixer from 'autoprefixer';
import { basename, extname, join } from 'path';
import babel from 'rollup-plugin-babel';
import commonjs from 'rollup-plugin-commonjs';
import nodeResolve from 'rollup-plugin-node-resolve';
import postcss from 'rollup-plugin-postcss';
import typescript from 'rollup-plugin-typescript2';
import tempDir from 'temp-dir';

import { IsExternal } from 'rollup';
import { ENTRY_FILES } from './constants';
import getBabelConfig from './getBabelConfig';
import { BundleType, IBuildOpts, IFormattedBuildConf, IPackage, IUmd } from './types';
import { getExistFilePath, IFilePath } from './utils';

function getEntry(conf: IFormattedBuildConf, opts: IBuildOpts) {
  if (conf.entry) {
    return conf.entry;
  }
  const entryPath = getExistFilePath({ cwd: opts.cwd, files: ENTRY_FILES });

  assert.ok(entryPath, 'entry must be exit!');

  return (entryPath as IFilePath).relative;
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

export default function getRollupConfig(
  type: BundleType,
  conf: IFormattedBuildConf,
  opts: IBuildOpts,
) {
  // runtimeHelpers
  const runtimeHelpers = type === 'cjs' ? false : conf.runtimeHelpers;
  // input;
  const input = getEntry(conf, opts);
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
  const external = generateExternal(conf.pkg, runtimeHelpers);

  const plugins = [
    postcss({
      // TODO: css编译之后的路径;
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
            tsconfig: join(opts.cwd, 'tsconfig.json'),
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

  const { cwd } = opts;

  switch (type) {
    case 'esm':
      return {
        input,
        external,
        plugins,
        output: {
          format,
          exports: conf.outputExports,
          file: join(cwd, `dist/${(conf.esm && conf.esm.name) || fname}.esm.js`),
        },
      };
    case 'cjs':
      return {
        input,
        external,
        plugins,
        output: {
          format,
          exports: conf.outputExports,
          file: join(cwd, `dist/${(conf.esm && conf.esm.name) || fname}.cjs.js`),
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
          ...Object.keys(conf.pkg.peerDependencies || {}),
          /**
           * 2019-03-11 15:33:37 在打包umd 的时候 引入 d3   d3 pkg.module 使用esmodule
           * 如果 external 不加入d3 的话，只在globals加入 会出现先转换 的情况
           * 解决方案： 将 globals 加入到 external
           */
          ...Object.keys((conf.umd as IUmd).globals || {}),
        ],
        plugins,
        output: {
          format,
          exports: conf.outputExports,
          globals: (conf.umd as IUmd).globals,
          name: (conf.umd && conf.umd.name) || fname,
          file: join(cwd, `dist/${(conf.umd && conf.umd.name) || fname}.umd.js`),
        },
      };
    default:
      throw new Error('rollup config type error');
  }
}

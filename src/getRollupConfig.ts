import autoprefixer from 'autoprefixer';
import { extname, join } from 'path';
import { IsExternal } from 'rollup';
// import builtins from 'rollup-plugin-node-builtins';
// import globals from 'rollup-plugin-node-globals';
import alias from 'rollup-plugin-alias';
import babel from 'rollup-plugin-babel';
import commonjs from 'rollup-plugin-commonjs';
import nodeResolve from 'rollup-plugin-node-resolve';
import postcss from 'rollup-plugin-postcss';
import typescript from 'rollup-plugin-typescript2';
import tempDir from 'temp-dir';

import { ROLLUP_OUPUT_DIR } from './constants';
import getBabelConfig from './getBabelConfig';
import { BundleType, IBuildOpts, IFormattedBuildConf, IPackage, IUmd } from './types';
import { getOutput } from './utils';

/**
 * 2019-06-04 17:48:23 fixed bug
 * 当文件名包含 node_modules里面package的名字时，会被跳过 改用 RegExp
 * @param pkg
 * @param runtimeHelpers
 */
function generateExternal(pkg: IPackage, runtimeHelpers?: boolean): IsExternal {
  const names = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.peerDependencies || {}),
  ].map(n => new RegExp(`^${n}$`));

  if (runtimeHelpers) {
    names.push(/^@babel\/runtime/);
  }

  return id => names.some(name => name.test(id));
}

export default function getRollupConfig(
  type: BundleType,
  entry: string,
  conf: IFormattedBuildConf,
  opts: IBuildOpts,
) {
  // runtimeHelpers
  const runtimeHelpers = type === 'cjs' ? false : conf.runtimeHelpers;
  const input = entry;
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
    exclude: /\/node_modules\//,
    babelrc: false,
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.es6', '.es', '.mjs'],
  };

  const format = type;
  const external = generateExternal(conf.pkg, runtimeHelpers);

  const plugins = [
    postcss({
      // TODO: css编译之后的路径;
      extract: `${ROLLUP_OUPUT_DIR}/styles.css`,
      modules: false,
      namedExports: true,
      use: ['less'],
      plugins: [autoprefixer()],
    }),
    ...(conf.alias ? [alias(conf.alias)] : []),
    nodeResolve({
      mainFields: ['module', 'jsnext:main', 'main'],
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

  const file = join(opts.cwd, getOutput(type, conf, opts));

  switch (type) {
    case 'esm':
      return { input, external, plugins, output: { file, format, exports: conf.outputExports } };
    case 'cjs':
      return { input, external, plugins, output: { file, format, exports: conf.outputExports } };
    case 'umd':
      plugins.push(
        commonjs({
          include: /node_modules/,
          // namedExports,
        }),
      );
      return {
        input,
        onwarn(warning: any) {
          // Suppress this error message... there are hundreds of them. Angular team says to ignore it.
          // https://github.com/rollup/rollup/wiki/Troubleshooting#this-is-undefined
          if (warning.code === 'THIS_IS_UNDEFINED') {
            return;
          }
          // tslint:disable-next-line:no-console
          console.error(warning.message);
        },
        /**
         * 2019-05-16 17:40:16
         * 解决多次引用包的顶级作用域问题
         * beta
         */
        context: 'window',
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
          file,
          format,
          exports: conf.outputExports,
          globals: (conf.umd as IUmd).globals,
          name: conf.umd && conf.umd.name,
        },
      };
    default:
      throw new Error('rollup config type error');
  }
}

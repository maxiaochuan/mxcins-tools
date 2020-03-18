import { join, basename, extname } from 'path';
import Debug from 'debug';
import { RollupOptions, IsExternal } from 'rollup';
import babel from 'rollup-plugin-babel';
import typescript from 'rollup-plugin-typescript2';
import nodeResolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import alias from 'rollup-plugin-alias';
import tempDir from 'temp-dir';
import { BundleType, IPackageJSON, IRequiredConfig, IUMD } from './types';
import { getBabelConfig } from './getBabelConfig';
import { EXTENSIONS } from './const';

interface IGetRollupConfigOpts {
  cwd: string;
  entry: string;
  type: BundleType;
  isTs: boolean;
  pkg: IPackageJSON;
  conf: IRequiredConfig;
}

const debug = Debug('mxcins-tools:rollup:config');

const gExternal = (pkg: IPackageJSON, rh?: boolean): IsExternal => {
  const names = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.peerDependencies || {}),
  ].map(n => new RegExp(`^${n}`));

  if (rh) {
    names.push(/^@babel\/runtime/);
  }

  return id => names.some(name => name.test(id));
};

export const getRollupConfig = (opts: IGetRollupConfigOpts): RollupOptions => {
  const { cwd, entry, type, isTs, conf, pkg } = opts;
  const { esm, cjs, umd, target = 'browser', alias: confAlias, outputExports } = conf;

  const runtimeHelpers = type === 'cjs' ? false : conf.runtimeHelpers;

  const babelConfig = {
    ...getBabelConfig({
      type,
      target: type === 'cjs' ? 'node' : target,
      typescript: isTs,
      runtimeHelpers,
    }),
    runtimeHelpers,
    exclude: /\/node_modules\//,
    babelrc: false,
    extensions: EXTENSIONS,
  };

  const input = join(cwd, entry);
  const external = gExternal(pkg, runtimeHelpers);
  const format = type;

  debug('typescript: %s', isTs);

  const plugins = [
    ...(confAlias
      ? [
          alias({
            resolve: ['.js', '.jsx', '.ts', '.tsx'],
            entries: Object.keys(confAlias).map(k => ({ find: k, replacement: confAlias[k] })),
          }),
        ]
      : []),
    nodeResolve({
      mainFields: ['jsnext:main', 'browser', 'module', 'main'],
      dedupe: ['react', 'react-dom'],
    }),
    ...(isTs
      ? [
          typescript({
            cacheRoot: `${tempDir}/.rollup_plugin_typescript2_cache`,
            tsconfig: join(opts.cwd, 'tsconfig.json'),
            tsconfigDefaults: {
              compilerOptions: {
                allowSyntheticDefaultImports: true,
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

  const name = (conf[type] as any).name || basename(entry, extname(entry));

  switch (type) {
    case 'esm':
      return {
        input,
        external,
        plugins,
        output: {
          file: join(cwd, 'dist', `${(esm && esm.file) || `${name}.esm`}.js`),
          format,
        },
      };
    case 'cjs':
      return {
        input,
        external,
        plugins,
        output: {
          file: join(cwd, 'dist', `${(cjs && cjs.file) || `${name}.cjs`}.js`),
          exports: outputExports,
          format,
        },
      };
    case 'umd':
      plugins.push(
        commonjs({
          include: /node_modules/,
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
          // eslint-disable-next-line no-console
          console.error(warning.message);
        },
        /**
         * 2019-05-16 17:40:16
         * 解决多次引用包的顶级作用域问题
         * beta
         */
        context: 'window',
        external: [
          ...Object.keys(pkg.peerDependencies || {}),
          /**
           * 2019-03-11 15:33:37 在打包umd 的时候 引入 d3   d3 pkg.module 使用esmodule
           * 如果 external 不加入d3 的话，只在globals加入 会出现先转换 的情况
           * 解决方案： 将 globals 加入到 external
           */
          ...Object.keys((umd && umd.globals) || {}),
        ],
        plugins,
        output: {
          file: join(cwd, 'dist', `${(cjs && cjs.file) || `${name}.umd`}.js`),
          format,
          exports: outputExports,
          globals: (conf.umd as IUMD).globals,
          name: conf.umd && conf.umd.name,
        },
      };
    default:
      throw new Error(`rollup unsupported type ${type}`);
  }
};

import { ModuleFormat } from './types';

interface IGetBabelConfigOptions {
  target: 'browser' | 'node';
  type?: ModuleFormat;
  typescript?: boolean;
  runtimeHelpers?: boolean;
}

export default function getBabelConfig(opts: IGetBabelConfigOptions) {
  const { target, typescript, type, runtimeHelpers } = opts;

  const isBrowser = target === 'browser';
  const targets = isBrowser ? { browsers: ['last 2 versions', 'IE 10'] } : { node: 6 };

  return {
    presets: [
      ...(typescript ? [require.resolve('@babel/preset-typescript')] : []),
      [require.resolve('@babel/preset-env'), { targets, modules: type === 'esm' ? false : 'auto' }],
      ...(isBrowser ? [require.resolve('@babel/preset-react')] : []),
    ],
    plugins: [
      require.resolve('@babel/plugin-proposal-export-default-from'),
      ...(isBrowser
        ? [
            [require.resolve('@babel/plugin-proposal-decorators'), { legacy: true }],
            [require.resolve('@babel/plugin-proposal-class-properties'), { loose: true }],
          ]
        : [require.resolve('@babel/plugin-proposal-class-properties')]),
      ...(runtimeHelpers
        ? [[require.resolve('@babel/plugin-transform-runtime'), { useESModules: true }]]
        : []),
    ],
  };
}

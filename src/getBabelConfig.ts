import { BundleType } from './types';

interface IGetBabelConfigOpts {
  target: 'browser' | 'node';
  type: BundleType;
  typescript?: boolean;
  runtimeHelpers?: boolean;
}

export const getBabelConfig = (opts: IGetBabelConfigOpts) => {
  const { target, type, typescript, runtimeHelpers } = opts;

  const isBrowser = target === 'browser';
  const targets = isBrowser ? { browsers: ['last 2 version', 'IE 10'] } : { node: 10 };

  return {
    presets: [
      ...(typescript ? [require.resolve('@babel/preset-typescript')] : []),
      [
        require.resolve('@babel/preset-env'),
        {
          targets,
          modules: type === 'esm' ? false : 'auto',
        },
      ],
      ...(isBrowser ? [require.resolve('@babel/preset-react')] : []),
    ],
    plugins: [
      require.resolve('babel-plugin-react-require'),
      require.resolve('@babel/plugin-syntax-dynamic-import'),
      [require.resolve('@babel/plugin-proposal-decorators'), { legacy: true }],
      [require.resolve('@babel/plugin-proposal-class-properties'), { loose: true }],
      ...(runtimeHelpers
        ? [
            require.resolve('@babel/plugin-transform-runtime'),
            { useESModules: isBrowser && type === 'esm' },
          ]
        : []),
    ],
  };
};

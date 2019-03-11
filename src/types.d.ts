export type BundleType = 'rollup' | 'babel';
export type ModuleFormat = 'cjs' | 'esm' | 'umd';

export interface IPackage {
  dependencies?: object;
  peerDependencies?: object;
  name: string;
  main?: string;
  ['umd:main']?: string;
  unpkg: string;
  module?: string;
  source?: string;
  ['jsnext:main']?: string;
  browser?: string;
  sideEffects?: boolean;
}

/**
 * build options
 */
export interface IOpts {
  cwd: string;
  watch?: boolean;
  config?: IConfig;
}

export interface IEsm {
  type: BundleType;
  name?: string;
}

export interface ICjs {
  type: BundleType;
  name?: string;
}

export interface IUmd {
  type: 'rollup';
  name?: string;
  globals?: { [x: string]: string };
}

export interface IConfig {
  entry?: string;
  esm?: BundleType | IEsm | false;
  cjs?: BundleType | ICjs | false;
  umd?: 'rollup' | IUmd | false;
  outputExports?: 'default' | 'named' | 'none' | 'auto';
  runtimeHelpers?: boolean;
  browserFiles?: string[];
}

export interface IFormattedConfig {
  entry: string;
  esm?: IEsm | false;
  cjs?: ICjs | false;
  umd?: IUmd | false;
  outputExports: 'default' | 'named' | 'none' | 'auto';
  runtimeHelpers: boolean;
  browserFiles: string[];
}

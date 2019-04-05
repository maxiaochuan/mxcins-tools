/**
 * 规范 esm, cjs, umd
 * 构建方式 单一文件: singular，多文件: plural，按需加载: dynamic,
 */

export type BundleType = 'esm' | 'cjs' | 'umd';

type Singular = 'single'; // rollup
type Plural = 'multiple';
type Dynamic = 'dynamic';

export interface IPackage {
  dependencies?: { [x: string]: string };
  peerDependencies?: { [x: string]: string };
  name: string;
  main?: string;
  ['umd:main']?: string;
  unpkg: string;
  module?: string;
  source?: string;
  ['jsnext:main']?: string;
  browser?: string;
  sideEffects?: boolean;
  types?: string;
}

export type EsmType = Singular | Plural | Dynamic;
export type CjsType = Singular | Plural;
export type UmdType = Singular;

export interface IEsm {
  type: EsmType;
  name?: string;
}

export interface ICjs {
  type: CjsType;
  name?: string;
}

export interface IUmd {
  type: UmdType;
  name: string;
  globals?: { [x: string]: string };
}

export interface IConfig {
  entry?: string;
  esm?: IEsm | EsmType;
  cjs?: ICjs | CjsType;
  umd?: IUmd;
  runtimeHelpers?: boolean;
  browserFiles?: string[];
  outputExports?: 'default' | 'named' | 'none' | 'auto';
  typings?: string;
}

export interface IFormattedBuildConf extends IConfig {
  esm?: IEsm;
  cjs?: ICjs;
  umd?: IUmd;
  pkg: IPackage;
}

export interface IBuildOpts {
  cwd: string;
  watch?: boolean;
  root?: string;
  isLerna?: boolean;
  update?: boolean;
}

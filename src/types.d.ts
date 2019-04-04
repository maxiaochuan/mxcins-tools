/**
 * 规范 esm, cjs, umd
 * 构建方式 单一文件: singular，多文件: plural，按需加载: dynamic,
 */

export type BundleType = 'esm' | 'cjs' | 'umd';

type Singular = 'singular'; // rollup
type Plural = 'plural';
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
  name?: string;
  globals: { [x: string]: string };
}

export interface IBuildConf {
  entry?: string;
  esm?: EsmType | IEsm;
  cjs?: CjsType | ICjs;
  umd?: UmdType | IUmd;
  runtimeHelpers?: boolean;
  outputExports?: 'default' | 'named' | 'none' | 'auto';
}

export interface IFormattedBuildConf extends IBuildConf {
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
}

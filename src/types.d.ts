/**
 * 规范 esm, cjs, umd
 * 构建方式 单一文件: singular，多文件: plural，按需加载: dynamic,
 */

type Singular = 'singular'; // rollup
type Plural = 'plural';
type Dynamic = 'dynamic';

export type EsmType = Singular | Plural | Dynamic;
export type CjsType = Singular | Plural;
export type UmdType = Singular

export interface IEsm {
  type: EsmType; 
}

export interface ICjs {
  type: CjsType; 
}

export interface IUmd {
  type: UmdType;
}

export interface IBuildConfig {
  esm: EsmType | IEsm;
  cjs: CjsType | ICjs;
  umd: UmdType | IUmd;
}

export interface IBuildOpts {

}
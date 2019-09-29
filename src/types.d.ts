export interface IBuildOpts {
  cwd: string;
  watch: boolean;
  package: boolean;
}

export interface IOutput {
  esm?: string;
  cjs?: string;
  umd?: string;
}

export interface IPackageJSON {
  name?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
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
/**
 * single
 * multiple
 * components
 */
export interface IConfig {
  esm?: boolean | ESM | IESM;
  cjs?: boolean | CJS | ICJS;
  umd?: IUMD;

  runtimeHelpers?: boolean;

  target?: 'browser' | 'node';
  // for rollup
  entry?: string;
  namedExports: 'default' | 'named' | 'none' | 'auto';
  alias?: Record<string, string>;
}

export type BundleType = 'esm' | 'cjs' | 'umd';
export interface IRequiredConfig extends IConfig {
  esm?: IESM;
  cjs?: ICJS;
  umd?: IUMD;
}

interface IESM {
  type: ESM;
  file?: string;
}
interface ICJS {
  type: CJS;
  file?: string;
}
interface IUMD {
  type?: UMD;
  name?: string;
  file?: string;
  globals?: Record<string, string>;
}

type ESM = S | M;
type CJS = S | M;
type UMD = S;
type S = 'single';
type M = 'multiple';

export interface IPackageJSON {
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  peerDependencies: Record<string, string>;
}
/**
 * single
 * multiple
 * components
 */
export interface IConfig {
  esm?: boolean | ESM | IESM;
  cjs?: boolean | CJS | ICJS;
  umd?: boolean | UMD | IUMD;

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
  type: UMD;
  name?: string;
  file?: string;
  globals?: Record<string, string>;
}
type ESM = S | M | C;
type CJS = S | M;
type UMD = S;
type S = 'single';
type M = 'multiple';
type C = 'components';

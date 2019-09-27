/**
 * single
 * multiple
 * components
 */
export interface IConfig {
  esm?: IESM | ESM;
  cjs?: ICJS | CJS;
  umd?: IUMD | UMD;

  runtimeHelpers?: boolean;

  // for rollup
  entry?: string;
  exports: "default" | "named" | "none" | "auto";
}

interface IESM {
  type: ESM;
}
interface ICJS {
  type: CJS;
}
interface IUMD {
  type: UMD;
}
type ESM = S | M | C;
type CJS = S | M;
type UMD = S;
type S = "single";
type M = "multiple";
type C = "components";

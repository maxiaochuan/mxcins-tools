export type BundleType = 'rollup' | 'babel';
export type ModuleFormat = 'cjs' | 'esm' | 'umd';

interface IEsm {
  type: BundleType;
  name?: string;
}

interface ICjs {
  type: BundleType;
  name?: string;
}

interface IUmd {
  type: BundleType;
  name?: string;
}

export interface IConfig {
  entry?: string;
  esm?: BundleType | IEsm | false;
  cjs?: BundleType | ICjs | false;
  umd?: BundleType | IUmd | false;
  runtimeHelpers?: boolean;
}

interface IFormattedConfig {
  entry: string;
  esm?: IEsm | false;
  cjs?: ICjs | false;
  umd?: IUmd | false;
  runtimeHelpers?: boolean;
}

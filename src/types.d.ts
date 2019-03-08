export type BundleType = 'rollup' | 'babel';
export type ModuleFormat = 'cjs' | 'esm' | 'umd';

export interface IPackage {
  dependencies?: object;
  peerDependencies?: object;
  name: object;
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
  type: 'babel';
  name?: string;
}

export interface IConfig {
  entry?: string;
  esm?: BundleType | IEsm | false;
  cjs?: BundleType | ICjs | false;
  umd?: 'babel' | IUmd | false;
  runtimeHelpers?: boolean;
  nodes?: string[];
}

export interface IFormattedConfig {
  entry: string;
  esm?: IEsm | false;
  cjs?: ICjs | false;
  umd?: IUmd | false;
  runtimeHelpers?: boolean;
  nodes: string[];
}

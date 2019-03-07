export type BundleType = 'rollup' | 'babel';
export type ModuleFormat = 'cjs' | 'esm' | 'umd';

interface IEsm {
  type: BundleType;
  name?: string;
}

export interface IConfig {
  entry?: string;
  esm?: BundleType | IEsm | false;
}

interface IFormattedConfig {
  entry: string;
  esm?: IEsm | false;
}

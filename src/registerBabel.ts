import { join } from 'path';
import slash from 'slash2';
import getBabelConfig from './getBabelConfig';

interface IRegisterBabelOpts {
  cwd: string;
  only: string[];
}

export default function registerBabel(opts: IRegisterBabelOpts) {
  const { cwd, only } = opts;
  const config = getBabelConfig({
    target: 'node',
    typescript: true,
  });
  require('@babel/register')({
    ...config,
    extensions: ['.es6', '.es', '.jsx', '.js', '.mjs', '.ts', '.tsx'],
    only: only.map(file => slash(join(cwd, file))),
    babelrc: false,
    cache: false,
  });
}

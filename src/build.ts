import signale from 'signale';
import getUserConfig from './getUserConfig';
import { IBuildOpts } from './types';
import { getPackageJson } from './utils';

export default function build(opts: IBuildOpts) {
  try {
    const pkg = getPackageJson(opts.cwd);

    const conf = getUserConfig(pkg, opts);
    signale.info(conf);
  } catch (error) {
    // tslint:disable-next-line:no-console
    console.error(error);
  }
}

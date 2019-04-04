import rollup from 'rollup';
import { IBuildOpts } from './types';

export default async function build(opts: IBuildOpts) {
  // tslint:disable-next-line:no-console
  console.log('rollup opts', opts, rollup);
}

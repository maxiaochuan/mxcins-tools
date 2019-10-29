import { fork } from 'child_process';
import { join } from 'path';
import mkdirp from 'mkdirp';
import { IBuildOpts } from '../types';
import { generateTsConfig } from '../utils';

const DOC_PATH = '.doc';

export default async ({ cwd }: IBuildOpts) => {
  process.chdir(cwd);
  mkdirp.sync(join(cwd, '.docz'));
  generateTsConfig(cwd);
  const bin = require.resolve('docz/bin/index.js');
  const params = [
    '--dest', DOC_PATH,
    '--config', join(__dirname, 'doczrc.js'),
  ];


  return new Promise((resolve, reject) => {
    const child = fork(bin, ['dev', ...params], {
      cwd,
      env: process.env,
    });
    child.on('exit', code => {
      if (code === 1) {
        reject(new Error('Doc build failed'));
      } else {
        resolve();
      }
    });
  });
}
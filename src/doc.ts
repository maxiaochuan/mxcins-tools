import { fork } from 'child_process';
import { join } from 'path';
import { sync } from 'resolve-bin';
import { IBuildOpts } from './types';
import { generateTsConfig } from './utils';

export function dev(opts: IBuildOpts) {
  process.chdir(opts.cwd);
  const params: string[] = [];
  generateTsConfig(opts);

  params.push('--config', join(__dirname, '../lib/doczrc.js'));
  const binPath = sync('docz');
  return new Promise((resolve, reject) => {
    const child = fork(binPath, ['dev', ...params], {
      cwd: opts.cwd,
      env: process.env,
    });
    child.on('exit', code => {
      if (code === 1) {
        reject(new Error('Doc build failed'));
      } else {
        resolve(process.exit());
      }
    });
  });
}

export function build() {
  // TODO
}

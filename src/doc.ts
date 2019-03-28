import { join } from 'path';
import { fork } from 'child_process';
import { sync } from 'resolve-bin';

interface IOpts {
  cwd: string;
}

export function dev({ cwd }: IOpts) {
  process.chdir(cwd);
  const params: string[] = [];

  params.push('--config', join(__dirname, '../lib/doczrc.js'));
  const binPath = sync('docz');
  return new Promise((resolve, reject) => {
    const child = fork(binPath, ['dev', ...params], {
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

export function build() {
  // TODO
}

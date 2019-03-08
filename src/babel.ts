/**
 *
 *
 */
import { ModuleFormat, IFormattedConfig } from './types';
import * as chokidar from 'chokidar';
import * as babel from '@babel/core';
import vfs from 'vinyl-fs';
import through from 'through2';
import slash from 'slash2';
import rimraf from 'rimraf';
import { signale } from './utils';
import { join, extname } from 'path';
import getBabelConfig from './getBabelConfig';
import { existsSync, statSync } from 'fs';

interface IBabelOpts {
  cwd: string;
  watch?: boolean;
  type: ModuleFormat;
  config: IFormattedConfig;
}

function transform(f: { contents: string; path: string }, opts: IBabelOpts) {
  const { cwd, type, config } = opts;
  const nodes = config.nodes;

  const isNode = nodes.includes(slash(f.path).replace(`${cwd}/`, ''));
  signale.info(
    `[${type}] Babel Transform: ${isNode ? 'node' : 'browser'} ${slash(f.path).replace(
      `${cwd}/`,
      '',
    )}`,
  );

  const babelConfig = getBabelConfig({
    target: isNode ? 'node' : 'browser',
    type,
    typescript: true,
    runtimeHelpers: config.runtimeHelpers,
  });

  return babel.transform(f.contents, {
    ...babelConfig,
    filename: f.path,
  }).code;
}

function createStream(src: string[], srcPath: string, targetPath: string, opts: IBabelOpts) {
  return vfs
    .src(src, { allowEmpty: true, base: srcPath })
    .pipe(
      through.obj((file, env, cb) => {
        file.contents = Buffer.from(transform(file, opts));
        file.path = file.path.replace(extname(file.path), '.js');
        cb(null, file);
      }),
    )
    .pipe(vfs.dest(targetPath));
}

export default async function build(opts: IBabelOpts) {
  const { cwd, type, watch } = opts;

  const srcPath = join(cwd, 'src');
  const targetDir = type === 'esm' ? 'es' : 'lib';
  const targetPath = join(cwd, targetDir);

  signale.info(`Clear ${targetDir} directory`);
  rimraf.sync(targetPath);

  const src = [
    join(srcPath, '**/*'),
    `!${join(srcPath, '**/fixtures/**/*')}`,
    `!${join(srcPath, '**/.umi/**/*')}`,
    `!${join(srcPath, '**/.umi-production/**/*')}`,
    `!${join(srcPath, '**/*.test.js')}`,
    `!${join(srcPath, '**/*.e2e.js')}`,
    `!${join(srcPath, 'pages/**/*')}`,
  ];

  return new Promise(resolve => {
    createStream(src, srcPath, targetPath, opts).on('end', () => {
      if (watch) {
        signale.info('Start watch', srcPath);
        chokidar
          .watch(srcPath, {
            ignoreInitial: true,
          })
          .on('all', (event, fullPath) => {
            const relPath = fullPath.replace(srcPath, '');
            signale.info(`[${event}] ${fullPath}`);
            if (!existsSync(fullPath)) {
              return;
            }
            if (statSync(fullPath).isFile()) {
              createStream([fullPath], srcPath, targetPath, opts);
            }
          });
      }
      resolve();
    });
  });
}

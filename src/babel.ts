import * as babel from '@babel/core';
import assert from 'assert';
import * as chokidar from 'chokidar';
import { existsSync, statSync } from 'fs';
import gulp from 'gulp';
import { extname, join } from 'path';
import rimraf from 'rimraf';
import slash from 'slash2';
import through from 'through2';
import getBabelConfig from './getBabelConfig';
import { BundleType, IBuildOpts, IFormattedBuildConf } from './types';
import { generateTsConfig, signale } from './utils';

function transform(
  type: BundleType,
  f: { contents: string; path: string },
  conf: IFormattedBuildConf,
  opts: IBuildOpts,
) {
  const { cwd } = opts;
  const { browserFiles = [] } = conf;

  const isBrowser = browserFiles.includes(slash(f.path).replace(`${cwd}/`, ''));
  signale.info(
    `[${type}] Babel Transform: ${isBrowser ? 'browser' : 'node'} ${slash(f.path).replace(
      `${cwd}/`,
      '',
    )}`,
  );

  const babelConfig = getBabelConfig({
    target: isBrowser ? 'browser' : 'node',
    type,
    typescript: true,
    runtimeHelpers: conf.runtimeHelpers,
  });

  return babel.transform(f.contents, {
    ...babelConfig,
    filename: f.path,
  }).code;
}

function createStream(
  src: string[],
  srcPath: string,
  targetPath: string,
  type: BundleType,
  conf: IFormattedBuildConf,
  opts: IBuildOpts,
) {
  return gulp
    .src(src, { allowEmpty: true, base: srcPath })
    .pipe(
      through.obj((file, _, cb) => {
        file.contents = Buffer.from(transform(type, file, conf, opts));
        file.path = file.path.replace(extname(file.path), '.js');
        cb(null, file);
      }),
    )
    .pipe(gulp.dest(targetPath));
}

export default async function build(type: BundleType, conf: IFormattedBuildConf, opts: IBuildOpts) {
  const { cwd, watch } = opts;

  const srcPath = join(cwd, conf.entry || 'src');
  assert.ok(statSync(srcPath).isDirectory(), 'Babel entry MUST be a directory.');

  generateTsConfig(opts);

  const targetDir = type === 'esm' ? 'es' : 'lib';
  const targetPath = join(cwd, targetDir);

  signale.info(`Clear ${targetDir} directory`);
  rimraf.sync(targetPath);

  const src = [
    join(srcPath, '**/*.{js,ts,jsx,tsx}'),
    `!${join(srcPath, '**/fixtures/**/*')}`,
    `!${join(srcPath, '**/.umi/**/*')}`,
    `!${join(srcPath, '**/.umi-production/**/*')}`,
    `!${join(srcPath, '**/*.test.js')}`,
    `!${join(srcPath, '**/*.e2e.js')}`,
    `!${join(srcPath, 'pages/**/*')}`,
  ];

  return new Promise((resolve, reject) => {
    createStream(src, srcPath, targetPath, type, conf, opts)
      .on('end', () => {
        if (watch) {
          signale.info('Start watch', srcPath);
          chokidar
            .watch(srcPath, {
              ignoreInitial: true,
            })
            .on('all', (event, fullPath) => {
              // const relPath = fullPath.replace(srcPath, '');
              signale.info(`[${event}] ${fullPath}`);
              if (!existsSync(fullPath)) {
                return;
              }
              if (statSync(fullPath).isFile()) {
                createStream([fullPath], srcPath, targetPath, type, conf, opts);
              }
            });
        }
        resolve();
      })
      .on('error', e => reject(e));
  });
}

import assert from 'assert';
import { readFileSync, statSync } from 'fs';
import gulp from 'gulp';
import babel from 'gulp-babel';
import typescript from 'gulp-typescript';
import { join } from 'path';
import rimraf from 'rimraf';
import getBabelConfig from './getBabelConfig';
import { BundleType, IBuildOpts, IFormattedBuildConf } from './types';
import { generateTsConfig, getEntry, signale } from './utils';

function getTsConfig(cwd: string) {
  const tsConfig = JSON.parse(readFileSync(join(cwd, 'tsconfig.json'), 'utf-8'));
  return {
    noUnusedParameters: true,
    noUnusedLocals: true,
    strictNullChecks: true,
    target: 'es6',
    jsx: 'preserve',
    moduleResolution: 'node',
    declaration: true,
    allowSyntheticDefaultImports: true,
    ...tsConfig.compilerOptions,
  };
}

async function buildLess(srcDir: string, targetDir: string) {
  signale.await('Copy Less...');
  return new Promise((resolve, reject) => {
    gulp
      .src(`${srcDir}/**/*.less`)
      .pipe(gulp.dest(targetDir))
      .on('finish', () => resolve())
      .on('error', e => reject(e));
  });
}

async function copyAssets(srcDir: string, targetDir: string) {
  signale.await('Copy Assets...');
  return new Promise((resolve, reject) => {
    gulp
      .src([`${srcDir}/**/*.@(png|svg)`])
      .pipe(gulp.dest(targetDir))
      .on('finish', () => resolve())
      .on('error', e => reject(e));
  });
}

async function buildTs(
  srcDir: string,
  targetDir: string,
  type: BundleType,
  conf: IFormattedBuildConf,
  opts: IBuildOpts,
) {
  signale.await('Copy Assets...');
  const source = [
    `${srcDir}/**/*.tsx`,
    `${srcDir}/**/*.ts`,
    'typings/**/*.d.ts',
    `!${srcDir}/**/*.test.{js,ts}`,
    `!${srcDir}/**/*.e2e.{js,ts}`,
  ];
  const tsConf = getTsConfig(opts.cwd);
  const babelConf = getBabelConfig({
    target: 'browser',
    type,
    typescript: true,
    runtimeHelpers: conf.runtimeHelpers,
  });
  return new Promise((resolve, reject) => {
    gulp
      .src(source)
      .pipe(typescript(tsConf))
      .pipe(babel(babelConf))
      .pipe(gulp.dest(targetDir))
      .on('finish', () => resolve())
      .on('error', (e: Error) => reject(e));
  });
}

export default async function build(type: BundleType, conf: IFormattedBuildConf, opts: IBuildOpts) {
  const { cwd } = opts;
  const srcDir = getEntry(conf, opts);
  assert.ok(statSync(srcDir).isDirectory(), 'Babel entry MUST be a directory.');
  const targetDir = 'es';

  signale.info(`Clear es directory`);
  rimraf.sync(join(cwd, targetDir));

  generateTsConfig(opts);
  try {
    await buildLess(srcDir, targetDir);
    await copyAssets(srcDir, targetDir);
    await buildTs(srcDir, targetDir, type, conf, opts);
    signale.complete('Dynamic Build Success');
  } catch (error) {
    throw error;
  }
}

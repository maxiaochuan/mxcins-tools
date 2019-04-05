import { readFileSync } from 'fs';
import gulp from 'gulp';
import babel from 'gulp-babel';
import typescript from 'gulp-typescript';
import { join } from 'path';
import rimraf from 'rimraf';
import getBabelConfig from './getBabelConfig';
import { BundleType, IBuildOpts, IFormattedBuildConf } from './types';
import { generateTsConfig, signale } from './utils';

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

async function buildLess(esDir: string) {
  signale.await('Building Less...');
  return new Promise((resolve, reject) => {
    gulp
      .src('components/**/*.less')
      .pipe(gulp.dest(esDir))
      .on('finish', () => resolve())
      .on('error', e => reject(e));
  });
}

async function copyAssets(esDir: string) {
  signale.await('Copy Assets...');
  return new Promise((resolve, reject) => {
    gulp
      .src(['components/**/*.@(png|svg)'])
      .pipe(gulp.dest(esDir))
      .on('finish', () => resolve())
      .on('error', e => reject(e));
  });
}

async function buildTs(type: BundleType, conf: IFormattedBuildConf, cwd: string, esDir: string) {
  signale.await('Copy Assets...');
  const source = ['components/**/*.tsx', 'components/**/*.ts', 'typings/**/*.d.ts'];
  const tsConf = getTsConfig(cwd);
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
      .pipe(gulp.dest(esDir))
      .on('finish', () => resolve())
      .on('error', (e: Error) => reject(e));
  });
}

export default async function build(type: BundleType, conf: IFormattedBuildConf, opts: IBuildOpts) {
  const { cwd } = opts;
  const esDir = 'es';

  signale.info(`Clear es directory`);
  rimraf.sync(join(cwd, esDir));

  generateTsConfig(opts);
  try {
    await buildLess(esDir);
    await copyAssets(esDir);
    await buildTs(type, conf, cwd, esDir);
    signale.complete('Dynamic Build Success');
  } catch (error) {
    throw error;
  }
}

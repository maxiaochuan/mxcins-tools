import * as babel from '@babel/core';
import { extname, join } from 'path';
import rimraf from 'rimraf';
import through from 'through2';
import signale from 'signale';
import gulp, { watch } from 'gulp';
import typescript from 'gulp-typescript';
import { existsSync } from 'fs';
import { BundleType, IRequiredConfig, IPackageJSON } from './types';
import { getEntryPath, ConfigError } from './utils';
import { DEFAULT_GULP_ENTRY_DIRS } from './const';
import { getBabelConfig } from './getBabelConfig';

interface IGulpOpts {
  cwd: string;
  watch?: boolean;
  type: BundleType;
  conf: IRequiredConfig;
  pkg: IPackageJSON;
}

const jsTransform = (type: BundleType, conf: IRequiredConfig, target?: 'browser' | 'node') =>
  through.obj((f, _, cb) => {
    f.contents = Buffer.from(
      babel.transform(f.contents, {
        ...getBabelConfig({
          target: target || conf.target || 'node',
          type,
          typescript: false,
          runtimeHelpers: conf.runtimeHelpers,
        }),
        filename: f.path,
      }).code,
    );
    f.path = f.path.replace(extname(f.path), '.js');
    cb(null, f);
  });

async function transform(
  source: string[],
  targetDir: string,
  type: BundleType,
  conf: IRequiredConfig,
  isTs: boolean,
  target?: 'browser' | 'node',
) {
  const ts = async () => {
    const tsTransform = typescript.createProject('tsconfig.json', {
      target: 'esnext',
      jsx: 'preserve',
      declaration: true,
      allowSyntheticDefaultImports: true,
    });

    const tsResult = gulp.src(source.filter(s => s.includes('.ts'))).pipe(tsTransform());

    return Promise.all([
      new Promise((resolve, reject) => {
        tsResult.js
          .pipe(jsTransform(type, conf, target))
          .pipe(gulp.dest(targetDir))
          .on('finish', resolve)
          .on('error', reject);
      }),
      new Promise((resolve, reject) => {
        tsResult.dts
          .pipe(gulp.dest(targetDir))
          .on('finish', resolve)
          .on('error', reject);
      }),
    ]);
  };
  const js = async () =>
    new Promise((resolve, reject) => {
      gulp
        .src(source.filter(s => s.includes('.js')))
        .pipe(jsTransform(type, conf, target))
        .pipe(gulp.dest(targetDir))
        .on('finish', resolve)
        .on('error', reject);
    });

  if (isTs) {
    await ts();
  }
  await js();
}

async function buildLess(source: string[], targetDir: string) {
  return new Promise((resolve, reject) => {
    gulp
      .src(source.filter(s => s.includes('less')))
      .pipe(gulp.dest(targetDir))
      .on('finish', resolve)
      .on('error', reject);
  });
}

async function copyAssets(source: string[], targetDir: string) {
  return new Promise((resolve, reject) => {
    gulp
      .src(source.filter(s => s.includes('png')))
      .pipe(gulp.dest(targetDir))
      .on('finish', resolve)
      .on('error', reject);
  });
}

const forESM = async (src: string[], targetDir: string, conf: IRequiredConfig, isTs: boolean) => {
  await transform(src, targetDir, 'esm', conf, isTs);
  await buildLess(src, targetDir);
  await copyAssets(src, targetDir);
};

const forCJS = (source: string[], targetDir: string, conf: IRequiredConfig, isTs: boolean) =>
  transform(source, targetDir, 'cjs', conf, isTs, 'node');

const run = async (opts: IGulpOpts) => {
  const { cwd, type, pkg, conf } = opts;
  const scope = [pkg.name || '', type.toUpperCase(), (conf[type] as any).type.toUpperCase()];
  const print = signale.scope(...scope);
  const srcDir = conf.entry || getEntryPath(cwd, DEFAULT_GULP_ENTRY_DIRS);
  if (!srcDir) {
    throw new ConfigError('Entry file must be exist!', scope);
  }

  const targetDir = join(cwd, type === 'esm' ? 'es' : 'lib');
  rimraf.sync(targetDir);
  print.info(`clear ${targetDir.replace(cwd, '')} directory.`);

  const source = [
    `${srcDir}/**/*.tsx`,
    `${srcDir}/**/*.ts`,
    `${srcDir}/**/*.jsx`,
    `${srcDir}/**/*.js`,
    'typings/**/*.d.ts',
    `${srcDir}/**/*.@(png|svg)`,
    `${srcDir}/**/*.less`,
    `!${srcDir}/**/*.test.{js,ts}`,
    `!${srcDir}/**/*.e2e.{js,ts}`,
  ];

  const isTs = existsSync(join(opts.cwd, 'tsconfig.json'));

  try {
    if (type === 'cjs') {
      print.start(`gulp <- ${srcDir.replace(`${opts.cwd}/`, '')}`);
      await forCJS(source, targetDir, conf, isTs).then(() => {
        if (opts.watch) {
          watch(source, () => forCJS(source, targetDir, conf, isTs));
        }
      });
    }
    if (type === 'esm') {
      await forESM(source, targetDir, conf, isTs).then(() => {
        if (opts.watch) {
          watch(source, () => forESM(source, targetDir, conf, isTs));
        }
      });
    }

    const dist = `${targetDir}/index.js`.replace(`${opts.cwd}/`, '');
    print.complete(`gulp -> ${dist}`);

    return dist;
  } catch (error) {
    throw error;
  }
};

export default run;

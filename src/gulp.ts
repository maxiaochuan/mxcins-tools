import * as babel from '@babel/core';
import { extname, join } from 'path';
import rimraf from 'rimraf';
import through from 'through2';
import signale from 'signale';
import gulp from 'gulp';
import watch from 'gulp-watch';
import typescript from 'gulp-typescript';
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

const tsTransform = typescript.createProject('tsconfig.json', {
    target: 'es6',
    jsx: 'preserve',
    declaration: true,
    allowSyntheticDefaultImports: true,
});

const babelTransform = (f: any, type: BundleType, conf: IRequiredConfig, target?: 'browser' | 'node') => {
  const babelConfig = getBabelConfig({
    target: target || conf.target || 'node',
    type,
    typescript: true,
    runtimeHelpers: conf.runtimeHelpers,
  });

  return babel.transform(f.contents, {
    ...babelConfig,
    filename: f.path,
  }).code;
};

const forCJS = (
  source: string[],
  targetDir: string,
  type: BundleType,
  conf: IRequiredConfig,
) => buildJs(source, targetDir, type, conf);

// const bundleWithoutDeclaration = async () => {
//   gulp
//     .src(source, { base, allowEmpty: true })
//     .pipe(
//       through.obj((file, _, cb) => {
//         file.contents = Buffer.from(babelTransform(type, file, conf, target));
//         file.path = file.path.replace(extname(file.path), '.js');
//         cb(null, file);
//       }),
//     )
//     .pipe(gulp.dest(targetPath))
//     .on('end', resolve)
//     .on('error', reject)
// }

async function buildJss (
  source: string[],
  targetDir: string,
  type: BundleType,
  conf: IRequiredConfig,
  target?: 'browser' | 'node',
) {
  gulp
    .src(source, { allowEmpty: true })
    .pipe(
      through.obj((file, _, cb) => {
        file.contents = Buffer.from(babelTransform(type, file, conf, target));
        file.path = file.path.replace(extname(file.path), '.js');
        cb(null, file);
      }),
    )
    .pipe(gulp.dest(targetPath))
    .on('end', resolve)
    .on('error', reject)
}

async function transform(
  source: string[],
  targetDir: string,
  type: BundleType,
  conf: IRequiredConfig,
  target?: 'browser' | 'node',
) {

  const ts = async () => {
    const tsResult = gulp
      .src(source.filter(s => s.includes('.ts')))
      .pipe(tsTransform())
    
    tsResult.js
    .pipe(
      through.obj((file, _, cb) => {
        file.contents = Buffer.from(babelTransform(type, file, conf, target));
        file.path = file.path.replace(extname(file.path), '.js');
        cb(null, file);
      }),
    )
    .pipe(gulp.dest(targetDir))
    // await new Promise((resolve, reject) => {
    //   const tsResult = gulp
    //     .src(source.filter(s => s.includes('.ts')))
    //     .pipe(tsTransform())
    //     .on('error', e => reject(e))
    //     .on('finish', () => resolve(tsResult));
    // });

  }
  const js = () => {

  }

  const js = (s: any) =>
    new Promise((resolve, reject) => {
      s.js
        .pipe(
          through.obj((file, _, cb) => {
            file.contents = Buffer.from(babelTransform(type, file, conf));
            file.path = file.path.replace(extname(file.path), '.js');
            cb(null, file);
          }),
        )
        .pipe(gulp.dest(targetDir))
        .on('error', (e: Error) => reject(e))
        .on('finish', () => resolve());
    });

  const dts = (s: any) =>
    new Promise((resolve, reject) => {
      s.dts
        .pipe(gulp.dest(targetDir))
        .on('error', (e: Error) => reject(e))
        .on('finish', () => resolve());
    });

  const stream = await main();
  await dts(stream);
  await js(stream);
}

async function buildLess(srcDir: string, targetDir: string) {
  return new Promise((resolve, reject) => {
    gulp
      .src(`${srcDir}/**/*.less`)
      .pipe(gulp.dest(targetDir))
      .on('finish', resolve)
      .on('error', reject);
  });
}

async function copyAssets(srcDir: string, targetDir: string) {
  return new Promise((resolve, reject) => {
    gulp
      .src([`${srcDir}/**/*.@(png|svg)`])
      .pipe(gulp.dest(targetDir))
      .on('finish', resolve)
      .on('error', reject);
  });
}

const forESM = async (
  src: string[],
  srcDir: string,
  targetDir: string,
  type: BundleType,
  conf: IRequiredConfig,
  ) => {
  await buildTs(src, targetDir, type, conf);
  await buildLess(srcDir, targetDir);
  await copyAssets(srcDir, targetDir);
};

const run = async (opts: IGulpOpts) => {
  const { cwd, type, pkg, conf } = opts;
  const scope = [
    pkg.name || '',
    (conf[type] as any).type.toUpperCase(),
    type.toUpperCase(),
  ]
  const print = signale.scope(...scope);
  const srcDir = conf.entry || getEntryPath(cwd, DEFAULT_GULP_ENTRY_DIRS);
  if (!srcDir) {
    throw new ConfigError('Entry file must be exist!', scope);
  }

  const targetDir = join(cwd, type === 'esm' ? 'es' : 'lib');
  rimraf.sync(targetDir);
  print.info(`Clear ${targetDir.replace(cwd, '')} directory.`);

  const source = [
    `${srcDir}/**/*.tsx`,
    `${srcDir}/**/*.ts`,
    'typings/**/*.d.ts',
    `!${srcDir}/**/*.test.{js,ts}`,
    `!${srcDir}/**/*.e2e.{js,ts}`,
  ];

  if (type === 'cjs') {
    return forCJS(source, targetDir, type, conf).then(() => {
      if (opts.watch) {
        watch(source, forCJS);
      }
    })
  }

  if (type === 'esm') {
    return forESM(source, srcDir, targetDir, type, conf).then(() => {
      if (opts.watch) {
        watch(source, forESM);
      }
    })
  }
};

export default run;

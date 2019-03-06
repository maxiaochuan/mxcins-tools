const { join, extname } = require('path');
const babel = require('@babel/core');
const through = require('through2');
const rimraf = require('rimraf');
const vfs = require('vinyl-fs');
const chalk = require('chalk');
const slash = require('slash2');
const shell = require('shelljs');
const { logger } = require('./utils');

const cwd = process.cwd();
let pkgCount = null;

function getBabelConfig(isBrowser) {
  const options = isBrowser
    ? {
        modules: false,
        targets: {
          browsers: ['last 2 versions', 'IE 10'],
        },
      }
    : {
        targets: {
          node: 6,
        },
      };

  return {
    sourceMaps: true,
    presets: [
      [require.resolve('@babel/preset-typescript'), {}],
      [require.resolve('@babel/preset-env'), options],
      ...(isBrowser ? [require.resolve('@babel/preset-react')] : []),
    ],
    plugins: [
      require.resolve('@babel/plugin-proposal-export-default-from'),
      ...(isBrowser
        ? [
            [require.resolve('@babel/plugin-proposal-decorators'), { legacy: true }],
            [require.resolve('@babel/plugin-proposal-class-properties'), { loose: true }],
            [require.resolve('@babel/plugin-transform-runtime'), { corejs: 2 }],
          ]
        : [require.resolve('@babel/plugin-proposal-class-properties')]),
    ],
  };
}

function addLastSlash(path) {
  return path.slice(-1) === '/' ? path : `${path}/`;
}

function transform(opts = {}) {
  const { content, path, isBrowser } = opts;

  const babelConfig = getBabelConfig(isBrowser);

  return babel.transform(content, {
    ...babelConfig,
    filename: path,
  });
}

function build(dir) {
  const pkgPath = join(cwd, dir, 'package.json');
  const pkg = require(pkgPath); // eslint-disable-line
  if (!pkg.mxcinsTools) {
    return;
  }

  const root = join(cwd, dir).replace(/\/$/, '');

  const { browserFiles, isBrowser, types } = pkg.mxcinsTools || {};

  const libDir = join(dir, 'lib');
  const srcDir = join(dir, 'src');

  // delete lib
  rimraf.sync(libDir);
  if (types) {
    rimraf.sync(join(dir, 'types'));
    shell.cd(join(cwd, dir));
    shell.exec(`tsc -d --declarationDir types --emitDeclarationOnly --sourceMap`);
    if (typeof types === 'string' && types !== 'types') {
      shell.exec(`cp -R types/* ${types}`);
      rimraf.sync(join(dir, 'types'));
    }
    shell.cd(cwd);
  }

  function createStream(src) {
    return vfs
      .src(
        [
          src,
          `!${join(srcDir, '**/fixtures/**/*')}`,
          `!${join(srcDir, '**/.umi/**/*')}`,
          `!${join(srcDir, '**/.umi-production/**/*')}`,
          `!${join(srcDir, '**/*.test.js')}`,
          `!${join(srcDir, '**/*.e2e.js')}`,
          `!${join(srcDir, 'pages/**/*')}`,
        ],
        { allowEmpty: true, base: srcDir },
      )
      .pipe(
        through.obj((f, env, cb) => {
          if (f.path.includes('templates')) {
            logger.copy(chalk.red(`${slash(f.path).replace(`${cwd}/`, '')}`));
          } else if (['.js', '.ts', '.tsx'].includes(extname(f.path))) {
            const isBrowserFile =
              isBrowser ||
              (browserFiles && browserFiles.includes(`${slash(f.path).replace(`${root}/`, '')}`));
            const transformed = transform({
              content: f.contents,
              isBrowser: isBrowserFile,
              path: f.path,
            });
            f.contents = Buffer.from(transformed.code);
            f.path = f.path.replace(extname(f.path), '.js');
            f.map = transformed.map;
            logger.transform(
              chalk[isBrowserFile ? 'yellow' : 'blue'](`${slash(f.path).replace(`${root}/`, '')}`),
            );
          }
          cb(null, f);
        }),
      )
      .pipe(vfs.dest(libDir))
      .pipe(
        through.obj((f, env, cb) => {
          const mf = f.clone();
          if (mf.map) {
            mf.contents = Buffer.from(JSON.stringify(f.map));
            mf.path = f.path.replace(extname(f.path), '.js.map');
          }
          this.push(mf);
          this.push(f);
          
        }),
      )
      .pipe(vfs.dest(libDir));
  }

  const stream = createStream(join(srcDir, '**/*'));
  stream.on('end', () => {
    pkgCount -= 1;

    if (pkgCount === 0 && process.send) {
      process.send('BUILD_COMPLETE');
    }
    // watch
    // if (watch) {
    //   log.pending('start watch', srcDir);
    //   const watcher = chokidar.watch(join(cwd, srcDir), {
    //     ignoreInitial: true,
    //   });
    //   watcher.on('all', (event, fullPath) => {
    //     const relPath = fullPath.replace(join(cwd, srcDir), '');
    //     log.watch(`[${event}] ${join(srcDir, relPath)}`);
    //     if (!existsSync(fullPath)) return;
    //     if (statSync(fullPath).isFile()) {
    //       createStream(fullPath);
    //     }
    //   });
    // }
  });
}

function babelTransform(dir, { cwd, watch }) {}

module.exports = build;

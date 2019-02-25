const { join, extname } = require('path');
const { existsSync, readdirSync, statSync } = require('fs');
const yParser = require('yargs-parser');
const babel = require('@babel/core');
const through = require('through2');
const rimraf = require('rimraf');
const vfs = require('vinyl-fs');
const chalk = require('chalk');
const slash = require('slash2');
const shell = require('shelljs');
const log = require('./utils/log');

const cwd = process.cwd();
let pkgCount = null;

function getBabelConfig(isBrowser) {
  const options = isBrowser
    ? {
        // modules: false,
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
          ]
        : [require.resolve('@babel/plugin-proposal-class-properties')]),
    ],
  };
}

function addLastSlash(path) {
  return path.slice(-1) === '/' ? path : `${path}/`;
}

function transform(opts = {}) {
  const { content, path, isBrowser, root } = opts;

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

  const { browserFiles, isBrowser, types } = pkg.mxcinsTools || {};

  const libDir = join(dir, 'lib');
  const srcDir = join(dir, 'src');

  // delete lib
  rimraf.sync(libDir);
  if (types) {
    rimraf.sync(join(dir, 'types'));
    shell.cd(join(cwd, dir));
    shell.exec('tsc -d --declarationDir types --emitDeclarationOnly --sourceMap');
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
        ],
        { allowEmpty: true, base: srcDir },
      )
      .pipe(
        through.obj((f, env, cb) => {
          if (f.path.includes('templates')) {
            log.copy(chalk.red(`${slash(f.path).replace(`${cwd}/`, '')}`));
          } else if (['.js', '.ts'].includes(extname(f.path))) {
            const isBrowserFile =
              isBrowser ||
              (browserFiles && browserFiles.includes(`${slash(f.path).replace(`${cwd}/`, '')}`));
            const transformed = transform({
              content: f.contents,
              isBrowser: isBrowserFile,
              path: f.path,
              root: join(cwd, dir),
            });
            f.contents = Buffer.from(transformed.code);
            f.path = f.path.replace(extname(f.path), '.js');
            f.map = transformed.map;
            log.transform(
              chalk[isBrowserFile ? 'yellow' : 'blue'](`${slash(f.path).replace(`${cwd}/`, '')}`),
            );
          }
          cb(null, f);
        }),
      )
      .pipe(vfs.dest(libDir))
      .pipe(
        through.obj((f, env, cb) => {
          if (f.map) {
            f.contents = Buffer.from(JSON.stringify(f.map));
            f.path = f.path.replace(extname(f.path), '.js.map');
          }
          cb(null, f);
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

function isLerna(cw) {
  return existsSync(join(cw, 'lerna.json'));
}

// Init
const args = yParser(process.argv.slice(3));
const watch = args.w || args.watch;
if (isLerna(cwd)) {
  const dirs = readdirSync(join(cwd, 'packages')).filter(dir => dir.charAt(0) !== '.');
  pkgCount = dirs.length;
  dirs.forEach(pkg => {
    build(`./packages/${pkg}`, {
      cwd,
    });
  });
} else {
  pkgCount = 1;
  build('./', {
    cwd,
    watch,
  });
}

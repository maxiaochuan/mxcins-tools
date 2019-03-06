const { join, extname, basename } = require('path');
const rimraf = require('rimraf');
const vfs = require('vinyl-fs');
const through = require('through2');
const babel = require('@babel/core');
const chalk = require('chalk');
const slash = require('slash2');
const debug = require('debug')('mxcins:tools:babel-transform');
const { logger } = require('./utils');

function getBabelConfig(isNode) {
  const options = isNode
    ? {
        targets: {
          node: 6,
        },
      }
    : {
        modules: false,
        targets: {
          browsers: ['last 2 versions', 'IE 10'],
        },
        exclude: ['transform-regenerator'],
      };

  return {
    sourceMaps: !isNode,
    presets: [
      [require.resolve('@babel/preset-typescript'), {}],
      [require.resolve('@babel/preset-env'), options],
      ...(isNode ? [] : [require.resolve('@babel/preset-react')]),
    ],
    plugins: [
      require.resolve('@babel/plugin-proposal-export-default-from'),
      ...(isNode
        ? [require.resolve('@babel/plugin-proposal-class-properties')]
        : [
            [require.resolve('@babel/plugin-proposal-decorators'), { legacy: true }],
            [require.resolve('@babel/plugin-proposal-class-properties'), { loose: true }],
          ]),
    ],
  };
}

function createStream(srcDir, { cwd, root, nodes, libDir }) {
  return vfs
    .src([
      join(srcDir, '**/*'),
      `!${join(srcDir, '**/fixtures/**/*')}`,
      `!${join(srcDir, '**/.umi/**/*')}`,
      `!${join(srcDir, '**/.umi-production/**/*')}`,
      `!${join(srcDir, '**/*.test.js')}`,
      `!${join(srcDir, '**/*.e2e.js')}`,
      `!${join(srcDir, 'pages/**/*')}`,
    ])
    .pipe(
      through.obj(function trans(f, encoding, callback) {
        const fp = slash(f.path).replace(cwd, '');
        const find = slash(f.path).replace(`${root}/`.replace('//', '/'), '');
        if (f.path.includes('templates')) {
          // ignore templates
          logger.copy(chalk.red(fp));
          this.push(f);
        } else if (['.js', '.jsx', '.ts', '.tsx'].includes(extname(f.path))) {
          // transformed file
          const isNode = nodes && nodes.includes(find);
          const transformed = babel.transform(f.contents, {
            ...getBabelConfig(isNode),
            filename: f.path,
          });

          f.contents = Buffer.from(
            `${transformed.code}\n\n//# sourceMappingURL=${basename(f.path).replace(
              extname(f.path),
              '.js.map',
            )}`,
          );
          f.path = f.path.replace(extname(f.path), '.js');

          // map
          if (transformed.map) {
            // # sourceMappingURL=b.js.map
            const mf = f.clone();
            mf.contents = Buffer.from(JSON.stringify(transformed.map));
            mf.path = f.path.replace(extname(f.path), '.js.map');
            this.push(mf);
          }

          logger.transform(
            chalk[isNode ? 'yellow' : 'blue'](`babel ${isNode ? 'node' : 'browser'} -> ${fp}`),
          );
          this.push(f);
        }
        callback();
      }),
    )
    .pipe(vfs.dest(libDir));
}

function tramsform(dir, { cwd, pkg }) {
  return new Promise(resolve => {
    const root = join(cwd, dir);
    debug(`tramsform start -> ${root}`);

    const { nodes, src = 'src' } = pkg.mxcinsTools || {};

    const libDir = join(root, 'lib');
    const srcDir = join(root, src);
    rimraf.sync(libDir);

    const stream = createStream(srcDir, { cwd, root, nodes, libDir });

    stream.on('end', () => {
      resolve(pkg.input);
    });
  });
}

module.exports = tramsform;

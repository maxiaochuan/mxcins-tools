const yParser = require('yargs-parser');
const { join } = require('path');
const rollup = require('rollup');
const nodeResolve = require('rollup-plugin-node-resolve');
const commonjs = require('rollup-plugin-commonjs');
const babel = require('rollup-plugin-babel');
const log = require('./utils/log');
const cwd = process.cwd();
const args = yParser(process.argv.slice(2));
const watch = args.w || args.watch;

const babelConfig = {
  externalHelpers: true,
  exclude: 'node_modules/**',
  presets: [
    [require.resolve('@babel/preset-typescript'), {}],
    [
      require.resolve('@babel/preset-env'),
      {
        modules: false,
        targets: {
          browsers: ['last 2 versions', 'IE 10'],
        },
      },
    ],
    require.resolve('@babel/preset-react'),
  ],
  extensions: ['.js', '.jsx', '.ts', '.tsx'],
  plugins: [
    require.resolve('@babel/plugin-proposal-export-default-from'),
    [require.resolve('@babel/plugin-proposal-decorators'), { legacy: true }],
    [require.resolve('@babel/plugin-proposal-class-properties'), { loose: true }],
    [require.resolve('@babel/plugin-transform-runtime'), { corejs: 2 }],
    require.resolve('@babel/plugin-external-helpers'),
  ],
};

function build(dir) {
  const pkgPath = join(cwd, dir, 'package.json');
  const pkg = require(pkgPath);

  const { input, name } = pkg.mxcinsTools || {};

  if (!input) {
    log.error('input must be exist');
    process.exit(1);
  }

  const inputOptions = {
    input,
    external: Object.keys(pkg.dependencies || {}),
    plugins: [
      nodeResolve({
        jsnext: true,
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      }),
      babel(babelConfig),
      commonjs(),
    ],
  };

  const output = [];

  if (pkg.main) {
    output.push({
      file: pkg.main,
      format: 'cjs',
    });
  }
  if (pkg.module) {
    output.push({
      file: pkg.module,
      format: 'es',
    });
  }

  if (pkg.browser) {
    if (!name) {
      log.error('name must be exist in browser output');
      process.exit(1);
    }
    output.push({
      file: pkg.browser,
      format: 'iife',
      name,
    });
  }

  (async () => {
    if (watch) {
      const watcher = rollup.watch({
        ...inputOptions,
        output,
      });
      watcher.on('event', event => {
        log.info(`watch ${event.code}`);
      });
    } else {
      const bundle = await rollup.rollup(inputOptions);
      await Promise.all(output.map(o => bundle.write(o)));
    }
  })();
}

build('./');

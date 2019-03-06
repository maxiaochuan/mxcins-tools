const { join } = require('path');
const rollup = require('rollup');
const rimraf = require('rimraf');
const nodeResolve = require('rollup-plugin-node-resolve');
const babel = require('rollup-plugin-babel');
const commonjs = require('rollup-plugin-commonjs');
const chalk = require('chalk');
const { logger } = require('./utils');

const babelConfig = {
    exclude: 'node_modules/**',
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
    runtimeHelpers: true,
    sourceMaps: true,
    presets: [
      [require.resolve('@babel/preset-typescript'), {}],
      [require.resolve('@babel/preset-env'), {
        modules: false,
        targets: {
          browsers: ['last 2 versions', 'IE 10'],
        },
        exclude: ['transform-regenerator'],
      }],
      require.resolve('@babel/preset-react'),
    ],
    plugins: [
      require.resolve('@babel/plugin-proposal-export-default-from'),
      [require.resolve('@babel/plugin-proposal-decorators'), { legacy: true }],
      [require.resolve('@babel/plugin-proposal-class-properties'), { loose: true }],
    ],
}

// function generateExternal(dependencies) {
//   return (id) => {
//     const ret = Object.keys(dependencies).some(name => new RegExp(name).test(id));
//     return ret;
//   }
// }

function build(dir, { cwd, pkg, watch }) {
  const { input, name, globals = [], external } = pkg.mxcinsTools || {};

  const outputGlobals = globals.reduce((prev, [n1, n2]) => {
    prev[n1] = [n2];
    return prev;
  }, {});

  const inputOptions = {
    input: join(dir, input),
    external: external || Object.keys(pkg.dependencies || {}),
    plugins: [
      nodeResolve({
        jsnext: true,
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      }),
      babel(babelConfig),
      commonjs({
        include: 'node_modules/**',
      }),
    ],
  };

  const output = [];

  if (pkg.main) {
    if (!/dist/.test(pkg.main)) {
      logger.error('rollup pkg.main path must has dist!!');
      process.exit(1);
    }
    rimraf.sync(join(cwd, dir, 'dist'));
    output.push({
      file: join(dir, pkg.main),
      format: 'cjs',
      sourcemap: true,
      exports: 'named',
    });
  }
  if (pkg.module) {
    if (!/es/.test(pkg.module)) {
      logger.error('rollup pkg.main path must has dist!!');
      process.exit(1);
    }
    rimraf.sync(join(cwd, dir, 'es'));
    output.push({
      file: join(dir, pkg.module),
      format: 'es',
      sourcemap: true,
    });
  }

  if (pkg.browser) {
    if (!name) {
      logger.error('name must be exist in browser output');
      process.exit(1);
    }
    output.push({
      file: join(dir, pkg.browser),
      format: 'iife',
      globals: outputGlobals,
      name,
      sourcemap: true,
    });
  }

  if (watch) {
    const watcher = rollup.watch({
      ...inputOptions,
      output,
    });

    watcher.on('event', event => {
      logger.info(`watch ${event.code}`);
    });
    return watcher;
  }
  return rollup.rollup(inputOptions).then(bundle => {
    return Promise.all(output.map(o => bundle.write(o).then(() => {
      logger.transform(
        chalk.green(`rollup ${o.format} -> ${o.file}`),
      );
    })));
  });
}

module.exports = build;

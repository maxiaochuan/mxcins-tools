const { join } = require('path');
const { readdirSync } = require('fs');
const yParser = require('yargs-parser');
const shell = require('shelljs');
const rimraf = require('rimraf');
const { logger, isLerna } = require('./utils');
const babelTramsform = require('./babelTransform');
const rollupTransform = require('./rollupTransform');

const args = yParser(process.argv.slice(2));
const cwd = process.cwd();
const watch = args.w || args.watch;

/**
 *
 * { types } tsc
 * { nodes, src } babel transform
 * { input, globals, external } rollup transform
 * @param {*} dir
 * @param {*} opts
 */
function build(dir, opts) {
  const pkg = require(join(cwd, dir, 'package.json'));
  if (!pkg.mxcinsTools) {
    return Promise.resolve();
  }
  if (pkg.mxcinsTools.types) {
    const { types } = pkg.mxcinsTools;
    const tDir = types === true ? 'types' : types;
    rimraf.sync(join(cwd, dir, tDir));
    shell.cd(join(cwd, dir));
    shell.exec(`tsc -d --declarationDir ${tDir} --emitDeclarationOnly`);
    shell.cd(cwd);
    logger.tsc(join(dir, tDir));
  }
  const options = { ...opts, pkg };
  if (pkg.mxcinsTools.input) {
    return rollupTransform(dir, options);
  }
  return babelTramsform(dir, options);
}

if (isLerna(cwd)) {
  const dirs = readdirSync(join(cwd, 'packages')).filter(dir => dir.charAt(0) !== '.');
  dirs.forEach(pkg => {
    build(`./packages/${pkg}`, { cwd });
  });
} else {
  build('./', { watch, cwd });
}

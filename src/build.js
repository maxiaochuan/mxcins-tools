const { join } = require('path');
const { readdirSync } = require('fs');
const yParser = require('yargs-parser');
const { isLerna } = require('./utils');
const babelTramsform = require('./babelTransform');
const rollupTransform = require('./rollupTransform');

const args = yParser(process.argv.slice(2));
const cwd = process.cwd();
const watch = args.w || args.watch;

/**
 * 
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

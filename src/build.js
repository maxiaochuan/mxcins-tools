const { join } = require('path');
const { readdirSync } = require('fs');
const yParser = require('yargs-parser');
const { isLerna } = require('./utils');
const babelTramsform = require('./babelTransform');

const args = yParser(process.argv.slice(2));
const cwd = process.cwd();
const watch = args.w || args.watch;

if (isLerna(cwd)) {
  // const dirs = readdirSync(join(cwd, 'packages')).filter(dir => dir.charAt(0) !== '.');
  // dirs.forEach(pkg => {
  //   build(`./packages/${pkg}`, {
  //     cwd,
  //   });
  // });
} else {
  babelTramsform('./', {
    cwd,
    watch,
  });
}






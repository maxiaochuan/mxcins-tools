#!/usr/bin/env node
const signale = require('signale');
const args = require('yargs-parser')(process.argv.slice(2), {
  alias: {
    version: ['v'],
    watch: ['w'],
    update: ['u'],
  },
});

/**
 * version
 */
if (args.version) {
  signale.log(require('../package').version);
  process.exit(0);
}

const cwd = process.cwd();
const { watch, update } = args;

switch (args._[0]) {
  case 'build':
    require('../lib/build').default({
      cwd,
      watch,
      update,
    });
    break;

  default:
    signale.error(`Unknown command ${args._}`);
    break;
}

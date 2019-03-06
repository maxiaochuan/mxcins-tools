const { Signale } = require('signale');
const { join } = require('path');
const { existsSync } = require('fs');

const logger = new Signale({
  types: {
    transform: {
      badge: '🎅',
      color: 'blue',
      label: 'transform',
    },
    copy: {
      badge: '🎅',
      color: 'red',
      label: 'copy',
    },
    pending: {
      badge: '++',
      color: 'magenta',
      label: 'pending',
    },
    watch: {
      badge: '**',
      color: 'yellow',
      label: 'watch',
    },
    tsc: {
      badge: '🎅',
      color: 'gray',
      label: 'typings',
    },
  },
});

function isLerna(cw) {
  return existsSync(join(cw, 'lerna.json'));
}

module.exports = {
  isLerna,
  logger,
};

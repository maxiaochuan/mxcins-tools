const { Signale } = require('signale');

module.exports = new Signale({
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
  },
});

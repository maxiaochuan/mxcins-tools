const { eslint } = require('@mxcins/bedrock');

module.exports = {
  ...eslint,
  rules: {
    ...eslint.rules,
    'global-require': 0,
    'import/no-dynamic-require': 0,
    'no-nested-ternary': 0,
  },
};

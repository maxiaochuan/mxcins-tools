const { eslint } = require("@mxcins/bedrock");

module.exports = {
  ...eslint,
  rules: {
    ...eslint.rules,
    "global-require": 0
  }
};

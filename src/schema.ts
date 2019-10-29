export default {
  type: 'object',
  additionalProperties: false,
  properties: {
    entry: {
      oneOf: [
        { type: 'string', minLength: 1 },
        { type: 'array', items: { type: 'string', minLength: 1 } },
      ],
    },

    esm: {
      oneOf: [
        { type: 'boolean' },
        { type: 'string', minLength: 1 },
        {
          type: 'object',
          properties: {
            type: { type: 'string', pattern: '^(single|multiple|components)$' },
          },
        },
      ],
    },

    cjs: {
      oneOf: [
        { type: 'boolean' },
        { type: 'string', minLength: 1 },
        {
          type: 'object',
          properties: {
            type: { type: 'string', pattern: '^(single|multiple)$' },
          },
        },
      ],
    },

    umd: {
      oneOf: [
        { type: 'boolean' },
        { type: 'string', minLength: 1 },
        {
          type: 'object',
          properties: {
            type: { type: 'string', pattern: '^(single)$' },
          },
        },
      ],
    },

    runtimeHelpers: { type: 'boolean' },
    namedExports: { type: 'string' },
    outputExports: { type: 'string' },
    dev: { type: 'string' },
    doc: { type: 'string' },
  },
};

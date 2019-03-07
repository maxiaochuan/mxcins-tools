module.exports = {
  presets: [
    [require.resolve('@babel/preset-typescript'), {}],
    [ require.resolve('@babel/preset-env'), { targets: { node: 10 } }],
  ],
  plugins: [
    require.resolve('@babel/plugin-proposal-export-default-from'),
    require.resolve('@babel/plugin-proposal-class-properties'),
  ],
}
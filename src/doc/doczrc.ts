import { existsSync } from "fs";
import { join, dirname } from "path";

const cwd = process.cwd();
const isTypescript = existsSync(join(cwd, 'tsconfig.json'));

// const userConfig = getUserConfig(cwd, {});

export default {
  typescript: isTypescript,
  repository: false,
  // ...userConfig.doc,
  // modifyBabelRc(babelrc, args) {
  //   if (typeof userConfig.doc.modifyBabelRc === 'function') {
  //     babelrc = userConfig.doc.modifyBabelRc(babelrc, args);
  //   }

  //   // 需放 class-properties 前面
  //   babelrc.plugins.unshift([
  //     require.resolve('@babel/plugin-proposal-decorators'),
  //     { legacy: true },
  //   ]);

  //   // Support extraBabelPresets and extraBabelPlugins
  //   babelrc.presets = [...babelrc.presets, ...(userConfig.extraBabelPresets || [])];
  //   babelrc.plugins = [...babelrc.plugins, ...(userConfig.extraBabelPlugins || [])];

  //   return babelrc;
  // },
  modifyBundlerConfig(config: any, dev: any, args: any) {
    console.log('div', dev, args);
    // if (userConfig.doc.modifyBundlerConfig) {
    //   config = userConfig.doc.modifyBundlerConfig(config, dev, args);
    // }

    // if (!dev) {
    //   // do not generate doc sourcemap
    //   config.devtool = false;

    //   // support disable minimize via process.env.COMPRESS
    //   if (process.env.COMPRESS === 'none') {
    //     config.optimization.minimize = false;
    //   }
    // }

    // 确保只有一个版本的 docz，否则 theme 会出错，因为 ComponentProvider 的 context 不是同一个
    config.resolve.alias = config.resolve.alias || {};
    config.resolve.alias.docz = dirname(require.resolve('docz/package.json'));

    config.module.rules.push({
      test: /\.less$/,
      use: ['style-loader', 'css-loader',
        {
          loader: 'less-loader',
          options: {
            javascriptEnabled: true,
          },
        }],
    });

    // 透传 BIGFISH_VERSION 环境变量
    // config.plugins.push(
    //   new (require('webpack')).DefinePlugin({
    //     'process.env.BIGFISH_VERSION': JSON.stringify(process.env.BIGFISH_VERSION),
    //   }),
    // );

    // fallback resolve 路径
    config.resolve.modules.push(join(__dirname, '../../node_modules'));
    config.resolveLoader.modules.push(join(__dirname, '../../node_modules'));

    return config;
  },
  plugins: [],
};

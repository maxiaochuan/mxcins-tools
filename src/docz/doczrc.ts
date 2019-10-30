import { existsSync } from "fs";
import { join, dirname } from "path";

const cwd = process.cwd();
const isTypescript = existsSync(join(cwd, 'tsconfig.json'));

// const userConfig = getUserConfig(cwd, {});

export default {
  typescript: isTypescript,
  repository: false,
  modifyBundlerConfig(config: any) {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      docz: dirname(require.resolve('docz/package.json')),
      'react': require.resolve('react'),
      'react-dom': require.resolve('react-dom'),
      'react-router': require.resolve('react-router'),
      'react-router-dom': require.resolve('react-router-dom'),
      // 'react-intl': require.resolve('react-intl'),
    };

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

    // fallback resolve 路径
    config.resolve.modules.push(join(__dirname, '../../node_modules'));
    config.resolveLoader.modules.push(join(__dirname, '../../node_modules'));

    return config;
  },
  plugins: [],
};

import { join, resolve } from 'path';
import { existsSync } from 'fs';

const cwd = process.cwd();
const isTypescript = existsSync(join(cwd, 'tsconfig.json'));

export default {
  typescript: isTypescript,
  modifyBundlerConfig(config: any) {
    config.devtool = false;
    config.resolve.modules.push(join(__dirname, '../node_modules'));
    config.resolveLoader.modules.push(join(__dirname, '../node_modules'));

    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      react: resolve(cwd, 'node_modules/react'),
      'react-dom': resolve(cwd, 'node_modules/react-dom'),
    };

    return config;
  },
};

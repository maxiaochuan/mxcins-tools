import { join } from 'path';
import { existsSync } from 'fs';

const cwd = process.cwd();
const isTypescript = existsSync(join(cwd, 'tsconfig.json'));

export default {
  typescript: isTypescript,
  modifyBundlerConfig(config: any) {
    config.devtool = false;
    config.resolve.modules.push(join(__dirname, '../node_modules'));
    config.resolveLoader.modules.push(join(__dirname, '../node_modules'));

    return config;
  },
};

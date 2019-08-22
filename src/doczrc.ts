// import { existsSync } from 'fs';
import { join } from 'path';

// const cwd = process.cwd();
// const isTypescript = existsSync(join(cwd, 'tsconfig.json'));

export default {
  typescript: true,
  modifyBundlerConfig(config: any) {
    config.devtool = false;
    config.resolve.modules.push(join(__dirname, '../node_modules'));
    config.resolveLoader.modules.push(join(__dirname, '../node_modules'));

    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      // 解决react hooks 报错问题
      'react': require.resolve('react'),
      'react-dom': require.resolve('react-dom'),
    };

    return config;
  },
};

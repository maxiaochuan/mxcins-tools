import { join } from 'path';
import signale from 'signale';
import rimraf from 'rimraf';
import registerBabel from './registerBabel';
import getConfig from './getConfig';
import { CONFIG_FILES } from './const';
import rollup from './rollup';
import { IEsm } from './types';

interface IOpts {
  watch?: boolean;
  cwd: string;
}

export default async function build(opts: IOpts) {
  const { cwd, watch } = opts;
  signale.info(`build options -> watch: ${watch}`);

  try {
    // 注册babel 读取配置文件
    registerBabel({ cwd, only: CONFIG_FILES });

    // 获取配置
    const config = getConfig({ cwd });

    // 清除 dist
    signale.info(`Clean dist directory`);
    rimraf.sync(join(cwd, 'dist'));

    if (config.esm) {
      const esm = config.esm as IEsm;
      if (esm.type === 'rollup') {
        await rollup({ cwd, watch, type: 'esm', config });
      }
      // await rollup({ type: 'esm' });
    }
  } catch (e) {
    signale.error(e);
  }
}

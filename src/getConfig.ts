import assert from 'assert';
import getUserConfig from './getUserConfig';
import { getExistFile } from './utils';
import { IConfig, IFormattedConfig, IEsm, ModuleFormat } from './types';
import { ENTRY_FILES } from './const';

interface IGetBundleConfigOpts {
  cwd: string;
}

function getEntry({ cwd }: { cwd: string }) {
  const entry = getExistFile({ cwd, files: ENTRY_FILES });
  if (entry) {
    return entry.relative;
  }
}

/**
 * 获取配置文件并且格式化
 * @param opts
 */
export default function(opts: IGetBundleConfigOpts): IFormattedConfig {
  const { cwd } = opts;

  const uc = getUserConfig({ cwd });

  // get entry;
  const entry = uc.entry || getEntry({ cwd }) || '';
  assert.ok(entry, 'entry must be exit!');

  return {
    entry,
    esm: typeof uc.esm === 'string' ? { type: uc.esm } : uc.esm,
    cjs: typeof uc.cjs === 'string' ? { type: uc.cjs } : uc.cjs,
    umd: typeof uc.umd === 'string' ? { type: uc.umd } : uc.umd,
  };
}

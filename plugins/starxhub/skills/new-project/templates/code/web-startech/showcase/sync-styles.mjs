/* ============================================================
 * 把 src/styles 的三层样式同步到 showcase 同目录。
 * 原因：静态预览服务不允许 HTML 跨上级目录引用资源（403）。
 * 单一事实来源仍是 src/styles，改完令牌后执行：
 *   npm run sync:showcase
 * ============================================================ */
import { copyFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const styles = join(here, '..', 'src', 'styles')

for (const file of ['tokens.css', 'common.css', 'components.css']) {
  copyFileSync(join(styles, file), join(here, file))
  console.log('synced:', file)
}

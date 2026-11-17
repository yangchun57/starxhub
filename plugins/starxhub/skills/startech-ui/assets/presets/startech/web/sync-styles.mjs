/* ============================================================
 * 把 src/styles 的三层样式同步到 showcase 同目录。
 * 原因：静态预览服务不允许 HTML 跨上级目录引用资源（403）。
 * 单一事实来源仍是 src/styles，改完令牌后执行：
 *   npm run sync:showcase
 * ============================================================ */
import { copyFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const styles = join(here, '..', '..', 'src', 'styles')
// 两个静态预览目录共用同一份 CSS 副本，避免跨上级目录取资源被预览服务拒绝（403）
const targets = [
  { dir: here, label: 'showcases/startech-web/' },
  { dir: join(here, '..', 'startech-mobile'), label: 'showcases/startech-mobile/' }
]
const files = ['tokens.css', 'common.css', 'components.css', 'mobile.css']

for (const target of targets) {
  mkdirSync(target.dir, { recursive: true })
  for (const file of files) {
    copyFileSync(join(styles, file), join(target.dir, file))
    console.log('synced:', target.label + file)
  }
}

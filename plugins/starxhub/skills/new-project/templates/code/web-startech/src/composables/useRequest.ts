import { ref, shallowRef } from 'vue'
import type { ApiResult } from '@/types'

/**
 * 统一请求封装：mock 与真实接口共用这一个入口，loader 只需返回 ApiResult<T>。
 * 接后端时把 loader 换成 () => http.get<T>('/orders') —— http 适配层已把
 * dotnet / python / java-spring 三种响应统一成 ApiResult<T>，视图零改动。
 * 禁止改本函数签名（规范 §12.2），禁止在此处塞 axios 或手写 fetch。
 */
export function useRequest<T>(loader: () => Promise<ApiResult<T>>, initial?: T) {
  // shallowRef 不做深层解包，泛型 T 能原样保留（DTO 里常带嵌套对象）
  const data = shallowRef<T | undefined>(initial)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function run() {
    loading.value = true
    error.value = null
    try {
      const res = await loader()
      if (res.code !== 0) throw new Error(res.message || '请求失败')
      data.value = res.data
    } catch (e) {
      error.value = e instanceof Error ? e.message : '未知错误'
    } finally {
      loading.value = false
    }
  }

  void run()
  return { data, loading, error, refresh: run }
}

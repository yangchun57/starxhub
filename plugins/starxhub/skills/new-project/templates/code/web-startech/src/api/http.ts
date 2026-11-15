/* ============================================================
 * 统一 HTTP 适配层（零依赖，原生 fetch）
 *
 * 前端既定契约是 ApiResult<T>（code===0 成功），后端却有三种形态：
 *   dotnet      : { code, data, message }                —— 已是信封
 *   java-spring : { code, data, message | msg }         —— 已是信封
 *   python      : RESTful 裸 DTO / Page{items,total,page,size}，
 *                 错误为 HTTP 4xx/5xx + { detail }
 *
 * 本层把三者统一收敛成 ApiResult<T>，并补齐分页字段差异：
 *   size → pageSize、records → items。
 * 视图与 useRequest 不感知后端形态；切换后端只改 envelope 配置。
 * 规范 §12.3 要求的「新增 src/api/http.ts」即本文件。
 * ============================================================ */
import type { ApiResult } from '@/types'

export type BackendEnvelope = 'dotnet' | 'python' | 'java-spring' | 'auto'

export interface HttpOptions {
  baseURL?: string
  envelope?: BackendEnvelope
  getToken?: () => string | null
  onUnauthorized?: () => void
}

type JsonRecord = Record<string, unknown>

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** 判定是否为「统一信封」形态（dotnet / java-spring） */
function isEnvelope(value: unknown): value is JsonRecord {
  return isRecord(value)
    && typeof value.code === 'number'
    && ('data' in value || 'message' in value || 'msg' in value)
}

/** 分页字段归一化：python 的 size / MyBatis-Plus 的 records → 前端 PageResult<T> */
function normalizePage<T>(data: T): T {
  if (!isRecord(data)) return data
  const out: JsonRecord = { ...data }
  if ('records' in out && !('items' in out)) out.items = out.records
  if ('items' in out && !('pageSize' in out)) {
    out.pageSize = out.size ?? out.limit ?? 0
  }
  return out as T
}

function extractError(payload: unknown, status: number): string {
  if (isRecord(payload)) {
    const detail = payload.detail ?? payload.message ?? payload.msg ?? payload.error
    if (typeof detail === 'string') return detail
    if (isRecord(detail) && typeof detail.message === 'string') return detail.message
  }
  return `请求失败（HTTP ${status}）`
}

/** 把任意后端响应归一化成 ApiResult<T>；不抛异常，交给 useRequest 统一处理 */
export function normalize<T>(status: number, payload: unknown, envelope: BackendEnvelope): ApiResult<T> {
  const useEnvelope = envelope !== 'python' && (envelope !== 'auto' || isEnvelope(payload))

  if (useEnvelope && isEnvelope(payload)) {
    const message = typeof payload.message === 'string'
      ? payload.message
      : typeof payload.msg === 'string' ? payload.msg : ''
    return {
      code: payload.code,
      data: normalizePage(payload.data as T),
      message,
    }
  }

  if (status >= 200 && status < 300) {
    // python RESTful：2xx 裸 DTO 直接包成成功信封
    return { code: 0, data: normalizePage(payload as T), message: 'ok' }
  }

  return {
    code: status || -1,
    data: undefined as unknown as T,
    message: extractError(payload, status),
  }
}

async function request<T>(
  method: string,
  path: string,
  body: unknown,
  options: HttpOptions,
): Promise<ApiResult<T>> {
  const { baseURL = '', envelope = 'auto', getToken, onUnauthorized } = options
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  const token = getToken?.()
  if (token) headers.Authorization = `Bearer ${token}`

  let status = 0
  let payload: unknown = null
  try {
    const res = await fetch(`${baseURL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    status = res.status
    const text = await res.text()
    if (text) {
      try { payload = JSON.parse(text) as unknown } catch { payload = text }
    }
  } catch (e) {
    return {
      code: -1,
      data: undefined as unknown as T,
      message: e instanceof Error ? `网络异常：${e.message}` : '网络异常',
    }
  }

  if (status === 401) onUnauthorized?.()
  return normalize<T>(status, payload, envelope)
}

export function createHttp(options: HttpOptions = {}) {
  return {
    request: <T>(method: string, path: string, body?: unknown) =>
      request<T>(method, path, body, options),
    get: <T>(path: string) => request<T>('GET', path, undefined, options),
    post: <T>(path: string, body?: unknown) => request<T>('POST', path, body, options),
    put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body, options),
    patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body, options),
    del: <T>(path: string) => request<T>('DELETE', path, undefined, options),
  }
}

/**
 * 默认实例：脚手架按 --backend 注入 envelope，baseURL 走 vite.config.ts 的 /api 代理。
 * 用法：useRequest(() => http.get<Order[]>('/orders'))，或
 *       const api = createHttp({ envelope: 'python', baseURL: '/api' }) 自定义。
 */
export const http = createHttp({
  baseURL: '/api',
  envelope: '{{BACKEND_ENVELOPE}}' as BackendEnvelope,
  getToken: () => (typeof localStorage === 'undefined' ? null : localStorage.getItem('hx-token')),
})

---
paths:
  - "src/stores/**/*.ts"
  - "src/api/**/*.ts"
---

# 前端状态与 API 层规范（uni-app + Vue 3）

## 状态管理（Pinia）

### 铁律
- 使用 `defineStore('name', () => { ... })` setup 函数风格，禁止 Options 风格
- Token/用户信息存储于 `stores/user.ts`，通过 `uni.setStorageSync` 持久化
- 禁止在 `utils/` 或 `api/` 中直接读写 store（循环依赖）
- Store 中禁止直接操作 DOM 或调用 `uni.navigateTo`（状态层不应有副作用导航）

**违反后果**：循环依赖导致打包失败，状态层与导航耦合导致无法在脚本/测试中复用。

### ✅ 正确示例
```typescript
// src/stores/user.ts
import { ref, computed } from "vue";
import { defineStore } from "pinia";
import { login as loginApi, getUserInfo } from "@/api/auth";
import type { LoginRequest, UserInfo } from "@/api/auth";

export const useUserStore = defineStore("user", () => {
  // 状态
  const token = ref(uni.getStorageSync("access_token") || "");
  const userInfo = ref<UserInfo | null>(null);

  // 计算属性
  const isLoggedIn = computed(() => !!token.value);
  const tenantId = computed(() => userInfo.value?.tenantId);

  // 操作
  async function login(data: LoginRequest) {
    const res = await loginApi(data);
    token.value = res.token;
    uni.setStorageSync("access_token", res.token);
  }

  async function fetchUserInfo() {
    const res = await getUserInfo();
    userInfo.value = res;
    uni.setStorageSync("user_info", JSON.stringify(res));
    uni.setStorageSync("tenant_id", res.tenantId);
  }

  function logout() {
    token.value = "";
    userInfo.value = null;
    uni.removeStorageSync("access_token");
    uni.removeStorageSync("user_info");
    uni.removeStorageSync("tenant_id");
  }

  return { token, userInfo, isLoggedIn, tenantId, login, fetchUserInfo, logout };
});
```

### ❌ 错误示例
```typescript
// ❌ Options 风格（禁止）
export const useUserStore = defineStore("user", {
  state: () => ({ token: "" }),
  actions: {
    async login() { ... }
  }
});

// ❌ Store 中调用导航（副作用）
export const useUserStore = defineStore("user", () => {
  function logout() {
    token.value = "";
    uni.navigateTo({ url: "/pages/login/index" });  // ❌ 不应在 store 中导航
  }
  return { logout };
});

// ❌ utils 中读写 store（循环依赖）
// utils/format.ts
import { useUserStore } from "@/stores/user";
export function formatName() {
  const userStore = useUserStore();  // ❌
  return userStore.userInfo?.name;
}
```

## API 层

### 统一请求封装

```typescript
// src/api/request.ts
const BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface RequestOptions {
  url: string;
  method?: "GET" | "POST" | "PUT" | "DELETE";
  data?: any;
  header?: Record<string, string>;
}

interface ApiResponse<T = any> {
  code: number;
  data: T;
  message: string;
}

export function request<T = any>(options: RequestOptions): Promise<T> {
  return new Promise((resolve, reject) => {
    const token = uni.getStorageSync("access_token");
    const header: Record<string, string> = {
      "Content-Type": "application/json",
      ...options.header,
    };
    if (token) {
      header["Authorization"] = `Bearer ${token}`;
    }

    uni.request({
      url: BASE_URL + options.url,
      method: options.method || "GET",
      data: options.data,
      header,
      success: (res) => {
        const data = res.data as ApiResponse<T>;
        if (data.code === 401) {
          // Token 过期，跳转登录
          uni.removeStorageSync("access_token");
          uni.navigateTo({ url: "/pages/login/index" });
          reject(new Error("未登录"));
          return;
        }
        if (data.code !== 0) {
          uni.showToast({ title: data.message || "请求失败", icon: "none" });
          reject(new Error(data.message));
          return;
        }
        resolve(data.data);
      },
      fail: (err) => {
        uni.showToast({ title: "网络错误", icon: "none" });
        reject(err);
      },
    });
  });
}
```

### API 模块规范

> **ID 类型铁律**：主键为 19 位雪花 ID，超出 JS 安全整数范围（`2^53-1`）。后端已把 ID 序列化为字符串，**前端所有实体 ID 及 `*Id` 字段一律用 `string`**，禁止用 `number`、`Number()` / `parseInt()` 转换 ID（会丢精度）。`total` / `page` 等普通数值字段不受影响。

✅ 正确
```typescript
// src/api/user.ts
// 类型定义与 API 函数放在同一文件
import { request } from "./request";

export interface UserDto {
  id: string;        // 雪花 ID，后端以字符串下发
  username: string;
  email: string;
  status: number;
  createdAt: string;
}

export interface QueryUserRequest {
  keyword?: string;
  status?: number;
  page: number;
  size: number;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
}

export interface PageResult<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

export function getUserList(params: QueryUserRequest) {
  return request<PageResult<UserDto>>({
    url: "/api/v1/users",
    method: "GET",
    data: params,
  });
}

export function getUserById(id: string) {
  return request<UserDto>({
    url: `/api/v1/users/${id}`,
    method: "GET",
  });
}

export function createUser(data: CreateUserRequest) {
  return request<string>({  // 返回雪花 ID，字符串
    url: "/api/v1/users",
    method: "POST",
    data,
  });
}

export function deleteUser(id: string) {
  return request<void>({
    url: `/api/v1/users/${id}`,
    method: "DELETE",
  });
}
```

❌ 错误
```typescript
// ❌ 类型单独放 types/ 目录（禁止）
// src/types/user.ts
export interface UserDto { ... }

// src/api/user.ts
import type { UserDto } from "@/types/user";  // ❌

// ❌ 页面内直接写 uni.request
// src/pages/user/list.vue
<script setup lang="ts">
async function loadData() {
  const res = await uni.request({  // ❌ 应该走 api 层
    url: "/api/v1/users",
    header: { Authorization: `Bearer ${token}` }
  });
}
</script>
```

## 持久化规范

### 存储 Key 规范

| Key | 类型 | 说明 |
|-----|------|------|
| `access_token` | string | JWT Token |
| `user_info` | string (JSON) | 用户信息 |
| `tenant_id` | string | 租户 ID（雪花 ID，19 位，勿用 number） |

### ✅ 正确
```typescript
// 存储
uni.setStorageSync("access_token", token);
uni.setStorageSync("user_info", JSON.stringify(userInfo));
uni.setStorageSync("tenant_id", userInfo.tenantId);

// 读取
const token = uni.getStorageSync("access_token") as string;
const userInfo = JSON.parse(uni.getStorageSync("user_info") || "null") as UserInfo;

// 清除（登出时）
function clearAll() {
  uni.removeStorageSync("access_token");
  uni.removeStorageSync("user_info");
  uni.removeStorageSync("tenant_id");
}
```

❌ 错误
```typescript
// ❌ 使用 localStorage（小程序不支持）
localStorage.setItem("access_token", token);

// ❌ 直接存储对象（会被序列化为 [object Object]）
uni.setStorageSync("user_info", userInfo);  // ❌ 应该 JSON.stringify

// ❌ 登出时只清除 token，不清除其他数据
function logout() {
  uni.removeStorageSync("access_token");
  // ❌ user_info 和 tenant_id 没有清除
}
```

## 命名约定

| 类型 | 规则 | 示例 |
|------|------|------|
| Store 文件 | camelCase | `user.ts`, `order.ts` |
| API 文件 | camelCase | `auth.ts`, `familyBase.ts` |
| Store 函数 | camelCase 动词开头 | `login`, `fetchUserInfo`, `logout` |
| API 函数 | camelCase 动词开头 | `getUserList`, `createUser` |
| 类型接口 | PascalCase | `UserDto`, `CreateUserRequest` |

## 边界情况

### 例外场景
- 简单页面可省略 Store，直接使用 API 层
- 临时状态（如表单草稿）可用页面级 ref，不放入 Store

### 优先级裁决
当 Store 持久化与存储容量冲突时，**优先保证 Token 存储**，其他数据可降级为内存状态。

## 详细规范
如需更多细节，参考：
- @.claude/standards/topics/uni-app开发规范_v1.0/05-第-4-章-状态管理.md
- @.claude/standards/topics/uni-app开发规范_v1.0/04-第-3-章-网络层与请求封装.md

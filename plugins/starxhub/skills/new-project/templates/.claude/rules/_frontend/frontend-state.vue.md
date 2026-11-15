---
paths:
  - "src/stores/**/*.ts"
  - "src/api/**/*.ts"
---

# 前端状态与 API 层规范（Vue 3 + Element Plus）

## 状态管理（Pinia）

### 铁律
- 使用 `defineStore('name', () => { ... })` setup 函数风格
- Token/用户信息存储于 `stores/user.ts`
- 禁止在 `utils/` 或 `api/` 中直接读写 store（循环依赖）
- Store 异步操作返回 Promise，页面通过 `await` 消费

**违反后果**：循环依赖导致打包失败，状态层与 UI 耦合导致无法测试。

### ✅ 正确示例
```typescript
// src/stores/user.ts
import { ref, computed } from "vue";
import { defineStore } from "pinia";
import { login as loginApi, getUserInfo } from "@/api/auth";
import type { LoginRequest, UserInfo } from "@/api/auth";

export const useUserStore = defineStore("user", () => {
  // 状态
  const token = ref(localStorage.getItem("access_token") || "");
  const userInfo = ref<UserInfo | null>(null);

  // 计算属性
  const isLoggedIn = computed(() => !!token.value);
  const roles = computed(() => userInfo.value?.roles || []);

  // 操作
  async function login(data: LoginRequest) {
    const res = await loginApi(data);
    token.value = res.token;
    localStorage.setItem("access_token", res.token);
  }

  async function fetchUserInfo() {
    const res = await getUserInfo();
    userInfo.value = res;
  }

  function logout() {
    token.value = "";
    userInfo.value = null;
    localStorage.removeItem("access_token");
  }

  return { token, userInfo, isLoggedIn, roles, login, fetchUserInfo, logout };
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

// ❌ Store 中操作 DOM
export const useUserStore = defineStore("user", () => {
  function showNotification() {
    document.querySelector(".notification")!.classList.add("show");  // ❌
  }
  return { showNotification };
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
import axios from "axios";
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { ElMessage } from "element-plus";

const service: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 30000,
});

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器
service.interceptors.response.use(
  (response: AxiosResponse) => {
    const { code, data, message } = response.data;
    if (code === 0) {
      return data;
    }
    if (code === 401) {
      localStorage.removeItem("access_token");
      window.location.href = "/login";
      return Promise.reject(new Error("未登录"));
    }
    ElMessage.error(message || "请求失败");
    return Promise.reject(new Error(message));
  },
  (error) => {
    ElMessage.error(error.message || "网络错误");
    return Promise.reject(error);
  }
);

export default service;

// 封装 request 函数
import request from "./request";

export function get<T>(url: string, params?: any): Promise<T> {
  return request.get(url, { params });
}

export function post<T>(url: string, data?: any): Promise<T> {
  return request.post(url, data);
}

export function put<T>(url: string, data?: any): Promise<T> {
  return request.put(url, data);
}

export function del<T>(url: string): Promise<T> {
  return request.delete(url);
}
```

### API 模块规范

✅ 正确
```typescript
// src/api/user.ts
// 类型定义与 API 函数放在同一文件
import { get, post, put, del } from "./request";

export interface UserDto {
  id: number;
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
  return get<PageResult<UserDto>>("/api/v1/users", params);
}

export function getUserById(id: number) {
  return get<UserDto>(`/api/v1/users/${id}`);
}

export function createUser(data: CreateUserRequest) {
  return post<number>("/api/v1/users", data);
}

export function updateUser(id: number, data: Partial<CreateUserRequest>) {
  return put<void>(`/api/v1/users/${id}`, data);
}

export function deleteUser(id: number) {
  return del<void>(`/api/v1/users/${id}`);
}
```

❌ 错误
```typescript
// ❌ 类型单独放 types/ 目录（禁止）
// src/types/user.ts
export interface UserDto { ... }

// src/api/user.ts
import type { UserDto } from "@/types/user";  // ❌

// ❌ 直接使用 axios，没有统一封装
// src/api/user.ts
import axios from "axios";
export function getUserList() {
  return axios.get("/api/v1/users");  // ❌ 应该用封装好的 get/post
}
```

## 类型生成

### 规范
- 业务实体 TS 类型优先从后端 Swagger 自动生成: `npm run gen:api`
- 生成物为唯一事实源，手写仅限 Form/Query 等前端形态

### ✅ 正确流程
```bash
# 1. 后端更新 API
# 2. 运行代码生成
npm run gen:api

# 3. 生成的类型在 src/api/generated/
# src/api/generated/user.ts
export interface UserDto {
  id: number;
  username: string;
  // ... 从 Swagger 生成
}

# 4. 手写前端特有类型
// src/api/user.ts
import type { UserDto } from "./generated/user";

export interface UserForm extends Omit<UserDto, "id" | "createdAt"> {
  password: string;  // 前端表单特有
}

export interface UserQuery {
  keyword?: string;
  status?: number;
  page: number;
  size: number;
}
```

❌ 错误
```typescript
// ❌ 手动维护所有类型，与后端不同步
export interface UserDto {
  id: number;
  username: string;
  email: string;
  // ... 手动维护，容易遗漏
}
```

## 命名约定

| 类型 | 规则 | 示例 |
|------|------|------|
| Store 文件 | camelCase | `user.ts`, `order.ts` |
| API 文件 | kebab-case | `family-base.ts`, `family-meter.ts` |
| 生成类型 | PascalCase | `UserDto`, `OrderDto` |
| 手写类型 | PascalCase | `UserForm`, `UserQuery` |

## 错误处理

### 全局错误处理

```typescript
// src/api/request.ts 响应拦截器
service.interceptors.response.use(
  (response) => {
    const { code, data, message } = response.data;
    
    // 业务错误
    if (code !== 0) {
      // 401: 未登录
      if (code === 401) {
        localStorage.removeItem("access_token");
        window.location.href = "/login";
        return Promise.reject(new Error("未登录"));
      }
      
      // 403: 无权限
      if (code === 403) {
        ElMessage.error("没有权限访问");
        return Promise.reject(new Error("无权限"));
      }
      
      // 其他业务错误
      ElMessage.error(message || "请求失败");
      return Promise.reject(new Error(message));
    }
    
    return data;
  },
  (error) => {
    // HTTP 错误
    if (error.response) {
      switch (error.response.status) {
        case 400:
          ElMessage.error("请求参数错误");
          break;
        case 401:
          ElMessage.error("未登录");
          break;
        case 403:
          ElMessage.error("没有权限");
          break;
        case 404:
          ElMessage.error("资源不存在");
          break;
        case 500:
          ElMessage.error("服务器错误");
          break;
        default:
          ElMessage.error(error.message || "网络错误");
      }
    } else {
      ElMessage.error("网络错误");
    }
    return Promise.reject(error);
  }
);
```

### 页面级错误处理

✅ 正确
```typescript
// 在页面中捕获特定错误
async function handleDelete(id: number) {
  try {
    await deleteUser(id);
    ElMessage.success("删除成功");
    loadData();
  } catch (error) {
    // 全局拦截器已处理通用错误，这里只处理特殊逻辑
    if (error.message === "该用户有关联订单，无法删除") {
      ElMessageBox.confirm(error.message, "提示", {
        confirmButtonText: "查看订单",
        cancelButtonText: "取消",
      }).then(() => {
        // 跳转订单列表
      });
    }
  }
}
```

## 边界情况

### 例外场景
- 简单页面可省略 Store，直接使用 API 层
- 临时状态（如表单草稿）可用页面级 ref，不放入 Store

### 优先级裁决
当类型自动生成与手写类型冲突时，**以自动生成为准**，手写类型仅限前端特有形态。

## 详细规范
如需更多细节，参考：
- @.claude/standards/topics/前端开发规范/07-七、Mock-数据规范.md
- @.claude/standards/topics/前端开发规范/08-八、错误处理规范.md

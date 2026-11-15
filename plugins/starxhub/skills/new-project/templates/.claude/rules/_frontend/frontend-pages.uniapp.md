---
paths:
  - "src/pages/**/*.vue"
---

# 前端页面规范（uni-app + Vue 3）

## 技术栈
- uni-app + Vue 3 Composition API + TypeScript + Pinia
- 目标平台: H5 + 微信小程序

## 铁律

1. **页面必须使用 `<script setup lang="ts">`**，禁止 Options API
2. **所有页面必须在 `pages.json` 中注册**，禁止硬编码路径
3. **TabBar 页用 `uni.switchTab()`，非 TabBar 页用 `uni.navigateTo()`**
4. **禁止页面内直接写 `uni.request`**，必须走 `api/` 层统一封装

**违反后果**：跨平台兼容性问题，代码无法维护，请求逻辑散落。

## 页面结构

### 标准模板

✅ 正确
```vue
<template>
  <view class="container">
    <view class="header">
      <text>{{ title }}</text>
    </view>
    
    <view class="content">
      <view v-for="item in list" :key="item.id" class="item">
        <text>{{ item.name }}</text>
      </view>
    </view>
    
    <uni-load-more :status="loadStatus" />
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { getUserList } from "@/api/user";
import type { UserDto } from "@/api/user";

const title = "用户列表";
const list = ref<UserDto[]>([]);
const loadStatus = ref<"more" | "loading" | "noMore">("more");
const page = ref(1);
const size = ref(10);

onMounted(async () => {
  await loadData();
});

async function loadData() {
  loadStatus.value = "loading";
  try {
    const res = await getUserList({ page: page.value, size: size.value });
    list.value = res.items;
    loadStatus.value = res.items.length < size.value ? "noMore" : "more";
  } catch (error) {
    uni.showToast({ title: "加载失败", icon: "none" });
    loadStatus.value = "more";
  }
}

function navigateToDetail(id: number) {
  uni.navigateTo({ url: `/pages/user/detail?id=${id}` });
}
</script>

<style lang="scss" scoped>
.container {
  padding: 20rpx;
}

.header {
  font-size: 32rpx;
  font-weight: bold;
  margin-bottom: 20rpx;
}

.item {
  padding: 20rpx;
  border-bottom: 1rpx solid #eee;
}
</style>
```

❌ 错误
```vue
<!-- ❌ 使用 Options API -->
<script>
export default {
  data() {
    return {
      list: []
    };
  },
  async onMounted() {
    // ❌ 直接写 uni.request
    const res = await uni.request({ url: "/api/users" });
    this.list = res.data;
  }
};
</script>

<!-- ❌ 没有使用 scoped -->
<style>
.container { ... }  <!-- 全局污染 -->
</style>
```

## 路由配置

### 规范
- 集中配置于 `pages.json`
- 新增页面三步: 创建 `.vue` → 注册 `pages.json` → 添加导航入口
- 导航栏标题: `"navigationBarTitleText"` 在 pages.json 中配置

### ✅ 正确示例
```json
// pages.json
{
  "pages": [
    {
      "path": "pages/index/index",
      "style": {
        "navigationBarTitleText": "首页"
      }
    },
    {
      "path": "pages/user/list",
      "style": {
        "navigationBarTitleText": "用户列表"
      }
    },
    {
      "path": "pages/user/detail",
      "style": {
        "navigationBarTitleText": "用户详情"
      }
    }
  ],
  "tabBar": {
    "list": [
      {
        "pagePath": "pages/index/index",
        "text": "首页"
      },
      {
        "pagePath": "pages/user/list",
        "text": "用户"
      }
    ]
  }
}
```

### 导航规范

✅ 正确
```typescript
// TabBar 页面跳转
uni.switchTab({ url: "/pages/index/index" });

// 非 TabBar 页面跳转
uni.navigateTo({ url: "/pages/user/detail?id=123" });

// 返回上一页
uni.navigateBack();

// 重定向（替换当前页面）
uni.redirectTo({ url: "/pages/login/index" });
```

❌ 错误
```typescript
// ❌ TabBar 页面用 navigateTo（会报错）
uni.navigateTo({ url: "/pages/index/index" });

// ❌ 硬编码路径
const url = "/pages/user/detail?id=" + id;  // ❌ 应该用模板字符串
uni.navigateTo({ url });

// ❌ 路径不在 pages.json 中注册
uni.navigateTo({ url: "/pages/xxx/yyy" });  // 页面未注册
```

## 目录结构

```
src/
├── api/          # 请求封装 + 接口定义（类型与函数同文件）
├── pages/        # 页面（按业务域分目录）
│   ├── index/
│   │   └── index.vue
│   ├── user/
│   │   ├── list.vue
│   │   └── detail.vue
│   └── order/
│       ├── list.vue
│       └── detail.vue
├── stores/       # Pinia 状态（setup 函数风格）
├── utils/        # 纯工具函数（禁止引入 store）
├── components/   # 跨页共享组件
├── static/       # 静态资源（图片、图标）
├── pages.json    # 路由配置
└── manifest.json # 应用配置
```

## 依赖方向

```
pages → stores → api → utils
```

**严格单向，禁止反向。**

✅ 正确
```typescript
// pages/user/list.vue
import { useUserStore } from "@/stores/user";
import { getUserList } from "@/api/user";
import { formatDate } from "@/utils/date";

const userStore = useUserStore();
const list = await getUserList();
const formattedDate = formatDate(new Date());
```

❌ 错误
```typescript
// ❌ utils 引入 store（反向依赖）
// utils/format.ts
import { useUserStore } from "@/stores/user";

export function formatUserName(id: number) {
  const userStore = useUserStore();
  return userStore.getUser(id).name;
}

// ❌ api 引入 store（反向依赖）
// api/user.ts
import { useUserStore } from "@/stores/user";

export async function getUserList() {
  const userStore = useUserStore();
  ...
}
```

## 组件通信

### 规范
- 父子组件：`props` + `emit`
- 跨层级：`provide` + `inject`
- 全局状态：Pinia store

✅ 正确
```vue
<!-- 父组件 -->
<template>
  <UserCard :user="user" @click="handleClick" />
</template>

<script setup lang="ts">
import UserCard from "@/components/UserCard.vue";
import type { UserDto } from "@/api/user";

const user = ref<UserDto>({ ... });

function handleClick(id: number) {
  uni.navigateTo({ url: `/pages/user/detail?id=${id}` });
}
</script>

<!-- 子组件 -->
<template>
  <view class="card" @click="emit('click', user.id)">
    <text>{{ user.name }}</text>
  </view>
</template>

<script setup lang="ts">
import type { UserDto } from "@/api/user";

const props = defineProps<{
  user: UserDto;
}>();

const emit = defineEmits<{
  click: [id: number];
}>();
</script>
```

## 条件编译

### 规范
使用 `#ifdef` / `#ifndef` 进行平台条件编译。

✅ 正确
```vue
<template>
  <view>
    <!-- #ifdef H5 -->
    <web-view :src="url" />
    <!-- #endif -->
    
    <!-- #ifdef MP-WEIXIN -->
    <button open-type="contact">联系客服</button>
    <!-- #endif -->
  </view>
</template>

<script setup lang="ts">
// #ifdef H5
import { ref } from "vue";
const url = ref("https://example.com");
// #endif

// #ifndef MP-WEIXIN
console.log("非微信小程序环境");
// #endif
</script>
```

## 边界情况

### 例外场景
- 简单页面可省略 Pinia store，直接使用 API 层
- 静态页面可省略 API 调用

### 优先级裁决
当代码复用与平台差异冲突时，**优先保证跨平台兼容**，使用条件编译处理差异。

## 详细规范
如需更多细节，参考：
- @.claude/standards/topics/uni-app开发规范_v1.0/02-第-1-章-工程结构与分层.md
- @.claude/standards/topics/uni-app开发规范_v1.0/03-第-2-章-页面与路由.md

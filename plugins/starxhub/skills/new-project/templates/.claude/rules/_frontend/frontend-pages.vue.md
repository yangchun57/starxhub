---
paths:
  - "src/views/**/*.vue"
  - "src/pages/**/*.vue"
---

# 前端页面规范（Vue 3 + Element Plus）

## 技术栈
- Vue 3 Composition API + `<script setup lang="ts">`
- Element Plus + Pinia + Vue Router + Axios + Vite + TypeScript

## 铁律

1. **页面组件必须使用 `<script setup lang="ts">`**，禁止 Options API
2. **模板顺序**: `<template>` → `<script setup>` → `<style scoped>`
3. **所有页面必须懒加载**: `component: () => import('@/views/...')`
4. **样式必须使用 `scoped`**，禁止全局污染

**违反后果**：首屏加载慢，样式冲突，代码风格混乱。

## 页面结构

### 标准模板

✅ 正确
```vue
<template>
  <div class="user-list-page">
    <!-- 搜索表单 -->
    <el-form :model="queryForm" inline class="search-form">
      <el-form-item label="用户名">
        <el-input v-model="queryForm.keyword" placeholder="请输入用户名" />
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="queryForm.status" placeholder="请选择">
          <el-option label="启用" :value="1" />
          <el-option label="禁用" :value="0" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 操作按钮 -->
    <div class="action-bar">
      <el-button type="primary" @click="handleCreate">新增</el-button>
    </div>

    <!-- 数据表格 -->
    <el-table :data="tableData" v-loading="loading" border>
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="username" label="用户名" />
      <el-table-column prop="email" label="邮箱" />
      <el-table-column prop="status" label="状态">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'danger'">
            {{ row.status === 1 ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200">
        <template #default="{ row }">
          <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
          <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <el-pagination
      v-model:current-page="pagination.page"
      v-model:page-size="pagination.size"
      :total="pagination.total"
      @change="loadData"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { getUserList, deleteUser } from "@/api/user";
import type { UserDto, QueryUserRequest } from "@/api/user";

// 查询表单
const queryForm = reactive<QueryUserRequest>({
  keyword: "",
  status: undefined,
});

// 表格数据
const tableData = ref<UserDto[]>([]);
const loading = ref(false);

// 分页
const pagination = reactive({
  page: 1,
  size: 10,
  total: 0,
});

onMounted(() => {
  loadData();
});

async function loadData() {
  loading.value = true;
  try {
    const res = await getUserList({
      ...queryForm,
      page: pagination.page,
      size: pagination.size,
    });
    tableData.value = res.items;
    pagination.total = res.total;
  } catch (error) {
    ElMessage.error("加载失败");
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  pagination.page = 1;
  loadData();
}

function handleReset() {
  queryForm.keyword = "";
  queryForm.status = undefined;
  handleSearch();
}

function handleCreate() {
  // 打开新增对话框
}

function handleEdit(row: UserDto) {
  // 打开编辑对话框
}

async function handleDelete(row: UserDto) {
  await ElMessageBox.confirm("确认删除该用户？", "提示", {
    type: "warning",
  });
  try {
    await deleteUser(row.id);
    ElMessage.success("删除成功");
    loadData();
  } catch (error) {
    ElMessage.error("删除失败");
  }
}
</script>

<style lang="scss" scoped>
.user-list-page {
  padding: 20px;
}

.search-form {
  margin-bottom: 20px;
}

.action-bar {
  margin-bottom: 20px;
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
      tableData: []
    };
  }
};
</script>

<!-- ❌ 顺序错误：script 在 style 后面 -->
<style scoped>
...
</style>
<script setup lang="ts">
...
</script>

<!-- ❌ 没有 scoped -->
<style>
.user-list-page { ... }  <!-- 全局污染 -->
</style>
```

## 路由配置

### 规范
- 所有页面必须懒加载
- 路由名使用 PascalCase
- meta 字段包含 title、icon、roles 等

✅ 正确
```typescript
// router/modules/user.ts
import type { RouteRecordRaw } from "vue-router";

const userRoutes: RouteRecordRaw[] = [
  {
    path: "/user",
    name: "User",
    component: () => import("@/layouts/DefaultLayout.vue"),
    meta: { title: "用户管理", icon: "user" },
    children: [
      {
        path: "list",
        name: "UserList",
        component: () => import("@/views/user/UserList.vue"),
        meta: { title: "用户列表", requiresAuth: true },
      },
      {
        path: "detail/:id",
        name: "UserDetail",
        component: () => import("@/views/user/UserDetail.vue"),
        meta: { title: "用户详情", hidden: true },
      },
    ],
  },
];

export default userRoutes;
```

❌ 错误
```typescript
// ❌ 没有懒加载
import UserList from "@/views/user/UserList.vue";

const routes = [
  {
    path: "/user/list",
    component: UserList,  // ❌ 应该用 () => import(...)
  },
];

// ❌ 路由名不规范
const routes = [
  {
    path: "/user/list",
    name: "user-list",  // ❌ 应该是 "UserList"
  },
];
```

## 目录结构

```
src/
├── views/              # 页面（按业务模块划分）
│   ├── user/
│   │   ├── UserList.vue
│   │   ├── UserDetail.vue
│   │   └── components/
│   │       ├── UserForm.vue
│   │       └── UserSearch.vue
│   ├── order/
│   │   ├── OrderList.vue
│   │   └── OrderDetail.vue
│   └── dashboard/
│       └── Dashboard.vue
├── layouts/            # 布局
│   ├── DefaultLayout.vue
│   └── BlankLayout.vue
├── components/         # 公共组件（PascalCase）
│   ├── SearchForm.vue
│   ├── DataTable.vue
│   └── Pagination.vue
├── router/
│   ├── index.ts
│   └── modules/
│       ├── user.ts
│       └── order.ts
└── App.vue
```

## 命名约定

| 类型 | 规则 | 示例 |
|------|------|------|
| 页面文件 | PascalCase | `UserList.vue`, `OrderDetail.vue` |
| 路由名 | PascalCase | `UserList`, `OrderDetail` |
| 组件文件 | PascalCase | `SearchForm.vue`, `DataTable.vue` |
| meta.title | 中文 | `用户列表`, `订单详情` |

## 样式规范

### 规范
- 全局重置: `body { margin: 0; }` 必须在全局样式中
- 类名: kebab-case（`.card-header`, `.search-form`）
- 选择器宽度统一: 160px / 日期 150px / 输入框 180px

✅ 正确
```scss
// 全局样式（assets/styles/global.scss）
body {
  margin: 0;
  font-family: "Helvetica Neue", Helvetica, "PingFang SC", "Hiragino Sans GB",
    "Microsoft YaHei", Arial, sans-serif;
}

// 页面样式（scoped）
.user-list-page {
  padding: 20px;

  .search-form {
    margin-bottom: 20px;

    .el-input {
      width: 180px;
    }

    .el-select {
      width: 160px;
    }
  }
}
```

❌ 错误
```scss
// ❌ 类名使用 camelCase
.userListPage { ... }  // ❌ 应该是 .user-list-page

// ❌ 没有 scoped
<style>
.user-list-page { ... }  // 全局污染
</style>

// ❌ 选择器宽度不统一
.el-input {
  width: 200px;  // ❌ 应该统一为 180px
}
```

## Element Plus 组件使用

### 表格规范

✅ 正确
```vue
<el-table :data="tableData" v-loading="loading" border stripe>
  <el-table-column prop="id" label="ID" width="80" align="center" />
  <el-table-column prop="username" label="用户名" min-width="120" />
  <el-table-column prop="status" label="状态" width="100" align="center">
    <template #default="{ row }">
      <el-tag :type="row.status === 1 ? 'success' : 'danger'">
        {{ row.status === 1 ? '启用' : '禁用' }}
      </el-tag>
    </template>
  </el-table-column>
  <el-table-column label="操作" width="200" align="center" fixed="right">
    <template #default="{ row }">
      <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
      <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
    </template>
  </el-table-column>
</el-table>
```

### 表单规范

✅ 正确
```vue
<el-form
  ref="formRef"
  :model="formData"
  :rules="formRules"
  label-width="100px"
>
  <el-form-item label="用户名" prop="username">
    <el-input v-model="formData.username" placeholder="请输入用户名" />
  </el-form-item>
  <el-form-item label="邮箱" prop="email">
    <el-input v-model="formData.email" placeholder="请输入邮箱" />
  </el-form-item>
  <el-form-item>
    <el-button type="primary" @click="handleSubmit">提交</el-button>
    <el-button @click="handleReset">重置</el-button>
  </el-form-item>
</el-form>

<script setup lang="ts">
import { ref, reactive } from "vue";
import type { FormInstance, FormRules } from "element-plus";

const formRef = ref<FormInstance>();
const formData = reactive({
  username: "",
  email: "",
});

const formRules: FormRules = {
  username: [
    { required: true, message: "请输入用户名", trigger: "blur" },
    { min: 3, max: 50, message: "长度在 3 到 50 个字符", trigger: "blur" },
  ],
  email: [
    { required: true, message: "请输入邮箱", trigger: "blur" },
    { type: "email", message: "请输入正确的邮箱格式", trigger: "blur" },
  ],
};

async function handleSubmit() {
  const valid = await formRef.value?.validate();
  if (!valid) return;
  // 提交表单
}

function handleReset() {
  formRef.value?.resetFields();
}
</script>
```

## 边界情况

### 例外场景
- 简单展示页面可省略分页组件
- 静态页面可省略搜索表单

### 优先级裁决
当 Element Plus 默认样式与项目设计稿冲突时，**优先遵循设计稿**，通过全局样式覆盖。

## 详细规范
如需更多细节，参考：
- @.claude/standards/topics/前端开发规范/01-一、项目结构规范.md
- @.claude/standards/topics/前端开发规范/05-五、样式规范.md
- @.claude/standards/topics/前端开发规范/06-六、路由规范.md

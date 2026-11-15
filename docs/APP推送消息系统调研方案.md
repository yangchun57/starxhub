# APP推送消息系统调研方案（多用户版）

**项目背景**：为starxhub插件系统开发移动端通知APP，支持多用户注册登录，通过绑定码机制关联插件实例  
**调研日期**：2026-10-12  
**调研目标**：完成技术选型、架构设计、用户系统、绑定码机制、消息协议规划、部署方案

---

## 一、需求分析

### 1.1 核心需求

| 需求类型 | 描述 | 优先级 |
|---------|------|--------|
| **多用户系统** | 支持用户注册、登录、个人信息管理 | P0 |
| **绑定码机制** | 用户生成绑定码，插件端输入完成关联 | P0 |
| **事件触发** | 任务完成、需要用户确认时触发推送 | P0 |
| **信息推送** | 向移动端APP推送详细信息 | P0 |
| **插件集成** | 在starxhub插件中增加钩子机制 | P0 |
| **多租户隔离** | 不同用户数据完全隔离 | P0 |
| **实时性** | 消息到达延迟 < 3秒 | P1 |
| **可靠性** | 消息不丢失、可追溯 | P1 |
| **多端支持** | iOS + Android | P1 |
| **免费部署** | 部署在免费服务器上，资源受限 | P1 |

### 1.2 用户场景

```
场景A：用户首次使用
├─ 下载APP → 注册账号（手机号/邮箱）
├─ 登录后显示"绑定码"（6位数字，如：A3F8K2）
├─ 在Claude Code插件中输入绑定码完成关联
└─ 开始接收推送通知

场景B：多设备绑定
├─ 同一用户可绑定多个插件实例（不同项目）
├─ 每个实例生成独立绑定码
├─ APP按项目分组显示消息
└─ 用户可解绑不再使用的实例

场景C：团队协作
├─ 团队成员各自注册账号
├─ 同一项目可绑定多个用户（如PM+开发）
├─ 消息按权限推送（如只有PM收到审批通知）
└─ 支持消息转发给其他成员
```

### 1.3 触发场景

```
场景1：任务完成通知
├─ 触发时机：Agent完成某个任务阶段
├─ 推送内容：任务名称、执行结果、耗时、产出物
└─ 用户动作：查看详情、确认完成

场景2：需要用户确认
├─ 触发时机：遇到需要人工决策的节点（如方案门禁、多租户红线阻塞）
├─ 推送内容：阻塞原因、待确认事项、可选方案
└─ 用户动作：审批通过、驳回、补充信息

场景3：异常告警
├─ 触发时机：构建失败、测试未通过、hook拦截
├─ 推送内容：错误信息、失败原因、修复建议
└─ 用户动作：查看详情、重新执行
```

---

## 二、技术选型调研

### 2.1 移动端APP开发框架对比

| 框架 | 跨平台 | 性能 | 推送支持 | 开发成本 | 适用场景 |
|------|--------|------|----------|----------|----------|
| **Flutter** | ✅ iOS/Android/Web/桌面 | ⭐⭐⭐⭐⭐ | 原生支持 | 中等 | 高性能、复杂UI、国际化 |
| **React Native** | ✅ iOS/Android | ⭐⭐⭐⭐ | 生态丰富 | 中等 | JS生态、快速迭代 |
| **uni-app** | ✅ 多端（H5/小程序/App） | ⭐⭐⭐ | 插件市场 | 低 | 国内生态、多端发布 |
| **原生开发** | ❌ 单平台 | ⭐⭐⭐⭐⭐ | 最佳 | 高 | 极致性能、深度定制 |
| **PWA** | ✅ 全平台 | ⭐⭐⭐ | 有限 | 低 | 轻量级、无需安装 |

**最终选择：Flutter**

选择理由：
- **性能接近原生**：自绘引擎（Skia/Impeller），60fps流畅渲染，推送消息即时展示
- **UI一致性**：跨平台像素级一致，绑定码展示、消息列表视觉效果统一
- **推送生态成熟**：firebase_messaging、jpush_flutter等SDK完善
- **国际化友好**：天生支持多语言，方便将来拓展海外用户
- **热重载**：开发效率高，UI调试方便
- **单一代码库**：iOS + Android + Web 三端共用一套代码

技术栈：
- **语言**：Dart 3.x
- **状态管理**：Riverpod（推荐）或 Bloc
- **网络请求**：Dio
- **本地存储**：shared_preferences + sqflite（离线消息缓存）
- **WebSocket**：web_socket_channel
- **路由**：go_router
- **推送（离线）**：firebase_messaging（海外）/ jpush_flutter（国内）

### 2.2 推送服务方案对比

| 方案 | 类型 | 优势 | 劣势 | 成本 |
|------|------|------|------|------|
| **自建WebSocket服务** | 自建 | 完全可控、无依赖、双向通信 | 需维护长连接 | 仅服务器成本 |
| **Firebase Cloud Messaging (FCM)** | 第三方 | 全球覆盖、稳定 | 国内受限 | 免费 |
| **极光推送 (JPush)** | 第三方 | 国内稳定、SDK完善 | 免费版200连接上限 | 付费无限制 |
| **Supabase Realtime** | 托管 | Postgres CDC驱动 | 免费版200连接硬上限 | 免费/付费 |
| **MQTT协议** | 自建 | 轻量、低功耗 | 需自建Broker | 仅服务器成本 |
| **Server-Sent Events (SSE)** | 自建 | 简单、单向推送 | 不支持双向 | 仅服务器成本 |

**推荐方案**：**混合推送**（自建WebSocket在线推送 + 阿里云EMAS离线推送）

方案说明：
- **在线推送**：自建WebSocket服务（部署在Oracle Cloud免费VM上，零成本）
- **离线推送**：阿里云EMAS移动推送（5万台/月免费额度，系统级通知）
- **路由策略**：APP在线走WebSocket，APP被杀死走阿里云EMAS

选择理由：
- 在线WebSocket：零成本、双向通信、实时性最佳
- 阿里云EMAS：5万台免费、国内到达率高、支持厂商通道（小米/华为/OPPO/vivo）
- 混合方案：兼顾实时性与离线到达率，初期完全免费

### 2.3 后端服务技术栈

| 组件 | 最终方案 | 备选方案 | 说明 |
|------|----------|----------|------|
| **API服务** | FastAPI (Python 3.12+) | ASP.NET Core | 与现有后端模板一致 |
| **消息队列** | asyncio.Queue（内存） | Redis Pub/Sub | 免费服务器零依赖 |
| **持久化** | SQLite (WAL模式) | PostgreSQL | 零运维，适配免费VM |
| **实时通信** | WebSocket (FastAPI) | SSE | 双向通信，支持操作回传 |
| **在线推送** | 自建WebSocket | - | 零成本，实时双向 |
| **离线推送** | 阿里云EMAS | 极光推送 | 5万台/月免费，系统级通知 |
| **认证** | JWT (PyJWT) + API Key | OAuth2 | APP用JWT，插件用API Key |
| **密码哈希** | bcrypt | argon2 | 业界标准，安全性高 |
| **反向代理** | Nginx | Caddy | HTTPS + 静态文件 |

### 2.4 阿里云EMAS集成架构

**推送路由策略**：
```
消息产生 → 检查用户WebSocket连接状态
  ├─ 在线 → WebSocket直接推送（零成本、实时）
  └─ 离线 → 阿里云EMAS推送（系统级通知、厂商通道）
```

**设备注册流程**：
1. APP启动时，调用阿里云EMAS SDK获取DeviceToken
2. 将DeviceToken上报到服务端（POST /api/device/register）
3. 服务端存储 user_id ↔ device_token 映射
4. 用户WebSocket连接时，标记 online_status = true
5. 用户WebSocket断开时，标记 online_status = false

**服务端推送决策**：
```python
async def push_message(user_id: int, message: dict):
    """推送消息给用户"""
    # 1. 检查WebSocket连接状态
    if user_id in active_connections:
        # 在线，走WebSocket
        await active_connections[user_id].send_json(message)
        return {"channel": "websocket", "status": "delivered"}
    
    # 2. 离线，走阿里云EMAS
    device_token = await get_device_token(user_id)
    if device_token:
        await emas_pusher.push_to_device(
            device_token=device_token,
            title=message["title"],
            body=message["content"],
            data=message
        )
        return {"channel": "emas", "status": "sent"}
    
    return {"channel": "none", "status": "no_device"}
```

**阿里云EMAS配置**：
- 免费额度：月推送去重设备数 < 5万台
- 超出计费：0.06元/台/月
- 支持平台：Android、iOS
- 厂商通道：小米、华为、OPPO、vivo、魅族、FCM

**Flutter集成依赖**：
```yaml
# pubspec.yaml
dependencies:
  # 阿里云EMAS推送SDK（需要原生集成或找Flutter插件）
  # 或通过MethodChannel调用原生SDK
```

**服务端集成**：
```python
# emas_push.py
from aliyunsdkcore.client import AcsClient
from aliyunsdkpush.request.v20160801 import PushRequest

class EMASPusher:
    def __init__(self, access_key_id, access_key_secret, app_key):
        self.client = AcsClient(access_key_id, access_key_secret, 'cn-hangzhou')
        self.app_key = app_key
    
    async def push_to_device(self, device_token: str, title: str, body: str, data: dict):
        """推送给指定设备"""
        request = PushRequest.PushRequest()
        request.set_AppKey(self.app_key)
        request.set_DeviceToken(device_token)
        request.set_Title(title)
        request.set_Body(body)
        request.set_PushStore("true")  # 离线保存
        request.set_AndroidNotificationBarType("1")
        request.set_AndroidOpenUrl("flutter://message/detail")
        request.set_ExtParameters(data)
        
        response = self.client.do_action_with_exception(request)
        return response
```

**成本估算**：
- 初期（< 5万用户）：完全免费
- 中期（5-10万用户）：约 300元/月（超出部分按量付费）
- 长期：根据实际用户量评估是否迁移到自建推送服务

### 2.5 免费服务器选型（2026年10月调研）

| 平台 | 免费配置 | WebSocket支持 | 永久免费 | 推荐度 |
|------|----------|---------------|----------|--------|
| **Oracle Cloud** | 2核12GB ARM + 200GB NVMe + 10TB流量 | ✅ 完整VM | ✅ 永久 | ⭐⭐⭐⭐⭐ |
| **Fly.io** | 3个共享VM + 3GB存储 + 160GB流量 | ✅ 原生支持 | ✅ 永久 | ⭐⭐⭐⭐ |
| **Google Cloud** | e2-micro（1核1GB）+ 30GB | ✅ 但资源太小 | ✅ 永久 | ⭐⭐⭐ |
| **HuggingFace Spaces** | 2核16GB（CPU） | ⚠️ 需Docker | ✅ 永久 | ⭐⭐⭐⭐ |
| **Render** | 免费Web服务 | ❌ 15分钟休眠 | ✅ 永久 | ⭐⭐ |
| **Vercel** | Serverless Functions | ❌ 无长连接 | ✅ 永久 | ⭐ |
| **AWS** | t2.micro（1核1GB） | ✅ 但仅12个月 | ❌ 12个月 | ⭐⭐ |

**最终选择：Oracle Cloud Free Tier**

选择理由：
- **资源碾压**：2核12GB ARM，推送服务仅需200MB，余量充足
- **永久免费**：不是12个月试用，是真正的Always Free
- **完整VM**：想装什么装什么，无平台限制
- **流量充裕**：10TB/月出站流量，推送消息基本用不完
- **存储充足**：200GB NVMe，SQLite + 日志 + 备份绰绰有余

注意事项：
- 注册需信用卡验证（临时扣$1后退还）
- 热门区域可能"out of capacity"，需多试几次或换区域
- 两层防火墙（云安全列表 + iptables），都要正确配置
- Oracle可能回收长期闲置实例，需保持一定活跃度

---

## 三、系统架构设计

### 3.1 绑定码机制设计

**绑定流程**：

```
用户侧                          服务端                          插件侧
  │                               │                               │
  │  1. 注册/登录                 │                               │
  ├──────────────────────────────>│                               │
  │                               │                               │
  │  2. 请求绑定码                │                               │
  ├──────────────────────────────>│                               │
  │                               │  生成6位绑定码（有效期10分钟） │
  │  3. 返回绑定码                │                               │
  │<──────────────────────────────│                               │
  │                               │                               │
  │  4. 用户看到绑定码            │                               │
  │  （如：A3F8K2）               │                               │
  │                               │                               │
  │                               │  5. 用户输入绑定码             │
  │                               │<──────────────────────────────┤
  │                               │                               │
  │                               │  6. 验证绑定码                 │
  │                               │  创建绑定关系                  │
  │                               │                               │
  │  7. 推送绑定成功通知          │                               │
  │<──────────────────────────────│                               │
  │                               │                               │
  │  8. 开始接收消息推送          │                               │
  │<──────────────────────────────│  9. 钩子触发推送               │
  │                               │<──────────────────────────────┤
```

**绑定码规则**：
- 格式：6位大写字母+数字混合（如 A3F8K2）
- 有效期：10分钟（防止滥用）
- 一次性使用：绑定成功后失效
- 每用户最多绑定10个插件实例

### 3.3 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                    starxhub插件系统（多实例）                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  项目A实例              项目B实例                      │  │
│  │  ┌────────────────┐    ┌────────────────┐            │  │
│  │  │ Agent执行任务  │    │ Agent执行任务  │            │  │
│  │  └───────┬────────┘    └───────┬────────┘            │  │
│  │          ↓                     ↓                      │  │
│  │  ┌─────────────────────────────────────────────┐     │  │
│  │  │ notification_hook.py                        │     │  │
│  │  │ ├─ 读取绑定码（.notification_config）       │     │  │
│  │  │ ├─ 构造消息 + 附加instance_id               │     │  │
│  │  │ └─ POST到推送服务API（带API Key）           │     │  │
│  │  └─────────────────────────────────────────────┘     │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                    推送服务后端（多租户）                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  FastAPI服务                                         │  │
│  │  ├─ /api/auth (注册/登录/绑定码)                     │  │
│  │  ├─ /api/bind (绑定/解绑实例)                        │  │
│  │  ├─ /api/push (接收钩子推送，验证API Key)            │  │
│  │  ├─ /api/messages (按用户隔离的消息列表)             │  │
│  │  └─ /ws (WebSocket，按user_id隔离频道)               │  │
│  └──────────────────────────────────────────────────────┘  │
│                         ↓                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  数据层（轻量级，适配免费服务器）                    │  │
│  │  ├─ SQLite（用户+绑定+消息，单文件，零运维）         │  │
│  │  └─ 内存队列（替代Redis，减少资源占用）              │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                    移动端APP (Flutter)                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  用户层                                              │  │
│  │  ├─ 注册/登录（邮箱+密码）                           │  │
│  │  ├─ 显示绑定码（大字体，一键复制）                   │  │
│  │  └─ 管理绑定实例列表                                 │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  消息层                                              │  │
│  │  ├─ 按实例分组显示消息                               │  │
│  │  ├─ WebSocket实时接收（web_socket_channel）          │  │
│  │  ├─ 本地离线缓存（sqflite）                          │  │
│  │  └─ 操作回传（确认/驳回）                            │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 3.4 数据流设计

```
1. 用户注册与绑定
   APP注册 → 生成绑定码 → 插件输入绑定码 → 创建绑定关系 → 分配API Key

2. 事件触发
   Agent完成任务 → Claude Code触发PostToolUse钩子

3. 钩子处理
   notification_hook.py
   ├─ 读取本地配置（API Key + instance_id）
   ├─ 读取stdin（JSON格式的事件数据）
   ├─ 提取关键字段（任务ID、状态、产出物路径）
   ├─ 构造标准消息体
   └─ HTTP POST到推送服务（Header携带API Key）

4. 消息路由
   推送服务API
   ├─ 验证API Key → 查找绑定关系 → 获取user_id
   ├─ 写入内存队列（轻量级，无Redis依赖）
   ├─ 持久化到SQLite
   └─ WebSocket推送给在线用户

5. 客户端接收
   Flutter APP
   ├─ WebSocket接收（在线，web_socket_channel）
   ├─ sqflite本地缓存（离线消息）
   ├─ 本地通知展示（flutter_local_notifications）
   └─ 用户操作回传（确认/驳回）

6. 操作回传
   APP → 推送服务API → 钩子系统 → Agent继续执行
```

---

## 四、数据模型设计（适配免费服务器）

### 4.1 数据库选型

| 方案 | 优势 | 劣势 | 适用场景 |
|------|------|------|----------|
| **SQLite** | 零运维、单文件、免费 | 并发写入受限 | 小规模（<1000用户） |
| **PostgreSQL** | 高并发、功能强 | 需独立服务、占资源 | 中大规模 |
| **MySQL** | 生态成熟 | 需独立服务 | 中大规模 |

**推荐方案**：**SQLite**（免费服务器资源受限，SQLite足够支撑初期规模）

### 4.2 核心数据表

```sql
-- 用户表
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone VARCHAR(20) UNIQUE,           -- 手机号（可选）
    email VARCHAR(100) UNIQUE,          -- 邮箱
    password_hash VARCHAR(255),         -- 密码哈希
    nickname VARCHAR(50),               -- 昵称
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login_at DATETIME
);

-- 绑定码表（临时，用于关联插件实例）
CREATE TABLE bind_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    code VARCHAR(10) UNIQUE NOT NULL,   -- 6位绑定码（如A3F8K2）
    expires_at DATETIME NOT NULL,       -- 过期时间（10分钟后）
    used BOOLEAN DEFAULT FALSE,         -- 是否已使用
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 插件实例绑定表
CREATE TABLE instances (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    instance_name VARCHAR(100),         -- 实例名称（如"电商项目-开发环境"）
    api_key VARCHAR(64) UNIQUE NOT NULL, -- 插件使用的API Key
    project_path VARCHAR(500),          -- 项目路径（可选）
    is_active BOOLEAN DEFAULT TRUE,     -- 是否启用
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_active_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 消息表
CREATE TABLE messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    instance_id INTEGER NOT NULL,       -- 关联的插件实例
    user_id INTEGER NOT NULL,           -- 冗余字段，方便查询
    event_type VARCHAR(50) NOT NULL,    -- 事件类型（task_completed/approval_required等）
    priority VARCHAR(20) DEFAULT 'normal', -- 优先级（low/normal/high/critical）
    title VARCHAR(200) NOT NULL,        -- 消息标题
    content TEXT,                       -- 消息内容
    details_json TEXT,                  -- 详细信息（JSON格式）
    actions_json TEXT,                  -- 可执行操作（JSON格式）
    is_read BOOLEAN DEFAULT FALSE,      -- 是否已读
    is_actioned BOOLEAN DEFAULT FALSE,  -- 是否已处理
    action_result VARCHAR(50),          -- 处理结果（confirm/reject等）
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    read_at DATETIME,
    actioned_at DATETIME,
    FOREIGN KEY (instance_id) REFERENCES instances(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 索引优化
CREATE INDEX idx_messages_user_id ON messages(user_id);
CREATE INDEX idx_messages_instance_id ON messages(instance_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_is_read ON messages(is_read);
CREATE INDEX idx_bind_codes_code ON bind_codes(code);
CREATE INDEX idx_instances_api_key ON instances(api_key);
```

### 4.3 数据隔离策略

```
用户A (user_id=1)
├─ 实例1 (instance_id=1, api_key=abc123) → 项目A
│  └─ 消息1, 消息2, 消息3...
├─ 实例2 (instance_id=2, api_key=def456) → 项目B
│  └─ 消息4, 消息5...
└─ 绑定码记录（临时）

用户B (user_id=2)
├─ 实例3 (instance_id=3, api_key=ghi789) → 项目C
│  └─ 消息6, 消息7...
└─ 绑定码记录（临时）

隔离规则：
- 所有查询必须带 user_id 条件
- API Key 全局唯一，用于插件端认证
- 消息查询自动过滤，用户只能看到自己的消息
```

---

## 五、API接口设计

### 5.1 用户认证接口

```python
# POST /api/auth/register - 用户注册
{
    "phone": "13800138000",        # 或 email
    "password": "hashed_password",
    "nickname": "张三"
}
Response: {
    "code": 0,
    "data": {
        "user_id": 1,
        "token": "jwt_token_here"
    }
}

# POST /api/auth/login - 用户登录
{
    "phone": "13800138000",
    "password": "hashed_password"
}
Response: {
    "code": 0,
    "data": {
        "user_id": 1,
        "token": "jwt_token_here",
        "nickname": "张三"
    }
}

# POST /api/auth/bindcode - 生成绑定码
Headers: Authorization: Bearer {token}
Response: {
    "code": 0,
    "data": {
        "bind_code": "A3F8K2",
        "expires_at": "2026-10-12T22:30:00Z",  # 10分钟后过期
        "message": "请在10分钟内在插件中输入此绑定码"
    }
}
```

### 5.2 插件绑定接口

```python
# POST /api/bind/verify - 插件端验证绑定码
{
    "bind_code": "A3F8K2",
    "instance_name": "电商项目-开发环境",
    "project_path": "/path/to/project"  # 可选
}
Response: {
    "code": 0,
    "data": {
        "instance_id": 1,
        "api_key": "sk_abc123def456...",  # 插件后续使用此Key
        "user_id": 1,
        "message": "绑定成功"
    }
}

# POST /api/bind/unbind - 解绑实例
Headers: Authorization: Bearer {token}
{
    "instance_id": 1
}
Response: {
    "code": 0,
    "message": "解绑成功"
}

# GET /api/bind/list - 获取绑定实例列表
Headers: Authorization: Bearer {token}
Response: {
    "code": 0,
    "data": [
        {
            "instance_id": 1,
            "instance_name": "电商项目-开发环境",
            "project_path": "/path/to/project",
            "is_active": true,
            "created_at": "2026-10-12T22:00:00Z",
            "last_active_at": "2026-10-12T22:15:00Z"
        }
    ]
}
```

### 5.3 消息推送接口（插件端调用）

```python
# POST /api/push - 插件推送消息
Headers: 
  X-API-Key: sk_abc123def456...  # 插件使用API Key认证
  Content-Type: application/json

{
    "event_type": "task_completed",
    "priority": "normal",
    "title": "构建任务完成",
    "content": "前端项目构建成功，耗时 45秒",
    "details": {
        "task_name": "frontend_build",
        "status": "success",
        "duration_seconds": 45,
        "artifacts": [
            {"type": "file", "path": "/dist/index.html", "size": "2.3MB"}
        ]
    },
    "actions": [
        {"action_id": "confirm", "label": "确认完成", "type": "primary"},
        {"action_id": "view_details", "label": "查看详情", "type": "secondary"}
    ]
}

Response: {
    "code": 0,
    "data": {
        "message_id": 123,
        "user_id": 1,
        "delivered": true
    }
}
```

### 5.4 消息查询接口（APP端调用）

```python
# GET /api/messages - 获取消息列表
Headers: Authorization: Bearer {token}
Query: ?page=1&page_size=20&instance_id=1&is_read=false

Response: {
    "code": 0,
    "data": {
        "total": 45,
        "messages": [
            {
                "message_id": 123,
                "instance_id": 1,
                "instance_name": "电商项目-开发环境",
                "event_type": "task_completed",
                "priority": "normal",
                "title": "构建任务完成",
                "content": "前端项目构建成功",
                "is_read": false,
                "created_at": "2026-10-12T22:15:00Z"
            }
        ]
    }
}

# POST /api/messages/{message_id}/action - 用户处理消息
Headers: Authorization: Bearer {token}
{
    "action": "confirm",  # 或 "reject", "view"
    "comment": "已确认"   # 可选
}
Response: {
    "code": 0,
    "message": "操作已回传"
}
```

---

## 六、消息协议设计

### 4.1 钩子输入格式（Claude Code → 钩子）

```json
{
  "hookEventName": "PostToolUse",
  "tool_name": "Bash",
  "tool_input": {
    "command": "npm run build"
  },
  "tool_output": {
    "exit_code": 0,
    "stdout": "Build completed successfully",
    "stderr": ""
  },
  "session_id": "abc123",
  "project_dir": "/path/to/project"
}
```

### 4.2 推送消息格式（钩子 → 推送服务）

```json
{
  "message_id": "msg_20261012_abc123",
  "user_id": "user_123",
  "event_type": "task_completed",
  "priority": "normal",
  "title": "构建任务完成",
  "content": "前端项目构建成功，耗时 45秒",
  "details": {
    "task_name": "frontend_build",
    "status": "success",
    "duration_seconds": 45,
    "artifacts": [
      {
        "type": "file",
        "path": "/dist/index.html",
        "size": "2.3MB"
      }
    ],
    "project": {
      "name": "电商系统",
      "path": "/path/to/project"
    }
  },
  "actions": [
    {
      "action_id": "confirm",
      "label": "确认完成",
      "type": "primary"
    },
    {
      "action_id": "view_details",
      "label": "查看详情",
      "type": "secondary"
    }
  ],
  "timestamp": "2026-10-12T15:30:00Z",
  "expires_at": "2026-10-13T15:30:00Z"
}
```

### 4.3 事件类型定义

| 事件类型 | 触发场景 | 优先级 | 需要操作 |
|---------|---------|--------|---------|
| `task_completed` | 任务完成 | normal | 确认 |
| `approval_required` | 需要审批 | high | 审批/驳回 |
| `build_failed` | 构建失败 | high | 查看详情 |
| `test_failed` | 测试失败 | high | 查看详情 |
| `hook_blocked` | 钩子拦截 | critical | 处理阻塞 |
| `review_requested` | 请求评审 | normal | 评审 |

---

## 七、钩子实现方案（多用户版）

### 7.1 插件端配置文件

插件首次绑定后，在项目根目录生成配置文件：

```json
// .claude/notification_config.json
{
    "api_url": "https://notify.example.com",
    "api_key": "sk_abc123def456...",
    "instance_id": 1,
    "instance_name": "电商项目-开发环境",
    "bindcode": "A3F8K2",
    "created_at": "2026-10-12T22:00:00Z"
}
```

### 7.2 钩子脚本结构

```python
#!/usr/bin/env python3
# notification_hook.py - 多用户版
import sys
import json
import os
import requests
from datetime import datetime
from pathlib import Path

CONFIG_FILE = ".claude/notification_config.json"

def load_config():
    """加载插件配置（API Key等）"""
    project_dir = os.environ.get("CLAUDE_PROJECT_DIR", ".")
    config_path = Path(project_dir) / CONFIG_FILE
    
    if not config_path.exists():
        return None  # 未绑定，静默跳过
    
    try:
        with open(config_path) as f:
            return json.load(f)
    except Exception:
        return None

def main():
    # 1. 加载配置
    config = load_config()
    if not config:
        return  # 未绑定，不推送
    
    # 2. 读取Claude Code传入的事件数据
    try:
        event_data = json.loads(sys.stdin.read())
    except Exception as e:
        print(f"[notify] Failed to parse input: {e}", file=sys.stderr)
        return
    
    # 3. 判断是否需要推送
    if not should_notify(event_data):
        return
    
    # 4. 构造推送消息
    message = build_notification(event_data, config)
    
    # 5. 推送到服务端（使用API Key认证）
    try:
        response = requests.post(
            f"{config['api_url']}/api/push",
            json=message,
            headers={
                "X-API-Key": config["api_key"],
                "Content-Type": "application/json"
            },
            timeout=5
        )
        response.raise_for_status()
    except Exception as e:
        # 静默失败，不影响Agent执行
        print(f"[notify] Failed to send: {e}", file=sys.stderr)

def should_notify(event_data):
    """判断是否需要推送"""
    hook_event = event_data.get("hookEventName")
    
    # PostToolUse: 任务完成
    if hook_event == "PostToolUse":
        tool_name = event_data.get("tool_name", "")
        if tool_name in ["Bash", "Write", "Edit"]:
            return True
    
    # 需要用户确认（通过输出判断）
    tool_output = event_data.get("tool_output", {})
    stdout = tool_output.get("stdout", "")
    if any(kw in stdout for kw in ["需要确认", "请确认", "approval_required"]):
        return True
    
    return False

def build_notification(event_data, config):
    """构造推送消息"""
    event_type = determine_event_type(event_data)
    
    return {
        "event_type": event_type,
        "priority": get_priority(event_type),
        "title": get_title(event_type, event_data),
        "content": get_content(event_data),
        "details": {
            "task_name": event_data.get("tool_name", "unknown"),
            "project_dir": os.environ.get("CLAUDE_PROJECT_DIR", "."),
            "instance_id": config["instance_id"],
            "instance_name": config.get("instance_name", "Unknown"),
            **extract_details(event_data)
        },
        "actions": get_actions(event_type),
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }

def determine_event_type(event_data):
    """判断事件类型"""
    hook_event = event_data.get("hookEventName")
    tool_output = event_data.get("tool_output", {})
    
    # 检查是否有错误
    if tool_output.get("exit_code", 0) != 0:
        return "build_failed"
    
    # 检查是否需要确认
    stdout = tool_output.get("stdout", "")
    if any(kw in stdout for kw in ["需要确认", "请确认"]):
        return "approval_required"
    
    return "task_completed"

def get_priority(event_type):
    """获取优先级"""
    priority_map = {
        "task_completed": "normal",
        "approval_required": "high",
        "build_failed": "high",
        "test_failed": "high",
        "hook_blocked": "critical"
    }
    return priority_map.get(event_type, "normal")

def get_title(event_type, event_data):
    """生成消息标题"""
    title_map = {
        "task_completed": "任务完成",
        "approval_required": "需要您确认",
        "build_failed": "构建失败",
        "test_failed": "测试失败",
        "hook_blocked": "操作被拦截"
    }
    return title_map.get(event_type, "新通知")

def get_content(event_data):
    """生成消息内容"""
    tool_name = event_data.get("tool_name", "unknown")
    tool_output = event_data.get("tool_output", {})
    stdout = tool_output.get("stdout", "")[:200]  # 截取前200字符
    return f"{tool_name} 执行完成\n{stdout}" if stdout else f"{tool_name} 执行完成"

def extract_details(event_data):
    """提取详细信息"""
    return {
        "tool_name": event_data.get("tool_name"),
        "tool_input": event_data.get("tool_input", {}),
        "exit_code": event_data.get("tool_output", {}).get("exit_code"),
        "session_id": event_data.get("session_id")
    }

def get_actions(event_type):
    """获取可执行操作"""
    if event_type == "approval_required":
        return [
            {"action_id": "confirm", "label": "确认通过", "type": "primary"},
            {"action_id": "reject", "label": "驳回", "type": "danger"}
        ]
    elif event_type in ["build_failed", "test_failed"]:
        return [
            {"action_id": "view_details", "label": "查看详情", "type": "primary"},
            {"action_id": "retry", "label": "重新执行", "type": "secondary"}
        ]
    else:
        return [
            {"action_id": "view_details", "label": "查看详情", "type": "secondary"}
        ]

if __name__ == "__main__":
    main()
```

### 7.3 绑定命令（新增斜杠命令）

在插件中新增 `/bind-notify` 命令，引导用户完成绑定：

```markdown
# /bind-notify 命令流程

1. 询问用户是否已有账号
   ├─ 无账号 → 引导下载APP注册
   └─ 有账号 → 继续

2. 提示用户在APP中生成绑定码

3. 用户输入绑定码（如：A3F8K2）

4. 调用服务端 /api/bind/verify 接口

5. 绑定成功 → 写入 .claude/notification_config.json

6. 提示绑定成功，开始接收通知
```

### 7.4 钩子注册配置

在`.claude/settings.json`中注册钩子：

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "python3 .claude/hooks/notification_hook.py"
          }
        ]
      }
    ]
  }
}
```

---

## 八、部署方案（免费服务器适配）

### 8.1 免费服务器选型

| 平台 | 免费额度 | 限制 | 推荐度 |
|------|----------|------|--------|
| **Oracle Cloud Free Tier** | 2台ARM实例（各1核24GB） | 永久免费，需信用卡验证 | ⭐⭐⭐⭐⭐ |
| **Google Cloud Free** | e2-micro（1核1GB） | 12个月免费 | ⭐⭐⭐⭐ |
| **Railway** | $5/月额度 | 用完即止 | ⭐⭐⭐ |
| **Render** | 免费Web服务 | 15分钟休眠 | ⭐⭐⭐ |
| **Fly.io** | 3个共享CPU VM | 256MB内存 | ⭐⭐⭐⭐ |
| **Vercel** | Serverless Functions | 100GB带宽/月 | ⭐⭐⭐⭐ |
| **HuggingFace Spaces** | 2核16GB（CPU） | 需Docker部署 | ⭐⭐⭐⭐⭐ |

**推荐方案**：Oracle Cloud Free Tier（ARM 1核24GB，资源充足）或 HuggingFace Spaces（简单快速）

### 8.2 技术栈轻量化调整

| 组件 | 原方案 | 免费服务器方案 | 理由 |
|------|--------|----------------|------|
| 数据库 | PostgreSQL | **SQLite** | 零运维，单文件，<1000用户足够 |
| 消息队列 | Redis Pub/Sub | **内存队列（asyncio.Queue）** | 减少资源占用 |
| 推送通道 | 极光推送+WebSocket | **WebSocket only** | 免费，离线消息靠本地缓存 |
| 认证 | JWT | **JWT（PyJWT）** | 无变化，轻量 |
| 部署 | Docker Compose | **单进程 Uvicorn** | 简化部署 |

### 8.3 部署架构（单进程方案）

```
Oracle Cloud ARM VM（2核12GB）
┌─────────────────────────────────────────┐
│  Nginx (反向代理 + HTTPS)              │
│  ├─ 443端口 → 8000端口                 │
│  └─ Let's Encrypt证书自动续期          │
│                                         │
│  Uvicorn (单进程，4 workers)           │
│  ├─ FastAPI 应用                        │
│  │   ├─ /api/auth/*    (用户认证)       │
│  │   ├─ /api/bind/*    (绑定管理)       │
│  │   ├─ /api/push      (消息接收)       │
│  │   ├─ /api/messages  (消息查询)       │
│  │   └─ /ws            (WebSocket)      │
│  ├─ SQLite 数据库 (notify.db, WAL模式) │
│  ├─ 内存消息队列 (asyncio.Queue)       │
│  └─ JWT 认证中间件                      │
│                                         │
│  定时任务 (cron)                        │
│  ├─ 每日备份SQLite到对象存储           │
│  ├─ 清理过期绑定码（>10分钟）          │
│  └─ 清理过期消息（>30天）              │
│                                         │
│  监控脚本                               │
│  ├─ 进程存活检查（systemd）            │
│  ├─ 资源使用告警（CPU/内存/磁盘）      │
│  └─ WebSocket连接数监控                │
└─────────────────────────────────────────┘

资源占用预估：
├─ 内存：~200MB（1000用户并发）
├─ 磁盘：~50MB（SQLite + 代码）
├─ CPU：极低（异步IO，无计算密集）
└─ 带宽：~10MB/天（纯文本消息）
```

### 8.4 Oracle Cloud部署详细步骤

**步骤1：创建VM实例**

```bash
# 1. 登录Oracle Cloud Console
# 2. 进入 Compute → Instances → Create instance
# 3. 配置：
#    - Name: notify-service
#    - Image: Canonical Ubuntu 22.04
#    - Shape: VM.Standard.A1.Flex (ARM)
#    - OCPU: 2
#    - Memory: 12 GB
#    - Boot volume: 50 GB
#    - SSH key: 生成并下载私钥

# 4. 创建后获取公网IP（如：129.159.100.50）
```

**步骤2：配置防火墙（两层）**

```bash
# 第一层：Oracle Cloud安全列表
# Networking → Virtual cloud networks → 你的VCN → 安全列表
# 添加入站规则：
# - Source: 0.0.0.0/0
# - Protocol: TCP
# - Destination ports: 80, 443, 22

# 第二层：VM内部iptables
ssh -i ~/Downloads/ssh-key.key ubuntu@129.159.100.50

# 查看当前iptables规则
sudo iptables -L INPUT --line-numbers

# 找到REJECT行的行号（假设是第6行）
# 在REJECT之前插入允许规则
sudo iptables -I INPUT 6 -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -p tcp --dport 443 -j ACCEPT
sudo iptables -I INPUT 6 -p tcp --dport 8000 -j ACCEPT

# 保存规则
sudo netfilter-persistent save
```

**步骤3：安装依赖**

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装Python 3.12
sudo apt install -y python3.12 python3.12-venv python3-pip

# 安装Nginx
sudo apt install -y nginx

# 安装Certbot（Let's Encrypt）
sudo apt install -y certbot python3-certbot-nginx

# 创建项目目录
mkdir -p ~/notify-service
cd ~/notify-service

# 创建虚拟环境
python3.12 -m venv venv
source venv/bin/activate

# 安装Python依赖
pip install fastapi uvicorn[standard] pyjwt aiosqlite websockets bcrypt python-multipart
```

**步骤4：部署应用**

```bash
# 上传代码（使用scp或git clone）
git clone https://github.com/your-repo/notify-service.git .

# 初始化数据库
python init_db.py

# 创建systemd服务
sudo nano /etc/systemd/system/notify.service
```

```ini
# /etc/systemd/system/notify.service
[Unit]
Description=Notify Service
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/notify-service
Environment="PATH=/home/ubuntu/notify-service/venv/bin"
Environment="JWT_SECRET=your-secret-key-here"
Environment="DATABASE_URL=sqlite:///data/notify.db"
ExecStart=/home/ubuntu/notify-service/venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000 --workers 4
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# 启动服务
sudo systemctl daemon-reload
sudo systemctl enable notify
sudo systemctl start notify
sudo systemctl status notify
```

**步骤5：配置Nginx + HTTPS**

```bash
# Nginx配置
sudo nano /etc/nginx/sites-available/notify
```

```nginx
# /etc/nginx/sites-available/notify
server {
    listen 80;
    server_name notify.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket支持
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 86400;
    }
}
```

```bash
# 启用配置
sudo ln -s /etc/nginx/sites-available/notify /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# 申请HTTPS证书
sudo certbot --nginx -d notify.yourdomain.com

# 自动续期测试
sudo certbot renew --dry-run
```

**步骤6：配置定时任务**

```bash
# 编辑crontab
crontab -e
```

```cron
# 每日凌晨3点备份数据库
0 3 * * * /home/ubuntu/notify-service/backup.sh

# 每小时清理过期绑定码
0 * * * * /home/ubuntu/notify-service/venv/bin/python /home/ubuntu/notify-service/cleanup_expired_codes.py

# 每天凌晨4点清理30天前的消息
0 4 * * * /home/ubuntu/notify-service/venv/bin/python /home/ubuntu/notify-service/cleanup_old_messages.py
```

### 8.5 开发环境

```yaml
# docker-compose.dev.yml（本地开发用）
version: '3.8'
services:
  api:
    build: ./api
    ports:
      - "8000:8000"
    volumes:
      - ./data:/app/data    # SQLite持久化
    environment:
      - DATABASE_URL=sqlite:///data/notify.db
      - JWT_SECRET=dev_secret_key
  
  app:
    build: ./flutter_app
    ports:
      - "8080:8080"
    # Flutter开发环境（可选，本地开发更常用flutter run）
```

### 8.5 生产部署脚本

```bash
#!/bin/bash
# deploy.sh - 一键部署到免费服务器

# 1. 安装依赖
pip install fastapi uvicorn[standard] pyjwt aiosqlite websockets

# 2. 初始化数据库
python init_db.py

# 3. 启动服务（后台运行）
nohup uvicorn main:app --host 0.0.0.0 --port 8000 --workers 1 &

# 4. 配置Nginx反向代理（可选）
# 5. 申请HTTPS证书（可选）
```

---

## 九、安全设计

### 9.1 密码安全

```python
# 密码存储：使用bcrypt哈希，永不存储明文
import bcrypt

def hash_password(password: str) -> str:
    """密码哈希（bcrypt，自动加盐）"""
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    """验证密码"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

# 密码强度要求
PASSWORD_RULES = {
    "min_length": 8,
    "require_uppercase": True,
    "require_lowercase": True,
    "require_digit": True,
    "require_special": False  # 可选
}
```

### 9.2 API Key安全

```python
import secrets
import hashlib

def generate_api_key() -> str:
    """生成安全的API Key（64字符）"""
    # 格式：sk_前缀 + 48位随机字符串
    random_part = secrets.token_urlsafe(36)
    return f"sk_{random_part}"

def mask_api_key(key: str) -> str:
    """API Key脱敏显示（仅显示前8位和后4位）"""
    if len(key) <= 12:
        return "****"
    return f"{key[:8]}...{key[-4:]}"

# API Key存储：数据库中存储SHA256哈希，不存储明文
def hash_api_key(key: str) -> str:
    return hashlib.sha256(key.encode()).hexdigest()
```

### 9.3 防攻击策略

| 攻击类型 | 防御措施 | 实现方式 |
|---------|---------|----------|
| **暴力破解** | 登录频率限制 | 5次失败后锁定15分钟 |
| **绑定码猜测** | 6位混合字符 + 10分钟过期 | 36^6 = 21亿种组合 |
| **API Key泄露** | HTTPS强制 + IP白名单（可选） | Nginx配置 |
| **SQL注入** | 参数化查询 | SQLite aiosqlite自动处理 |
| **XSS攻击** | 输入过滤 + 输出转义 | FastAPI自动处理 |
| **CSRF攻击** | JWT Token认证 | 无需CSRF Token |
| **DDoS攻击** | 连接数限制 + 请求频率限制 | Nginx + FastAPI中间件 |
| **消息伪造** | API Key签名验证 | 每个请求验证Key |

### 9.4 频率限制实现

```python
from fastapi import Request, HTTPException
from collections import defaultdict
import time

# 简单的内存限流（生产环境建议用Redis）
rate_limit_store = defaultdict(list)

async def rate_limit(request: Request, calls: int = 60, period: int = 60):
    """
    频率限制：默认60次/分钟
    """
    client_ip = request.client.host
    now = time.time()
    
    # 清理过期记录
    rate_limit_store[client_ip] = [
        t for t in rate_limit_store[client_ip] 
        if t > now - period
    ]
    
    # 检查是否超限
    if len(rate_limit_store[client_ip]) >= calls:
        raise HTTPException(
            status_code=429,
            detail="请求过于频繁，请稍后再试"
        )
    
    rate_limit_store[client_ip].append(now)
```

---

## 十、Flutter APP页面设计

### 10.1 核心页面列表

| 页面 | 功能 | 优先级 |
|------|------|--------|
| **登录/注册页** | 用户认证 | P0 |
| **首页（绑定码）** | 显示绑定码 + 消息概览 | P0 |
| **消息列表页** | 按实例分组显示消息 | P0 |
| **消息详情页** | 消息详情 + 操作按钮 | P0 |
| **实例管理页** | 查看/解绑实例 | P1 |
| **个人中心页** | 修改密码 + 设置 | P2 |

### 10.2 页面原型（文字描述）

**首页（绑定码页面）**：
```
┌─────────────────────────────────────┐
│  星枢通知                    [设置] │
├─────────────────────────────────────┤
│                                     │
│  当前绑定码                          │
│  ┌─────────────────────────────┐   │
│  │                             │   │
│  │      A 3 F 8 K 2            │   │
│  │      (大字体，易复制)        │   │
│  │                             │   │
│  └─────────────────────────────┘   │
│  [复制绑定码]                       │
│                                     │
│  有效期：还剩 8:32                  │
│  [刷新绑定码]                       │
│                                     │
│  ─── 消息概览 ───                   │
│  未读消息：3 条                     │
│  已绑定实例：2 个                   │
│                                     │
│  ─── 最近消息 ───                   │
│  ● 电商项目  构建任务完成    10:30  │
│  ● 电商项目  需要您确认      10:15  │
│  ○ 博客项目  测试全部通过    09:45  │
│                                     │
├─────────────────────────────────────┤
│  [首页]  [消息]  [实例]  [我的]     │
└─────────────────────────────────────┘
```

**消息列表页**：
```
┌─────────────────────────────────────┐
│  消息通知              [全部已读]   │
├─────────────────────────────────────┤
│  [全部] [任务完成] [需确认] [告警]  │
├─────────────────────────────────────┤
│                                     │
│  ── 电商项目-开发环境 ──            │
│                                     │
│  🔴 需要您确认                      │
│  方案门禁：多租户红线阻塞           │
│  10:15              [确认] [驳回]   │
│                                     │
│  🟢 构建任务完成                    │
│  前端项目构建成功，耗时45秒         │
│  10:30                              │
│                                     │
│  ── 博客项目 ──                     │
│                                     │
│  🟢 测试全部通过                    │
│  12个测试用例全部通过               │
│  09:45                              │
│                                     │
└─────────────────────────────────────┘
```

**消息详情页**：
```
┌─────────────────────────────────────┐
│  ← 消息详情                         │
├─────────────────────────────────────┤
│                                     │
│  🔴 需要您确认                      │
│  优先级：高                         │
│  来源：电商项目-开发环境            │
│  时间：2026-10-12 10:15:00         │
│                                     │
│  ─── 详细信息 ───                   │
│  阻塞原因：多租户数据隔离红线       │
│  触发规则：tenant_guard.py         │
│  文件：src/models/order.py         │
│  问题：Order表缺少tenant_id字段    │
│                                     │
│  ─── 建议操作 ───                   │
│  1. 为Order模型添加tenant_id字段   │
│  2. 更新所有查询添加租户过滤       │
│                                     │
│  ┌──────────┐  ┌──────────┐       │
│  │  确认通过  │  │   驳回    │       │
│  └──────────┘  └──────────┘       │
│                                     │
└─────────────────────────────────────┘
```

### 10.3 Flutter项目结构

```
notify_app/
├── lib/
│   ├── main.dart                  # 入口
│   ├── app.dart                   # App配置（路由、主题）
│   ├── core/
│   │   ├── api/
│   │   │   ├── api_client.dart    # Dio封装
│   │   │   ├── auth_api.dart      # 认证接口
│   │   │   ├── message_api.dart   # 消息接口
│   │   │   └── bind_api.dart      # 绑定接口
│   │   ├── websocket/
│   │   │   ├── ws_client.dart     # WebSocket客户端
│   │   │   └── ws_manager.dart    # 连接管理（重连、心跳）
│   │   ├── storage/
│   │   │   ├── local_db.dart      # sqflite离线缓存
│   │   │   └── secure_storage.dart # flutter_secure_storage
│   │   └── utils/
│   │       ├── jwt_store.dart     # JWT存取
│   │       └── clipboard.dart     # 剪贴板工具
│   ├── models/
│   │   ├── user.dart
│   │   ├── message.dart
│   │   └── instance.dart
│   ├── providers/                 # Riverpod状态管理
│   │   ├── auth_provider.dart
│   │   ├── message_provider.dart
│   │   └── bindcode_provider.dart
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── login_screen.dart
│   │   │   └── register_screen.dart
│   │   ├── home/
│   │   │   └── home_screen.dart   # 绑定码 + 消息概览
│   │   ├── messages/
│   │   │   ├── message_list_screen.dart
│   │   │   └── message_detail_screen.dart
│   │   ├── instances/
│   │   │   └── instance_list_screen.dart
│   │   └── profile/
│   │       └── profile_screen.dart
│   └── widgets/
│       ├── bindcode_display.dart   # 绑定码大字体组件
│       ├── message_card.dart       # 消息卡片
│       └── priority_badge.dart     # 优先级标签
├── android/
├── ios/
├── web/
├── pubspec.yaml
└── README.md
```

### 10.4 Flutter核心依赖

```yaml
# pubspec.yaml
dependencies:
  flutter:
    sdk: flutter
  
  # 状态管理
  flutter_riverpod: ^2.5.1
  
  # 网络请求
  dio: ^5.4.3
  
  # WebSocket
  web_socket_channel: ^2.4.5
  
  # 本地存储
  sqflite: ^2.3.3
  flutter_secure_storage: ^9.0.0
  shared_preferences: ^2.2.3
  
  # 路由
  go_router: ^14.2.0
  
  # UI
  google_fonts: ^6.2.1
  
  # 本地通知
  flutter_local_notifications: ^17.0.0
  
  # 剪贴板
  flutter_clipboard: ^1.0.0
```

---

## 十一、WebSocket离线消息方案

### 11.1 问题

WebSocket只在客户端在线时能推送消息。用户关闭APP或网络断开时，消息会丢失。

### 11.2 解决方案：服务端持久化 + 客户端拉取

```
在线状态：
APP ←──WebSocket──→ 服务端
     实时推送新消息

离线状态：
APP（关闭）          服务端
                     ├─ 钩子POST消息
                     ├─ 写入SQLite（is_read=false）
                     └─ 标记"待推送"

重连时：
APP ←──WebSocket──→ 服务端
     ├─ 1. 建立连接，发送user_id
     ├─ 2. 请求离线消息（last_sync_time）
     ├─ 3. 服务端返回增量消息
     └─ 4. 客户端写入本地sqflite
```

### 11.3 服务端实现

```python
# websocket.py
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import json
from datetime import datetime

router = APIRouter()

# 内存中维护在线用户连接
active_connections: dict[int, WebSocket] = {}  # user_id -> websocket

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: str):
    """WebSocket端点"""
    # 1. 验证JWT，获取user_id
    user_id = verify_ws_token(token)
    if not user_id:
        await websocket.close(code=4001, reason="认证失败")
        return
    
    await websocket.accept()
    active_connections[user_id] = websocket
    
    try:
        while True:
            data = await websocket.receive_text()
            msg = json.loads(data)
            
            # 客户端心跳
            if msg.get("type") == "ping":
                await websocket.send_json({"type": "pong"})
            
            # 客户端请求离线消息
            elif msg.get("type") == "sync":
                last_sync = msg.get("last_sync_time")
                missed = get_missed_messages(user_id, last_sync)
                await websocket.send_json({
                    "type": "sync_result",
                    "messages": missed
                })
            
            # 客户端操作回传
            elif msg.get("type") == "action":
                handle_action(user_id, msg)
    
    except WebSocketDisconnect:
        active_connections.pop(user_id, None)

async def push_to_user(user_id: int, message: dict):
    """推送消息给在线用户"""
    ws = active_connections.get(user_id)
    if ws:
        try:
            await ws.send_json({
                "type": "new_message",
                "message": message
            })
            return True
        except Exception:
            active_connections.pop(user_id, None)
    return False  # 用户离线，消息已持久化到SQLite

def get_missed_messages(user_id: int, since: str) -> list:
    """获取离线期间的消息"""
    db = get_db()
    cursor = db.execute(
        "SELECT * FROM messages WHERE user_id = ? AND created_at > ? ORDER BY created_at",
        (user_id, since)
    )
    return [dict(row) for row in cursor.fetchall()]
```

### 11.4 Flutter客户端实现

```dart
// ws_manager.dart
import 'package:web_socket_channel/web_socket_channel.dart';
import 'dart:async';
import 'dart:convert';

class WebSocketManager {
  WebSocketChannel? _channel;
  Timer? _heartbeatTimer;
  Timer? _reconnectTimer;
  int _reconnectAttempts = 0;
  String? _token;
  String? _lastSyncTime;
  
  // 回调
  Function(Map<String, dynamic>)? onNewMessage;
  Function()? onConnected;
  Function()? onDisconnected;

  void connect(String wsUrl, String token) {
    _token = token;
    _channel = WebSocketChannel.connect(
      Uri.parse('$wsUrl?token=$token')
    );
    
    _channel!.stream.listen(
      (data) {
        _reconnectAttempts = 0;  // 重置重连计数
        final msg = jsonDecode(data);
        
        switch (msg['type']) {
          case 'new_message':
            onNewMessage?.call(msg['message']);
            _lastSyncTime = DateTime.now().toIso8601String();
            break;
          case 'pong':
            break;  // 心跳响应
          case 'sync_result':
            _handleSyncResult(msg['messages']);
            break;
        }
      },
      onDone: () {
        onDisconnected?.call();
        _scheduleReconnect();
      },
      onError: (e) {
        _scheduleReconnect();
      },
    );
    
    // 启动心跳（每30秒一次）
    _startHeartbeat();
    
    // 连接成功后请求离线消息
    _requestSync();
    onConnected?.call();
  }

  void _startHeartbeat() {
    _heartbeatTimer?.cancel();
    _heartbeatTimer = Timer.periodic(
      Duration(seconds: 30),
      (_) => _send({'type': 'ping'})
    );
  }

  void _scheduleReconnect() {
    _reconnectAttempts++;
    // 指数退避：1s, 2s, 4s, 8s, 最大30s
    final delay = min(30, pow(2, _reconnectAttempts).toInt());
    _reconnectTimer = Timer(Duration(seconds: delay), () {
      if (_token != null) {
        connect('wss://notify.example.com/ws', _token!);
      }
    });
  }

  void _requestSync() {
    _send({
      'type': 'sync',
      'last_sync_time': _lastSyncTime ?? '2020-01-01T00:00:00Z'
    });
  }

  void sendAction(int messageId, String action) {
    _send({
      'type': 'action',
      'message_id': messageId,
      'action': action
    });
  }

  void _send(Map<String, dynamic> data) {
    _channel?.sink.add(jsonEncode(data));
  }

  void disconnect() {
    _heartbeatTimer?.cancel();
    _reconnectTimer?.cancel();
    _channel?.sink.close();
  }
}
```

---

## 十二、开发计划（多用户版）

### 12.1 阶段划分

| 阶段 | 任务 | 工期 | 产出 |
|------|------|------|------|
| **阶段1：用户系统** | 多用户基础功能 | 3天 | 可注册登录 |
| | - 用户注册/登录API | | |
| | - 绑定码生成与验证 | | |
| | - JWT认证中间件 | | |
| **阶段2：推送核心** | 消息推送链路 | 3天 | 完整推送链路 |
| | - 钩子脚本（多用户版） | | |
| | - 消息接收与持久化 | | |
| | - WebSocket实时推送 + 离线同步 | | |
| **阶段3：Flutter APP** | 移动端界面 | 5天 | 可用APP |
| | - 注册/登录页面 | | |
| | - 绑定码展示页面（大字体，一键复制） | | |
| | - 消息列表与详情 | | |
| | - WebSocket连接与sqflite离线缓存 | | |
| | - 操作回传功能 | | |
| **阶段4：部署上线** | Oracle Cloud部署 | 2天 | 生产环境 |
| | - SQLite数据库初始化（WAL模式） | | |
| | - Nginx反向代理 + HTTPS | | |
| | - systemd服务 + 定时备份 | | |

**总工期：13天**

### 12.2 技术栈确认清单

- [x] 确认APP开发框架：**Flutter**（高性能、跨平台、UI一致性强）
- [x] 确认推送服务：**WebSocket only**（免费，无第三方依赖）
- [x] 确认后端技术栈：**FastAPI**（轻量，异步）
- [x] 确认数据库：**SQLite**（免费服务器适配）
- [x] 确认部署方式：**单进程Uvicorn**（简化部署）
- [x] 确认免费服务器平台：**Oracle Cloud Free Tier**（2核12GB ARM，永久免费）

---

## 十三、风险与应对（多用户版）

| 风险 | 影响 | 概率 | 应对措施 |
|------|------|------|----------|
| **免费服务器限制** | 性能瓶颈、随时关停 | 中 | 数据定期备份，准备迁移方案 |
| **SQLite并发写入** | 多用户同时推送时冲突 | 中 | WAL模式 + 写入队列 + 重试机制 |
| **WebSocket断连** | 用户收不到实时消息 | 高 | 心跳检测 + 指数退避重连 + 离线消息拉取 |
| **绑定码泄露** | 他人恶意绑定 | 低 | 10分钟过期 + 一次性使用 + 频率限制 |
| **API Key泄露** | 他人伪造推送 | 中 | HTTPS传输 + Key轮换机制 + 异常检测 |
| **APP审核失败** | 无法上架应用商店 | 中 | 提前了解政策，准备H5版本（Flutter Web）备选 |
| **钩子性能影响** | Agent执行变慢 | 中 | 异步推送 + 5秒超时 + 静默失败 |
| **数据隔离失效** | 用户看到他人消息 | 低 | 所有查询强制user_id过滤 + 单元测试覆盖 |

### 13.1 免费服务器应对策略

```
风险：免费服务器可能随时关停或限制资源

应对方案：
1. 数据备份
   - 每日自动备份SQLite到对象存储（如Cloudflare R2）
   - 用户可导出自己的消息历史

2. 迁移准备
   - 使用标准SQL语法，便于迁移到PostgreSQL
   - 配置文件外部化，便于切换服务器

3. 降级方案
   - 服务器不可用时，钩子静默失败
   - APP缓存最近消息（sqflite），恢复后同步

4. 监控告警
   - 服务器资源监控（CPU/内存/磁盘）
   - 异常流量告警
   - systemd自动重启 + watchdog
```

---

## 十四、下一步行动

### 14.1 立即执行（阶段1）

1. **申请Oracle Cloud免费服务器**
   - 注册Oracle Cloud账号（需信用卡验证）
   - 创建ARM实例（2核12GB）
   - 配置防火墙（安全列表 + iptables）

2. **搭建后端骨架**
   ```bash
   mkdir notify-service && cd notify-service
   # 创建FastAPI项目结构
   ├── main.py              # 入口
   ├── models.py            # SQLite模型
   ├── auth.py              # JWT认证 + bcrypt
   ├── bind.py              # 绑定码逻辑
   ├── push.py              # 消息推送
   ├── websocket.py         # WebSocket处理 + 离线同步
   └── notify.db            # SQLite数据库
   ```

3. **实现核心API**
   - POST /api/auth/register（注册）
   - POST /api/auth/login（登录）
   - POST /api/auth/bindcode（生成绑定码）
   - POST /api/bind/verify（验证绑定）
   - POST /api/push（接收推送）
   - GET /api/messages（查询消息）
   - WebSocket /ws（实时推送 + 离线同步）

### 14.2 开发原型（阶段2）

4. **实现钩子脚本**
   - notification_hook.py（多用户版）
   - 读取 .claude/notification_config.json
   - 使用API Key认证推送

5. **开发Flutter APP基础版**
   - 注册/登录页面
   - 绑定码展示页面（大字体，一键复制）
   - 消息列表页面
   - WebSocket连接 + sqflite离线缓存

### 14.3 测试与部署（阶段3）

6. **端到端测试**
   - 用户注册 → 生成绑定码 → 插件绑定 → 推送消息 → APP接收
   - 离线测试：关闭APP → 触发推送 → 重新打开 → 验证消息同步

7. **部署上线**
   - Oracle Cloud环境配置
   - SQLite数据库初始化（WAL模式）
   - Nginx反向代理 + Let's Encrypt HTTPS
   - systemd服务 + 定时备份脚本
   - 域名解析（可选）

---

## 十五、参考资料

- Claude Code Hooks文档：https://docs.anthropic.com/en/docs/claude-code/hooks
- Flutter官方文档：https://flutter.dev/docs
- FastAPI文档：https://fastapi.tiangolo.com/
- SQLite文档：https://www.sqlite.org/docs.html
- WebSocket协议：https://developer.mozilla.org/zh-CN/docs/Web/API/WebSockets_API
- Oracle Cloud Free Tier：https://www.oracle.com/cloud/free/
- Riverpod状态管理：https://riverpod.dev/docs/getting_started
- Dio网络请求：https://pub.dev/packages/dio

---

## 调研结论

**技术方案已确定**：
- **APP框架**：Flutter（高性能、跨平台、UI一致性强）
- **后端服务**：FastAPI + SQLite（轻量级，适配免费服务器）
- **推送通道**：WebSocket（免费，无第三方依赖，离线消息靠持久化+重连拉取）
- **认证机制**：JWT + API Key（插件端使用API Key，APP端使用JWT）
- **绑定机制**：6位绑定码（10分钟过期，一次性使用）
- **部署平台**：Oracle Cloud Free Tier（2核12GB ARM，永久免费）

**核心特性**：
1. **多用户系统**：支持注册登录，数据完全隔离
2. **绑定码机制**：用户生成绑定码 → 插件输入完成关联
3. **多实例绑定**：同一用户可绑定多个插件实例（不同项目）
4. **离线消息**：服务端SQLite持久化 + APP重连后增量拉取
5. **免费部署**：SQLite + 单进程，资源占用极低（~200MB内存）

**预计工期**：13天（4阶段）
- 阶段1：用户系统（3天）
- 阶段2：推送核心（3天）
- 阶段3：Flutter APP开发（5天）
- 阶段4：Oracle Cloud部署上线（2天）

**下一步**：申请Oracle Cloud免费服务器，搭建后端骨架，实现核心API。

---

## 实现状态（2026-10-13 更新）

本方案已**全量实现**，代码位于 `src/` 目录：

```
src/
├── notify-service/          # 推送服务后端（FastAPI + SQLite）
│   ├── app/
│   │   ├── main.py              # 入口（lifespan + CORS + 路由注册 + 定时清理）
│   │   ├── config.py            # 环境变量配置
│   │   ├── database.py          # SQLite WAL + 5张表 + 清理任务
│   │   ├── security.py          # bcrypt / JWT / API Key / 绑定码
│   │   ├── deps.py              # JWT 与 API Key 双认证依赖
│   │   ├── rate_limit.py        # 频率限制 + 登录防爆破
│   │   ├── schemas.py           # Pydantic 模型
│   │   ├── routers/             # auth / bind / messages / devices / websocket
│   │   └── services/
│   │       ├── connection_manager.py  # WebSocket 连接池 + 心跳
│   │       ├── emas.py                # 阿里云 EMAS 客户端（POP签名）
│   │       └── notifier.py            # 推送路由（在线WS / 离线EMAS）
│   ├── tests/                   # pytest 单元测试 + e2e_manual.py
│   └── README.md                # 部署文档（含 Oracle Cloud + Nginx + systemd）
│
├── notify-hook/              # Claude Code 钩子
│   ├── notification_hook.py       # PostToolUse 钩子（静默失败/去重/5s超时）
│   └── README.md                  # 安装绑定指南
│
└── flutter-app/             # 星枢通知 APP（Flutter 3.x + Riverpod）
    ├── lib/
    │   ├── main.dart              # 入口 + go_router
    │   ├── core/                  # config + theme
    │   ├── models/                # User / Message / Instance
    │   ├── services/              # API / WebSocket / Push(EMAS) / Storage
    │   ├── providers/             # auth / message / bind
    │   ├── pages/                 # 登录/首页/列表/详情/实例/我的
    │   └── widgets/               # 绑定码卡片 / 消息项
    └── README.md                  # 构建指南 + EMAS 集成步骤
```

### 已验证（2026-10-13）

| 验证项 | 结果 |
|--------|------|
| 全部 Python 模块编译 | ✅ |
| pytest 4 项测试（注册/绑定全流程/认证拒绝/绑定码一次性） | ✅ 4 passed |
| 端到端：注册→绑定码→插件绑定→钩子推送→查询 | ✅ |
| WebSocket 实时推送（delivered_via=websocket） | ✅ |
| 心跳 ping/pong | ✅ |
| 消息持久化 + 增量查询 | ✅ |
| 操作回传（confirm） | ✅ |

### 与方案的差异说明

| 方案原设计 | 实际实现 | 原因 |
|-----------|---------|------|
| 手机号+验证码注册 | 用户名+密码注册 | 避免短信服务商依赖与成本，免费部署 |
| 内存队列（asyncio.Queue） | 直接投递（无中间队列） | 单进程场景下 SQLite + 直投更简单可靠 |
| Redis Pub/Sub | 连接管理器内存字典 | 免费服务器零依赖 |

### 待完成（依赖外部资源）

1. **阿里云 EMAS 接入**：需在控制台开通移动推送，按 `flutter-app/README.md` 完成 Android 原生配置，并取消 `push_service.dart` 中 TODO 注释
2. **Oracle Cloud 服务器申请**：按 `notify-service/README.md` 部署
3. **starxhub 插件命令封装**：将 `/notify-bind <绑定码>` 封装为插件 skill（当前通过 curl/配置文件手动完成绑定）

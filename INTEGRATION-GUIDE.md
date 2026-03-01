# Telegram MiniApp - 项目状态数据库集成指南

## 📊 架构图

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Telegram       │     │  Mini App        │     │  Project State  │
│  Bot            │────▶│  (Web Frontend)  │────▶│  Database       │
│                 │     │                  │     │  (SQLite)       │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │
                               │     ┌──────────────────┐
                               │     │  Sync Service    │
                               └────▶│  (Node.js)       │
                                     │  Port: 3001      │
                                     └──────────────────┘
```

## 🎯 功能特性

### 实时更新
- ✅ 自动刷新（30 秒间隔）
- ✅ 手动刷新按钮
- ✅ 最后更新时间显示

### 任务看板
- ✅ 按项目分组显示
- ✅ 状态过滤（全部/待处理/进行中/已完成）
- ✅ 优先级标签
- ✅ 完成进度统计

### 统计信息
- ✅ 总任务数
- ✅ 已完成任务数
- ✅ 进行中任务数
- ✅ 待处理任务数

## 📁 文件结构

```
telegram-miniapp/
├── api/
│   └── sync-project-state.js    # 数据同步服务
├── public/
│   ├── index-tasks.html         # 任务看板页面
│   └── app-tasks-live.js        # 前端逻辑
├── data/
│   └── project-state-cache.json # 缓存文件
└── package.json
```

## 🚀 部署步骤

### 步骤 1: 启动项目状态数据库 API

```bash
cd C:\Users\x\.openclaw\workspace\config
node dashboard-api.js
```

**访问:** http://localhost:3000

### 步骤 2: 启动同步服务

```bash
cd C:\Users\x\.openclaw\workspace\telegram-miniapp
node api/sync-project-state.js
```

**访问:** http://localhost:3001

### 步骤 3: 部署前端

**选项 A: 本地测试**
```bash
# 使用任意 HTTP 服务器
npx serve public
```

**选项 B: GitHub Pages**
```bash
# 推送到 GitHub
git add .
git commit -m "Update tasks dashboard"
git push

# GitHub Pages 会自动部署
```

**选项 C: Vercel**
```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署
vercel --prod
```

### 步骤 4: 配置 Telegram Bot

1. 打开 @BotFather
2. 选择你的 Bot
3. 设置 Menu Button:
   ```
   /setmenubutton
   选择 Bot
   输入 URL: https://your-deployment-url/index-tasks.html
   输入标题：任务看板
   ```

## 🔧 配置选项

### 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `PROJECT_STATE_API` | 项目状态数据库 API 地址 | http://localhost:3000 |
| `REFRESH_INTERVAL` | 刷新间隔（毫秒） | 30000 |
| `API_URL` | MiniApp API 地址 | http://localhost:3001 |

### 修改配置

编辑 `api/sync-project-state.js`:

```javascript
const CONFIG = {
    PROJECT_STATE_API: 'http://your-server:3000',
    REFRESH_INTERVAL: 60000, // 1 分钟
    // ...
};
```

## 📊 API 端点

### 同步服务 API (Port 3001)

| 端点 | 说明 | 参数 |
|------|------|------|
| `GET /api/stats` | 统计信息 | - |
| `GET /api/projects` | 项目列表 | - |
| `GET /api/tasks` | 任务列表 | `?project=&status=` |
| `GET /api/evolutions` | 进化历史 | `?limit=` |
| `GET /api/dashboard` | 聚合仪表板 | - |
| `GET /api/health` | 健康检查 | - |

### 项目状态数据库 API (Port 3000)

| 端点 | 说明 |
|------|------|
| `GET /api/stats` | 统计信息 |
| `GET /api/projects` | 项目列表 |
| `GET /api/tasks` | 任务列表 |
| `GET /api/evolutions` | 进化历史 |
| `GET /api/metrics` | 指标数据 |

## 🧪 测试

### 测试同步服务

```bash
# 检查健康状态
curl http://localhost:3001/api/health

# 获取统计数据
curl http://localhost:3001/api/stats

# 获取项目列表
curl http://localhost:3001/api/projects
```

### 测试前端

1. 打开浏览器访问部署的 URL
2. 检查统计卡片是否显示
3. 检查项目列表是否正确
4. 测试状态过滤功能
5. 点击刷新按钮验证更新

### 测试 Telegram 集成

1. 在 Telegram 中打开 Bot
2. 点击 Menu Button
3. 验证 MiniApp 正常加载
4. 检查数据是否正确显示

## 📱 界面预览

### 统计卡片区
```
┌────────────────────────────────────┐
│  📋 任务看板                        │
├────────┬────────┬────────┬────────┤
│   18   │   15   │   2    │   1    │
│ 总任务 │ 已完成 │ 进行中 │ 待处理 │
└────────┴────────┴────────┴────────┘
```

### 过滤器
```
[全部] [待处理] [进行中] [已完成]
```

### 项目列表
```
┌────────────────────────────────────┐
│ Evolver                    🟢 运行中│
│ 4/4 完成 (100%)                    │
├────────────────────────────────────┤
│ ✅ 已完成     🔴 高优先级          │
│ 分析 Evolver 项目结构和依赖          │
│ 📅 2 小时前  📁 Evolver            │
└────────────────────────────────────┘
```

## 🔍 故障排除

### 问题 1: 数据不显示

**检查:**
1. 项目状态数据库 API 是否运行
2. 同步服务是否运行
3. 查看浏览器控制台错误

**解决:**
```bash
# 检查 API 状态
curl http://localhost:3000/api/stats

# 检查同步服务状态
curl http://localhost:3001/api/health
```

### 问题 2: 刷新失败

**检查:**
1. 网络连接
2. CORS 配置
3. API 地址是否正确

**解决:**
- 确保 API 地址配置正确
- 检查防火墙设置
- 查看同步服务日志

### 问题 3: Telegram 无法加载

**检查:**
1. URL 是否 HTTPS
2. Telegram Bot 配置
3. 网页是否可公开访问

**解决:**
- 使用 HTTPS 部署（Vercel/GitHub Pages）
- 重新配置 Bot Menu Button
- 检查部署状态

## 📈 性能优化

### 缓存策略

同步服务会自动缓存数据：
- 缓存文件：`data/project-state-cache.json`
- 缓存更新：每 30 秒
- 缓存读取：毫秒级

### 减少请求

- 使用聚合 API `/api/dashboard`
- 前端缓存数据
- 按需加载（过滤时不请求新数据）

### 优化建议

1. **生产环境** - 增加刷新间隔到 60 秒
2. **大数据量** - 实现分页加载
3. **实时性要求高** - 使用 WebSocket

## 🎨 自定义主题

### 修改颜色

编辑 `index-tasks.html`:

```css
:root {
    --tg-theme-bg-color: #ffffff;
    --tg-theme-text-color: #000000;
    --tg-theme-button-color: #3390ec;
    /* ... */
}
```

### Telegram 主题适配

MiniApp 会自动适配 Telegram 主题：
- 白天模式
- 夜间模式
- 自定义主题色

## 📝 更新日志

### v1.0 (2026-03-01)
- ✅ 初始版本
- ✅ 项目状态数据库集成
- ✅ 实时更新
- ✅ 状态过滤
- ✅ 统计卡片

---

**创建日期:** 2026-03-01  
**版本:** 1.0  
**状态:** ✅ 完成

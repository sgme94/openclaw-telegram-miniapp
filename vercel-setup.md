# Vercel 部署指南

## 🚀 快速部署

### 步骤 1: 安装 Vercel CLI

```bash
npm install -g vercel
```

### 步骤 2: 登录 Vercel

```bash
vercel login
```

支持以下登录方式：
- GitHub
- GitLab
- Bitbucket
- Email

### 步骤 3: 配置环境变量

创建 `.env` 文件：

```bash
# .env
PROJECT_STATE_API=https://your-project-state-api.com
REFRESH_INTERVAL=30000
```

**重要:** 项目状态数据库 API 也需要部署到可公开访问的地址。

### 步骤 4: 部署到 Vercel

```bash
cd C:\Users\x\.openclaw\workspace\telegram-miniapp
vercel --prod
```

首次部署会提示：
- Set up and deploy? **Y**
- Which scope? **选择你的账户**
- Link to existing project? **N**
- What's your project's name? **openclaw-telegram-miniapp**
- In which directory is your code located? **./**
- Want to override the settings? **N**

### 步骤 5: 配置生产环境变量

部署完成后，在 Vercel 控制台配置：

1. 访问 https://vercel.com/dashboard
2. 选择你的项目
3. 进入 Settings → Environment Variables
4. 添加变量：
   - `PROJECT_STATE_API` - 项目状态数据库 API 地址
   - `REFRESH_INTERVAL` - 刷新间隔（毫秒）

---

## 📊 部署架构

```
┌─────────────────┐
│  Telegram Bot   │
│  @YourBot       │
└────────┬────────┘
         │
         │ Menu Button
         ▼
┌─────────────────┐
│  Vercel         │
│  (Frontend +    │
│   API Routes)   │
└────────┬────────┘
         │
         │ Fetch /api/dashboard
         ▼
┌─────────────────┐
│  Your Server    │
│  (Project State │
│   Database API) │
└─────────────────┘
```

---

## 🔧 配置选项

### 前端配置

编辑 `public/app-tasks-live.js`:

```javascript
const CONFIG = {
    // 生产环境使用 Vercel API
    API_URL: window.location.origin,
    
    // 刷新间隔
    REFRESH_INTERVAL: 30000,
    
    // 自动刷新
    AUTO_REFRESH: true
};
```

### API 配置

编辑 `api/sync-project-state.js`:

```javascript
const CONFIG = {
    // 从环境变量读取
    PROJECT_STATE_API: process.env.PROJECT_STATE_API || 'http://localhost:3000',
    REFRESH_INTERVAL: parseInt(process.env.REFRESH_INTERVAL) || 30000
};
```

---

## 🌐 项目状态数据库 API 部署

### 选项 A: 部署到 Railway

1. 访问 https://railway.app
2. 创建新项目
3. 部署方式：
   - **Docker:** 创建 Dockerfile
   - **GitHub:** 连接仓库自动部署

**Dockerfile 示例:**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["node", "config/dashboard-api.js"]
```

### 选项 B: 部署到 Render

1. 访问 https://render.com
2. 创建 Web Service
3. 连接 GitHub 仓库
4. 配置：
   - Build Command: `npm install`
   - Start Command: `node config/dashboard-api.js`

### 选项 C: 自有服务器

```bash
# 在服务器上运行
cd /path/to/workspace/config
node dashboard-api.js

# 使用 PM2 管理
npm install -g pm2
pm2 start dashboard-api.js --name project-state-api
pm2 save
pm2 startup
```

---

## 🔒 安全配置

### CORS 配置

编辑 `api/sync-project-state.js`:

```javascript
const ALLOWED_ORIGINS = [
    'https://your-app.vercel.app',
    'https://telegram.org'
];

res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGINS);
```

### API 认证（可选）

```javascript
const API_KEY = process.env.API_KEY;

if (req.headers.authorization !== `Bearer ${API_KEY}`) {
    res.writeHead(401);
    res.end(JSON.stringify({ error: 'Unauthorized' }));
    return;
}
```

---

## 📱 Telegram Bot 配置

### 设置 Menu Button

1. 打开 @BotFather
2. 发送 `/setmenubutton`
3. 选择你的 Bot
4. 输入 Vercel URL: `https://your-app.vercel.app/index-tasks.html`
5. 输入标题：`任务看板`

### 设置 Inline Keyboard（可选）

在 Bot 代码中添加：

```javascript
const keyboard = {
    inline_keyboard: [[
        { text: '📋 任务看板', url: 'https://your-app.vercel.app/index-tasks.html' },
        { text: '📊 项目状态', url: 'https://your-app.vercel.app/index-projects.html' }
    ]]
};
```

---

## 🧪 测试部署

### 本地测试

```bash
# 1. 安装 Vercel CLI
npm i -g vercel

# 2. 本地运行
vercel dev

# 访问 http://localhost:3000
```

### 生产测试

```bash
# 1. 部署
vercel --prod

# 2. 获取部署 URL
# https://your-app.vercel.app

# 3. 测试 API
curl https://your-app.vercel.app/api/health

# 4. 测试前端
# 在浏览器中打开 https://your-app.vercel.app/index-tasks.html
```

---

## 🔍 故障排除

### 问题 1: 404 Not Found

**原因:** Vercel 配置问题

**解决:**
```bash
# 检查 vercel.json 配置
cat vercel.json

# 重新部署
vercel --prod
```

### 问题 2: API 无法连接

**原因:** 项目状态数据库 API 地址配置错误

**解决:**
```bash
# 在 Vercel 控制台检查环境变量
# Settings → Environment Variables

# 确保 PROJECT_STATE_API 指向正确的地址
```

### 问题 3: CORS 错误

**原因:** 跨域请求被阻止

**解决:**
```javascript
// 在 api/sync-project-state.js 中添加
res.setHeader('Access-Control-Allow-Origin', '*');
```

---

## 📈 性能优化

### 启用缓存

Vercel 自动缓存静态文件，对于 API 响应：

```javascript
res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
```

### 减少请求

- 使用聚合 API `/api/dashboard`
- 前端缓存数据
- 增加刷新间隔到 60 秒

---

## 💰 成本估算

### Vercel 免费计划

- ✅ 无限静态文件托管
- ✅ 100GB 带宽/月
- ✅ 1000 次 Serverless 函数执行/天
- ✅ 自动 HTTPS

### 付费计划 ($20/月)

- 更多带宽
- 更多 Serverless 执行
- 团队协作功能

**对于小型项目，免费计划足够使用。**

---

## 📝 检查清单

部署前检查：

- [ ] `vercel.json` 配置正确
- [ ] `.env` 文件包含必要变量
- [ ] 项目状态数据库 API 可公开访问
- [ ] 前端 API 地址配置正确
- [ ] Telegram Bot Menu Button 已配置

部署后验证：

- [ ] 前端页面正常加载
- [ ] API 端点返回数据
- [ ] 自动刷新正常工作
- [ ] Telegram MiniApp 正常打开
- [ ] 统计数据正确显示

---

**创建日期:** 2026-03-01  
**版本:** 1.0  
**状态:** ✅ 待部署

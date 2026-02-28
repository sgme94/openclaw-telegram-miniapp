# OpenClaw Telegram Mini App - 快速部署指南

## ✅ 已完成

- [x] 前端页面（HTML + CSS + JS）
- [x] Telegram WebApp 集成
- [x] OpenClaw API 连接
- [x] 实时刷新（10 秒）

## 📁 文件位置

```
C:\Users\x\.openclaw\workspace\telegram-miniapp\
├── public/
│   ├── index.html    # 主页面
│   └── app.js        # 前端逻辑
├── package.json
├── vercel.json
├── README.md
└── DEPLOY.md
```

## 🚀 部署方式（3 选 1）

### 方式 1: Vercel（推荐）

```bash
cd C:\Users\x\.openclaw\workspace\telegram-miniapp
vercel login
vercel --prod
```

### 方式 2: GitHub Pages（免费）

1. 创建 GitHub 仓库
2. 推送代码
3. Settings → Pages → 启用

### 方式 3: 本地测试

```bash
cd public
python -m http.server 8080
# 访问 http://localhost:8080
```

## 🔧 配置 Telegram Bot

1. 打开 Telegram，找到 @BotFather
2. 发送 `/newapp`
3. 按提示配置：
   - App 标题：`OpenClaw 监控`
   - Web App URL: `https://你的部署地址.vercel.app`
   - 短名称：`openclaw`

## ⚠️ 重要配置

### Gateway 地址

如果 OpenClaw Gateway 在本地，需要：

1. 使用 ngrok 暴露：
   ```bash
   ngrok http 18688
   ```

2. 修改 `public/app.js`：
   ```javascript
   const GATEWAY_URL = 'https://你的 ngrok 地址.ngrok.io';
   ```

### CORS 配置

确保 Gateway 允许跨域请求。

## 📱 使用

1. Telegram 打开你的 Bot
2. 点击菜单按钮
3. 查看实时任务状态

## 📊 功能

- ✅ 会话总数统计
- ✅ 活跃会话数
- ✅ Token 使用量
- ✅ 会话列表（ID/状态/模型/最后活动）
- ✅ 自动刷新（10 秒）
- ✅ Telegram 主题适配

## 🛠️ 下一步

1. 部署到 Vercel
2. 配置 Bot
3. 测试访问

需要帮助？告诉我！

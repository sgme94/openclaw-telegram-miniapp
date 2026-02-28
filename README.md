# Telegram Mini App - OpenClaw 任务监控

## 架构图

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Telegram      │     │   Mini App       │     │   OpenClaw      │
│   Bot           │────▶│   (Web Frontend) │────▶│   Gateway       │
│                 │     │                  │     │   (WebSocket)   │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                       │                        │
        │  /tasks 命令          │  fetch() API           │  sessions API
        │                       │                        │
```

## 文件结构

```
telegram-miniapp/
├── public/
│   ├── index.html        # 主页面
│   ├── app.js           # 前端逻辑
│   └── style.css        # 样式
├── server/
│   └── api.js           # 后端 API 代理（可选）
├── package.json
└── README.md
```

## 关键 API

### OpenClaw Gateway API
- `GET /sessions` - 获取所有会话
- `GET /sessions/:id` - 获取会话详情
- `WS /ws` - WebSocket 实时连接

### Telegram Bot API
- `setMenuButton` - 设置 Mini App 入口
- `answerWebAppQuery` - 响应查询

## 部署方案

### 方案 A: GitHub Pages（最简单）
1. 静态文件推送到 GitHub
2. 启用 GitHub Pages
3. Telegram Bot 配置 URL

### 方案 B: Vercel（推荐）
1. 推送到 GitHub
2. 导入 Vercel
3. 自动部署

## 实现步骤

1. 创建 HTML 页面
2. 集成 Telegram WebApp SDK
3. 调用 OpenClaw API
4. 部署到 Vercel
5. 配置 Telegram Bot

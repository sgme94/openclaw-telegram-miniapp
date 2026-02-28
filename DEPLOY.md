# 部署指南

## 步骤 1: 部署到 Vercel

### 方法 A: 命令行部署

```bash
cd C:\Users\x\.openclaw\workspace\telegram-miniapp
npm install -g vercel
vercel --prod
```

### 方法 B: GitHub + Vercel

1. 创建 GitHub 仓库
2. 推送代码：
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/openclaw-miniapp.git
   git push -u origin main
   ```

3. 访问 [vercel.com](https://vercel.com)
4. Import 你的仓库
5. 点击 Deploy

## 步骤 2: 配置 Telegram Bot

### 获取部署 URL

部署完成后，你会得到一个 URL，例如：
`https://openclaw-miniapp.vercel.app`

### 配置 Bot

1. 在 Telegram 中与 @BotFather 对话
2. 发送 `/newapp`
3. 选择你的 Bot
4. 输入 App 标题：`OpenClaw 监控`
5. 输入 App 描述：`实时查看 OpenClaw 任务状态`
6. 上传一张 640x360 的截图（可选）
7. 输入 Web App URL：`https://openclaw-miniapp.vercel.app`
8. 输入短名称：`openclaw`

### 完成！

现在你的 Bot 会有一个菜单按钮，点击即可打开 Mini App。

## 步骤 3: 配置 Gateway 地址

**重要：** 如果你的 OpenClaw Gateway 不在本地，需要修改 `public/app.js` 中的 `GATEWAY_URL`：

```javascript
const GATEWAY_URL = 'https://your-gateway.example.com';
```

如果 Gateway 在本地且需要公网访问，可以使用 ngrok：

```bash
ngrok http 18688
```

然后用 ngrok 的 URL 替换 `GATEWAY_URL`。

## 测试

1. 在 Telegram 中打开你的 Bot
2. 点击菜单按钮或发送 `/openclaw`
3. 查看任务列表

## 故障排查

### 显示"加载失败"

- 检查 Gateway 是否运行：`openclaw gateway status`
- 检查 CORS：Gateway 需要允许跨域请求
- 检查网络：确保 Mini App 能访问 Gateway

### 没有会话显示

- 确保有活跃的会话
- 检查 API 格式：`openclaw sessions --json`

### 样式问题

- Telegram 主题颜色可能不兼容
- 在 `app.js` 中调整默认颜色值

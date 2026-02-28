# Telegram Mini App 配置说明

## 当前配置

**Bot:** @Omybot666_bot  
**Mini App URL:** https://sgme94.github.io/openclaw-telegram-miniapp/

## 问题

Telegram Bot 菜单中的 Mini App 缓存了旧版本。

## 解决方案

### 方案 1：在 BotFather 中更新菜单按钮

1. 打开 Telegram，搜索 **@BotFather**
2. 发送 `/mybots`
3. 选择 **@Omybot666_bot**
4. 点击 **Bot Settings**
5. 点击 **Menu Button**
6. 选择 **Configure Menu Button**
7. 输入新 URL：
   ```
   https://sgme94.github.io/openclaw-telegram-miniapp/index-v2.html
   ```
8. 输入标题：`任务看板 v2`

### 方案 2：使用 Inline Button（推荐）

在聊天中发送 Mini App 链接，用户点击后自动清除缓存。

### 方案 3：等待 Telegram 自动刷新

Telegram 通常会在 24 小时内自动刷新缓存。

## 临时解决方案

在 Bot 聊天中发送：
```
点击打开最新版任务看板：
https://sgme94.github.io/openclaw-telegram-miniapp/index-v2.html
```

---

**更新时间：** 2026-02-28T23:58:00+08:00

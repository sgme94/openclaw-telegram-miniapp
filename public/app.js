// Telegram WebApp 初始化
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// 配置
const GATEWAY_URL = 'http://127.0.0.1:18688'; // OpenClaw Gateway 地址
const REFRESH_INTERVAL = 10000; // 10 秒刷新一次

// 加载会话列表
async function loadSessions() {
  try {
    // 尝试从 Gateway 获取
    let sessions = [];
    
    try {
      const response = await fetch(`${GATEWAY_URL}/sessions`);
      if (response.ok) {
        const data = await response.json();
        sessions = data.sessions || data || [];
      }
    } catch (gwError) {
      console.log('Gateway 不可用，使用模拟数据测试');
      // 本地测试用模拟数据
      sessions = [
        {
          key: 'test-session-1',
          sessionId: 'test-123',
          status: 'active',
          model: 'qwen3.5-plus',
          tokens: 288706,
          lastActivity: new Date().toISOString(),
          lastMessage: '这是一个测试会话消息'
        },
        {
          key: 'test-session-2',
          sessionId: 'test-456',
          status: 'idle',
          model: 'claude-sonnet',
          tokens: 150000,
          lastActivity: new Date(Date.now() - 3600000).toISOString(),
          lastMessage: '空闲中的会话'
        }
      ];
    }
    
    renderSessions(sessions);
    updateStats(sessions);
  } catch (error) {
    showError(`加载失败：${error.message}`);
  }
}

// 渲染会话列表
function renderSessions(sessions) {
  const container = document.getElementById('sessions-list');
  
  if (!sessions || sessions.length === 0) {
    container.innerHTML = '<div class="loading">暂无会话</div>';
    return;
  }
  
  container.innerHTML = sessions.map(session => {
    const sessionId = session.sessionId || session.key || session.id || 'N/A';
    const shortId = sessionId.split(':').pop() || sessionId;
    
    return `
    <div class="session-card">
      <div class="session-header">
        <span class="session-id" title="${sessionId}">${shortId}</span>
        <span class="session-status ${getStatusClass(session)}">${getStatusText(session)}</span>
      </div>
      <div class="session-info">
        ${session.model ? `模型：${session.model}` : ''}
        ${session.totalTokens || session.tokens ? ` • Token: ${formatNumber(session.totalTokens || session.tokens)}` : ''}
        ${session.updatedAt || session.lastActivity ? ` • ${formatTime(session.updatedAt || session.lastActivity)}` : ''}
      </div>
      ${session.lastMessage ? `
        <div class="session-info" style="margin-top: 8px; font-style: italic;">
          "${session.lastMessage.substring(0, 100)}${session.lastMessage.length > 100 ? '...' : ''}"
        </div>
      ` : ''}
    </div>
  `}).join('');
}

// 更新统计
function updateStats(sessions) {
  document.getElementById('total-sessions').textContent = sessions.length;
  
  // 根据更新时间判断活跃状态（5 分钟内）
  const fiveMinAgo = Date.now() - 5 * 60 * 1000;
  const active = sessions.filter(s => {
    const lastActivity = s.updatedAt || s.lastActivity;
    if (!lastActivity) return false;
    return new Date(lastActivity).getTime() > fiveMinAgo;
  }).length;
  document.getElementById('active-sessions').textContent = active;
  
  const totalTokens = sessions.reduce((sum, s) => sum + (s.totalTokens || s.tokens || 0), 0);
  document.getElementById('tokens-used').textContent = formatNumber(totalTokens);
}

// 获取状态样式
function getStatusClass(session) {
  if (session.status === 'active' || session.status === 'running') return 'status-active';
  if (session.status === 'idle') return 'status-idle';
  return 'status-completed';
}

// 获取状态文本
function getStatusText(session) {
  if (session.status === 'active' || session.status === 'running') return '进行中';
  if (session.status === 'idle') return '空闲';
  return '已完成';
}

// 格式化时间
function formatTime(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
  return date.toLocaleDateString('zh-CN');
}

// 格式化数字
function formatNumber(num) {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

// 显示错误
function showError(message) {
  const container = document.getElementById('error-container');
  container.innerHTML = `<div class="error">${message}</div>`;
  
  setTimeout(() => {
    container.innerHTML = '';
  }, 5000);
}

// 设置主题
function setupTheme() {
  document.documentElement.style.setProperty('--tg-theme-bg-color', tg.themeParams.bg_color || '#ffffff');
  document.documentElement.style.setProperty('--tg-theme-text-color', tg.themeParams.text_color || '#000000');
  document.documentElement.style.setProperty('--tg-theme-hint-color', tg.themeParams.hint_color || '#999999');
  document.documentElement.style.setProperty('--tg-theme-button-color', tg.themeParams.button_color || '#3390ec');
  document.documentElement.style.setProperty('--tg-theme-button-text-color', tg.themeParams.button_text_color || '#ffffff');
  document.documentElement.style.setProperty('--tg-theme-secondary-bg-color', tg.themeParams.secondary_bg_color || '#f0f0f0');
}

// 初始化
setupTheme();
loadSessions();

// 定时刷新
setInterval(loadSessions, REFRESH_INTERVAL);

// 告诉 Telegram 主按钮可以点击
tg.MainButton.setText('关闭');
tg.MainButton.onClick(() => tg.close());
tg.MainButton.show();

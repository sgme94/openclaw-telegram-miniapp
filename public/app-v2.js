// Telegram WebApp 初始化
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// 配置（添加时间戳防止缓存）
const GATEWAY_URL = 'http://127.0.0.1:18688';
const REFRESH_INTERVAL = 3000;

// 加载任务列表
async function loadTodos() {
  try {
    console.log('[v2] Loading todos...');
    // 强制添加时间戳，绕过所有缓存
    const response = await fetch('todos.json?t=' + Date.now());
    console.log('[v2] Response status:', response.status);
    
    if (!response.ok) {
      throw new Error('HTTP ' + response.status);
    }
    
    const data = await response.json();
    console.log('[v2] Loaded data:', data);
    
    const todos = data.todos || data.value || [];
    console.log('[v2] Todos count:', todos.length);
    
    renderTodos(todos);
    updateStats(todos);
  } catch (error) {
    console.error('[v2] Load failed:', error);
    showError('加载失败：' + error.message);
  }
}

// 渲染任务列表
function renderTodos(todos) {
  const container = document.getElementById('todos-list');
  
  if (!todos || todos.length === 0) {
    container.innerHTML = '<div class="loading">暂无任务</div>';
    return;
  }
  
  // 按状态排序
  const sorted = todos.sort((a, b) => {
    const order = { 'in_progress': 0, 'pending': 1, 'completed': 2 };
    return (order[a.status] || 999) - (order[b.status] || 999);
  });
  
  container.innerHTML = sorted.map(todo => `
    <div class="todo-card ${todo.status}">
      <div class="todo-header">
        <span class="todo-status ${todo.status}">${getStatusText(todo.status)}</span>
        <span class="todo-priority ${todo.priority}">${getPriorityText(todo.priority)}</span>
      </div>
      <div class="todo-content">${escapeHtml(todo.content)}</div>
      <div class="todo-info">
        <span class="todo-id">${todo.id}</span>
        <span class="todo-time">${formatTime(todo.createdAt)}</span>
      </div>
    </div>
  `).join('');
}

// 更新统计
function updateStats(todos) {
  const total = todos.length;
  const completed = todos.filter(t => t.status === 'completed').length;
  const inProgress = todos.filter(t => t.status === 'in_progress').length;
  const pending = todos.filter(t => t.status === 'pending').length;
  
  document.getElementById('total-todos').textContent = total;
  document.getElementById('completed-todos').textContent = completed;
  document.getElementById('in-progress-todos').textContent = inProgress;
  document.getElementById('pending-todos').textContent = pending;
  
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  document.getElementById('progress-bar').style.width = percent + '%';
  document.getElementById('progress-percent').textContent = percent + '%';
}

// 获取状态文本
function getStatusText(status) {
  const map = {
    'pending': '⏳ 待处理',
    'in_progress': '🔄 进行中',
    'completed': '✅ 已完成',
    'cancelled': '❌ 已取消'
  };
  return map[status] || status;
}

// 获取优先级文本
function getPriorityText(priority) {
  const map = {
    'high': '🔴 高',
    'medium': '🟡 中',
    'low': '🟢 低'
  };
  return map[priority] || priority;
}

// 格式化时间
function formatTime(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
  if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前';
  return date.toLocaleDateString('zh-CN');
}

// HTML 转义
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 显示错误
function showError(message) {
  const container = document.getElementById('error-container');
  container.innerHTML = '<div class="error">' + message + '</div>';
  setTimeout(() => { container.innerHTML = ''; }, 10000);
}

// 设置主题
function setupTheme() {
  const root = document.documentElement;
  root.style.setProperty('--tg-theme-bg-color', tg.themeParams.bg_color || '#ffffff');
  root.style.setProperty('--tg-theme-text-color', tg.themeParams.text_color || '#000000');
  root.style.setProperty('--tg-theme-hint-color', tg.themeParams.hint_color || '#999999');
  root.style.setProperty('--tg-theme-button-color', tg.themeParams.button_color || '#3390ec');
  root.style.setProperty('--tg-theme-button-text-color', tg.themeParams.button_text_color || '#ffffff');
  root.style.setProperty('--tg-theme-secondary-bg-color', tg.themeParams.secondary_bg_color || '#f0f0f0');
}

// 初始化
console.log('[v2] Starting...');
setupTheme();
loadTodos();

// 定时刷新
setInterval(loadTodos, REFRESH_INTERVAL);

// Telegram 主按钮
tg.MainButton.setText('刷新');
tg.MainButton.onClick(() => {
  loadTodos();
  tg.MainButton.showProgress();
  setTimeout(() => tg.MainButton.hideProgress(), 1000);
});
tg.MainButton.show();

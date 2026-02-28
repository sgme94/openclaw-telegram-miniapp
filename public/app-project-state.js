// Project State Management - Frontend
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// Mock data for demo (replace with actual API calls)
let dashboardData = {
  projects: [
    {
      id: 'proj_1',
      name: 'Telegram Mini App',
      status: 'active',
      current_phase: '开发中',
      events_count: 12,
      open_blockers: 0,
      last_update: new Date().toISOString()
    },
    {
      id: 'proj_2',
      name: 'Evolver 自我进化',
      status: 'blocked',
      current_phase: '等待网络',
      events_count: 8,
      open_blockers: 1,
      last_update: new Date().toISOString()
    },
    {
      id: 'proj_3',
      name: 'OpenCode 集成',
      status: 'active',
      current_phase: '配置中',
      events_count: 5,
      open_blockers: 0,
      last_update: new Date().toISOString()
    }
  ],
  recentEvents: [
    {
      id: 'evt_1',
      project_name: 'Telegram Mini App',
      event_type: 'progress',
      description: '完成了项目状态管理页面开发',
      timestamp: new Date().toISOString()
    },
    {
      id: 'evt_2',
      project_name: 'Evolver 自我进化',
      event_type: 'blocker',
      description: 'GitHub 访问超时，需要调整代理规则',
      timestamp: new Date().toISOString()
    },
    {
      id: 'evt_3',
      project_name: 'OpenCode 集成',
      event_type: 'decision',
      description: '决定使用 OpenCode Zen API',
      timestamp: new Date().toISOString()
    }
  ],
  openBlockers: [
    {
      id: 'blk_1',
      project_name: 'Evolver 自我进化',
      blocker_text: 'GitHub 访问超时，需要调整代理规则',
      created_at: new Date().toISOString()
    }
  ]
};

function loadDashboard() {
  try {
    // In production, fetch from API:
    // fetch('/api/dashboard').then(r => r.json()).then(data => renderDashboard(data));
    
    renderDashboard(dashboardData);
  } catch (error) {
    showError(`加载失败：${error.message}`);
  }
}

function renderDashboard(data) {
  // Update stats
  document.getElementById('total-projects').textContent = data.totalProjects || data.projects.length;
  document.getElementById('active-projects').textContent = data.activeProjects || data.projects.filter(p => p.status === 'active').length;
  document.getElementById('recent-events').textContent = data.recentEvents ? data.recentEvents.length : 0;
  document.getElementById('open-blockers').textContent = data.openBlockers ? data.openBlockers.length : 0;
  
  // Render projects
  renderProjects(data.projects);
  
  // Render events
  renderEvents(data.recentEvents);
  
  // Render blockers
  renderBlockers(data.openBlockers);
}

function renderProjects(projects) {
  const container = document.getElementById('projects-list');
  
  if (!projects || projects.length === 0) {
    container.innerHTML = '<div class="loading">暂无项目</div>';
    return;
  }
  
  container.innerHTML = projects.map(project => `
    <div class="project-card ${project.status}">
      <div class="project-header">
        <span class="project-name">${escapeHtml(project.name)}</span>
        <span class="project-status ${project.status}">${getStatusText(project.status)}</span>
      </div>
      <div class="project-phase">${project.current_phase || '无阶段'}</div>
      <div class="project-stats">
        <span>📝 ${project.events_count || 0} 事件</span>
        <span>⚠️ ${project.open_blockers || 0} 阻塞</span>
        <span>🕐 ${formatTime(project.last_update)}</span>
      </div>
    </div>
  `).join('');
}

function renderEvents(events) {
  const container = document.getElementById('events-list');
  
  if (!events || events.length === 0) {
    container.innerHTML = '<div class="loading">暂无事件</div>';
    return;
  }
  
  container.innerHTML = events.map(event => `
    <div class="event-card ${event.event_type}">
      <div class="event-type">${getEventTypeText(event.event_type)}</div>
      <div class="event-description">${escapeHtml(event.description)}</div>
      <div class="event-time">${event.project_name} • ${formatTime(event.timestamp)}</div>
    </div>
  `).join('');
}

function renderBlockers(blockers) {
  const container = document.getElementById('blockers-list');
  
  if (!blockers || blockers.length === 0) {
    container.innerHTML = '<div class="loading">暂无阻塞问题</div>';
    return;
  }
  
  container.innerHTML = blockers.map(blocker => `
    <div class="blocker-card">
      <div class="blocker-text">${escapeHtml(blocker.blocker_text)}</div>
      <div class="blocker-project">📁 ${blocker.project_name}</div>
      <div class="event-time">${formatTime(blocker.created_at)}</div>
    </div>
  `).join('');
}

function logEvent() {
  // Show Telegram native popup for event logging
  tg.showPopup({
    title: '记录项目事件',
    message: '选择事件类型：',
    buttons: [
      {id: 'progress', type: 'default', text: '✅ 进展'},
      {id: 'blocker', type: 'default', text: '⚠️ 阻塞'},
      {id: 'decision', type: 'default', text: '💡 决策'},
      {id: 'cancel', type: 'cancel', text: '取消'}
    ]
  }, (buttonId) => {
    if (buttonId && buttonId !== 'cancel') {
      tg.showAlert(`已选择：${buttonId}（演示功能，实际使用时会打开表单）`);
    }
  });
}

function getStatusText(status) {
  const map = {
    'active': '进行中',
    'blocked': '已阻塞',
    'completed': '已完成',
    'paused': '已暂停'
  };
  return map[status] || status;
}

function getEventTypeText(eventType) {
  const map = {
    'progress': '✅ 进展',
    'blocker': '⚠️ 阻塞',
    'decision': '💡 决策',
    'pivot': '🔄 转向',
    'standup': '📋 站会'
  };
  return map[eventType] || eventType;
}

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

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showError(message) {
  const container = document.getElementById('error-container');
  container.innerHTML = `<div class="error">${message}</div>`;
  
  setTimeout(() => {
    container.innerHTML = '';
  }, 5000);
}

// Setup theme
function setupTheme() {
  document.documentElement.style.setProperty('--tg-theme-bg-color', tg.themeParams.bg_color || '#ffffff');
  document.documentElement.style.setProperty('--tg-theme-text-color', tg.themeParams.text_color || '#000000');
  document.documentElement.style.setProperty('--tg-theme-hint-color', tg.themeParams.hint_color || '#999999');
  document.documentElement.style.setProperty('--tg-theme-button-color', tg.themeParams.button_color || '#3390ec');
  document.documentElement.style.setProperty('--tg-theme-button-text-color', tg.themeParams.button_text_color || '#ffffff');
  document.documentElement.style.setProperty('--tg-theme-secondary-bg-color', tg.themeParams.secondary_bg_color || '#f0f0f0');
}

// Initialize
setupTheme();
loadDashboard();

// Auto refresh every 30 seconds
setInterval(loadDashboard, 30000);

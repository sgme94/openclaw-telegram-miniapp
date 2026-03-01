/**
 * Telegram MiniApp - 任务看板（实时连接项目状态数据库）
 * 
 * 功能:
 * - 从项目状态数据库 API 获取任务
 * - 按项目和状态分组显示
 * - 自动刷新（30 秒）
 * - Telegram WebApp 集成
 */

// Telegram WebApp 初始化
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// 配置
const CONFIG = {
    // API 地址 - 自动检测环境
    // Vercel 环境：使用当前域名
    // 本地环境：使用 localhost
    API_URL: window.location.origin === 'null' || 
             window.location.hostname === 'localhost' ||
             window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3001'
        : window.location.origin,
    
    // 刷新间隔
    REFRESH_INTERVAL: 30000, // 30 秒
    
    // 是否启用自动刷新
    AUTO_REFRESH: true
};

// 状态
let state = {
    projects: [],
    tasks: [],
    stats: null,
    filter: 'all',
    lastUpdate: null,
    loading: false
};

/**
 * 从 API 获取数据
 */
async function fetchData() {
    if (state.loading) return;
    
    state.loading = true;
    updateRefreshButton(true);
    
    try {
        // 获取仪表板数据（包含所有聚合数据）
        const response = await fetch(`${CONFIG.API_URL}/api/dashboard`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        
        state.projects = data.projects || [];
        state.tasks = data.recentTasks || [];
        state.stats = data.stats;
        state.lastUpdate = data.lastUpdate;
        
        render();
        
    } catch (error) {
        console.error('[Fetch] Error:', error);
        showError(`加载失败：${error.message}`);
    } finally {
        state.loading = false;
        updateRefreshButton(false);
    }
}

/**
 * 渲染页面
 */
function render() {
    renderStats();
    renderProjects();
    renderLastUpdate();
}

/**
 * 渲染统计卡片
 */
function renderStats() {
    if (!state.stats) return;
    
    const { tasks } = state.stats;
    
    document.getElementById('stat-total').textContent = tasks?.total || 0;
    document.getElementById('stat-completed').textContent = tasks?.completed || 0;
    document.getElementById('stat-progress').textContent = tasks?.in_progress || 0;
    document.getElementById('stat-pending').textContent = tasks?.pending || 0;
}

/**
 * 渲染项目列表
 */
function renderProjects() {
    const content = document.getElementById('content');
    
    if (!state.projects || state.projects.length === 0) {
        content.innerHTML = '<div class="loading">暂无项目</div>';
        return;
    }
    
    // 按项目分组任务
    const tasksByProject = {};
    state.projects.forEach(p => {
        tasksByProject[p.id] = [];
    });
    
    state.tasks.forEach(task => {
        const projectId = task.project_id || 'general';
        if (!tasksByProject[projectId]) {
            tasksByProject[projectId] = [];
        }
        tasksByProject[projectId].push(task);
    });
    
    // 渲染每个项目
    const html = state.projects.map(project => {
        const projectTasks = tasksByProject[project.id] || [];
        const filteredTasks = filterTasks(projectTasks);
        const completedTasks = projectTasks.filter(t => t.status === 'completed').length;
        const completionRate = project.total_tasks > 0 
            ? Math.round((completedTasks / project.total_tasks) * 100) 
            : 0;
        
        return `
            <div class="project-section">
                <div class="project-header">
                    <div>
                        <div class="project-name">${escapeHtml(project.name)}</div>
                        <div class="project-stats">
                            ${completedTasks}/${project.total_tasks} 完成 (${completionRate}%)
                        </div>
                    </div>
                    <span class="task-status status-${project.status}">${getStatusText(project.status)}</span>
                </div>
                
                ${filteredTasks.length > 0 ? `
                    <div class="task-list">
                        ${filteredTasks.map(task => renderTask(task)).join('')}
                    </div>
                ` : `
                    <div class="loading">暂无任务</div>
                `}
            </div>
        `;
    }).join('');
    
    content.innerHTML = html;
}

/**
 * 渲染单个任务卡片
 */
function renderTask(task) {
    const createdAt = new Date(task.created_at);
    const timeAgo = getTimeAgo(createdAt);
    
    return `
        <div class="task-card" data-task-id="${escapeHtml(task.id)}">
            <div class="task-header">
                <span class="task-status status-${task.status}">${getStatusText(task.status)}</span>
                <span class="priority-badge priority-${task.priority}">${getPriorityText(task.priority)}</span>
            </div>
            <div class="task-content">
                ${escapeHtml(task.content)}
            </div>
            <div class="task-meta">
                <span>📅 ${timeAgo}</span>
                ${task.project_name ? `<span>📁 ${escapeHtml(task.project_name)}</span>` : ''}
            </div>
        </div>
    `;
}

/**
 * 过滤任务
 */
function filterTasks(tasks) {
    if (state.filter === 'all') return tasks;
    return tasks.filter(t => t.status === state.filter);
}

/**
 * 渲染最后更新时间
 */
function renderLastUpdate() {
    const el = document.getElementById('last-update');
    if (state.lastUpdate) {
        const time = new Date(state.lastUpdate).toLocaleTimeString('zh-CN');
        el.textContent = `最后更新：${time}`;
    }
}

/**
 * 更新刷新按钮状态
 */
function updateRefreshButton(spinning) {
    const btn = document.getElementById('refresh-btn');
    if (spinning) {
        btn.classList.add('spinning');
    } else {
        btn.classList.remove('spinning');
    }
}

/**
 * 显示错误
 */
function showError(message) {
    const content = document.getElementById('content');
    content.innerHTML = `<div class="error">${escapeHtml(message)}</div>`;
    
    setTimeout(() => {
        if (state.projects.length === 0) {
            content.innerHTML = '<div class="loading">暂无数据</div>';
        }
    }, 5000);
}

/**
 * 工具函数：转义 HTML
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * 工具函数：获取状态文本
 */
function getStatusText(status) {
    const map = {
        'pending': '待处理',
        'in_progress': '进行中',
        'completed': '已完成',
        'active': '🟢 运行中',
        'paused': '⚪ 已暂停',
        'completed': '✅ 已完成'
    };
    return map[status] || status;
}

/**
 * 工具函数：获取优先级文本
 */
function getPriorityText(priority) {
    const map = {
        'high': '高',
        'medium': '中',
        'low': '低'
    };
    return map[priority] || priority;
}

/**
 * 工具函数：获取相对时间
 */
function getTimeAgo(date) {
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`;
    
    return date.toLocaleDateString('zh-CN');
}

/**
 * 设置过滤器
 */
function setFilter(filter) {
    state.filter = filter;
    
    // 更新按钮状态
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === filter);
    });
    
    // 重新渲染
    renderProjects();
}

/**
 * 刷新数据
 */
function refresh() {
    fetchData();
}

/**
 * 初始化
 */
function init() {
    // 设置主题
    document.documentElement.style.setProperty('--tg-theme-bg-color', tg.themeParams.bg_color || '#ffffff');
    document.documentElement.style.setProperty('--tg-theme-text-color', tg.themeParams.text_color || '#000000');
    document.documentElement.style.setProperty('--tg-theme-hint-color', tg.themeParams.hint_color || '#999999');
    document.documentElement.style.setProperty('--tg-theme-button-color', tg.themeParams.button_color || '#3390ec');
    document.documentElement.style.setProperty('--tg-theme-button-text-color', tg.themeParams.button_text_color || '#ffffff');
    document.documentElement.style.setProperty('--tg-theme-secondary-bg-color', tg.themeParams.secondary_bg_color || '#f0f0f0');
    
    // 绑定过滤器事件
    document.getElementById('filter-bar').addEventListener('click', (e) => {
        if (e.target.classList.contains('filter-btn')) {
            setFilter(e.target.dataset.filter);
        }
    });
    
    // 绑定刷新按钮
    document.getElementById('refresh-btn').addEventListener('click', refresh);
    
    // 初始加载
    fetchData();
    
    // 自动刷新
    if (CONFIG.AUTO_REFRESH) {
        setInterval(refresh, CONFIG.REFRESH_INTERVAL);
    }
    
    // 告诉 Telegram 主页面已加载
    tg.MainButton.setText('关闭');
    tg.MainButton.onClick(() => tg.close());
    tg.MainButton.show();
}

// 启动
init();

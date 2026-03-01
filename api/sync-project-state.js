#!/usr/bin/env node
/**
 * 项目状态数据库同步 API
 * 
 * 从 OpenClaw 项目状态数据库同步数据到 Telegram MiniApp
 * 
 * 用法:
 *   node api/sync-project-state.js
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const CONFIG = {
    // 项目状态数据库 API 地址
    PROJECT_STATE_API: process.env.PROJECT_STATE_API || 'http://localhost:3000',
    
    // 数据缓存目录
    DATA_DIR: path.join(__dirname, '../data'),
    
    // 缓存文件
    CACHE_FILE: path.join(__dirname, '../data/project-state-cache.json'),
    
    // 刷新间隔（毫秒）
    REFRESH_INTERVAL: parseInt(process.env.REFRESH_INTERVAL) || 30000 // 30 秒
};

// 确保数据目录存在
if (!fs.existsSync(CONFIG.DATA_DIR)) {
    fs.mkdirSync(CONFIG.DATA_DIR, { recursive: true });
}

// 缓存数据
let cachedData = {
    stats: null,
    projects: [],
    tasks: [],
    evolutions: [],
    lastUpdate: null,
    nextUpdate: null
};

/**
 * 从项目状态数据库获取数据
 */
async function fetchProjectState() {
    const endpoints = {
        stats: '/api/stats',
        projects: '/api/projects',
        tasks: '/api/tasks',
        evolutions: '/api/evolutions?limit=10'
    };
    
    const results = {};
    
    for (const [key, endpoint] of Object.entries(endpoints)) {
        try {
            const url = `${CONFIG.PROJECT_STATE_API}${endpoint}`;
            const response = await fetch(url, { timeout: 5000 });
            
            if (response.ok) {
                results[key] = await response.json();
            } else {
                console.warn(`[Sync] ${endpoint} returned ${response.status}`);
                results[key] = null;
            }
        } catch (error) {
            console.warn(`[Sync] Failed to fetch ${endpoint}: ${error.message}`);
            results[key] = null;
        }
    }
    
    return results;
}

/**
 * 更新缓存
 */
async function updateCache() {
    console.log('[Sync] Fetching project state...');
    
    const data = await fetchProjectState();
    
    if (data.stats || data.projects) {
        cachedData = {
            stats: data.stats,
            projects: data.projects || [],
            tasks: data.tasks || [],
            evolutions: data.evolutions || [],
            lastUpdate: new Date().toISOString(),
            nextUpdate: new Date(Date.now() + CONFIG.REFRESH_INTERVAL).toISOString()
        };
        
        // 保存到缓存文件
        fs.writeFileSync(CONFIG.CACHE_FILE, JSON.stringify(cachedData, null, 2));
        
        console.log(`[Sync] Cache updated: ${cachedData.projects?.length || 0} projects, ${cachedData.tasks?.length || 0} tasks`);
    } else {
        console.warn('[Sync] No data received, keeping old cache');
    }
    
    return cachedData;
}

/**
 * 加载缓存
 */
function loadCache() {
    try {
        if (fs.existsSync(CONFIG.CACHE_FILE)) {
            const data = JSON.parse(fs.readFileSync(CONFIG.CACHE_FILE, 'utf8'));
            cachedData = data;
            console.log('[Sync] Cache loaded from file');
            return true;
        }
    } catch (e) {
        console.warn('[Sync] Failed to load cache:', e.message);
    }
    return false;
}

/**
 * HTTP API 服务器
 */
function startServer(port = 3001) {
    const server = http.createServer((req, res) => {
        // CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        res.setHeader('Content-Type', 'application/json');
        
        // Handle OPTIONS
        if (req.method === 'OPTIONS') {
            res.writeHead(204);
            res.end();
            return;
        }
        
        // Handle GET
        if (req.method === 'GET') {
            const url = new URL(req.url, `http://localhost:${port}`);
            const pathname = url.pathname;
            
            // API routes
            if (pathname === '/api/stats') {
                res.writeHead(200);
                res.end(JSON.stringify(cachedData.stats || { error: 'No data' }));
            } else if (pathname === '/api/projects') {
                res.writeHead(200);
                res.end(JSON.stringify(cachedData.projects || []));
            } else if (pathname === '/api/tasks') {
                const project = url.searchParams.get('project');
                const status = url.searchParams.get('status');
                
                let tasks = cachedData.tasks || [];
                
                if (project) {
                    tasks = tasks.filter(t => t.project_id === project);
                }
                if (status) {
                    tasks = tasks.filter(t => t.status === status);
                }
                
                res.writeHead(200);
                res.end(JSON.stringify(tasks));
            } else if (pathname === '/api/evolutions') {
                res.writeHead(200);
                res.end(JSON.stringify(cachedData.evolutions || []));
            } else if (pathname === '/api/dashboard') {
                // Aggregate dashboard data
                const dashboard = {
                    stats: cachedData.stats,
                    projects: cachedData.projects?.map(p => ({
                        ...p,
                        taskCount: (cachedData.tasks || []).filter(t => t.project_id === p.id).length,
                        completedTasks: (cachedData.tasks || []).filter(t => t.project_id === p.id && t.status === 'completed').length
                    })),
                    recentTasks: (cachedData.tasks || []).slice(-10),
                    recentEvolutions: (cachedData.evolutions || []).slice(-5),
                    lastUpdate: cachedData.lastUpdate,
                    nextUpdate: cachedData.nextUpdate
                };
                res.writeHead(200);
                res.end(JSON.stringify(dashboard));
            } else if (pathname === '/api/health') {
                res.writeHead(200);
                res.end(JSON.stringify({
                    status: 'ok',
                    lastUpdate: cachedData.lastUpdate,
                    nextUpdate: cachedData.nextUpdate,
                    projects: cachedData.projects?.length || 0,
                    tasks: cachedData.tasks?.length || 0
                }));
            } else {
                res.writeHead(404);
                res.end(JSON.stringify({ error: 'Not found' }));
            }
            return;
        }
        
        // Unknown method
        res.writeHead(405);
        res.end(JSON.stringify({ error: 'Method not allowed' }));
    });
    
    server.listen(port, () => {
        console.log(`
╔════════════════════════════════════════════════════════╗
║     📊 Project State Sync API Server                   ║
╠════════════════════════════════════════════════════════╣
║  Port: ${port}                                          ║
║  Source: ${CONFIG.PROJECT_STATE_API}                    ║
║  Cache: ${CONFIG.CACHE_FILE}                            ║
║  Refresh: ${CONFIG.REFRESH_INTERVAL / 1000}s            ║
╚════════════════════════════════════════════════════════╝

API Endpoints:
  GET /api/stats       - Statistics
  GET /api/projects    - Project list
  GET /api/tasks       - Task list (?project=&status=)
  GET /api/evolutions  - Evolution history
  GET /api/dashboard   - Aggregated dashboard
  GET /api/health      - Health check
`);
    });
    
    return server;
}

/**
 * 定时同步
 */
function startSync() {
    console.log(`[Sync] Starting auto-sync every ${CONFIG.REFRESH_INTERVAL / 1000}s`);
    
    // Initial sync
    updateCache();
    
    // Periodic sync
    setInterval(() => {
        updateCache().catch(err => {
            console.error('[Sync] Error:', err.message);
        });
    }, CONFIG.REFRESH_INTERVAL);
}

// Main
if (require.main === module) {
    const port = parseInt(process.argv[2]) || 3001;
    
    // Load existing cache
    loadCache();
    
    // Start HTTP server
    startServer(port);
    
    // Start auto-sync
    startSync();
}

module.exports = {
    updateCache,
    loadCache,
    getCachedData: () => cachedData,
    startServer,
    startSync
};

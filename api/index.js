/**
 * Vercel Serverless Function - Project State API Proxy
 * 
 * 代理请求到项目状态数据库 API
 * 
 * 用法:
 *   GET /api/stats
 *   GET /api/projects
 *   GET /api/tasks?project=&status=
 *   GET /api/dashboard
 */

const https = require('https');
const http = require('http');

// 配置
const PROJECT_STATE_API = process.env.PROJECT_STATE_API || 'http://localhost:3000';
const CACHE_TTL = 30000; // 30 秒缓存

// 内存缓存
const cache = {
    data: null,
    timestamp: 0
};

/**
 * 从项目状态数据库获取数据
 */
function fetchFromAPI(endpoint) {
    return new Promise((resolve, reject) => {
        const url = new URL(endpoint, PROJECT_STATE_API);
        const lib = url.protocol === 'https:' ? https : http;
        
        const req = lib.get(url.toString(), (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(new Error('Invalid JSON response'));
                }
            });
        });
        
        req.on('error', reject);
        req.setTimeout(5000, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
    });
}

/**
 * 获取聚合仪表板数据
 */
async function getDashboard() {
    const now = Date.now();
    
    // 检查缓存
    if (cache.data && (now - cache.timestamp) < CACHE_TTL) {
        return {
            ...cache.data,
            fromCache: true
        };
    }
    
    // 并行获取所有数据
    const [stats, projects, tasks, evolutions] = await Promise.all([
        fetchFromAPI('/api/stats'),
        fetchFromAPI('/api/projects'),
        fetchFromAPI('/api/tasks'),
        fetchFromAPI('/api/evolutions?limit=10')
    ]);
    
    // 聚合数据
    const dashboard = {
        stats,
        projects: projects.map(p => ({
            ...p,
            taskCount: tasks.filter(t => t.project_id === p.id).length,
            completedTasks: tasks.filter(t => t.project_id === p.id && t.status === 'completed').length
        })),
        recentTasks: tasks.slice(-10),
        recentEvolutions: evolutions.slice(-5),
        lastUpdate: new Date().toISOString(),
        nextUpdate: new Date(Date.now() + CACHE_TTL).toISOString()
    };
    
    // 更新缓存
    cache.data = dashboard;
    cache.timestamp = now;
    
    return dashboard;
}

/**
 * Vercel Serverless Function Handler
 */
module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'application/json');
    
    // Handle OPTIONS
    if (req.method === 'OPTIONS') {
        res.status(204).send();
        return;
    }
    
    // Handle GET
    if (req.method !== 'GET') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }
    
    try {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const pathname = url.pathname;
        
        // API routes
        if (pathname === '/api/health') {
            res.status(200).json({
                status: 'ok',
                timestamp: new Date().toISOString(),
                cached: cache.data !== null,
                cacheAge: cache.timestamp ? Date.now() - cache.timestamp : 0
            });
        } else if (pathname === '/api/dashboard') {
            const dashboard = await getDashboard();
            res.status(200).json(dashboard);
        } else if (pathname === '/api/stats') {
            const data = await fetchFromAPI('/api/stats');
            res.status(200).json(data);
        } else if (pathname === '/api/projects') {
            const data = await fetchFromAPI('/api/projects');
            res.status(200).json(data);
        } else if (pathname === '/api/tasks') {
            let data = await fetchFromAPI('/api/tasks');
            
            // 过滤
            const project = url.searchParams.get('project');
            const status = url.searchParams.get('status');
            
            if (project) {
                data = data.filter(t => t.project_id === project);
            }
            if (status) {
                data = data.filter(t => t.status === status);
            }
            
            res.status(200).json(data);
        } else if (pathname === '/api/evolutions') {
            const limit = url.searchParams.get('limit') || '10';
            const data = await fetchFromAPI(`/api/evolutions?limit=${limit}`);
            res.status(200).json(data);
        } else {
            res.status(404).json({ error: 'Not found' });
        }
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

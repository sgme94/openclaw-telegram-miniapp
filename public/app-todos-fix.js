// 添加版本号强制刷新
const CACHE_BUSTER = '?v=' + Date.now();
const response = await fetch('todos.json' + CACHE_BUSTER);

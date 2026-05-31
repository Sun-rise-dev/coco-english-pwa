// SayHi-Eeay 后端服务 — Claude API 流式代理
// 加载根目录的 .env 文件 (ANTHROPIC_API_KEY)
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');

// 导入路由
const chatRouter = require('./routes/chat');
const ttsRouter = require('./routes/tts');
const translateRouter = require('./routes/translate');

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件配置
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://192.168.1.13:5173'],
  methods: ['GET', 'POST'],
}));
app.use(express.json());   // 解析 JSON 请求体

// 安全头 (防止 XSS/sniffing/clickjacking)
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.removeHeader('X-Powered-By');
  next();
});

// 挂载路由 (必须在静态文件之前)
app.use('/api', chatRouter);
app.use('/api', ttsRouter);
app.use('/api', translateRouter);

// 健康检查端点
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', name: 'SayHi-Eeay API' });
});

// === 生产模式：提供前端静态文件 ===
// 如果 client/dist 目录存在 (已构建), 则直接提供前端页面
const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
const fs = require('fs');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  // SPA 回退：所有非 API 路由返回 index.html
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
  console.log('📦 前端静态文件已就绪');
} else {
  console.log('💡 开发模式: 请用 Vite 开发服务器 (npm run dev:client)');
}

// 启动服务器
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🦀 SayHi-Eeay 已启动: http://localhost:${PORT}`);
  if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'sk-ant-your-key-here') {
    console.warn('⚠️  请在 .env 文件中填入你的 ANTHROPIC_API_KEY');
  }
});

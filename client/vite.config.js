// Vite 配置文件 — 开发代理 + PWA 插件
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(), // React JSX 编译支持
    VitePWA({
      registerType: 'autoUpdate', // 有新版本自动更新 Service Worker
      includeAssets: ['icons/icon-192.png', 'icons/icon-512.png'], // PWA 图标资源
      manifest: {
        name: 'Coco — AI 英语口语伙伴',
        short_name: 'Coco',
        description: '和螃蟹伙伴 Coco 一起学英语 — AI 对话式口语练习',
        theme_color: '#FF7B4A',        // Coco 珊瑚橙
        background_color: '#FEFAF7',   // sand-50 暖白
        display: 'standalone',         // 独立窗口模式, 无浏览器 UI
        orientation: 'portrait',       // 竖屏锁定, 适配手机单手操作
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        // 预缓存：确保关键文件离线可用
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // 运行时缓存策略：API 请求不缓存, 始终走网络
        runtimeCaching: [],
      },
    }),
  ],
  server: {
    port: 5173,
    // 开发时 API 代理：/api 请求转发到 Express 后端 (端口 3001)
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})

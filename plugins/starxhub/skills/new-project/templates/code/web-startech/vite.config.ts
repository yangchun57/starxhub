import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  // 相对路径：dist 可直接静态托管到任意子目录，无需改资源前缀
  base: './',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    // 代理目标由脚手架按 --backend 注入（dotnet 5157 / python 8000 / java-spring 8080）
    proxy: {
      '/api': {
        target: '{{BACKEND_ORIGIN}}',
        changeOrigin: true,
      },
    },
  },
})

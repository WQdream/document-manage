import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  server: {
    host: '0.0.0.0', // 监听所有地址，包括局域网和公网IP
    port: 5173, // 默认端口
    strictPort: false, // 如果端口已被占用，则会尝试下一个可用端口
  },
})

import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';

// 同一页上既有 React 组件库也有 Vue 组件库：两个插件并存，Tailwind 只服务于 shadcn 套件。
// 两个页面：index.html 是演示页，audit.html 是检查页（自动检查打开它来量取）。
export default defineConfig({
  plugins: [react(), vue(), tailwindcss()],
  resolve: {
    alias: [
      // TDesign 的图标包：默认入口（esm）会自己往页面里插一份不在 cascade layer 里的图标样式
      // （.t-icon { width: 1em }），压过 tdesign 层里菜单图标的 20px。改用不带样式的 lib 入口——
      // 和组件从 tdesign-vue-next/lib 引入是同一个道理；图标的基础样式 dist/tdesign.css 里已经有了（在层里）。
      { find: /^tdesign-icons-vue-next$/, replacement: 'tdesign-icons-vue-next/lib/index.js' },
    ],
  },
  define: {
    __VUE_OPTIONS_API__: true,
    __VUE_PROD_DEVTOOLS__: false,
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false,
  },
  build: {
    chunkSizeWarningLimit: 2500,
    rollupOptions: {
      input: {
        demo: resolve(import.meta.dirname, 'index.html'),
        audit: resolve(import.meta.dirname, 'audit.html'),
      },
    },
  },
});

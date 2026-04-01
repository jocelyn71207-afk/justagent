import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'

// 打包時將 HTML 內 /libs/ 的靜態資源路徑補上 base 前綴
// dev 環境 Vite 把 public/ 掛在根目錄，所以 /libs/... 直接可用；
// prod 部署在子路徑下（如 /aiviews/），需改成 /aiviews/libs/...
function rewritePublicLibPaths(base: string): Plugin {
  return {
    name: 'rewrite-public-lib-paths',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        const prefix = base.replace(/\/$/, '')
        return html
          .replace(/src="\/libs\//g, `src="${prefix}/libs/`)
          .replace(/href="\/libs\//g, `href="${prefix}/libs/`)
      },
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  const isDevMode = env.VITE_DEV_MODE === 'true'
  const base = '/aiviews/'

  return {
    plugins: [
      vue(),
      rewritePublicLibPaths(base),
      // vueDevTools(),
    ],
    define: {
      __VUE_PROD_DEVTOOLS__: isDevMode, // VITE_DEV_MODE=true 時啟用 Vue DevTools
    },
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)), // 在組件內import時, @指向/src目錄
      },
    },
    base, // content path 根據專案修改
    server: {
      host: '0.0.0.0', // 允許外部訪問
      port: 8087,
      strictPort: true, // 若端口被佔用則直接退出
      allowedHosts: [
        '2943-61-216-61-42.ngrok-free.app', // 允許 ngrok 訪問 (每次都需手動更換)
      ]
    }
  }
})

import { fileURLToPath } from 'node:url'

import react from '@vitejs/plugin-react'
import jotaiDebugLabel from 'jotai/babel/plugin-debug-label'
import jotaiReactRefresh from 'jotai/babel/plugin-react-refresh'
import UnoCSS from 'unocss/vite'
import { defineConfig } from 'vite'
import tsConfigPath from 'vite-tsconfig-paths'

// During development the dashboard is served by Vite, while the API lives in
// the clash process. Keep the frontend same-origin and proxy API requests.
const srcDir = fileURLToPath(new URL('./src', import.meta.url))
const clashAPI = process.env.CLASH_API ?? 'http://127.0.0.1:9090'
const clashProxy = {
    target: clashAPI,
    changeOrigin: true,
    ws: true,
}

export default defineConfig(
    env => ({
        plugins: [
            // only use react-fresh
            env.mode === 'development' && react({
                babel: { plugins: [jotaiDebugLabel, jotaiReactRefresh] },
            }),
            tsConfigPath(),
            UnoCSS(),
        ],
        server: {
            port: 3000,
            host: '0.0.0.0',
            proxy: {
                '/configs': clashProxy,
                '/proxies': clashProxy,
                '/rules': clashProxy,
                '/connections': clashProxy,
                '/providers': clashProxy,
                '/dns': clashProxy,
                '/logs': clashProxy,
                '/traffic': clashProxy,
                '/version': clashProxy,
            },
        },
        base: './',
        css: {
            preprocessorOptions: {
                scss: {
                    loadPaths: [srcDir],
                    additionalData: '@use "sass:color"; @use "sass:math"; @use "styles/variables" as *;',
                },
            },
        },
        build: {
            reportCompressedSize: false,
            rollupOptions: {
                onwarn (warning, warn) {
                    // React Server Component directives from dependencies are
                    // irrelevant for this browser-only bundle.
                    if (warning.code === 'MODULE_LEVEL_DIRECTIVE' && warning.id?.includes('node_modules')) {
                        return
                    }
                    warn(warning)
                },
                output: {
                    manualChunks (id) {
                        if (id.includes('node_modules')) {
                            return 'vendor'
                        }
                    },
                },
            },
        },
        esbuild: {
            jsxInject: "import React from 'react'",
        },
    }),
)

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
export default defineConfig({
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, '.'),
            // Mock Tauri APIs in browser dev mode
            '@tauri-apps/api/core': path.resolve(__dirname, './lib/tauri-mocks/core.ts'),
            '@tauri-apps/api/event': path.resolve(__dirname, './lib/tauri-mocks/event.ts'),
            '@tauri-apps/api/window': path.resolve(__dirname, './lib/tauri-mocks/window.ts'),
            '@tauri-apps/plugin-dialog': path.resolve(__dirname, './lib/tauri-mocks/plugin-dialog.ts'),
        },
    },
    build: {
        outDir: '../out',
        emptyOutDir: true,
        rolldownOptions: {
            output: {
                codeSplitting: {
                    groups: [
                        {
                            name: 'vendor-react',
                            test: /[\\/]node_modules[\\/](react|react-dom|react-router-dom)[\\/]/,
                        },
                        {
                            name: 'vendor-math',
                            test: /[\\/]node_modules[\\/](katex|marked|dompurify)[\\/]/,
                        },
                    ],
                },
            },
        },
        chunkSizeWarningLimit: 500,
    },
});

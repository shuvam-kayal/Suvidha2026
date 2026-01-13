import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@components': path.resolve(__dirname, './src/components'),
            '@pages': path.resolve(__dirname, './src/pages'),
            '@hooks': path.resolve(__dirname, './src/hooks'),
            '@utils': path.resolve(__dirname, './src/utils'),
            '@types': path.resolve(__dirname, './src/types'),
        },
    },
    server: {
        port: 5173,
        host: true,
        proxy: {
            // Auth service - direct connection in development
            '/api/v1/auth': {
                target: 'http://localhost:3001',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api\/v1\/auth/, ''),
            },
            // Billing service - direct connection in development
            '/api/v1/billing': {
                target: 'http://localhost:3002',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api\/v1\/billing/, ''),
            },
            // Other services - through API Gateway
            '/api': {
                target: 'http://localhost:3000',
                changeOrigin: true,
            },
        },
    },
    build: {
        outDir: 'dist',
        sourcemap: true,
        minify: 'terser',
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom', 'react-router-dom'],
                    i18n: ['react-i18next', 'i18next'],
                },
            },
        },
    },
});

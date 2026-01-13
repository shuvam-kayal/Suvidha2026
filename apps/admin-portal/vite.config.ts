import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        port: 5174,
        host: true,
        proxy: {
            // Auth service
            '/api/v1/auth': {
                target: 'http://localhost:3001',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api\/v1\/auth/, ''),
            },
            // Billing service
            '/api/v1/billing': {
                target: 'http://localhost:3002',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api\/v1\/billing/, ''),
            },
            // Grievance service
            '/api/v1/grievance': {
                target: 'http://localhost:3003',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api\/v1\/grievance/, ''),
            },
            // API Gateway fallback
            '/api': {
                target: 'http://localhost:3000',
                changeOrigin: true,
            },
        },
    },
    build: {
        outDir: 'dist',
        sourcemap: true,
    },
});

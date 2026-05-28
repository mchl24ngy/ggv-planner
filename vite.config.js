import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
    plugins: [react()],
    server: {
        proxy: {
            '/pvgis-api': {
                target: 'https://re.jrc.ec.europa.eu',
                changeOrigin: true,
                rewrite: function (path) { return path.replace(/^\/pvgis-api/, ''); },
            },
        },
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: function (id) {
                    if (!id.includes('/node_modules/'))
                        return;
                    if (id.includes('/html2canvas/'))
                        return 'vendor-html2canvas';
                    if (id.includes('/jspdf'))
                        return 'vendor-jspdf';
                    if (id.includes('/recharts/'))
                        return 'vendor-recharts';
                    if (id.includes('/d3-') || id.includes('/d3/') || id.includes('/internmap/') || id.includes('/robust-predicates/'))
                        return 'vendor-d3';
                    if (id.includes('/react-dom/') || id.includes('/react/') || id.includes('/scheduler/'))
                        return 'vendor-react';
                },
            },
        },
    },
});

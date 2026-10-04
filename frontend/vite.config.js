import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

function healthCheckPlugin() {
  const handler = (req, res, next) => {
    const url = req.url ? req.url.split('?')[0] : '';
    if (url === '/health' || url === '/health/') {
      const accept = req.headers['accept'] || '';
      const isHtml = accept.includes('text/html');
      const isJsonExplicit = accept.includes('application/json') || (req.url && req.url.includes('format=json'));

      // If probe/curl/API requesting JSON, return JSON directly
      if (isJsonExplicit || (!isHtml && !req.headers['sec-fetch-dest'])) {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
          status: 'healthy',
          service: 'Udhaar Frontend (Vite)',
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        }));
        return;
      }
    }
    next();
  };

  return {
    name: 'vite-plugin-health-check',
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), healthCheckPlugin()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
});

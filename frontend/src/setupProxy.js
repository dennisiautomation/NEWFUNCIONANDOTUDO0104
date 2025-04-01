const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://global.newcashbank.com.br:3001',
      changeOrigin: true,
      secure: false,
      pathRewrite: {
        '^/api': '/api'
      },
      onError: (err, req, res) => {
        console.error('Proxy error:', err);
        res.writeHead(500, {
          'Content-Type': 'application/json',
        });
        res.end(JSON.stringify({ 
          error: 'Erro de conexão com o servidor',
          details: err.message 
        }));
      },
      onProxyRes: (proxyRes, req, res) => {
        console.log(`Proxy response [${req.method}] ${req.path} -> ${proxyRes.statusCode}`);
      }
    })
  );
};

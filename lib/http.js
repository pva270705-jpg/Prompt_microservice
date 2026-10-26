const express = require('express');
const helmet = require('helmet');
function appFor(service) {
  const app = express();
  app.use(helmet()); app.use(express.json({ limit: '1mb' }));
  app.use((req, res, next) => { const start = Date.now(); res.on('finish', () => console.log(JSON.stringify({ service, method: req.method, path: req.path, status: res.statusCode, durationMs: Date.now() - start }))); next(); });
  app.get('/health', (_req, res) => res.json({ status: 'UP', service }));
  app.use((err, _req, res, _next) => { console.error(err); res.status(err.status || 500).json({ error: err.message || 'Internal server error' }); });
  return app;
}
function listen(app, port) { app.listen(port, '0.0.0.0', () => console.log(`Listening on ${port}`)); }
module.exports = { appFor, listen };

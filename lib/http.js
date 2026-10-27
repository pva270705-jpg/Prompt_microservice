const express = require('express');
const helmet = require('helmet');
function appFor(service, healthChecks = {}) {
  const app = express();
  app.use(helmet()); app.use(express.json({ limit: '1mb' }));
  app.use((req, res, next) => { const start = Date.now(); res.on('finish', () => console.log(JSON.stringify({ service, method: req.method, path: req.path, status: res.statusCode, durationMs: Date.now() - start }))); next(); });
  app.get('/health', async (_req, res) => {
    const checks = await Promise.all(Object.entries(healthChecks).map(async ([name, check]) => {
      try { await check(); return [name, 'UP']; }
      catch (error) { console.error(`${service} health check failed (${name}):`, error.message); return [name, 'DOWN']; }
    }));
    const dependencies = Object.fromEntries(checks);
    const healthy = checks.every(([, status]) => status === 'UP');
    res.status(healthy ? 200 : 503).json({ status: healthy ? 'UP' : 'DEGRADED', service, dependencies });
  });
  return app;
}
function listen(app, port) {
  app.use((err, _req, res, _next) => {
    console.error(err);
    if (res.headersSent) return;
    res.status(err.status || 500).json({ error: err.status && err.status < 500 ? err.message : 'Internal server error' });
  });
  return app.listen(port, '0.0.0.0', () => console.log(`Listening on ${port}`));
}
module.exports = { appFor, listen };

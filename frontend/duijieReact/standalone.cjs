const express = require('express');
const path = require('path');
const { loadConfig } = require('./db-config.cjs');

const PORT = process.env.PORT || 1300;
const DIST_DIR = path.join(__dirname, 'dist');

async function start() {
  const dbConfig = await loadConfig();
  const envJson = JSON.stringify({
    BACKEND_PORT: dbConfig.DUIJIE_BACKEND_PORT || '1800',
    FRONTEND_PORT: dbConfig.DUIJIE_FRONTEND_PORT || '1300',
    ...dbConfig,
  });

  const app = express();

  app.get('/env-config.js', (req, res) => {
    res.type('application/javascript');
    res.send(`window.__ENV__ = ${envJson};`);
  });

  app.use(express.static(DIST_DIR));

  app.get('*', (req, res) => {
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });

  app.listen(PORT, () => {
    console.log(`[duijie-frontend] http://localhost:${PORT}`);
  });
}

start().catch(console.error);

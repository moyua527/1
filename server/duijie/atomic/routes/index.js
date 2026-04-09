const express = require('express');
const logger = require('../../config/logger');
const router = express.Router();

const modules = ['auth', 'admin', 'search', 'knowledge', 'project', 'client', 'enterprise', 'crm', 'opportunity', 'task', 'communication', 'partner'];

modules.forEach(mod => {
  try {
    router.use(require(`./${mod}`));
  } catch (e) {
    logger.error(`[路由] ${mod} 模块加载失败: ${e.message}`);
  }
});

module.exports = router;

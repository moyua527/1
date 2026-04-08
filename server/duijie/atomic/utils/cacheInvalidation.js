const { cacheInvalidate } = require('../../config/redis');

async function invalidateProjectCaches() {
  await Promise.all([
    cacheInvalidate('projects:'),
    cacheInvalidate('dashboard:'),
  ]);
}

async function invalidateTaskCaches() {
  await Promise.all([
    cacheInvalidate('tasks:'),
    cacheInvalidate('dashboard:'),
  ]);
}

module.exports = { invalidateProjectCaches, invalidateTaskCaches };

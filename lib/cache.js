const PREFIX = 'gateway:products:';

function productCacheKey(path) {
  if (path === '/products') return `${PREFIX}list`;
  const match = path.match(/^\/products\/([^/]+)$/);
  return match ? `${PREFIX}detail:${match[1]}` : null;
}

async function invalidateProductCache(redis, pid) {
  if (!redis?.isOpen) return;
  const keys = [`${PREFIX}list`];
  if (pid !== undefined && pid !== null) keys.push(`${PREFIX}detail:${pid}`);
  await redis.del(keys);
}

module.exports = { productCacheKey, invalidateProductCache };

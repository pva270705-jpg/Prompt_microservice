function normalizeOrderItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return { error: 'items must be a non-empty array' };
  }

  const quantities = new Map();
  for (const item of items) {
    if (!item || !Number.isInteger(item.pid) || item.pid < 1 || item.pid > 2147483647 ||
        !Number.isInteger(item.qty) || item.qty < 1 || item.qty > 2147483647) {
      return { error: 'Each item requires a positive int32 pid and qty' };
    }
    const quantity = (quantities.get(item.pid) || 0) + item.qty;
    if (quantity > 2147483647) return { error: 'Combined qty for a product exceeds the supported int32 range' };
    quantities.set(item.pid, quantity);
  }

  return {
    items: [...quantities].map(([pid, qty]) => ({ pid, qty }))
  };
}

module.exports = { normalizeOrderItems };

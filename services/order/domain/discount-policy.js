function parseDiscountRules(raw) {
  if (!raw || !raw.trim()) return { error: 'DISCOUNT_RULES_JSON is required' };

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { error: 'DISCOUNT_RULES_JSON must be valid JSON' };
  }
  if (!Array.isArray(parsed) || parsed.length === 0) {
    return { error: 'DISCOUNT_RULES_JSON must be a non-empty array' };
  }

  const seen = new Set();
  for (const rule of parsed) {
    if (!rule || !Number.isInteger(rule.minScore) || rule.minScore < 0 ||
        !Number.isFinite(rule.discountPercent) || rule.discountPercent < 0 || rule.discountPercent > 100 ||
        seen.has(rule.minScore)) {
      return { error: 'Each rule needs a unique non-negative integer minScore and discountPercent from 0 to 100' };
    }
    seen.add(rule.minScore);
  }
  if (!seen.has(0)) return { error: 'A discount rule with minScore 0 is required' };

  return { rules: [...parsed].sort((a, b) => a.minScore - b.minScore) };
}

function discountPercentForScore(score, rules) {
  if (!Number.isFinite(score) || score < 0 || !Array.isArray(rules) || rules.length === 0) {
    throw new TypeError('A valid score and configured discount rules are required');
  }
  return rules.filter(rule => score >= rule.minScore).at(-1).discountPercent;
}

module.exports = { parseDiscountRules, discountPercentForScore };

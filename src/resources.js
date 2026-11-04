// Named provider token fields; omitted optional cache counters mean no reported cache use.
// No usage (including an unreceived response) means unknown, never zero.
export const TOKEN_FIELDS = ['input_tokens', 'output_tokens', 'cache_creation_input_tokens', 'cache_read_input_tokens'];
export const resourceValue = x => x === 'unknown' || (typeof x === 'number' && Number.isFinite(x) && x >= 0);
export function validateUsage(usage) {
  if (usage === null) return;
  if (!usage || typeof usage !== 'object' || Array.isArray(usage)) throw new Error('usage must be an object or null');
  for (const key of [...TOKEN_FIELDS, 'seconds']) if (usage[key] !== undefined && !resourceValue(usage[key])) throw new Error(`usage.${key} must be nonnegative finite or unknown`);
}
const sum = xs => xs.some(x => x === 'unknown') ? 'unknown' : xs.reduce((a,b) => a+b,0);
export function resourcesFromAttempts(attempts) {
  attempts.forEach(a => validateUsage(a.usage));
  const resources = {};
  for (const field of TOKEN_FIELDS) resources[field] = sum(attempts.map(a => a.usage === null ? 'unknown' : a.usage[field] ?? (field.startsWith('cache_') ? 0 : 'unknown')));
  resources.tokens = sum(TOKEN_FIELDS.map(f => resources[f]));
  resources.seconds = sum(attempts.map(a => a.usage?.seconds ?? 'unknown'));
  resources.requests = attempts.length;
  resources.sandboxExecutions = attempts.filter(a => a.status === 'received' && a.code && a.result.stage !== 'truncated').length;
  return resources;
}
export function sumResources(resources) {
  return Object.fromEntries([...TOKEN_FIELDS, 'tokens', 'seconds', 'requests', 'sandboxExecutions'].map(k => [k, sum(resources.map(r => r[k]))]));
}
export function validateResources(r) {
  if (!r || [...TOKEN_FIELDS, 'tokens', 'seconds', 'requests', 'sandboxExecutions'].some(k => !resourceValue(r[k]))) throw new Error('resources must contain named nonnegative finite values or unknown');
}

import * as laggedRule from './laggedRule.js';
import * as hiddenPeriod from './hiddenPeriod.js';
export const domains = { laggedRule, hiddenPeriod };
export function getDomain(name) {
  const d = domains[name];
  if (!d) throw new Error(`Unknown domain "${name}". Known: ${Object.keys(domains).join(', ')}`);
  return d;
}

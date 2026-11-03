// Minimal Anthropic Messages API client (no dependencies) plus a mock mode so the
// whole pipeline can be exercised without an API key:  LLM_MOCK=1
import { readFileSync, existsSync } from 'node:fs';

function loadDotEnv() {
  if (!existsSync('.env')) return;
  for (const line of readFileSync('.env', 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
loadDotEnv();

export const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5';
export const MOCK = process.env.LLM_MOCK === '1';
let lastUsage = null;
// token usage of the most recent real API call (null in mock mode)
export function getLastUsage() { return lastUsage; }

export const MAX_TOKENS = Number(process.env.MAX_OUTPUT_TOKENS || 16000);
export async function complete({ system, messages, maxTokens = MAX_TOKENS, temperature = 1 }) {
  if (MOCK) return mockComplete({ system, messages });
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error('ANTHROPIC_API_KEY not set (put it in .env or the environment), or set LLM_MOCK=1');
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, temperature, system, messages }),
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  const json = await res.json();
  lastUsage = { ...(json.usage || {}), stop_reason: json.stop_reason };
  return json.content.filter(b => b.type === 'text').map(b => b.text).join('\n');
}

// ---- mock: cycles through a few canned "ideas" so logs/analysis have something to chew on
let mockCalls = 0;
const canned = [
  { idea: 'Fixed-width 3-bit encoding as a baseline', code: `function encode(s){return s.map(x=>x.toString(2).padStart(3,'0')).join('');}\nfunction decode(b,n){const s=[];for(let i=0;i<n;i++)s.push(parseInt(b.slice(i*3,i*3+3),2));return s;}` },
  { idea: 'Huffman-style variable length codes from symbol frequencies', code: `function encode(s){return s.map(x=>x.toString(2).padStart(3,'0')).join('');}\nfunction decode(b,n){const s=[];for(let i=0;i<n;i++)s.push(parseInt(b.slice(i*3,i*3+3),2));return s;}` },
  { idea: 'Run-length encoding of repeated symbols', code: `function encode(s){return 'oops'}\nfunction decode(b,n){return []}` },
  { idea: 'Frequency-based variable-length coding with escape codes', code: `function encode(s){return s.map(x=>x.toString(2).padStart(3,'0')).join('');}\nfunction decode(b,n){const s=[];for(let i=0;i<n;i++)s.push(parseInt(b.slice(i*3,i*3+3),2));return s;}` },
];
function mockComplete({ system, messages }) {
  const lc = messages[messages.length - 1].content; const last = typeof lc === 'string' ? lc : lc.map(b => b.text || '').join('\n');
  if (/The experiment is over|why didn't you|why did you not/i.test(last)) return 'I assumed the dependency, if any, would be on the immediately preceding symbol, so I never tested other lags. I considered the symbols to be independent after seeing a flat histogram.';
  if (/SELF-REPORT:/.test(last)) return '{"claim":"I never tested lags beyond 1","assessment":"unverifiable","evidence":"","categories":["never_considered"]}';
  if (/Classify/i.test(last)) return '{"category":"never_considered","evidence":"says it never tested other lags"}';
  if (/Assign each idea/i.test(last)) return JSON.stringify({ assignments: [] });
  const c = canned[mockCalls++ % canned.length];
  return `<idea>${c.idea}</idea>\n<assumption_questioned>none</assumption_questioned>\n<new_object>none</new_object>\n<code>\n${c.code}\n</code>`;
}

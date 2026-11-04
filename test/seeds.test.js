import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { drawSeeds, validateConfig } from '../src/validate.js';

test('A1: adjacent masters do not yield shifted windows', () => {
  const a = drawSeeds('20261103', 40), b = drawSeeds('20261104', 40);
  assert.ok(a.filter(x => b.includes(x)).length < 5);
  assert.equal(new Set(a).size, 40);
  const expected = Number(BigInt('0x' + createHash('sha256').update('whydidntyou-seed-draw-v2|20261103|0').digest('hex')) & 0xffffffffn);
  assert.equal(a[0], expected);
  for (const name of ['kcurve', 'pilot']) {
    const cfg = JSON.parse(readFileSync(new URL(`../experiments/${name}.json`, import.meta.url)));
    assert.equal(cfg.seeds.length, 40);
    validateConfig(cfg);
  }
});
test('master representation is exact, including beyond Number precision', () => {
  for (const bad of [20261103, '', '01', '-1', '1.5', '1e2', ' 1', 'f', '9'.repeat(65)]) assert.throws(() => drawSeeds(bad, 1));
  assert.notDeepEqual(drawSeeds('9007199254740992', 10), drawSeeds('9007199254740993', 10));
  assert.equal(drawSeeds('9'.repeat(64), 1).length, 1);
});

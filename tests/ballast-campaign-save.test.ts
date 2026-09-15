import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseSave } from '../src/shared/save.ts';

test('Campaign migration keeps intro completions and the earned old stamp but does not credit the replaced fourth level', () => {
  const save = parseSave(JSON.stringify({ version: 1, muted: true, reduced: true, completed: [0, 1, 2], ballastCompleted: [0, 1, 2, 3] }));
  assert.deepEqual(save.ballastCompleted, [0, 1, 2]);
  assert.equal(save.ballastStamp, true);
  assert.equal(save.ballastEdition, 2);
  assert.deepEqual(save.completed, [0, 1, 2]);
  assert.equal(save.muted, true); assert.equal(save.reduced, true);
  assert.deepEqual(parseSave(JSON.stringify(save)), save);
});

test('Fresh campaign stamp needs all twelve levels; current saves retain every valid completion', () => {
  const base = { version: 1, ballastEdition: 2, ballastStamp: false };
  const intro = parseSave(JSON.stringify({ ...base, ballastCompleted: [0, 1, 2] }));
  assert.equal(intro.ballastStamp, false);
  const complete = parseSave(JSON.stringify({ ...base, ballastCompleted: Array.from({ length: 12 }, (_, i) => i) }));
  assert.equal(complete.ballastStamp, true); assert.equal(complete.ballastCompleted.length, 12);
  const invalid = parseSave(JSON.stringify({ ...base, ballastCompleted: [-1, 0, 11, 12, 50, 3.5, '4', 11] }));
  assert.deepEqual(invalid.ballastCompleted, [0, 11]); assert.equal(invalid.ballastStamp, false);
});

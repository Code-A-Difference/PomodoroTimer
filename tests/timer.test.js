import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Timer } from '../timer.js';

test('keeps accurate time after a delayed tick and preserves time when paused', () => {
  const timer = new Timer();
  timer.start(1000);
  timer.tick(62000);
  assert.equal(timer.remaining, 1439000);
  timer.pause(63000);
  timer.tick(100000);
  assert.equal(timer.remaining, 1438000);
  timer.start(100000);
  timer.tick(101000);
  assert.equal(timer.remaining, 1437000);
});

test('completes each focus only once and offers a long break after four', () => {
  const timer = new Timer();
  for (let i = 0; i < 4; i++) {
    timer.select('focus');
    timer.start(0);
    assert.equal(timer.tick(1500000), true);
    assert.equal(timer.tick(1500001), false);
    assert.equal(timer.nextMode, i === 3 ? 'long' : 'short');
  }
  assert.equal(timer.completed, 4);
});

test('skipping or resetting a focus does not count as completed work', () => {
  const timer = new Timer();
  timer.start(0);
  timer.tick(1000);
  timer.reset();
  assert.equal(timer.remaining, 1500000);
  assert.equal(timer.completed, 0);
  timer.skip();
  assert.equal(timer.mode, 'short');
  assert.equal(timer.completed, 0);
  const nextCycle = new Timer({completed: 4, mode: 'focus'});
  nextCycle.skip();
  assert.equal(nextCycle.mode, 'short');
});

test('restores a running timer and validates corrupted saved values', () => {
  const timer = new Timer();
  timer.start(1000);
  const restored = new Timer(JSON.parse(JSON.stringify(timer)));
  restored.tick(61000);
  assert.equal(restored.remaining, 1440000);
  const corrupt = new Timer({mode:'bad', completed:-2, remaining:-1, durations:{focus:0}});
  assert.equal(corrupt.mode, 'focus');
  assert.equal(corrupt.remaining, 1500000);
  assert.equal(corrupt.completed, 0);
});

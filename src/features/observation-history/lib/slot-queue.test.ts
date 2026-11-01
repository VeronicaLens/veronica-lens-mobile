import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createSlotQueue } from './slot-queue.ts';

function deferred() {
  let resolve!: () => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const tick = () => new Promise<void>((resolve) => setImmediate(resolve));

describe('slot queue', () => {
  it('never runs more tasks than the limit', async () => {
    const queue = createSlotQueue(2);
    let running = 0;
    let peak = 0;
    const gates = [deferred(), deferred(), deferred(), deferred()];
    const results = gates.map((gate, index) =>
      queue.run(`k${index}`, async () => {
        running += 1;
        peak = Math.max(peak, running);
        await gate.promise;
        running -= 1;
      }),
    );

    await tick();
    assert.equal(running, 2);
    for (const gate of gates) {
      gate.resolve();
      await tick();
    }
    await Promise.all(results);

    assert.equal(peak, 2);
  });

  it('serves the best-ranked waiting task first', async () => {
    const queue = createSlotQueue(1);
    const order: string[] = [];
    const blocker = deferred();
    const first = queue.run('blocker', () => blocker.promise);
    const start = (key: string) =>
      queue.run(key, async () => {
        order.push(key);
      });

    const tasks = [start('c'), start('a'), start('b')];
    queue.prioritize(['a', 'b', 'c']);
    blocker.resolve();
    await Promise.all([first, ...tasks]);

    assert.deepEqual(order, ['a', 'b', 'c']);
  });

  it('serves keys that were never ranked after ranked ones', async () => {
    const queue = createSlotQueue(1);
    const order: string[] = [];
    const blocker = deferred();
    const first = queue.run('blocker', () => blocker.promise);
    const start = (key: string) =>
      queue.run(key, async () => {
        order.push(key);
      });

    const tasks = [start('offscreen'), start('visible')];
    queue.prioritize(['visible']);
    blocker.resolve();
    await Promise.all([first, ...tasks]);

    assert.deepEqual(order, ['visible', 'offscreen']);
  });

  it('frees the slot when a task fails, so later tasks still run', async () => {
    const queue = createSlotQueue(1);
    const failing = queue.run('bad', async () => {
      throw new Error('boom');
    });
    const later = queue.run('good', async () => 'ok');

    await assert.rejects(failing, /boom/);
    assert.equal(await later, 'ok');
  });

  it('keeps working after every slot was used and released', async () => {
    const queue = createSlotQueue(2);

    await Promise.all([queue.run('a', async () => 1), queue.run('b', async () => 2)]);

    assert.equal(await queue.run('c', async () => 3), 3);
  });
});

export interface SlotQueue {
  /** Runs the task when a slot is free; the waiting task with the best rank goes first. */
  run<T>(key: string, task: () => Promise<T>): Promise<T>;
  /** Ranks keys by position (0 is served first); keys not listed are served last. */
  prioritize(keys: readonly string[]): void;
}

interface Waiter {
  key: string;
  resume(): void;
}

export function createSlotQueue(maxConcurrent: number): SlotQueue {
  const waiting: Waiter[] = [];
  const rankByKey = new Map<string, number>();
  let active = 0;

  function takeNext(): Waiter | undefined {
    let best = -1;
    let bestRank = Number.POSITIVE_INFINITY;
    waiting.forEach((waiter, index) => {
      const rank = rankByKey.get(waiter.key) ?? Number.MAX_SAFE_INTEGER;
      if (best === -1 || rank < bestRank) {
        best = index;
        bestRank = rank;
      }
    });
    return best === -1 ? undefined : waiting.splice(best, 1)[0];
  }

  async function run<T>(key: string, task: () => Promise<T>): Promise<T> {
    // The slot is handed over directly, so a newcomer cannot jump ahead of a woken waiter.
    if (active >= maxConcurrent) {
      await new Promise<void>((resume) => waiting.push({ key, resume }));
    } else {
      active += 1;
    }
    try {
      return await task();
    } finally {
      const next = takeNext();
      if (next) next.resume();
      else active -= 1;
    }
  }

  return {
    run,
    prioritize(keys) {
      rankByKey.clear();
      keys.forEach((key, index) => rankByKey.set(key, index));
    },
  };
}

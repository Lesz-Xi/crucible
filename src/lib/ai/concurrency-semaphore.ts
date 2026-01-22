/**
 * Promise-based Semaphore for limiting concurrent async operations.
 * Use this to parallelize synthesis steps without hitting API rate limits.
 */
export class Semaphore {
  private permits: number;
  private queue: Array<(value: void | PromiseLike<void>) => void> = [];

  constructor(permits: number = 1) {
    this.permits = permits;
  }

  /**
   * Acquire a permit. Returns a promise that resolves when a permit is available.
   */
  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return Promise.resolve();
    }

    return new Promise(resolve => {
      this.queue.push(resolve);
    });
  }

  /**
   * Release a permit, allowing the next queued task to proceed.
   */
  release(): void {
    if (this.queue.length > 0) {
      const resolve = this.queue.shift();
      if (resolve) resolve(undefined);
    } else {
      this.permits++;
    }
  }

  /**
   * Execute a function with a lock.
   * usage: await semaphore.run(() => asyncFunction())
   */
  async run<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquire();
    try {
      return await fn();
    } finally {
      this.release();
    }
  }

  /**
   * Returns current available permits
   */
  getAvailablePermits(): number {
    return this.permits;
  }
}

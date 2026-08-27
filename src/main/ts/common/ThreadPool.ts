/**
 * Simple thread pool with a microtask-based queue.
 *
 * Timer-free: browsers clamp nested setTimeout(0) to several ms, which stalls queued tasks.
 */
export default class ThreadPool {

  protected maxConcurrency: number;
  protected numRunning: number;
  protected queueHead: any; // linked list of queued tasks for O(1) removal
  protected queueTail: any;
  protected drainListeners: Array<() => void>;

  /**
   * Construct the thread pool.
   *
   * @param {number} [maxConcurrency] - maximum number of threads in the pool (default 1)
   */
  constructor(maxConcurrency) {
    if (maxConcurrency === undefined) maxConcurrency = 1;
    if (maxConcurrency < 1) throw new Error("Max concurrency must be greater than or equal to 1");
    this.maxConcurrency = maxConcurrency;
    this.numRunning = 0;
    this.queueHead = undefined;
    this.queueTail = undefined;
    this.drainListeners = [];
  }

  /**
   * Submit an asynchronous function to run using the thread pool.
   *
   * @param {function} asyncFn - asynchronous function to run with the thread pool
   * @return {Promise<T>} resolves when the function completes execution
   */
  async submit<T>(asyncFn: () => Promise<T>): Promise<T> {
    try {
      return await new Promise((resolve, reject) => {
        const task = async () => {
          try {
            resolve(await ((asyncFn as any).then ? (asyncFn as any) : asyncFn()));
          } catch (err) {
            reject(err);
          } finally {
            this.numRunning--;
            this.processNext();
          }
        };
        if (this.numRunning < this.maxConcurrency) {
          this.numRunning++;
          Promise.resolve().then(task);
        } else {
          const node = {task: task, next: undefined};
          if (this.queueTail) this.queueTail.next = node;
          else this.queueHead = node;
          this.queueTail = node;
        }
      });
    } catch (err: any) {
      if (err && typeof err === "object" && typeof err.stack === "string") {
        err.stack = err.stack + "\nOriginating from: " + new Error().stack;
      }
      throw err;
    }
  }

  /**
   * Await all functions to complete.
   *
   * @return {Promise<void>} resolves when all functions complete
   */
  async awaitAll(): Promise<void> {
    if (this.numRunning === 0 && !this.queueHead) return;
    return new Promise((resolve) => { this.drainListeners.push(resolve); });
  }

  protected processNext() {
    if (this.queueHead) {
      const node = this.queueHead;
      this.queueHead = node.next;
      if (!this.queueHead) this.queueTail = undefined;
      this.numRunning++;
      Promise.resolve().then(node.task);
    } else if (this.numRunning === 0) {
      for (const listener of this.drainListeners.splice(0)) listener();
    }
  }
}

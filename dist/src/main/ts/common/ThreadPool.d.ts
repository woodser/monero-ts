/**
 * Simple thread pool with a microtask-based queue.
 *
 * Timer-free: browsers clamp nested setTimeout(0) to several ms, which stalls queued tasks.
 */
export default class ThreadPool {
    protected maxConcurrency: number;
    protected numRunning: number;
    protected queueHead: any;
    protected queueTail: any;
    protected drainListeners: Array<() => void>;
    /**
     * Construct the thread pool.
     *
     * @param {number} [maxConcurrency] - maximum number of threads in the pool (default 1)
     */
    constructor(maxConcurrency: any);
    /**
     * Submit an asynchronous function to run using the thread pool.
     *
     * @param {function} asyncFn - asynchronous function to run with the thread pool
     * @return {Promise<T>} resolves when the function completes execution
     */
    submit<T>(asyncFn: () => Promise<T>): Promise<T>;
    /**
     * Await all functions to complete.
     *
     * @return {Promise<void>} resolves when all functions complete
     */
    awaitAll(): Promise<void>;
    protected processNext(): void;
}

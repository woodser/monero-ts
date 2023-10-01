/**
 * Simple thread pool using the async library.
 */
export default class ThreadPool {
    protected taskQueue: any;
    protected drainListeners: any;
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
    submit<T>(asyncFn: any): Promise<T>;
    /**
     * Await all functions to complete.
     *
     * @return {Promise<void>} resolves when all functions complete
     */
    awaitAll(): Promise<void>;
}

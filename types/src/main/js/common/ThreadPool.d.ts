export = ThreadPool;
/**
 * Simple thread pool using the async library.
 */
declare class ThreadPool {
    /**
     * Construct the thread pool.
     *
     * @param {int} maxConcurrency - maximum number of threads in the pool (default 1)
     */
    constructor(maxConcurrency: int);
    taskQueue: any;
    drainListeners: any[];
    /**
     * Submit an asynchronous function to run using the thread pool.
     *
     * @param {function} asyncFn - asynchronous function to run with the thread pool
     * @return {Promise} resolves when the function completes execution
     */
    submit(asyncFn: Function): Promise<any>;
    /**
     * Await all functions to complete.
     *
     * @return {Promise} resolves when all functions complete
     */
    awaitAll(): Promise<any>;
}

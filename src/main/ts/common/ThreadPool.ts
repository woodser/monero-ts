import GenUtils from "./GenUtils";
import async from "async";

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
  constructor(maxConcurrency) {
    if (maxConcurrency === undefined) maxConcurrency = 1;
    if (maxConcurrency < 1) throw new Error("Max concurrency must be greater than or equal to 1");
    
    // manager concurrency with async queue
    //import async from "async";
    this.taskQueue = async.queue((asyncFn, callback) => {
      if (asyncFn.then) asyncFn.then(resp => { callback(resp); }).catch(err => { callback(undefined, err); });
      else asyncFn().then(resp => { callback(resp); }).catch(err => { callback(undefined, err); });
    }, maxConcurrency);
    
    // use drain listeners to support await all
    this.drainListeners = [];
    this.taskQueue.drain = () => {
      for (let listener of this.drainListeners) listener();
    }
  }
  
  /**
   * Submit an asynchronous function to run using the thread pool.
   * 
   * @param {function} asyncFn - asynchronous function to run with the thread pool
   * @return {Promise<T>} resolves when the function completes execution
   */
  async submit<T>(asyncFn): Promise<T> {
    return new Promise((resolve, reject) => {
      this.taskQueue.push(asyncFn, (resp, err) => {
        if (err !== undefined) reject(err);
        else resolve(resp);
      });
    });
  }
  
  /**
   * Await all functions to complete.
   * 
   * @return {Promise<void>} resolves when all functions complete
   */
  async awaitAll(): Promise<void> {
    if (this.taskQueue.length === 0) return;
    return new Promise((resolve) => {
      this.drainListeners.push(() => {
        GenUtils.remove(this.drainListeners, this);
        resolve();
      })
    });
  }
}


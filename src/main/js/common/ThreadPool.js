const GenUtils = require("./GenUtils");

/**
 * Simple thread pool using the async library.
 */
class ThreadPool {
  
  /**
   * Construct the thread pool.
   * 
   * @param {int} maxConcurrency - maximum number of threads in the pool (default 1)
   */
  constructor(maxConcurrency) {
    if (maxConcurrency === undefined) maxConcurrency = 1;
    if (maxConcurrency < 1) throw new Error("Max concurrency must be greater than or equal to 1");
    
    // manager concurrency with async queue
    const async = require("async");
    this.taskQueue = async.queue(function(asyncFn, callback) {
      if (asyncFn.then) asyncFn.then(resp => { callback(resp); }).catch(err => { callback(undefined, err); });
      else asyncFn().then(resp => { callback(resp); }).catch(err => { callback(undefined, err); });
    }, maxConcurrency);
    
    // use drain listeners to support await all
    let that = this;
    this.drainListeners = [];
    this.taskQueue.drain = function() {
      for (let listener of that.drainListeners) listener();
    }
  }
  
  /**
   * Submit an asynchronous function to run using the thread pool.
   * 
   * @param {function} asyncFn - asynchronous function to run with the thread pool
   * @return {Promise} resolves when the function completes execution
   */
  async submit(asyncFn) {
    let that = this;
    return new Promise(function(resolve, reject) {
      that.taskQueue.push(asyncFn, function(resp, err) {
        if (err !== undefined) reject(err);
        else resolve(resp);
      });
    });
  }
  
  /**
   * Await all functions to complete.
   * 
   * @return {Promise} resolves when all functions complete
   */
  async awaitAll() {
    if (this.taskQueue.length === 0) return;
    let that = this;
    return new Promise(function(resolve) {
      that.drainListeners.push(function() {
        GenUtils.remove(that.drainListeners, this);
        resolve();
      })
    });
  }
}

module.exports = ThreadPool;
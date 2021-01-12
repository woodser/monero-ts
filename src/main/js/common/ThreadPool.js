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
    const async = require("async");
    this.taskQueue = async.queue(function(asyncFn, callback) {
      if (asyncFn.then) asyncFn.then(resp => { callback(resp); }).catch(err => { callback(undefined, err); });
      else asyncFn().then(resp => { callback(resp); }).catch(err => { callback(undefined, err); });
    }, maxConcurrency);
  }
  
  /**
   * Submit an asynchronous function to run using the thread pool.
   * 
   * @param {function} asyncFn - asynchronous function to run with the thread pool
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
}

module.exports = ThreadPool;
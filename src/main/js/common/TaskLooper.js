/**
 * Run a task in a fixed period loop.
 */
class TaskLooper {
  
  /**
   * Build the looper with a function to invoke on a fixed period loop.
   * 
   * @param {function} fn - the function to invoke
   */
  constructor(fn) {
    this.fn = fn;
  }
  
  /**
   * Start the task loop.
   * 
   * @param {int} periodInMs the loop period in milliseconds
   */
  start(periodInMs) {
    if (this.isStarted) return;
    this.isStarted = true;
    this._runLoop(periodInMs);
  }
  
  /**
   * Stop the task loop.
   */
  stop() {
    this.isStarted = false;
  }
  
  async _runLoop(periodInMs) {
    this.isLooping = true;
    while (this.isStarted) {
      let startTime = Date.now();
      await this.fn();
      if (this.isStarted) await new Promise(function(resolve) { setTimeout(resolve, periodInMs - (Date.now() - startTime)); });
    }
    this.isLooping = false;
  }
}

module.exports = TaskLooper;
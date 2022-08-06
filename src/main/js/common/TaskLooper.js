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
    this.periodInMs = periodInMs;
    if (this.isStarted) return;
    this.isStarted = true;
    
    // start looping
    this._runLoop();
  }
  
  /**
   * Stop the task loop.
   */
  stop() {
    this.isStarted = false;
  }
  
  /**
   * Set the loop period in milliseconds.
   * 
   * @param {int} periodInMs the loop period in milliseconds
   */
  setPeriodInMs(periodInMs) {
    this.periodInMs = periodInMs;
  }
  
  async _runLoop() {
    if (this.isLooping) return;
    this.isLooping = true;
    let that = this;
    while (this.isStarted) {
      let startTime = Date.now();
      await this.fn();
      if (this.isStarted) await new Promise(function(resolve) { setTimeout(resolve, that.periodInMs - (Date.now() - startTime)); });
    }
    this.isLooping = false;
  }
}

module.exports = TaskLooper;
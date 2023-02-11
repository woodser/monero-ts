/**
 * Run a task in a fixed period loop.
 */
class TaskLooper {
  
  /**
   * Build the looper with a function to invoke on a fixed period loop.
   * 
   * @param {function} task - the task function to invoke
   */
  constructor(task) {
    this._task = task;
  }

  /**
   * Get the task function to invoke on a fixed period loop.
   * 
   * @return {function} the task function
   */
  getTask() {
    return this._task;
  }
  
  /**
   * Start the task loop.
   * 
   * @param {int} periodInMs the loop period in milliseconds
   * @return {TaskLooper} this class for chaining
   */
  start(periodInMs) {
    this._periodInMs = periodInMs;
    if (this._isStarted) return this;
    this._isStarted = true;
    
    // start looping
    this._runLoop();
    return this;
  }

  /**
   * Indicates if looping.
   * 
   * @return {boolean} true if looping, false otherwise
   */
  isStarted() {
    return this._isStarted;
  }
  
  /**
   * Stop the task loop.
   */
  stop() {
    this._isStarted = false;
  }
  
  /**
   * Set the loop period in milliseconds.
   * 
   * @param {int} periodInMs the loop period in milliseconds
   */
  setPeriodInMs(periodInMs) {
    this._periodInMs = periodInMs;
  }
  
  async _runLoop() {
    if (this._isLooping) return;
    this._isLooping = true;
    let that = this;
    while (this._isStarted) {
      let startTime = Date.now();
      await this._task();
      if (this._isStarted) await new Promise(function(resolve) { setTimeout(resolve, that._periodInMs - (Date.now() - startTime)); });
    }
    this._isLooping = false;
  }
}

module.exports = TaskLooper;
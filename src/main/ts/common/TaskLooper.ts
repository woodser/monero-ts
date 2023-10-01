/**
 * Run a task in a fixed period loop.
 */
export default class TaskLooper {

  // instance variables
  protected task: any;
  protected periodInMs: any;
  protected _isStarted: any;
  protected isLooping: any;
  
  /**
   * Build the looper with a function to invoke on a fixed period loop.
   * 
   * @param {function} task - the task function to invoke
   */
  constructor(task) {
    this.task = task;
  }

  /**
   * Get the task function to invoke on a fixed period loop.
   * 
   * @return {function} the task function
   */
  getTask() {
    return this.task;
  }
  
  /**
   * Start the task loop.
   * 
   * @param {number} periodInMs the loop period in milliseconds
   * @return {TaskLooper} this class for chaining
   */
  start(periodInMs) {
    this.setPeriodInMs(periodInMs);
    if (this._isStarted) return this;
    this._isStarted = true;
    
    // start looping
    this.runLoop();
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
   * @param {number} periodInMs the loop period in milliseconds
   */
  setPeriodInMs(periodInMs) {
    if (periodInMs <= 0) throw new Error("Looper period must be greater than 0 ms");
    this.periodInMs = periodInMs;
  }
  
  protected async runLoop() {
    if (this.isLooping) return;
    this.isLooping = true;
    let that = this;
    while (this._isStarted) {
      let startTime = Date.now();
      await this.task();
      if (this._isStarted) await new Promise(function(resolve) { setTimeout(resolve, that.periodInMs - (Date.now() - startTime)); });
    }
    this.isLooping = false;
  }
}

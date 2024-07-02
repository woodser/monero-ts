/**
 * Run a task in a fixed period loop.
 */
export default class TaskLooper {

  _fn: () => Promise<void>;
  _isStarted: boolean;
  _isLooping: boolean;
  _periodInMs: number;
  _timeout: NodeJS.Timeout | undefined;
  
  /**
   * Build the looper with a function to invoke on a fixed period loop.
   * 
   * @param {function} fn - the async function to invoke
   */
  constructor(fn: () => Promise<void>) {
    this._fn = fn;
    this._isStarted = false;
    this._isLooping = false;
  }

  /**
   * Get the task function to invoke on a fixed period loop.
   * 
   * @return {function} the task function
   */
  getTask() {
    return this._fn;
  }
  
  /**
   * Start the task loop.
   * 
   * @param {number} periodInMs the loop period in milliseconds
   * @param {boolean} targetFixedPeriod specifies if the task should target a fixed period by accounting for run time (default false)
   * @return {TaskLooper} this instance for chaining
   */
  start(periodInMs: number, targetFixedPeriod?: boolean) {
    if (periodInMs <= 0) throw new Error("Looper period must be greater than 0 ms");
    this.setPeriodInMs(periodInMs);
    if (this._isStarted) return;
    this._isStarted = true;
    this._runLoop(targetFixedPeriod);
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
    clearTimeout(this._timeout!);
    this._timeout = undefined;
  }

  /**
   * Set the loop period in milliseconds.
   * 
   * @param {number} periodInMs the loop period in milliseconds
   */
    setPeriodInMs(periodInMs) {
      if (periodInMs <= 0) throw new Error("Looper period must be greater than 0 ms");
      this._periodInMs = periodInMs;
    }
  
  async _runLoop(targetFixedPeriod: boolean) {
    this._isLooping = true;
    while (this._isStarted) {
      const startTime = Date.now();
      await this._fn();
      let that = this;
      if (this._isStarted) await new Promise((resolve) => { this._timeout = setTimeout(resolve, that._periodInMs - (targetFixedPeriod ? (Date.now() - startTime) : 0)); });
    }
    this._isLooping = false;
  }
}

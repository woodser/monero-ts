"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0; /**
 * Run a task in a fixed period loop.
 */
class TaskLooper {

  // instance variables





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

  async runLoop() {
    if (this.isLooping) return;
    this.isLooping = true;
    let that = this;
    while (this._isStarted) {
      let startTime = Date.now();
      await this.task();
      if (this._isStarted) await new Promise(function (resolve) {setTimeout(resolve, that.periodInMs - (Date.now() - startTime));});
    }
    this.isLooping = false;
  }
}exports.default = TaskLooper;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJUYXNrTG9vcGVyIiwiY29uc3RydWN0b3IiLCJ0YXNrIiwiZ2V0VGFzayIsInN0YXJ0IiwicGVyaW9kSW5NcyIsInNldFBlcmlvZEluTXMiLCJfaXNTdGFydGVkIiwicnVuTG9vcCIsImlzU3RhcnRlZCIsInN0b3AiLCJFcnJvciIsImlzTG9vcGluZyIsInRoYXQiLCJzdGFydFRpbWUiLCJEYXRlIiwibm93IiwiUHJvbWlzZSIsInJlc29sdmUiLCJzZXRUaW1lb3V0IiwiZXhwb3J0cyIsImRlZmF1bHQiXSwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvbWFpbi90cy9jb21tb24vVGFza0xvb3Blci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIFJ1biBhIHRhc2sgaW4gYSBmaXhlZCBwZXJpb2QgbG9vcC5cbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgVGFza0xvb3BlciB7XG5cbiAgLy8gaW5zdGFuY2UgdmFyaWFibGVzXG4gIHByb3RlY3RlZCB0YXNrOiBhbnk7XG4gIHByb3RlY3RlZCBwZXJpb2RJbk1zOiBhbnk7XG4gIHByb3RlY3RlZCBfaXNTdGFydGVkOiBhbnk7XG4gIHByb3RlY3RlZCBpc0xvb3Bpbmc6IGFueTtcbiAgXG4gIC8qKlxuICAgKiBCdWlsZCB0aGUgbG9vcGVyIHdpdGggYSBmdW5jdGlvbiB0byBpbnZva2Ugb24gYSBmaXhlZCBwZXJpb2QgbG9vcC5cbiAgICogXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb259IHRhc2sgLSB0aGUgdGFzayBmdW5jdGlvbiB0byBpbnZva2VcbiAgICovXG4gIGNvbnN0cnVjdG9yKHRhc2spIHtcbiAgICB0aGlzLnRhc2sgPSB0YXNrO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgdGFzayBmdW5jdGlvbiB0byBpbnZva2Ugb24gYSBmaXhlZCBwZXJpb2QgbG9vcC5cbiAgICogXG4gICAqIEByZXR1cm4ge2Z1bmN0aW9ufSB0aGUgdGFzayBmdW5jdGlvblxuICAgKi9cbiAgZ2V0VGFzaygpIHtcbiAgICByZXR1cm4gdGhpcy50YXNrO1xuICB9XG4gIFxuICAvKipcbiAgICogU3RhcnQgdGhlIHRhc2sgbG9vcC5cbiAgICogXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBwZXJpb2RJbk1zIHRoZSBsb29wIHBlcmlvZCBpbiBtaWxsaXNlY29uZHNcbiAgICogQHJldHVybiB7VGFza0xvb3Blcn0gdGhpcyBjbGFzcyBmb3IgY2hhaW5pbmdcbiAgICovXG4gIHN0YXJ0KHBlcmlvZEluTXMpIHtcbiAgICB0aGlzLnNldFBlcmlvZEluTXMocGVyaW9kSW5Ncyk7XG4gICAgaWYgKHRoaXMuX2lzU3RhcnRlZCkgcmV0dXJuIHRoaXM7XG4gICAgdGhpcy5faXNTdGFydGVkID0gdHJ1ZTtcbiAgICBcbiAgICAvLyBzdGFydCBsb29waW5nXG4gICAgdGhpcy5ydW5Mb29wKCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogSW5kaWNhdGVzIGlmIGxvb3BpbmcuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtib29sZWFufSB0cnVlIGlmIGxvb3BpbmcsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgaXNTdGFydGVkKCkge1xuICAgIHJldHVybiB0aGlzLl9pc1N0YXJ0ZWQ7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBTdG9wIHRoZSB0YXNrIGxvb3AuXG4gICAqL1xuICBzdG9wKCkge1xuICAgIHRoaXMuX2lzU3RhcnRlZCA9IGZhbHNlO1xuICB9XG4gIFxuICAvKipcbiAgICogU2V0IHRoZSBsb29wIHBlcmlvZCBpbiBtaWxsaXNlY29uZHMuXG4gICAqIFxuICAgKiBAcGFyYW0ge251bWJlcn0gcGVyaW9kSW5NcyB0aGUgbG9vcCBwZXJpb2QgaW4gbWlsbGlzZWNvbmRzXG4gICAqL1xuICBzZXRQZXJpb2RJbk1zKHBlcmlvZEluTXMpIHtcbiAgICBpZiAocGVyaW9kSW5NcyA8PSAwKSB0aHJvdyBuZXcgRXJyb3IoXCJMb29wZXIgcGVyaW9kIG11c3QgYmUgZ3JlYXRlciB0aGFuIDAgbXNcIik7XG4gICAgdGhpcy5wZXJpb2RJbk1zID0gcGVyaW9kSW5NcztcbiAgfVxuICBcbiAgcHJvdGVjdGVkIGFzeW5jIHJ1bkxvb3AoKSB7XG4gICAgaWYgKHRoaXMuaXNMb29waW5nKSByZXR1cm47XG4gICAgdGhpcy5pc0xvb3BpbmcgPSB0cnVlO1xuICAgIGxldCB0aGF0ID0gdGhpcztcbiAgICB3aGlsZSAodGhpcy5faXNTdGFydGVkKSB7XG4gICAgICBsZXQgc3RhcnRUaW1lID0gRGF0ZS5ub3coKTtcbiAgICAgIGF3YWl0IHRoaXMudGFzaygpO1xuICAgICAgaWYgKHRoaXMuX2lzU3RhcnRlZCkgYXdhaXQgbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSkgeyBzZXRUaW1lb3V0KHJlc29sdmUsIHRoYXQucGVyaW9kSW5NcyAtIChEYXRlLm5vdygpIC0gc3RhcnRUaW1lKSk7IH0pO1xuICAgIH1cbiAgICB0aGlzLmlzTG9vcGluZyA9IGZhbHNlO1xuICB9XG59XG4iXSwibWFwcGluZ3MiOiJxR0FBQTtBQUNBO0FBQ0E7QUFDZSxNQUFNQSxVQUFVLENBQUM7O0VBRTlCOzs7Ozs7RUFNQTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0VBQ0VDLFdBQVdBLENBQUNDLElBQUksRUFBRTtJQUNoQixJQUFJLENBQUNBLElBQUksR0FBR0EsSUFBSTtFQUNsQjs7RUFFQTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0VBQ0VDLE9BQU9BLENBQUEsRUFBRztJQUNSLE9BQU8sSUFBSSxDQUFDRCxJQUFJO0VBQ2xCOztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNFRSxLQUFLQSxDQUFDQyxVQUFVLEVBQUU7SUFDaEIsSUFBSSxDQUFDQyxhQUFhLENBQUNELFVBQVUsQ0FBQztJQUM5QixJQUFJLElBQUksQ0FBQ0UsVUFBVSxFQUFFLE9BQU8sSUFBSTtJQUNoQyxJQUFJLENBQUNBLFVBQVUsR0FBRyxJQUFJOztJQUV0QjtJQUNBLElBQUksQ0FBQ0MsT0FBTyxDQUFDLENBQUM7SUFDZCxPQUFPLElBQUk7RUFDYjs7RUFFQTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0VBQ0VDLFNBQVNBLENBQUEsRUFBRztJQUNWLE9BQU8sSUFBSSxDQUFDRixVQUFVO0VBQ3hCOztFQUVBO0FBQ0Y7QUFDQTtFQUNFRyxJQUFJQSxDQUFBLEVBQUc7SUFDTCxJQUFJLENBQUNILFVBQVUsR0FBRyxLQUFLO0VBQ3pCOztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7RUFDRUQsYUFBYUEsQ0FBQ0QsVUFBVSxFQUFFO0lBQ3hCLElBQUlBLFVBQVUsSUFBSSxDQUFDLEVBQUUsTUFBTSxJQUFJTSxLQUFLLENBQUMseUNBQXlDLENBQUM7SUFDL0UsSUFBSSxDQUFDTixVQUFVLEdBQUdBLFVBQVU7RUFDOUI7O0VBRUEsTUFBZ0JHLE9BQU9BLENBQUEsRUFBRztJQUN4QixJQUFJLElBQUksQ0FBQ0ksU0FBUyxFQUFFO0lBQ3BCLElBQUksQ0FBQ0EsU0FBUyxHQUFHLElBQUk7SUFDckIsSUFBSUMsSUFBSSxHQUFHLElBQUk7SUFDZixPQUFPLElBQUksQ0FBQ04sVUFBVSxFQUFFO01BQ3RCLElBQUlPLFNBQVMsR0FBR0MsSUFBSSxDQUFDQyxHQUFHLENBQUMsQ0FBQztNQUMxQixNQUFNLElBQUksQ0FBQ2QsSUFBSSxDQUFDLENBQUM7TUFDakIsSUFBSSxJQUFJLENBQUNLLFVBQVUsRUFBRSxNQUFNLElBQUlVLE9BQU8sQ0FBQyxVQUFTQyxPQUFPLEVBQUUsQ0FBRUMsVUFBVSxDQUFDRCxPQUFPLEVBQUVMLElBQUksQ0FBQ1IsVUFBVSxJQUFJVSxJQUFJLENBQUNDLEdBQUcsQ0FBQyxDQUFDLEdBQUdGLFNBQVMsQ0FBQyxDQUFDLENBQUUsQ0FBQyxDQUFDO0lBQ2hJO0lBQ0EsSUFBSSxDQUFDRixTQUFTLEdBQUcsS0FBSztFQUN4QjtBQUNGLENBQUNRLE9BQUEsQ0FBQUMsT0FBQSxHQUFBckIsVUFBQSJ9
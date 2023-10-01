"use strict";var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _GenUtils = _interopRequireDefault(require("./GenUtils"));
var _async = _interopRequireDefault(require("async"));

/**
 * Simple thread pool using the async library.
 */
class ThreadPool {




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
    this.taskQueue = _async.default.queue((asyncFn, callback) => {
      if (asyncFn.then) asyncFn.then((resp) => {callback(resp);}).catch((err) => {callback(undefined, err);});else
      asyncFn().then((resp) => {callback(resp);}).catch((err) => {callback(undefined, err);});
    }, maxConcurrency);

    // use drain listeners to support await all
    this.drainListeners = [];
    this.taskQueue.drain = () => {
      for (let listener of this.drainListeners) listener();
    };
  }

  /**
   * Submit an asynchronous function to run using the thread pool.
   * 
   * @param {function} asyncFn - asynchronous function to run with the thread pool
   * @return {Promise<T>} resolves when the function completes execution
   */
  async submit(asyncFn) {
    return new Promise((resolve, reject) => {
      this.taskQueue.push(asyncFn, (resp, err) => {
        if (err !== undefined) reject(err);else
        resolve(resp);
      });
    });
  }

  /**
   * Await all functions to complete.
   * 
   * @return {Promise<void>} resolves when all functions complete
   */
  async awaitAll() {
    if (this.taskQueue.length === 0) return;
    return new Promise((resolve) => {
      this.drainListeners.push(() => {
        _GenUtils.default.remove(this.drainListeners, this);
        resolve();
      });
    });
  }
}exports.default = ThreadPool;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfR2VuVXRpbHMiLCJfaW50ZXJvcFJlcXVpcmVEZWZhdWx0IiwicmVxdWlyZSIsIl9hc3luYyIsIlRocmVhZFBvb2wiLCJjb25zdHJ1Y3RvciIsIm1heENvbmN1cnJlbmN5IiwidW5kZWZpbmVkIiwiRXJyb3IiLCJ0YXNrUXVldWUiLCJhc3luYyIsInF1ZXVlIiwiYXN5bmNGbiIsImNhbGxiYWNrIiwidGhlbiIsInJlc3AiLCJjYXRjaCIsImVyciIsImRyYWluTGlzdGVuZXJzIiwiZHJhaW4iLCJsaXN0ZW5lciIsInN1Ym1pdCIsIlByb21pc2UiLCJyZXNvbHZlIiwicmVqZWN0IiwicHVzaCIsImF3YWl0QWxsIiwibGVuZ3RoIiwiR2VuVXRpbHMiLCJyZW1vdmUiLCJleHBvcnRzIiwiZGVmYXVsdCJdLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9tYWluL3RzL2NvbW1vbi9UaHJlYWRQb29sLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBHZW5VdGlscyBmcm9tIFwiLi9HZW5VdGlsc1wiO1xuaW1wb3J0IGFzeW5jIGZyb20gXCJhc3luY1wiO1xuXG4vKipcbiAqIFNpbXBsZSB0aHJlYWQgcG9vbCB1c2luZyB0aGUgYXN5bmMgbGlicmFyeS5cbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgVGhyZWFkUG9vbCB7XG5cbiAgcHJvdGVjdGVkIHRhc2tRdWV1ZTogYW55O1xuICBwcm90ZWN0ZWQgZHJhaW5MaXN0ZW5lcnM6IGFueTtcbiAgXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3QgdGhlIHRocmVhZCBwb29sLlxuICAgKiBcbiAgICogQHBhcmFtIHtudW1iZXJ9IFttYXhDb25jdXJyZW5jeV0gLSBtYXhpbXVtIG51bWJlciBvZiB0aHJlYWRzIGluIHRoZSBwb29sIChkZWZhdWx0IDEpXG4gICAqL1xuICBjb25zdHJ1Y3RvcihtYXhDb25jdXJyZW5jeSkge1xuICAgIGlmIChtYXhDb25jdXJyZW5jeSA9PT0gdW5kZWZpbmVkKSBtYXhDb25jdXJyZW5jeSA9IDE7XG4gICAgaWYgKG1heENvbmN1cnJlbmN5IDwgMSkgdGhyb3cgbmV3IEVycm9yKFwiTWF4IGNvbmN1cnJlbmN5IG11c3QgYmUgZ3JlYXRlciB0aGFuIG9yIGVxdWFsIHRvIDFcIik7XG4gICAgXG4gICAgLy8gbWFuYWdlciBjb25jdXJyZW5jeSB3aXRoIGFzeW5jIHF1ZXVlXG4gICAgLy9pbXBvcnQgYXN5bmMgZnJvbSBcImFzeW5jXCI7XG4gICAgdGhpcy50YXNrUXVldWUgPSBhc3luYy5xdWV1ZSgoYXN5bmNGbiwgY2FsbGJhY2spID0+IHtcbiAgICAgIGlmIChhc3luY0ZuLnRoZW4pIGFzeW5jRm4udGhlbihyZXNwID0+IHsgY2FsbGJhY2socmVzcCk7IH0pLmNhdGNoKGVyciA9PiB7IGNhbGxiYWNrKHVuZGVmaW5lZCwgZXJyKTsgfSk7XG4gICAgICBlbHNlIGFzeW5jRm4oKS50aGVuKHJlc3AgPT4geyBjYWxsYmFjayhyZXNwKTsgfSkuY2F0Y2goZXJyID0+IHsgY2FsbGJhY2sodW5kZWZpbmVkLCBlcnIpOyB9KTtcbiAgICB9LCBtYXhDb25jdXJyZW5jeSk7XG4gICAgXG4gICAgLy8gdXNlIGRyYWluIGxpc3RlbmVycyB0byBzdXBwb3J0IGF3YWl0IGFsbFxuICAgIHRoaXMuZHJhaW5MaXN0ZW5lcnMgPSBbXTtcbiAgICB0aGlzLnRhc2tRdWV1ZS5kcmFpbiA9ICgpID0+IHtcbiAgICAgIGZvciAobGV0IGxpc3RlbmVyIG9mIHRoaXMuZHJhaW5MaXN0ZW5lcnMpIGxpc3RlbmVyKCk7XG4gICAgfVxuICB9XG4gIFxuICAvKipcbiAgICogU3VibWl0IGFuIGFzeW5jaHJvbm91cyBmdW5jdGlvbiB0byBydW4gdXNpbmcgdGhlIHRocmVhZCBwb29sLlxuICAgKiBcbiAgICogQHBhcmFtIHtmdW5jdGlvbn0gYXN5bmNGbiAtIGFzeW5jaHJvbm91cyBmdW5jdGlvbiB0byBydW4gd2l0aCB0aGUgdGhyZWFkIHBvb2xcbiAgICogQHJldHVybiB7UHJvbWlzZTxUPn0gcmVzb2x2ZXMgd2hlbiB0aGUgZnVuY3Rpb24gY29tcGxldGVzIGV4ZWN1dGlvblxuICAgKi9cbiAgYXN5bmMgc3VibWl0PFQ+KGFzeW5jRm4pOiBQcm9taXNlPFQ+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgdGhpcy50YXNrUXVldWUucHVzaChhc3luY0ZuLCAocmVzcCwgZXJyKSA9PiB7XG4gICAgICAgIGlmIChlcnIgIT09IHVuZGVmaW5lZCkgcmVqZWN0KGVycik7XG4gICAgICAgIGVsc2UgcmVzb2x2ZShyZXNwKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICAvKipcbiAgICogQXdhaXQgYWxsIGZ1bmN0aW9ucyB0byBjb21wbGV0ZS5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59IHJlc29sdmVzIHdoZW4gYWxsIGZ1bmN0aW9ucyBjb21wbGV0ZVxuICAgKi9cbiAgYXN5bmMgYXdhaXRBbGwoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMudGFza1F1ZXVlLmxlbmd0aCA9PT0gMCkgcmV0dXJuO1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgdGhpcy5kcmFpbkxpc3RlbmVycy5wdXNoKCgpID0+IHtcbiAgICAgICAgR2VuVXRpbHMucmVtb3ZlKHRoaXMuZHJhaW5MaXN0ZW5lcnMsIHRoaXMpO1xuICAgICAgICByZXNvbHZlKCk7XG4gICAgICB9KVxuICAgIH0pO1xuICB9XG59XG5cbiJdLCJtYXBwaW5ncyI6InlMQUFBLElBQUFBLFNBQUEsR0FBQUMsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFDLE1BQUEsR0FBQUYsc0JBQUEsQ0FBQUMsT0FBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDZSxNQUFNRSxVQUFVLENBQUM7Ozs7O0VBSzlCO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7RUFDRUMsV0FBV0EsQ0FBQ0MsY0FBYyxFQUFFO0lBQzFCLElBQUlBLGNBQWMsS0FBS0MsU0FBUyxFQUFFRCxjQUFjLEdBQUcsQ0FBQztJQUNwRCxJQUFJQSxjQUFjLEdBQUcsQ0FBQyxFQUFFLE1BQU0sSUFBSUUsS0FBSyxDQUFDLG9EQUFvRCxDQUFDOztJQUU3RjtJQUNBO0lBQ0EsSUFBSSxDQUFDQyxTQUFTLEdBQUdDLGNBQUssQ0FBQ0MsS0FBSyxDQUFDLENBQUNDLE9BQU8sRUFBRUMsUUFBUSxLQUFLO01BQ2xELElBQUlELE9BQU8sQ0FBQ0UsSUFBSSxFQUFFRixPQUFPLENBQUNFLElBQUksQ0FBQyxDQUFBQyxJQUFJLEtBQUksQ0FBRUYsUUFBUSxDQUFDRSxJQUFJLENBQUMsQ0FBRSxDQUFDLENBQUMsQ0FBQ0MsS0FBSyxDQUFDLENBQUFDLEdBQUcsS0FBSSxDQUFFSixRQUFRLENBQUNOLFNBQVMsRUFBRVUsR0FBRyxDQUFDLENBQUUsQ0FBQyxDQUFDLENBQUM7TUFDbkdMLE9BQU8sQ0FBQyxDQUFDLENBQUNFLElBQUksQ0FBQyxDQUFBQyxJQUFJLEtBQUksQ0FBRUYsUUFBUSxDQUFDRSxJQUFJLENBQUMsQ0FBRSxDQUFDLENBQUMsQ0FBQ0MsS0FBSyxDQUFDLENBQUFDLEdBQUcsS0FBSSxDQUFFSixRQUFRLENBQUNOLFNBQVMsRUFBRVUsR0FBRyxDQUFDLENBQUUsQ0FBQyxDQUFDO0lBQzlGLENBQUMsRUFBRVgsY0FBYyxDQUFDOztJQUVsQjtJQUNBLElBQUksQ0FBQ1ksY0FBYyxHQUFHLEVBQUU7SUFDeEIsSUFBSSxDQUFDVCxTQUFTLENBQUNVLEtBQUssR0FBRyxNQUFNO01BQzNCLEtBQUssSUFBSUMsUUFBUSxJQUFJLElBQUksQ0FBQ0YsY0FBYyxFQUFFRSxRQUFRLENBQUMsQ0FBQztJQUN0RCxDQUFDO0VBQ0g7O0VBRUE7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0VBQ0UsTUFBTUMsTUFBTUEsQ0FBSVQsT0FBTyxFQUFjO0lBQ25DLE9BQU8sSUFBSVUsT0FBTyxDQUFDLENBQUNDLE9BQU8sRUFBRUMsTUFBTSxLQUFLO01BQ3RDLElBQUksQ0FBQ2YsU0FBUyxDQUFDZ0IsSUFBSSxDQUFDYixPQUFPLEVBQUUsQ0FBQ0csSUFBSSxFQUFFRSxHQUFHLEtBQUs7UUFDMUMsSUFBSUEsR0FBRyxLQUFLVixTQUFTLEVBQUVpQixNQUFNLENBQUNQLEdBQUcsQ0FBQyxDQUFDO1FBQzlCTSxPQUFPLENBQUNSLElBQUksQ0FBQztNQUNwQixDQUFDLENBQUM7SUFDSixDQUFDLENBQUM7RUFDSjs7RUFFQTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0VBQ0UsTUFBTVcsUUFBUUEsQ0FBQSxFQUFrQjtJQUM5QixJQUFJLElBQUksQ0FBQ2pCLFNBQVMsQ0FBQ2tCLE1BQU0sS0FBSyxDQUFDLEVBQUU7SUFDakMsT0FBTyxJQUFJTCxPQUFPLENBQUMsQ0FBQ0MsT0FBTyxLQUFLO01BQzlCLElBQUksQ0FBQ0wsY0FBYyxDQUFDTyxJQUFJLENBQUMsTUFBTTtRQUM3QkcsaUJBQVEsQ0FBQ0MsTUFBTSxDQUFDLElBQUksQ0FBQ1gsY0FBYyxFQUFFLElBQUksQ0FBQztRQUMxQ0ssT0FBTyxDQUFDLENBQUM7TUFDWCxDQUFDLENBQUM7SUFDSixDQUFDLENBQUM7RUFDSjtBQUNGLENBQUNPLE9BQUEsQ0FBQUMsT0FBQSxHQUFBM0IsVUFBQSJ9
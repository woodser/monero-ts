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
    try {
      return await new Promise((resolve, reject) => {
        this.taskQueue.push(asyncFn, (resp, err) => {
          if (err !== undefined) reject(err);else
          resolve(resp);
        });
      });
    } catch (err) {
      if (err instanceof Error) {
        err.stack = new Error().stack + "\nCaused By: " + err.stack; // TODO: this preserves original error type but overwrites stack which is non-standard. upgrade to ES2022+ and use err.cause, then check for that in callers?
        throw err;
      }
      throw new Error(String(err));
    }
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfR2VuVXRpbHMiLCJfaW50ZXJvcFJlcXVpcmVEZWZhdWx0IiwicmVxdWlyZSIsIl9hc3luYyIsIlRocmVhZFBvb2wiLCJjb25zdHJ1Y3RvciIsIm1heENvbmN1cnJlbmN5IiwidW5kZWZpbmVkIiwiRXJyb3IiLCJ0YXNrUXVldWUiLCJhc3luYyIsInF1ZXVlIiwiYXN5bmNGbiIsImNhbGxiYWNrIiwidGhlbiIsInJlc3AiLCJjYXRjaCIsImVyciIsImRyYWluTGlzdGVuZXJzIiwiZHJhaW4iLCJsaXN0ZW5lciIsInN1Ym1pdCIsIlByb21pc2UiLCJyZXNvbHZlIiwicmVqZWN0IiwicHVzaCIsInN0YWNrIiwiU3RyaW5nIiwiYXdhaXRBbGwiLCJsZW5ndGgiLCJHZW5VdGlscyIsInJlbW92ZSIsImV4cG9ydHMiLCJkZWZhdWx0Il0sInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL21haW4vdHMvY29tbW9uL1RocmVhZFBvb2wudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IEdlblV0aWxzIGZyb20gXCIuL0dlblV0aWxzXCI7XG5pbXBvcnQgYXN5bmMgZnJvbSBcImFzeW5jXCI7XG5cbi8qKlxuICogU2ltcGxlIHRocmVhZCBwb29sIHVzaW5nIHRoZSBhc3luYyBsaWJyYXJ5LlxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBUaHJlYWRQb29sIHtcblxuICBwcm90ZWN0ZWQgdGFza1F1ZXVlOiBhbnk7XG4gIHByb3RlY3RlZCBkcmFpbkxpc3RlbmVyczogYW55O1xuICBcbiAgLyoqXG4gICAqIENvbnN0cnVjdCB0aGUgdGhyZWFkIHBvb2wuXG4gICAqIFxuICAgKiBAcGFyYW0ge251bWJlcn0gW21heENvbmN1cnJlbmN5XSAtIG1heGltdW0gbnVtYmVyIG9mIHRocmVhZHMgaW4gdGhlIHBvb2wgKGRlZmF1bHQgMSlcbiAgICovXG4gIGNvbnN0cnVjdG9yKG1heENvbmN1cnJlbmN5KSB7XG4gICAgaWYgKG1heENvbmN1cnJlbmN5ID09PSB1bmRlZmluZWQpIG1heENvbmN1cnJlbmN5ID0gMTtcbiAgICBpZiAobWF4Q29uY3VycmVuY3kgPCAxKSB0aHJvdyBuZXcgRXJyb3IoXCJNYXggY29uY3VycmVuY3kgbXVzdCBiZSBncmVhdGVyIHRoYW4gb3IgZXF1YWwgdG8gMVwiKTtcbiAgICBcbiAgICAvLyBtYW5hZ2VyIGNvbmN1cnJlbmN5IHdpdGggYXN5bmMgcXVldWVcbiAgICAvL2ltcG9ydCBhc3luYyBmcm9tIFwiYXN5bmNcIjtcbiAgICB0aGlzLnRhc2tRdWV1ZSA9IGFzeW5jLnF1ZXVlKChhc3luY0ZuLCBjYWxsYmFjaykgPT4ge1xuICAgICAgaWYgKGFzeW5jRm4udGhlbikgYXN5bmNGbi50aGVuKHJlc3AgPT4geyBjYWxsYmFjayhyZXNwKTsgfSkuY2F0Y2goZXJyID0+IHsgY2FsbGJhY2sodW5kZWZpbmVkLCBlcnIpOyB9KTtcbiAgICAgIGVsc2UgYXN5bmNGbigpLnRoZW4ocmVzcCA9PiB7IGNhbGxiYWNrKHJlc3ApOyB9KS5jYXRjaChlcnIgPT4geyBjYWxsYmFjayh1bmRlZmluZWQsIGVycik7IH0pO1xuICAgIH0sIG1heENvbmN1cnJlbmN5KTtcbiAgICBcbiAgICAvLyB1c2UgZHJhaW4gbGlzdGVuZXJzIHRvIHN1cHBvcnQgYXdhaXQgYWxsXG4gICAgdGhpcy5kcmFpbkxpc3RlbmVycyA9IFtdO1xuICAgIHRoaXMudGFza1F1ZXVlLmRyYWluID0gKCkgPT4ge1xuICAgICAgZm9yIChsZXQgbGlzdGVuZXIgb2YgdGhpcy5kcmFpbkxpc3RlbmVycykgbGlzdGVuZXIoKTtcbiAgICB9XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBTdWJtaXQgYW4gYXN5bmNocm9ub3VzIGZ1bmN0aW9uIHRvIHJ1biB1c2luZyB0aGUgdGhyZWFkIHBvb2wuXG4gICAqIFxuICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBhc3luY0ZuIC0gYXN5bmNocm9ub3VzIGZ1bmN0aW9uIHRvIHJ1biB3aXRoIHRoZSB0aHJlYWQgcG9vbFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPFQ+fSByZXNvbHZlcyB3aGVuIHRoZSBmdW5jdGlvbiBjb21wbGV0ZXMgZXhlY3V0aW9uXG4gICAqL1xuICBhc3luYyBzdWJtaXQ8VD4oYXN5bmNGbik6IFByb21pc2U8VD4ge1xuICAgIHRyeSB7XG4gICAgICByZXR1cm4gYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLnRhc2tRdWV1ZS5wdXNoKGFzeW5jRm4sIChyZXNwLCBlcnIpID0+IHtcbiAgICAgICAgICBpZiAoZXJyICE9PSB1bmRlZmluZWQpIHJlamVjdChlcnIpO1xuICAgICAgICAgIGVsc2UgcmVzb2x2ZShyZXNwKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIGlmIChlcnIgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgICBlcnIuc3RhY2sgPSBuZXcgRXJyb3IoKS5zdGFjayArIFwiXFxuQ2F1c2VkIEJ5OiBcIiArIGVyci5zdGFjazsgLy8gVE9ETzogdGhpcyBwcmVzZXJ2ZXMgb3JpZ2luYWwgZXJyb3IgdHlwZSBidXQgb3ZlcndyaXRlcyBzdGFjayB3aGljaCBpcyBub24tc3RhbmRhcmQuIHVwZ3JhZGUgdG8gRVMyMDIyKyBhbmQgdXNlIGVyci5jYXVzZSwgdGhlbiBjaGVjayBmb3IgdGhhdCBpbiBjYWxsZXJzP1xuICAgICAgICB0aHJvdyBlcnI7XG4gICAgICB9XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoU3RyaW5nKGVycikpO1xuICAgIH1cbiAgfVxuICBcbiAgLyoqXG4gICAqIEF3YWl0IGFsbCBmdW5jdGlvbnMgdG8gY29tcGxldGUuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHZvaWQ+fSByZXNvbHZlcyB3aGVuIGFsbCBmdW5jdGlvbnMgY29tcGxldGVcbiAgICovXG4gIGFzeW5jIGF3YWl0QWxsKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLnRhc2tRdWV1ZS5sZW5ndGggPT09IDApIHJldHVybjtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgIHRoaXMuZHJhaW5MaXN0ZW5lcnMucHVzaCgoKSA9PiB7XG4gICAgICAgIEdlblV0aWxzLnJlbW92ZSh0aGlzLmRyYWluTGlzdGVuZXJzLCB0aGlzKTtcbiAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgfSlcbiAgICB9KTtcbiAgfVxufVxuXG4iXSwibWFwcGluZ3MiOiJ5TEFBQSxJQUFBQSxTQUFBLEdBQUFDLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBQyxNQUFBLEdBQUFGLHNCQUFBLENBQUFDLE9BQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ2UsTUFBTUUsVUFBVSxDQUFDOzs7OztFQUs5QjtBQUNGO0FBQ0E7QUFDQTtBQUNBO0VBQ0VDLFdBQVdBLENBQUNDLGNBQWMsRUFBRTtJQUMxQixJQUFJQSxjQUFjLEtBQUtDLFNBQVMsRUFBRUQsY0FBYyxHQUFHLENBQUM7SUFDcEQsSUFBSUEsY0FBYyxHQUFHLENBQUMsRUFBRSxNQUFNLElBQUlFLEtBQUssQ0FBQyxvREFBb0QsQ0FBQzs7SUFFN0Y7SUFDQTtJQUNBLElBQUksQ0FBQ0MsU0FBUyxHQUFHQyxjQUFLLENBQUNDLEtBQUssQ0FBQyxDQUFDQyxPQUFPLEVBQUVDLFFBQVEsS0FBSztNQUNsRCxJQUFJRCxPQUFPLENBQUNFLElBQUksRUFBRUYsT0FBTyxDQUFDRSxJQUFJLENBQUMsQ0FBQUMsSUFBSSxLQUFJLENBQUVGLFFBQVEsQ0FBQ0UsSUFBSSxDQUFDLENBQUUsQ0FBQyxDQUFDLENBQUNDLEtBQUssQ0FBQyxDQUFBQyxHQUFHLEtBQUksQ0FBRUosUUFBUSxDQUFDTixTQUFTLEVBQUVVLEdBQUcsQ0FBQyxDQUFFLENBQUMsQ0FBQyxDQUFDO01BQ25HTCxPQUFPLENBQUMsQ0FBQyxDQUFDRSxJQUFJLENBQUMsQ0FBQUMsSUFBSSxLQUFJLENBQUVGLFFBQVEsQ0FBQ0UsSUFBSSxDQUFDLENBQUUsQ0FBQyxDQUFDLENBQUNDLEtBQUssQ0FBQyxDQUFBQyxHQUFHLEtBQUksQ0FBRUosUUFBUSxDQUFDTixTQUFTLEVBQUVVLEdBQUcsQ0FBQyxDQUFFLENBQUMsQ0FBQztJQUM5RixDQUFDLEVBQUVYLGNBQWMsQ0FBQzs7SUFFbEI7SUFDQSxJQUFJLENBQUNZLGNBQWMsR0FBRyxFQUFFO0lBQ3hCLElBQUksQ0FBQ1QsU0FBUyxDQUFDVSxLQUFLLEdBQUcsTUFBTTtNQUMzQixLQUFLLElBQUlDLFFBQVEsSUFBSSxJQUFJLENBQUNGLGNBQWMsRUFBRUUsUUFBUSxDQUFDLENBQUM7SUFDdEQsQ0FBQztFQUNIOztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNFLE1BQU1DLE1BQU1BLENBQUlULE9BQU8sRUFBYztJQUNuQyxJQUFJO01BQ0YsT0FBTyxNQUFNLElBQUlVLE9BQU8sQ0FBQyxDQUFDQyxPQUFPLEVBQUVDLE1BQU0sS0FBSztRQUM1QyxJQUFJLENBQUNmLFNBQVMsQ0FBQ2dCLElBQUksQ0FBQ2IsT0FBTyxFQUFFLENBQUNHLElBQUksRUFBRUUsR0FBRyxLQUFLO1VBQzFDLElBQUlBLEdBQUcsS0FBS1YsU0FBUyxFQUFFaUIsTUFBTSxDQUFDUCxHQUFHLENBQUMsQ0FBQztVQUM5Qk0sT0FBTyxDQUFDUixJQUFJLENBQUM7UUFDcEIsQ0FBQyxDQUFDO01BQ0osQ0FBQyxDQUFDO0lBQ0osQ0FBQyxDQUFDLE9BQU9FLEdBQUcsRUFBRTtNQUNaLElBQUlBLEdBQUcsWUFBWVQsS0FBSyxFQUFFO1FBQ3hCUyxHQUFHLENBQUNTLEtBQUssR0FBRyxJQUFJbEIsS0FBSyxDQUFDLENBQUMsQ0FBQ2tCLEtBQUssR0FBRyxlQUFlLEdBQUdULEdBQUcsQ0FBQ1MsS0FBSyxDQUFDLENBQUM7UUFDN0QsTUFBTVQsR0FBRztNQUNYO01BQ0EsTUFBTSxJQUFJVCxLQUFLLENBQUNtQixNQUFNLENBQUNWLEdBQUcsQ0FBQyxDQUFDO0lBQzlCO0VBQ0Y7O0VBRUE7QUFDRjtBQUNBO0FBQ0E7QUFDQTtFQUNFLE1BQU1XLFFBQVFBLENBQUEsRUFBa0I7SUFDOUIsSUFBSSxJQUFJLENBQUNuQixTQUFTLENBQUNvQixNQUFNLEtBQUssQ0FBQyxFQUFFO0lBQ2pDLE9BQU8sSUFBSVAsT0FBTyxDQUFDLENBQUNDLE9BQU8sS0FBSztNQUM5QixJQUFJLENBQUNMLGNBQWMsQ0FBQ08sSUFBSSxDQUFDLE1BQU07UUFDN0JLLGlCQUFRLENBQUNDLE1BQU0sQ0FBQyxJQUFJLENBQUNiLGNBQWMsRUFBRSxJQUFJLENBQUM7UUFDMUNLLE9BQU8sQ0FBQyxDQUFDO01BQ1gsQ0FBQyxDQUFDO0lBQ0osQ0FBQyxDQUFDO0VBQ0o7QUFDRixDQUFDUyxPQUFBLENBQUFDLE9BQUEsR0FBQTdCLFVBQUEifQ==
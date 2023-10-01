"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0; /**
 * Base filter.
 * 
 * @private
 */
class Filter {

  /**
   * Indicates if the given value meets the criteria of this filter.
   * 
   * @param val is the value to test
   * @return true if the value meets the criteria of this filter, false otherwise
   */
  meetsCriteria(val) {
    throw new Error("Subclass must implement");
  }

  /**
   * Returns a new array comprised of elements from the given array that meet
   * the filter's criteria.
   * 
   * @param filter implements meetsCriteria(elem) to filter the given array
   * @param array is the array to apply the filter to
   * @return the new array of filtered elements
   */
  static apply(filter, array) {
    return array.filter((elem) => !filter || filter.meetsCriteria(elem));
  }
}exports.default = Filter;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJGaWx0ZXIiLCJtZWV0c0NyaXRlcmlhIiwidmFsIiwiRXJyb3IiLCJhcHBseSIsImZpbHRlciIsImFycmF5IiwiZWxlbSIsImV4cG9ydHMiLCJkZWZhdWx0Il0sInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL21haW4vdHMvY29tbW9uL0ZpbHRlci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEJhc2UgZmlsdGVyLlxuICogXG4gKiBAcHJpdmF0ZVxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBGaWx0ZXIge1xuICBcbiAgLyoqXG4gICAqIEluZGljYXRlcyBpZiB0aGUgZ2l2ZW4gdmFsdWUgbWVldHMgdGhlIGNyaXRlcmlhIG9mIHRoaXMgZmlsdGVyLlxuICAgKiBcbiAgICogQHBhcmFtIHZhbCBpcyB0aGUgdmFsdWUgdG8gdGVzdFxuICAgKiBAcmV0dXJuIHRydWUgaWYgdGhlIHZhbHVlIG1lZXRzIHRoZSBjcml0ZXJpYSBvZiB0aGlzIGZpbHRlciwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBtZWV0c0NyaXRlcmlhKHZhbDogYW55KTogYm9vbGVhbiB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiU3ViY2xhc3MgbXVzdCBpbXBsZW1lbnRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgbmV3IGFycmF5IGNvbXByaXNlZCBvZiBlbGVtZW50cyBmcm9tIHRoZSBnaXZlbiBhcnJheSB0aGF0IG1lZXRcbiAgICogdGhlIGZpbHRlcidzIGNyaXRlcmlhLlxuICAgKiBcbiAgICogQHBhcmFtIGZpbHRlciBpbXBsZW1lbnRzIG1lZXRzQ3JpdGVyaWEoZWxlbSkgdG8gZmlsdGVyIHRoZSBnaXZlbiBhcnJheVxuICAgKiBAcGFyYW0gYXJyYXkgaXMgdGhlIGFycmF5IHRvIGFwcGx5IHRoZSBmaWx0ZXIgdG9cbiAgICogQHJldHVybiB0aGUgbmV3IGFycmF5IG9mIGZpbHRlcmVkIGVsZW1lbnRzXG4gICAqL1xuICBzdGF0aWMgYXBwbHkoZmlsdGVyOiBGaWx0ZXIsIGFycmF5OiBhbnlbXSk6IGFueVtdIHtcbiAgICByZXR1cm4gYXJyYXkuZmlsdGVyKGVsZW0gPT4gIWZpbHRlciB8fCBmaWx0ZXIubWVldHNDcml0ZXJpYShlbGVtKSk7XG4gIH1cbn1cbiJdLCJtYXBwaW5ncyI6InFHQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDZSxNQUFNQSxNQUFNLENBQUM7O0VBRTFCO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNFQyxhQUFhQSxDQUFDQyxHQUFRLEVBQVc7SUFDL0IsTUFBTSxJQUFJQyxLQUFLLENBQUMseUJBQXlCLENBQUM7RUFDNUM7O0VBRUE7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNFLE9BQU9DLEtBQUtBLENBQUNDLE1BQWMsRUFBRUMsS0FBWSxFQUFTO0lBQ2hELE9BQU9BLEtBQUssQ0FBQ0QsTUFBTSxDQUFDLENBQUFFLElBQUksS0FBSSxDQUFDRixNQUFNLElBQUlBLE1BQU0sQ0FBQ0osYUFBYSxDQUFDTSxJQUFJLENBQUMsQ0FBQztFQUNwRTtBQUNGLENBQUNDLE9BQUEsQ0FBQUMsT0FBQSxHQUFBVCxNQUFBIn0=
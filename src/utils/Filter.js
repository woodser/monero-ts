/**
 * Base filter.
 */
class Filter {
  
  /**
   * Applies this filter to the given array by removing elements in place that
   * do not meet this filter's criteria.
   * 
   * @param array is the array to filter in place
   * @returns {[]} is a reference to the filtered array for convenience
   */
  apply(array) {
    throw new Error("Not implemented");
  }
  
  /**
   * Indicates if the given parameter meets the criteria of this filter.
   * 
   * Elements that do not meet this filter's criteria are removed when this
   * filter is applied to an array.
   * 
   * @param param is the parameter to test
   * @returns true if the param meets the criteria of this filter, false otherwise
   */
  meetsCriteria(param) {
    throw new Error("Subclass must implement");
  }
}

module.exports = Filter;
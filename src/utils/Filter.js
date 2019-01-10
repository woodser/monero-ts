/**
 * Base filter.
 */
class Filter {
  
  /**
   * Returns a new array comprised of elements from the given array that meet
   * this filter's criteria.
   * 
   * @param array is the array to apply this filter to
   * @returns {[]} is the new array of filtered elements
   */
  apply(array) {
    return array.filter(elem => this.meetsCriteria(elem));
  }
  
  /**
   * Indicates if the given parameter meets the criteria of this filter.
   * 
   * @param param is the parameter to test
   * @returns true if the param meets the criteria of this filter, false otherwise
   */
  meetsCriteria(param) {
    throw new Error("Subclass must implement");
  }
}

module.exports = Filter;
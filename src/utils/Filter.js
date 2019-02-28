/**
 * Base filter.
 */
class Filter {
  
  /**
   * Returns a new array comprised of elements from the given array that meet
   * this filter's criteria.
   * 
   * @param array is the array to apply this filter to
   * @return {[]} is the new array of filtered elements
   */
  apply(array) {
    return array.filter(elem => this.meetsCriteria(elem));
  }
  
  /**
   * Indicates if the given value meets the criteria of this filter.
   * 
   * @param val is the value to test
   * @return true if the value meets the criteria of this filter, false otherwise
   */
  meetsCriteria(val) {
    throw new Error("Subclass must implement");
  }
}

module.exports = Filter;
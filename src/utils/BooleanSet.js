const assert = require("assert");
const GenUtils = require("../utils/GenUtils");

/**
 * Allows an infinite array of booleans to be set to true or false using ranges
 * to efficiently compress consecutive values.
 * 
 * TODO: optimize ranges using arrays and single numbers
 * TODO: don't set inverted by default
 */
class BooleanSet {

  /**
   * Constructs a BooleanSet.
   * 
   * @param stateOrObj is a state to initialize by reference, an existing
   *        BooleanSet to deep copy, or defaults to a cleared state
   */
  constructor(stateOrObj) {
    
    // deep copy state object if BooleanSet given
    if (stateOrObj instanceof BooleanSet) {
      this._setState(GenUtils.copyProperties(stateOrObj.getState()));
    }
    
    // set state directly by reference if internal state object given
    else if (stateOrObj) {
      this._setState(stateOrObj);
    }
    
    // otherwise start new
    else {
      this.state = {};
      this.state.ranges = [];
    }
  }
  
  /**
   * Returns the internal state of this set.
   * 
   * @returns {Object} with internal state.
   */
  getState() {
    return this.state;
  }
  
  /**
   * Sets all booleans to false.
   * 
   * @returns {BooleanSet} is this instance
   */
  clear() {
    return this.set(false);
  }
  
  /**
   * Copies this BooleanSet to a new one.
   * 
   * @returns {BooleanSet} is a copy of this instance
   */
  copy() {
    return new BooleanSet(this);
  }
  
  /**
   * Sets one or all booleans.
   * 
   * @param {boolean} val is the boolean value to set
   * @param {number} idx is the index of the value to set, sets all if not provided
   * @returns {BooleanSet} is this instance
   */
  set(val, idx, param) {
    
    // validate val and no extra param
    assert(typeof val === "boolean", "Value to set must be a boolean");
    assert(param === undefined, "3rd parameter must be undefined but was " + param);
    
    // set all
    if (idx === undefined || idx === null) {
      delete this.state.inverted;
      this.state.ranges.length = 0;
      if (val) this.state.inverted = true;
      return this;
    }
    
    // validate index
    assert(GenUtils.isInt(idx) && idx >= 0, "Index must be an integer >= 0 but was " + idx);
    
    // done if no change
    if (val === this.get(idx)) return;
    
    // find indices of previous, current, and next ranges relative to idx
    let prevRangeIdx, curRangeIdx, nextRangeIdx;
    for (let rangeIdx = 0; rangeIdx < this.state.ranges.length; rangeIdx++) {
      let range = this.state.ranges[rangeIdx];
      if (range.end < idx) prevRangeIdx = rangeIdx;
      else if (range.start <= idx && range.end >= idx) curRangeIdx = rangeIdx;
      else if (nextRangeIdx === undefined && range.start > idx) {
        nextRangeIdx = rangeIdx;
        break;
      }
    }
    
    // handle change in a range
    if (curRangeIdx !== undefined) {
      let range = this.state.ranges[curRangeIdx];
      if (range.start === idx) {
        if (range.end === idx) this.state.ranges.splice(curRangeIdx, 1);                // remove range
        else range.start++;                                                             // increment start
      } else if (range.end === idx) {
        range.end--;                                                                    // decrement end
      } else {
        this.state.ranges.splice(curRangeIdx + 1, 0, {start: idx + 1, end: range.end}); // add range
        range.end = idx - 1;
      }
    }
    
    // handle change not in a range
    else {
      
      // track whether or not idx is incorporated into existing range
      let incorporated = false;
      
      // incorporate idx into previous range if applicable
      if (prevRangeIdx !== undefined) {
        let prevRange = this.state.ranges[prevRangeIdx];
        if (prevRange.end === idx - 1) {
          prevRange.end++;
          incorporated = true;
        }
      }
      
      // incorporate idx into next range if applicable
      if (nextRangeIdx !== undefined) {
        let nextRange = this.state.ranges[nextRangeIdx];
        if (nextRange.start === idx + 1) {
          nextRange.start--;
          incorporated = true;
        }
      }
      
      // merge previous and next ranges if applicable
      if (incorporated && prevRangeIdx !== undefined && nextRangeIdx !== undefined) {
        let prevRange = this.state.ranges[prevRangeIdx];
        let nextRange = this.state.ranges[nextRangeIdx];
        if (prevRange.end === nextRange.start) {
          prevRange.end = nextRange.end;
          this.state.ranges.splice(nextRangeIdx, 1);
        }
      }
      
      // start new range if not incorporated
      if (!incorporated) {
        let rangeIdx = prevRangeIdx === undefined ? 0 : prevRangeIdx + 1;
        this.state.ranges.splice(rangeIdx, 0, {start: idx, end: idx});
      }
    }
    
    return this;
  }
  
  /**
   * Sets booleans in a range.
   * 
   * @param {boolean} val is the boolean value to set in the range
   * @param {number} start is the start of the range (defaults to 0)
   * @param {number} end is the end of the range (defaults to infinity)
   * @returns {BooleanSet} is this instance
   */
  setRange(val, start, end) {
    
    // validate and sanitize inputs
    assert(typeof val === "boolean", "Value to set must be a boolean");
    if (start === undefined || start === null) start = 0;
    if (end === null) end = undefined;
    assert(GenUtils.isInt(start) && start >= 0, "Start must be an integer >= 0 but was " + start);
    if (end !== undefined) assert(GenUtils.isInt(end) && end >= start, "End must be an integer >= start (" + start + ") but was " + end);
    
    // handle bounded range
    // TODO: can be more efficient than setting each index
    if (end !== undefined) {
      for (let i = start; i <= end; i++) {
        this.set(val, i);
      }
    }
    
    // handle unbounded range
    else {
      throw new Error("Not implemented");
    }
  }
  
  /**
   * Flips one or all booleans.
   * 
   * @param {number} idx is the index to flip, flips all if not provided
   * @returns {BooleanSet} is this instance
   */
  flip(idx) {
    
    // flip index
    if (idx !== null && idx !== undefined) {
      this.set(!this.get(idx), idx);
    }
    
    // flip all
    else {
      this.state.inverted = !this.state.inverted;
    }
    
    return this;
  }
  
  /**
   * Flips booleans in a range.
   * 
   * @param start is the start of the range (defaults to 0)
   * @param end is the end of the range (defaults to infinit)
   * @returns {BooleanSet} is this instance
   */
  flipRange(start, end) {
    throw new Error("Not implemented");
  }
  
  /**
   * Gets the boolean value at a given index.
   * 
   * @param {number} idx is the index of the value to get
   * @returns {boolean} the value at the index
   */
  get(idx) {
    
    // validate input
    assert(GenUtils.isInt(idx) && idx >= 0, "Index must be an integer >= 0 but was " + idx);
    
    // determine if idx is in range
    let inRange = false;
    for (let range of this.state.ranges) {
      if (range.start <= idx && range.end >= idx) {
        inRange = true;
        break;
      }
    }
    
    // apply inversion if applicable
    return inRange ? !this.state.inverted : !!this.state.inverted;
  }
  
  /**
   * Gets the first index in a range with the given value.
   * 
   * @param {boolean} val is the value to get the first index of
   * @param start is the start of the range (defauls to 0)
   * @param end is the end of the range (defaults to infinity)
   * @returns {number} is the first index in the range with the value, null if none found
   */
  getFirst(val, start, end) {
    
    // validate and sanitize inputs
    assert(typeof val === "boolean", "Value to set must be a boolean");
    if (start === undefined || start === null) start = 0;
    if (end === null) end = undefined;
    assert(GenUtils.isInt(start) && start >= 0, "Start must be an integer >= 0 but was " + start);
    if (end !== undefined) assert(GenUtils.isInt(end) && end >= start, "End must be an integer >= start (" + start + ") but was " + end);

    // get first range that touches search bounds
    let firstRange;
    for (let range of this.state.ranges) {
      
      // handle bounded range
      if (end !== undefined) {
        if (this._overlaps(range.start, range.end, start, end)) {
          firstRange = range;
          break;
        }
      }
      
      // handle unbounded range
      else if (range.end >= start) {
        firstRange = range;
        break;
      }
    }
    
    // if a suitable range is not found, everything in the given range is the same
    if (firstRange === undefined) return this.get(start) === val ? start : null;
    
    // if they match, return first index in bounds
    if (this.get(firstRange.start) === val) return Math.max(start, firstRange.start);
    
    // otherwise return first index outside of range
    if (start < firstRange.start) return start;
    return firstRange.end + 1 > end ? null : firstRange.end + 1;
  }
  
  /**
   * Gets the last index in a range with the given value.
   * 
   * @param {boolean} val is the value to get the last index of
   * @param start is the start of the range (defauls to 0)
   * @param end is the end of the range (defaults to infinity)
   * @returns {number} is the last index in the range with the value, null if none found, undefined if infinity
   */
  getLast(val, start, end) {
    throw new Error("Not implemented");
  }
  
  /**
   * Indicates if all booleans in a range are set to a given value.
   * 
   * @param {boolean} val is the value to test in the range
   * @param {number} start is the start of the range (defaults to 0)
   * @param {number} end is the end of the range (defaults to infinity)
   * @returns {boolean} is true if all booleans in the range are the given value, false otherwise
   */
  allSet(val, start, end) {
    assert(typeof val === "boolean", "Value to check must be a boolean");
    return this.getFirst(!val, start, end) === null;
  }
  
  /**
   * Indicates if any booleans in a range are set to a given value.
   * 
   * @param {boolean} val is the value to test in the range
   * @param {number} start is the start of the range (defaults to 0)
   * @param {number} end is the end of the range (defaults to infinity)
   * @returns {boolean} is true if any booleans in the range are the given value, false otherwise
   */
  anySet(val, start, end) {
    assert(typeof val === "boolean", "Value to check must be a boolean");
    return this.getFirst(val, start, end) !== null;
  }
  
  /**
   * Converts the given range to an array.
   * 
   * @param {number} start is the start index of the range
   * @param {number} is the end index of the range (defaults to length())
   * @returns {boolean[]} is an array representation of the given range
   */
  toArray(start, end = this.length()) {
    //if (end === undefined || end === null) end = this.length();
    throw new Error("Not implemented");
  }
  
  /**
   * Returns the index of the last boolean before all remaining booleans are infinitely false
   * or true (depending on if flip() was called which flips infinity).
   * 
   * @returns {number} is the last set boolean before the remaining are infinitely true or false
   */
  length() {
    return this.flipped ? this.getLast(false) : this.getLast(true);
  }
  
  // ---------------------------------- PRIVATE -------------------------------
  
  _setState(state) {
    BooleanSet._validateState(state);
    delete this.state;
    this.state = state;
    return this;
  }
  
  static _validateState(state) {
    assert(state);
    assert(state instanceof Object)
    assert (state.inverted === undefined || typeof state.inverted === "boolean");
    assert(state.ranges !== undefined);
    assert(Array.isArray(state.ranges));
    for (let range of state.ranges) {
      assert(range.start >= 0);
      assert(range.end >= 0);
    }
  }
  
  _overlaps(start1, end1, start2, end2) {
    if (end1 < start2) return false;
    if (end2 < start1) return false;
    return true;
  }
}

module.exports = BooleanSet;
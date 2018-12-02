const assert = require("assert");
const GenUtils = require("../utils/GenUtils");

/**
 * Allows indices in an infinite range to be arbitrarily marked or not marked.
 * 
 * TODO: ranges should be array[2], don't set inverted by default
 */
class IndexMarker {
  
  /**
   * Constructs the marker.
   * 
   * @param stateOrMarker is an initial state or marker to copy (optional)
   */
  constructor(stateOrMarker) {
    if (stateOrMarker instanceof IndexMarker) this.setState(GenUtils.copyProperties(stateOrMarker.getState()));
    else if (stateOrMarker) this.setState(stateOrMarker);
    else {
      this.state = { inverted: false, ranges: [] };
      this.reset();
    }
  }
  
  /**
   * Get the internal state of the marker.
   */
  getState() {
    return this.state;
  }
  
  /**
   * Set the internal state of the marker.
   * 
   * @param state is the state to set
   * @returns this instance for convenience
   */
  setState(state) {
    IndexMarker._validateState(state);
    delete this.state;
    this.state = state;
    return this;
  }
  
  /**
   * Resets everything to unmarked.
   * 
   * @returns this instance for convenience
   */
  reset() {
    this.state.inverted = false;
    this.state.ranges.length = 0;
    return this;
  }
  
  /**
   * Sets the marked status at one or more indices.
   * 
   * @param isMarked specifies if the given indices should be marked or not
   * @param start is a number specifying an index or a start or a range or an array of indices to set
   * @param end is a number specifying the end of the range to set (optional)
   * @returns this instance for convenience
   */
  set(isMarked, start, end) {
    
    // sanitize inputs
    let inputs = IndexMarker._sanitizeInputs(isMarked, start, end);
    
    // set single or range
    if (inputs.start !== undefined) {
      
      // set range
      if (inputs.end !== undefined) {
        for (let index = inputs.start; index <= inputs.end; index++) {
          this._setSingle(inputs.marked, index); // TODO: can be more efficient than setting individual indices
        }
      }
      
      // set single
      else {
        this._setSingle(inputs.marked, inputs.start);
      }
    }
    
    // set all or array of indices
    else {
      
      // set indices 
      if (inputs.indices !== undefined) {
        for (let index of inputs.indices) {
          this._setSingle(inputs.marked, index);
        }
      }
      
      // set all
      else {
        this.reset();
        if (inputs.marked) this.invert();
      }
    }
  }
  
  /**
   * Marks one or more indices.
   * 
   * @param start is a number specifying an index or a start of a range or an array of indices to mark.
   * @param end is a number specifying the end of the range to mark (optional)
   * @returns this instance for convenience
   */
  mark(start, end) {
    return this.set(true, start, end);
  }

  /**
   * Unmarks one or more indices.
   * 
   * @param start is a number specifying an index or a start of a range or an array of indices to unmark
   * @param end is a number specifying the end of the range to unmark (optional)
   * @returns this instance for convenience
   */
  unmark(start, end) {
    return this.set(false, start, end);
  }
  
  /**
   * Indicates if the given index is marked.
   * 
   * @param index is the index of to check
   * @returns true if the index is marked, false otherwise
   */
  isMarked(index, param2) {
    assert(typeof index === "number");
    assert(index >= 0);
    assert(param2 === undefined, "Can only call isMarked() with one parameter");
    
    // determine if index is in range
    let inRange = false;
    for (let range of this.state.ranges) {
      if (range.start <= index && range.end >= index) {
        inRange = true;
        break;
      }
    }
    
    // apply inversion if applicable
    return inRange ? !this.state.inverted : this.state.inverted;
  }
  
  /**
   * Indicates if any indices in the given range are marked.
   * 
   * @param start is the start index of a range or an array of indices (defaults to 0)
   * @param end is the end of the range (optional)
   * @returns true if any indices in the given range are marked, false otherwise
   */
  hasMarked(start = 0, end) {
    return this.getFirst(true, start, end) !== null;
  }
  
  hasUnmarked(start = 0, end) {
    return this.getFirst(false, start, end) !== null;
  }
  
  /**
   * Indicates if all indices in the given range are marked.
   * 
   * @param start is the start index of a range or an array of indices (defaults to 0)
   * @param end is the end of the range (optional)
   * @returns true if all indices in the given range are marked, false otherwise
   */
  allMarked(start = 0, end) {
    return this.getFirst(false, start, end) === null;
  }
  
  allUnmarked(start = 0, end) {
    return this.getFirst(true, start, end) === null;
  }
  
  /**
   * Inverts every marked state.
   * 
   * @returns this instance for convenience
   */
  invert() {
    this.state.inverted = !this.state.inverted;
    return this;
  }
  
  /**
   * Deep copies this instance to a new instance.
   * 
   * @returns IndexMarker is the deep copied instance
   */
  copy() {
    return new IndexMarker(this);
  }
  
  /**
   * Get the first index with the given marked state.
   * 
   * @param isMarked specifies if the index to find should be marked or unmarked
   * @param start is the start index to search from (optional)
   * @param end is the end index to search to (optional)
   * @returns the first index with the given marked state, null if none found
   */
  getFirst(isMarked, start = 0, end) {
    
    // sanitize inputs
    let inputs = IndexMarker._sanitizeInputs(isMarked, start, end);
    if (!inputs.start) inputs.start = 0;
    
    // iterate over array of indices if given
    if (inputs.indices) {
      for (let index of inputs.indices) {
        if (this.isMarked(index) === isMarked) return index;
      }
      return null;
    }

    // get first range that touches search bounds
    let firstRange;
    for (let range of this.state.ranges) {
      
      // handle bounded range
      if (end !== undefined) {
        if (this._overlaps(range.start, range.end, inputs.start, inputs.end)) {
          firstRange = range;
          break;
        }
      }
      
      // handle unbounded range
      else if (range.end >= inputs.start) {
        firstRange = range;
        break;
      }
    }
    
    // if a suitable range is not found, everything in the given range is the same
    if (firstRange === undefined) return this.isMarked(inputs.start) === inputs.marked ? inputs.start : null;
    
    // if they match, return first index in bounds
    if (this.isMarked(firstRange.start) === inputs.marked) return Math.max(inputs.start, firstRange.start);
    
    // otherwise return first index outside of range
    if (start < firstRange.start) return start;
    return firstRange.end + 1 > end ? null : firstRange.end + 1;
  }
  
  // --------------------------------- PRIVATE --------------------------------
  
  _setSingle(isMarked, index) {
    
    // no change if index already has given marked state
    if (isMarked === this.isMarked(index)) return;
    
    // find indices of previous, current, and next ranges relative to index
    let prevRangeIdx, curRangeIdx, nextRangeIdx;
    for (let rangeIdx = 0; rangeIdx < this.state.ranges.length; rangeIdx++) {
      let range = this.state.ranges[rangeIdx];
      if (range.end < index) prevRangeIdx = rangeIdx;
      else if (range.start <= index && range.end >= index) curRangeIdx = rangeIdx;
      else if (nextRangeIdx === undefined && range.start > index) {
        nextRangeIdx = rangeIdx;
        break;
      }
    }
    
    // handle change in a range
    if (curRangeIdx !== undefined) {
      let range = this.state.ranges[curRangeIdx];
      if (range.start === index) {
        if (range.end === index) this.state.ranges.splice(curRangeIdx, 1);                // remove range
        else range.start++;                                                               // increment start
      } else if (range.end === index) {
        range.end--;                                                                      // decrement end
      } else {
        this.state.ranges.splice(curRangeIdx + 1, 0, {start: index + 1, end: range.end}); // add range
        range.end = index - 1;
      }
    }
    
    // handle change not in a range
    else {
      
      // track whether or not index is incorporated into existing range
      let incorporated = false;
      
      // incorporate index into previous range if applicable
      if (prevRangeIdx !== undefined) {
        let prevRange = this.state.ranges[prevRangeIdx];
        if (prevRange.end === index - 1) {
          prevRange.end++;
          incorporated = true;
        }
      }
      
      // incorporate index into next range if applicable
      if (nextRangeIdx !== undefined) {
        let nextRange = this.state.ranges[nextRangeIdx];
        if (nextRange.start === index + 1) {
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
        this.state.ranges.splice(rangeIdx, 0, {start: index, end: index});
      }
    }
  }
  
  _overlaps(start1, end1, start2, end2) {
    if (end1 < start2) return false;
    if (end2 < start1) return false;
    return true;
  }
  
  static _validateState(state) {
    assert(state);
    assert(state instanceof Object)
    assert(typeof state.inverted === "boolean");
    assert(state.ranges !== undefined);
    assert(Array.isArray(state.ranges));
    for (let range of state.ranges) {
      assert(range.start >= 0);
      assert(range.end >= 0);
    }
  }
  
  static _sanitizeInputs(marked, start, end) {
    
    // normalize nulls
    if (marked === null) marked = undefined;
    if (start === null) start = undefined;
    if (end === null) end = undefined;
    
    // validate and sanitize inputs
    let indices;
    if (marked !== undefined) assert(typeof marked === "boolean", "marked is not boolean");
    if (start === undefined) {
      assert(end === undefined);
    } else {
      if (end !== undefined) {
        assert(typeof start === "number");
        assert(start >= 0);
        assert(typeof end === "number");
        assert(end >= start);
      } else {
        if (Array.isArray(start)) {
          indices = start;
          start = undefined;
        } else {
          assert(typeof start === "number");
          assert(start >= 0);
        }
      }
    }
    
    // assign sanitized inputs
    let sanitized = {};
    sanitized.marked = marked;
    sanitized.start = start;
    sanitized.end = end;
    sanitized.indices = indices;
    return sanitized;
  }
}

module.exports = IndexMarker;
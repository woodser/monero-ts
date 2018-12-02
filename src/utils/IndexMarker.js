const assert = require("assert");
const GenUtils = require("../utils/GenUtils");

/**
 * Allows indices in an infinite range to be arbitrarily marked or not marked.
 * 
 * TODO: compress into ranges to be more efficient
 * TODO: public set(isMarked, start, end) with example usage in documentation and tests
 *  set(true, 0);
 *  set(true, 0, 4);
 *  set(true, [0, 1, 2, 3, 4]);
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
    else this.reset();
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
    delete this.state;
    this.state = { inverted: false, ranges: [] };
    return this;
  }
  
  /**
   * Sets the mark status at one or more indices.
   * 
   * @param mark specifies if the given indices should be marked or not
   * @param start is a number specifying an index or a start or a range or an array of indices to set
   * @param end is a number specifying the end of the range to set (optional)
   * @returns this instance for convenience
   */
  set(mark, start, end) {
    
    // sanitize inputs
    let inputs = IndexMarker._sanitizeInputs(mark, start, end);
    
    // set single or range
    if (inputs.start !== undefined) {
      
      // set range
      if (inputs.end !== undefined) {
        for (let index = inputs.start; index <= inputs.end; index++) {
          this._setSingle(mark, index); // TODO: can be more efficient than setting individual indices
        }
      }
      
      // set single
      else {
        this._setSingle(mark, inputs.start);
      }
    }
    
    // set all or array of indices
    else {
      
      // set indices 
      if (inputs.indices !== undefined) {
        for (let index of inputs.indices) {
          this._setSingle(mark, index);
        }
      }
      
      // set all
      else {
        throw new Error("Not implemented");
      }
    }
  }
  
  /**
   * Marks one or more indices.
   * 
   * @param start is a number specifying an index or a start of a range or an array of indices to mark
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
   * Indicates if all specified indices are marked (true), unmarked (false),
   * or some are marked and some are not marked (undefined).
   * 
   * @param start is a number specifying an index or a start of a range or an array of indices to check
   * @param end is a number specifying the end of the range to check (optional)
   * @returns true iff all indices are marked, false iff all indices are not marked, undefined otherwise
   */
  isMarked(start, end) {
    
    // sanitize inputs
    let inputs = IndexMarker._sanitizeInputs(null, start, end);
    
    // check single or range
    if (inputs.start !== undefined) {
      
      // check range
      if (inputs.end !== undefined) {
        
        // find encompassing range
        let encompassingRange;
        let rangeTouched = false;
        for (let range of this.state.ranges) {
          if (range.start <= inputs.start && range.end >= inputs.end) {
            encompassingRange = range;
            break;
          }
          if (range.start <= inputs.start && range.end >= inputs.start) rangeTouched = true;
          if (range.start <= inputs.end && range.end >= inputs.end) rangeTouched = true;
        }
        
        // interpret range overlap
        if (encompassingRange) return !this.state.inverted; // encompassing range
        else if (rangeTouched) return undefined;            // touches but not encompassed
        else return this.state.inverted;                    // no overlap
      }
      
      // check single
      else {
        return this._isMarkedSingle(inputs.start);
      }
    }
    
    // check all or array of indices
    else {
      
      // check indices 
      if (inputs.indices !== undefined) {

        throw new Error("Not implemented");
        
        assert(inputs.indices);
        let marked;
        for (let index of inputs.indices) {
          if (marked === undefined) marked = this.isMarked(index)
          else if (marked !== this.isMarked(index)) return undefined;
        }
        return marked;
      }
      
      // check all
      else {
        throw new Error("Not implemented");
      }
    }
  }
  
  invert() {
    this.state.inverted = !this.state.inverted;
    return this;
  }
  
  copy() {
    return new IndexMarker(this);
  }
  
  /**
   * Gets the first index with the given marked state.
   * 
   * @param isMarked specifies if the index to find should be marked or unmarked
   * @param start is the start index to search from (optional)
   * @param end is the end index to search from (optional)
   */
  getFirst(isMarked, start = 0, end) {
    
    throw new Error("Not implemented");
  }
  
  // --------------------------------- PRIVATE --------------------------------
  
  _setSingle(mark, index) {
    
    // no change if index already has given marked state
    if (mark === this._isMarkedSingle(index)) return;
    
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
        if (range.end === index) this.state.ranges.splice(curRangeIdx, 1); // remove range
        else range.start++; // increment start
      } else if (range.end === index) {
        range.end--;        // decrement end
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
          this.state.ranges.splice(nextRangeIdx);
        }
      }
      
      // start new range if not incorporated
      if (!incorporated) this.state.ranges.push({start: index, end: index});
    }
  }
  
  _isMarkedSingle(index) {
    
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
  
  static _sanitizeInputs(mark, start, end) {
    
    // validate and sanitize inputs
    if (mark !== undefined && mark !== null) assert(typeof mark === "boolean", "Mark is not boolean");
    let indices;
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
    sanitized.mark = mark;
    sanitized.start = start;
    sanitized.end = end;
    sanitized.indices = indices;
    return sanitized;
  }
}

module.exports = IndexMarker;
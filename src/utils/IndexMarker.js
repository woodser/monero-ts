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
    if (stateOrMarker instanceof IndexMarker) this.setState(new Map(stateOrMarker.getState()));
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
   */
  setState(state) {
    IndexMarker._validateState(state);
    delete this.state;
    this.state = state;
  }
  
  /**
   * Resets everything to unmarked.
   */
  reset() {
    delete this.state;
    this.state = new Map();
    return this;
  }
  
  /**
   * Marks one or more indices.
   * 
   * @param start is a number specifying an index or a start of a range or an array of indices to mark
   * @param end is a number specifying the end of the range to mark (optional)
   */
  mark(start, end) {
    this._set(start, end, true);
    return this;
  }

  /**
   * Unmarks one or more indices.
   * 
   * @param start is a number specifying an index or a start of a range or an array of indices to unmark
   * @param end is a number specifying the end of the range to unmark (optional)
   */
  unmark(start, end) {
    this._set(start, end, false);
    return this;
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
    let inputs = IndexMarker._sanitizeInputs(start, end);
    
    // check single or range
    if (inputs.start !== undefined) {
      
      // check a range
      if (inputs.end !== undefined) {
        let marked;
        for (let index = inputs.start; index <= inputs.end; index++) {
          if (marked === undefined) marked = this.isMarked(index)
          else if (marked !== this.isMarked(index)) return undefined;
        }
        return marked;
      }
      
      // check single index
      else {
        let marked = this.state.get(inputs.start) === true;
        if (this.state.get("inverted")) marked = !marked;
        return marked;
      }
    }
    
    // check indices provided by an array
    else {
      assert(inputs.indices);
      let marked;
      for (let index of inputs.indices) {
        if (marked === undefined) marked = this.isMarked(index)
        else if (marked !== this.isMarked(index)) return undefined;
      }
      return marked;
    }
  }
  
  invert() {
    this.state.set("inverted", !this.state.get("inverted"));
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
    
    // validate inputs
    assert(typeof isMarked === "boolean");
    assert(start === undefined || start >= 0);
    if (end !== undefined) {
      assert(start !== undefined);
      assert(end >= start);
    }
    
    // get sorted keys TODO: expensive
    let keys = [...this.state.keys()];
    keys.splice(keys.indexOf("inverted"), 1);
    let sortedIndices = keys.sort((a, b) => a === b ? 0 : a > b ? 1 : -1);
    
    // find first index within range
    let firstIdx = start;
    for (let idx of sortedIndices) {
      if (idx < start) continue;
      if (end !== undefined && idx > end) continue;
      if (this.isMarked(idx) === isMarked) return idx;
      else if (idx !== firstIdx) break;
      else firstIdx = idx + 1;
    }
    
    // return first index within range
    if (end !== undefined && firstIdx > end) return null;
    if (this.isMarked(firstIdx) !== isMarked) return null;
    return firstIdx;
  }
  
  // --------------------------------- PRIVATE --------------------------------
  
  _set(start, end, mark) {
    
    // sanitize inputs
    let inputs = IndexMarker._sanitizeInputs(start, end);
    
    // mark single or range
    if (inputs.start !== undefined) {
      
      // mark a range
      if (inputs.end !== undefined) {
        for (let index = inputs.start; index <= inputs.end; index++) {
          this._setSingle(index, mark);
        }
      }
      
      // mark single index
      else {
        this._setSingle(inputs.start, mark);
      }
    }
    
    // mark indices provided by an array
    else {
      assert(inputs.indices);
      for (let index of inputs.indices) {
        this._setSingle(index, mark);
      }
    }
  }
  
  _setSingle(index, mark) {
    if (!this.state.get("inverted")) {
      if (mark) this.state.set(index, true);
      else this.state.delete(index)
    } else {
      if (mark) this.state.delete(index);
      else this.state.set(index, true);
    }
  }
  
  static _validateState(state) {
    assert(state);
    assert(state instanceof Map)
    assert(state.get("inverted") === undefined || typeof state.get("inverted") === "boolean");
  }
  
  static _sanitizeInputs(start, end) {
    let indices;
    assert(start !== undefined, "Must specify first parameter");
    if (end) {
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
    
    // sanitize inputs
    let sanitized = {};
    sanitized.start = start;
    sanitized.end = end;
    sanitized.indices = indices;
    return sanitized;
  }
}

module.exports = IndexMarker;
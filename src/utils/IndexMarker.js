const assert = require("assert");

/**
 * Allows indices in an infinite range to be arbitrarily marked or not marked.
 * 
 * TODO: compress into ranges to be more efficient
 */
class IndexMarker {
  
  /**
   * Constructs the marker.
   * 
   * @param state is an initial state (optional)
   */
  constructor(state) {
    if (state) this.setState(state);
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
    this.state = {};
  }
  
  /**
   * Marks one or more indices.
   * 
   * @param start is a number specifying an index or a start of a range or an array of indices to mark
   * @param end is a number specifying the end of the range to mark (optional)
   */
  mark(start, end) {
    this._set(start, end, true);
  }

  /**
   * Unmarks one or more indices.
   * 
   * @param start is a number specifying an index or a start of a range or an array of indices to unmark
   * @param end is a number specifying the end of the range to unmark (optional)
   */
  unmark(start, end) {
    this._set(start, end, false);
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
        let marked = this.state[inputs.start] === true;
        if (this.state.inverted) marked = !marked;
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
    this.state.inverted = !this.state.inverted;
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
    if (!this.state.inverted) {
      if (mark) this.state[index] = true;
      else delete this.state[index];
    } else {
      if (mark) delete this.state[index];
      else this.state[index] = true;
    }
  }
  
  static _validateState(state) {
    assert(state);
    assert(typeof state === "object")
    assert(state.inverted === undefined || typeof state.inverted === "boolean");
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
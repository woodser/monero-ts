/**
 * Allows indices in an infinite range to be arbitrarily marked or not marked.
 * 
 * TODO: compress into ranges to be more efficient
 */
class IndexMarker {
  
  getState() {
    throw new Error("Not implemented");
  }
  
  setState() {
    throw new Error("Not implemented");
  }
  
  reset() {
    throw new Error("Not implemented");
  }
  
  mark(start, end) {
    throw new Error("Not implemented");
  }
  
  unmark(start, end) {
    throw new Error("Not implemented");
  }
  
  isMarked(start, end) {
    throw new Error("Not implemented");
  }
  
  invert() {
    throw new Error("Not implemented");
  }
}

module.exports = IndexMarker;
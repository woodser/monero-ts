/**
 * Allows indices in an infinite range to be arbitrarily marked or not marked.
 * 
 * TODO: compress into ranges to be more efficient
 */
class IndexMarker {
  
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
  
  getState() {
    throw new Error("Not implemented");
  }
}

module.exports = IndexMarker;
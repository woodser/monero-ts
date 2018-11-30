/**
 * Allows indices in an infinite range to be arbitrarily marked or not marked.
 * 
 * TODO: compress into ranges to be more efficient
 */
class IndexMarker {
  
  mark(startIdx, endIdx) {
    throw new Error("Not implemented");
  }
  
  unmark(startIdx, endIdx) {
    throw new Error("Not implemented");
  }
  
  isMarked(startIdx, endIdx) {
    throw new Error("Not implemented");
  }
}

module.exports = IndexMarker;
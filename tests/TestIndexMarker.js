const assert = require("assert");
const GenUtils = require("../src/utils/GenUtils");
const IndexMarker = require("../src/utils/IndexMarker");

const MAX_INDEX = 10000;
const NUM_INDICES_TO_TEST = 10000;

/**
 * Tests the index marker.
 */
let marker = new IndexMarker();
describe("Test Index Marker", function() {
  
  it("Starts with nothing marked", function() {
    throw new Error("Not implemented");
  });
  
  it("Can be reset so nothing is marked", function() {
    throw new Error("Not implemented");
  });
  
  it("Can mark single indices", function() {
    
    // fetch random indicies
    let indices = GenUtils.getRandomInts(0, MAX_INDEX, NUM_INDICES_TO_TEST);
    
    // mark each index individually
    indices.map(idx =>  marker.mark(idx));
    
    // check marked indices
    assert(marker.isMarked(indices));                     // check as array
    indices.map(idx => assert(marker.isMarked(idx)));     // check individually
    
    // check not marked indices
    let notMarkedIndices = [];
    let indices2 = GenUtils.getRandomInts(0, MAX_INDEX, NUM_INDICES_TO_TEST);
    for (let idx of indices2) {
      if (indices.includes(idx)) assert(marker.isMarked(idx));
      else notMarkedIndices.push(idx);
    }
    assert(notMarkedIndices.length > 0);
    assert(!marker.isMarked(notMarkedIndices));                 // check as array
    notMarkedIndices.map(idx => assert(!marker.isMarked(idx))); // check individually
    
    // check mixture of marked and unmarked indices across a range
    assert(marker.isMarked(0, MAX_INDEX) === undefined);
  });
  
  it("Can mark an array of indices", function() {
    
    // fetch random indicies
    let indices = GenUtils.getRandomInts(0, MAX_INDEX, NUM_INDICES_TO_TEST);
    
    // mark indices as array
    marker.mark(indices);
    
    // check marked indices
    assert(marker.isMarked(indices));                     // check as array
    indices.map(idx => assert(marker.isMarked(idx)));     // check individually
    
    // check not marked indices
    let notMarkedIndices = [];
    let indices2 = GenUtils.getRandomInts(0, MAX_INDEX, NUM_INDICES_TO_TEST);
    for (let idx of indices2) {
      if (indices.includes(idx)) assert(marker.isMarked(idx));
      else notMarkedIndices.push(idx);
    }
    assert(notMarkedIndices.length > 0);
    assert(!marker.isMarked(notMarkedIndices));                 // check as array
    notMarkedIndices.map(idx => assert(!marker.isMarked(idx))); // check individually
    
    // check mixture of marked and unmarked indices across a range
    assert(marker.isMarked(0, MAX_INDEX) === undefined);
  });
  
  it("Can mark a range of indicies", function() {
    
    const MAX_IDX = 99;    
    
    // repeat this experiment many times
    for (let i = 0; i < 10000; i++) {
      marker.reset();
      
      // get random start and end indices
      let rands = GenUtils.getRandomInts(0, MAX_IDX, 2);
      let start = Math.min(rands[0], rands[1]);
      let end = Math.max(rands[0], rands[1]);
      
      // mark the range
      marker.mark(start, end);
      
      // test markings
      assert(marker.isMarked(start, end));                                  // check as range
      for (let idx = start; idx < end; idx++) assert(marker.isMarked(idx)); // check individually
      
      // test other markings
      if (start > 1) assert(!marker.isMarked(0, start - 1));
      if (end < MAX_IDX) assert(!marker.isMarked(end + 1, MAX_IDX));
    }
  });
  
  it("Can unmark single indices", function() {
    
    // mark random indices
    let indices = GenUtils.getRandomInts(0, 100, 40);
    marker.mark(indices);
  });
  
  it("Can unmark an array of indices", function() {
    throw new Error("Not implemented");
  });
  
  it("Can unmark a range of indices", function() {
    throw new Error("Not implemented");
  });
  
  it("Can save and re-load its state", function() {
    throw new Error("Not implemented");
  });
  
  it("Can get the index of the first marked index", function() {
    throw new Error("Not implemented");
  });
  
  it("Can get the index of the first unmarked index", function() {
    throw new Error("Not implemented");
  });
  
  it("Can invert marked indices", function() {
    throw new Error("Not implemented");
  });
});
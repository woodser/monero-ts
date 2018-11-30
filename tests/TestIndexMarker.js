const assert = require("assert");
const GenUtils = require("../src/utils/GenUtils");
const IndexMarker = require("../src/utils/IndexMarker");

/**
 * Tests the index marker.
 */
let marker = new IndexMarker();
describe("Test Index Marker", function() {
  
  it("Can mark single indices", async function() {
    
    // fetch random indicies
    let indices = GenUtils.getRandomInts(0, 10000, 1000);
    
    // mark the indices
    indices.map(idx =>  marker.mark(idx));
    
    // check that the indices are marked
    indices.map(idx => assert(marker.isMarked(idx)));
    
    // check that other indices are not marked
    let testedNotMarked = false;
    let indices2 = GenUtils.getRandomInts(0, 10000, 1000);
    for (let idx of indices2) {
      if (indices.includes(idx)) assert(marker.isMarked(idx));
      else {
        assert(!marker.isMarked(idx));
        testedNotMarked = true;
      }
    }
    assert(testedNotMarked);  // test the test
  });
  
  it("Can unmark single indices", async function() {
    throw new Error("Not implemented");
  });
  
  it("Can mark a range of indices", async function() {
    throw new Error("Not implemented");
  });
  
  it("Can unmark a range of indices", async function() {
    throw new Error("Not implemented");
  });
  
  it("Can save and re-load its state", async function() {
    throw new Error("Not implemented");
  });
  
  it("Can get the index of the first marked index", async function() {
    throw new Error("Not implemented");
  });
  
  it("Can get the index of the first unmarked index", async function() {
    throw new Error("Not implemented");
  });
  
  it("Can invert marked indices", async function() {
    throw new Error("Not implemented");
  });
});
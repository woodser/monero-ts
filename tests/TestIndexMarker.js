const assert = require("assert");
const GenUtils = require("../src/utils/GenUtils");
const IndexMarker = require("../src/utils/IndexMarker");

const MAX_INDEX = 10000;               // maximum index to mark
const NUM_MARKINGS = 5000;             // number of times to apply markings across indices
assert(MAX_INDEX >= NUM_MARKINGS);  // most tests assume some indices in the range will remain unmarked

/**
 * Tests the index marker.
 */
let marker = new IndexMarker();
describe("Test Index Marker", function() {
  
  beforeEach(function() {
    marker.reset();
  });
  
  it("Starts with nothing marked", function() {
    assert(marker.allUnmarked());
    assert(marker.allUnmarked(0, MAX_INDEX));
    assert(marker.allUnmarked([0, 5, 10]));
    assert(marker.hasUnmarked());
    assert(marker.hasUnmarked(0, MAX_INDEX));
    assert(marker.hasUnmarked([0, 10, 25]));
    assert(!marker.allMarked());
    assert(!marker.allMarked(0, MAX_INDEX));
    assert(!marker.allMarked([0, 5, 1000]));
    assert(!marker.hasMarked());
    assert(!marker.hasMarked(0, MAX_INDEX));
    assert(!marker.hasMarked([0, 5, 100]));
  });
  
  it("Can be reset so nothing is marked", function() {
    
    // mark random indices
    let indices = GenUtils.getRandomInts(0, MAX_INDEX, NUM_MARKINGS);
    indices = [ 3, 1, 6, 10, 2 ];
    assert(!marker.isMarked(1));
    marker.mark(indices);
    assert(marker.allMarked(indices));
    assert(marker.hasMarked(0, MAX_INDEX) && marker.hasUnmarked(0, MAX_INDEX)); // mixture of marked and unmarked
    
    // reset markings
    marker.reset();
    
    // nothing is marked
    assert(!marker.hasMarked(0, MAX_INDEX));
  });
  
  it("Can mark or or unmark all indices by not specifying indices", function() {
    
    // mark everything
    marker.mark();
    assert(marker.allMarked());
    for (let i = 0; i < MAX_INDEX; i++) assert(marker.isMarked(i));
    assert(marker.allMarked());
    assert(marker.hasMarked());
    assert.equal(null, marker.getFirst(false));
    assert.equal(0, marker.getFirst(true));
    
    // unmark everything
    marker.unmark();
    assert(!marker.hasMarked());
    for (let i = 0; i < MAX_INDEX; i++) assert(!marker.isMarked(i));
    assert.equal(0, marker.getFirst(false));
    assert(!marker.allMarked());
    assert(!marker.hasMarked());
    assert.equal(0, marker.getFirst(false));
    assert.equal(null, marker.getFirst(true));
  });
  
  it("Can mark single indices", function() {
    
    // fetch random indicies
    let indices = GenUtils.getRandomInts(0, MAX_INDEX, NUM_MARKINGS);
    
    // mark each index individually
    indices.map(idx => marker.mark(idx));
    
    // check marked indices
    assert(marker.allMarked(indices));                // check as array
    indices.map(idx => assert(marker.isMarked(idx))); // check individually
    
    // check not marked indices
    let notMarkedIndices = [];
    for (let idx = 0; idx <= MAX_INDEX; idx++) {
      if (indices.includes(idx)) assert(marker.isMarked(idx));
      else notMarkedIndices.push(idx);
    }
    assert(notMarkedIndices.length > 0);
    assert(marker.allUnmarked(notMarkedIndices));               // check as array
    notMarkedIndices.map(idx => assert(!marker.isMarked(idx))); // check individually
    
    // check mixture of marked and unmarked indices across a range
    assert(marker.hasMarked(0, MAX_INDEX) && marker.hasUnmarked(0, MAX_INDEX));
  });
  
  it("Can mark an array of indices", function() {
    assert(!marker.hasMarked(0, MAX_INDEX)); // ensure starting with reset state
    
    // fetch random indicies
    let indices = GenUtils.getRandomInts(0, MAX_INDEX, NUM_MARKINGS);
    
    // mark indices as array
    marker.mark(indices);
    
    // check marked indices
    assert(marker.allMarked(indices));                // check as array
    indices.map(idx => assert(marker.isMarked(idx))); // check individually
    
    // check not marked indices
    let notMarkedIndices = [];
    for (let idx = 0; idx <= MAX_INDEX; idx++) {
      if (indices.includes(idx)) assert(marker.isMarked(idx));
      else {
        assert(!marker.isMarked(idx));
        notMarkedIndices.push(idx);
      }
    }
    assert(notMarkedIndices.length > 0);
    assert(marker.allUnmarked(notMarkedIndices));               // check as array
    notMarkedIndices.map(idx => assert(!marker.isMarked(idx))); // check individually
    
    // check mixture of marked and unmarked indices across a range
    assert(marker.hasMarked(0, MAX_INDEX) && marker.hasUnmarked(0, MAX_INDEX));
  });
  
  it("Can mark a range of indicies", function() {
    
    const REPEAT = 1000;
    const MAX_IDX = 99;    
    
    // repeat this test
    for (let i = 0; i < REPEAT; i++) {
      marker.reset();
      
      // get random start and end indices
      let rands = GenUtils.getRandomInts(0, MAX_IDX, 2);
      let start = Math.min(rands[0], rands[1]);
      let end = Math.max(rands[0], rands[1]);
      
      // mark the range
      marker.mark(start, end);
      
      // test markings
      assert(marker.allMarked(start, end));                                 // check as range
      for (let idx = start; idx < end; idx++) assert(marker.isMarked(idx)); // check individually
      
      // test other markings
      if (start > 1) assert(!marker.hasMarked(0, start - 1));
      if (end < MAX_IDX) assert(!marker.hasMarked(end + 1, MAX_IDX));
    }
  });
  
  it("Can unmark single indices", function() {
    
    // mark random indices 
    let indices = GenUtils.getRandomInts(0, MAX_INDEX, NUM_MARKINGS);
    marker.mark(indices);
    
    // unmark each index
    indices.map(idx => marker.unmark(idx));
    
    // test that nothing is marked
    indices.map(idx => assert(!marker.isMarked(idx)));  // check individually
    assert(!marker.hasMarked(indices));                 // check as array
    assert(!marker.hasMarked(0, MAX_INDEX));            // check as range 
  });
  
  it("Can unmark an array of indices", function() {
    
    // mark random indices 
    let indices = GenUtils.getRandomInts(0, MAX_INDEX, NUM_MARKINGS);
    marker.mark(indices);
    
    // unmark indices as array
    marker.unmark(indices);
    
    // test that nothing is marked
    indices.map(idx => assert(!marker.isMarked(idx)));  // check individually
    assert(!marker.hasMarked(indices));                 // check as array
    assert(!marker.hasMarked(0, MAX_INDEX));            // check as range 
  });
  
  it("Can unmark a range of indices", function() {
    const REPEAT = 1000;
    const MAX_IDX = 99;    
    
    // repeat this test
    for (let i = 0; i < REPEAT; i++) {
      marker.reset();
      
      // get random start and end indices
      let rands = GenUtils.getRandomInts(0, MAX_IDX, 2);
      let start = Math.min(rands[0], rands[1]);
      let end = Math.max(rands[0], rands[1]);
      
      // mark the range
      marker.mark(start, end);
      assert(marker.allMarked(start, end));
      
      // unmark the range
      marker.unmark(start, end);
      
      // turn range into indices for unmark test
      let indices = [];
      for (let idx = start; idx < end; idx++) indices.push(idx);
      
      // test no markings
      for (let idx = start; idx < end; idx++) assert(!marker.isMarked(idx));  // check individually
      assert(!marker.hasMarked(indices));                                     // check indices
      assert(!marker.hasMarked(start, end));                                  // check range
      assert(!marker.hasMarked(0, MAX_IDX));                                  // check max range
    }
  });
  
  it("Can set marks on indices", function() {
    
    // mark everything
    marker.set(true);
    for (let i = 0; i < MAX_INDEX; i++) assert(marker.isMarked(i));
    assert(marker.allMarked());
    
    // unmark everything
    marker.set(false);
    for (let i = 0; i < MAX_INDEX; i++) assert(!marker.isMarked(i));
    assert(marker.allUnmarked());
    
    // mark individuals
    let indices = GenUtils.getRandomInts(0, MAX_INDEX, NUM_MARKINGS);
    indices = indices.sort((a, b) => a === b ? 0 : a > b ? 1 : -1);
    indices = GenUtils.toUniqueArray(indices);
    for (let idx of indices) {
      marker.set(true, idx);
      assert(marker.isMarked(idx));
    }
    assert.equal(indices[0], marker.getFirst(true));
    assert(marker.hasMarked(0, MAX_INDEX) && marker.hasUnmarked(0, MAX_INDEX)); // mixture of marked and unmarked
    
    // unmark individuals
    for (let i = 0; i < indices.length; i++) {
      marker.set(false, indices[i]);
      assert(!marker.isMarked(indices[i]));
      if (i < indices.length - 1) assert(marker.getFirst(true) !== null);
    }
    assert(!marker.hasMarked());
    assert.equal(null, marker.getFirst(true, 0, MAX_INDEX));  // test bounded
    assert.equal(null, marker.getFirst(true));                // test unbounded
    assert.equal(0, marker.getFirst(false));
    
    // mark range
    marker.set(true, 0, MAX_INDEX);
    for (let i = 0; i < MAX_INDEX; i++) assert(marker.isMarked(i));
    assert.equal(MAX_INDEX + 1, marker.getFirst(false));
    
    // unmark range
    marker.set(false, 0, MAX_INDEX);
    for (let i = 0; i < MAX_INDEX; i++) assert(!marker.isMarked(i));
    assert.equal(0, marker.getFirst(false));
    assert.equal(null, marker.getFirst(true));
    
    // mark indices
    marker.set(true, indices);
    for (let idx of indices) assert(marker.isMarked(idx));
    assert(marker.getFirst(true) !== null);
    
    // unmark indices
    marker.set(false, indices);
    for (let idx of indices) assert(!marker.isMarked(idx));
    assert(null == marker.getFirst(true));
  });
  
  it("Can invert marked indices", function() {
    
    // invert so all indices are theoretically marked
    marker.invert();
    assert(marker.allMarked(0, MAX_INDEX * MAX_INDEX));
    
    // invert to reset
    marker.invert();
    assert(marker.allUnmarked(0, MAX_INDEX * 2));
    
    // mark random indices
    let indices = GenUtils.getRandomInts(0, MAX_INDEX, NUM_MARKINGS);
    marker.mark(indices);
    
    // invert markings
    marker.invert();
    
    // check markings
    assert(!marker.hasMarked(indices));   // check indices
    for (let i = 0; i < MAX_INDEX; i++) { // check individually
      assert(indices.includes(i) ? !marker.isMarked(i) : marker.isMarked(i));
    }
    assert(marker.hasMarked(0, MAX_INDEX) && marker.hasUnmarked(0, MAX_INDEX)); // mixture of marked and unmarked
    
    // mark some more indices
    indices = GenUtils.getRandomInts(0, MAX_INDEX, NUM_MARKINGS);
    indices = [ 7, 4, 1, 8, 8 ];
    marker.mark(indices);
    for (let idx of indices) assert(marker.isMarked(idx));
  });
  
  it("Can get the first index with a given marked state", function() {
    
    // get random sorted indices
    let indices = GenUtils.getRandomInts(0, MAX_INDEX, NUM_MARKINGS);
    indices = GenUtils.toUniqueArray(indices);
    indices = indices.sort((a, b) => a === b ? 0 : a > b ? 1 : -1);
    
    // mark indices
    marker.mark(indices);
    
    // can get first marked
    assert.equal(indices[0], marker.getFirst(true));
    
    // can get first unmarked
    for (let i = 0; i < MAX_INDEX; i++) {
      if (indices.includes(i)) continue;
      assert.equal(i, marker.getFirst(false));
      break;
    }
    
    // can get first marked given a start index
    for (let i = 0; i < indices.length; i++) {
      assert.equal(indices[i], marker.getFirst(true, i === 0 ? null : indices[i - 1] + 1));
    }
    
    // get can first unmarked given a start index
    for (let i = 0; i < MAX_INDEX; i++) {
      if (indices.includes(i)) assert.notEqual(i, marker.getFirst(false, i));
      else assert.equal(i, marker.getFirst(false, i));
    }
    
    // can get first marked index by a range
    for (let i = 0; i < indices.length - 1; i++) {
      assert.equal(indices[i], marker.getFirst(true, indices[i], indices[i + 1]));
      if (indices[i + 1] - indices[i] > 1) {  // test cut off by range
        assert.equal(null, marker.getFirst(true, indices[i] + 1, indices[i + 1] - 1));
      }
    }
    
    // can get first unmarked index by range
    marker.reset()
    marker.invert();
    marker.unmark(6);
    marker.unmark(4);
    marker.unmark(2);
    assert.equal(null, marker.getFirst(false, 0, 1));
    assert.equal(2, marker.getFirst(false, 0, 10));
    assert.equal(4, marker.getFirst(false, 3, 5));
    assert.equal(6, marker.getFirst(false, 5, 10));
    assert.equal(null, marker.getFirst(false, 7));
  });
  
  it("Can be copied", function() {
    
    // mark random indices
    let indices = GenUtils.getRandomInts(0, MAX_INDEX, NUM_MARKINGS);
    marker.mark(indices);
    
    // copy
    let marker2 = marker.copy();
    
    // assert states are equal
    assert.deepEqual(marker.getState(), marker2.getState())
    
    // modify and test to ensure deep copy
    marker2.mark(MAX_INDEX + 5);
    assert.notDeepEqual(marker.getState(), marker2.getState())
  });
  
  it("Exposes and can be built from an internal state object", function() {
    
    // mark random indices
    let indices = GenUtils.getRandomInts(0, MAX_INDEX, NUM_MARKINGS);
    marker.mark(indices);
    
    // get state
    let state = marker.getState();
    
    // build a new marker from the state
    let marker2 = new IndexMarker(state);
    assert(state === marker2.getState());  // these have the same state
    
    // the states are linked unless explicitly deep copied
    let idx = MAX_INDEX + 5;
    marker.mark(idx);
    assert(marker2.isMarked(idx));
    marker.unmark(idx);
    assert(!marker2.isMarked(idx));
  });
  
  it("Can set an internal state object", function() {
    
    // mark random indices
    let indices = GenUtils.getRandomInts(0, MAX_INDEX, NUM_MARKINGS);
    marker.mark(indices);
    
    // create new marker with different markings
    let marker2 = new IndexMarker();
    marker2.mark(GenUtils.getRandomInts(0, MAX_INDEX, NUM_MARKINGS));
    
    // overwrite the internal state
    marker2.setState(marker.getState());
    
    // ensure states are equal
    assert(marker.getState() === marker2.getState());
    assert(marker2.allMarked(indices));
  });
});
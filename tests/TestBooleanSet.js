const assert = require("assert");
const GenUtils = require("../src/utils/GenUtils");
const BooleanSet = require("../src/utils/BooleanSet");

const MAX_INDEX = 10000;       // maximum index to set
const NUM_SETS = 5000;         // number of sets within the maximum index
assert(NUM_SETS < MAX_INDEX);  // most tests assume some indices in the range will remain unmarked

/**
 * Tests the BooleanSet class.
 */
let bs = new BooleanSet();
describe("Test BooleanSet", function() {
  
  // clear set before each test
  beforeEach(function() {
    bs.clear();
  });
  
  it("Is constructed in a cleared state by default", function() {
    testClearedState(bs);
  });
  
  it("Can get and set individual indices randomly", function() {
    
    // get random indices to set
    let indices = getRandomSortedIndices(0, MAX_INDEX, NUM_SETS);
    
    // set indices to true
    for (let index of indices) {
      assert(!bs.get(index));
      bs.set(true, index);
      assert(bs.get(index));
    }
    
    // test all indices
    for (let i = 0; i < MAX_INDEX; i++) {
      if (indices.includes(i)) assert(bs.get(index));
      else assert(!bs.get(index));
    }
  });
  
  it("Gets cleared before each test (assumes prior test sets at least one to true)", function() {
    assert(bs.anySet(true));
    testClearedState(bs);
  });
  
  it("Can be cleared", function() {
    
    // set random trues
    setRandom(bs, true, 0, MAX_INDEX, NUM_SETS);
    
    // clear it
    bs.clear();
    
    // test cleared state
    testClearedState(bs);
  });
  
  it("Can be copied", function() {
    
    // set random trues
    let indices = setRandom(bs, true, 0, MAX_INDEX, NUM_SETS);
    
    // copy
    let copy = bs.copy();
    
    // test states are deep copied
    assert.deepEqual(bs.getState(), copy.getState())
    copy.set(true, MAX_INDEX + 5);
    assert(!bs.get(MAX_INDEX + 5));
    assert.notDeepEqual(bs.getState(), copy.getState());
  });
  
  it("Can be recreated from its internal state", function() {

    // set random trues
    let indices = setRandom(bs, true, 0, MAX_INDEX, NUM_SETS);
    
    // get state
    let state = bs.getState();
    
    // recreate from state
    let bs2 = new BooleanSet(state);
    assert(state === marker2.getState());  // these have the same state
    
    // the states are linked unless explicitly deep copied
    let idx = MAX_INDEX + 5;
    bs.set(true, idx);
    assert(bs2.get(idx));
    bs.set(true, idx);
    assert(!bs2.get(idx));
  });
  
  it("Can set all", function() {
    
    // set random trues
    setRandom(bs, true, 0, MAX_INDEX, NUM_SETS);
    
    // set all to true
    bs.set(true);
    assert(bs.allSet(true));
    for (let i = 0; i < MAX_INDEX; i++) assert(bs.get(i));
    assert(bs.allSet(true));
    assert(bs.anySet(true));
    assert.equal(null, bs.getFirst(false));
    assert.equal(0, bs.getFirst(true));
    assert.equal(null, bs.getLast(false));
    assert.equal(undefined, bs.getLast(true));
    
    // set random falses
    setRandom(bs, false, 0, MAX_INDEX, NUM_SETS);
    assert(!bs.allSet(true));
    assert(!bs.allSet(false));
    assert(bs.anySet(true));
    assert(bs.anySet(false));
    
    // set all to false
    bs.set(false);
    assert(bs.allSet(false));
    assert(bs.anySet(false));
    assert(!bs.allSet(true));
    assert(!bs.anySet(true));
    for (let i = 0; i < MAX_INDEX; i++) assert(!bs.get(i));
    assert.equal(0, bs.getFirst(false));
    assert.equal(null, bs.getFirst(true));
    assert.equal(undefined, bs.getLast(false));
    assert.equal(null, bs.getLast(true));
  });
  
  it("Can set bounded ranges to true", function() {
    
    const REPEAT = 1000;
    const MAX_IDX = 99;    
    
    // repeat this test
    for (let i = 0; i < REPEAT; i++) {
      bs.clear();
      
      // get random start and end indices
      let rands = GenUtils.getRandomInts(0, MAX_IDX, 2);
      let start = Math.min(rands[0], rands[1]);
      let end = Math.max(rands[0], rands[1]);
      
      // set the range to true
      bs.set(true, start, end);
      
      // test range
      assert(bs.allSet(true, start, end));                          // check as range
      for (let idx = start; idx < end; idx++) assert(bs.get(idx));  // check individually
      
      // test others
      assert(!bs.allSet(true));
      if (start > 1) assert(!bs.anySet(true, 0, start - 1));
      if (end < MAX_IDX) assert(!bs.anySet(true, end + 1, MAX_IDX));
    }
  });
  
  it("Can set bounded ranges to false", function() {
    
    const REPEAT = 1000;
    const MAX_IDX = 99;
    
    // repeat this test
    for (let i = 0; i < REPEAT; i++) {
      bs.clear();
      
      // get random start and end indices
      let rands = GenUtils.getRandomInts(0, MAX_IDX, 2);
      let start = Math.min(rands[0], rands[1]);
      let end = Math.max(rands[0], rands[1]);
      
      // set the range to true
      bs.set(true, start, end);
      assert(bs.allSet(true, start, end));
      
      // set the range to false
      bs.set(false, start, end);
      
      // test all are false
      for (let idx = start; idx < end; idx++) assert(!bs.get(idx)); // check individually
      assert(bs.allSet(false));
      assert(bs.allSet(false, start, end));
      assert(bs.allSet(false, 0, MAX_INDEX));
      assert(bs.anySet(false, start, end));
      assert(!bs.anySet(true, start, end));                         // check range
      assert(!bs.anySet(true, 0, MAX_IDX));                         // check max range
    }
  });
  
  it("Can set unbounded ranges", function() {
    
    // set random trues
    let indices = setRandom(bs, true, 0, MAX_INDEX, NUM_SETS);
    
    // set from second half to infinity to false
    let indicesCutoff = Math.floor(indices.length / 2);
    let cutoff = indices[indicesCutoff];
    bs.setRange(false, cutoff);
    
    // test
    assert(bs.allSet(false, cutoff));
    assert(!bs.allSet(false));
    
    // flip
    bs.flip();
    assert(bs.allSet(true, cutoff));
    assert(!bs.allSet(false));
    
    // set from end indices to infinity while flipping
    let flipped = false;
    for (let i = indicesCutoff; i >= 0; i--) {
      bs.setRange(flipped, indices[i]);
      assert(bs.allSet(flipped, indices[i]));
      if (i > 0 && indices[i] < cutoff) assert(flipped ? !bs.get(indices[i - 1]) : bs.get(indices[i - 1]));
      flipped = !flipped;
    }
  });
  
  it("Can flip all", function() {
    
    // flip so all indices are true
    bs.flip();
    assert(bs.allSet(true, 0, MAX_INDEX * MAX_INDEX));
    
    // flip to clear
    bs.flip();
    assert(bs.allSet(false, 0, MAX_INDEX * MAX_INDEX));
    
    // set random trues
    let indices = setRandom(bs, true, 0, MAX_INDEX, NUM_SETS);
    
    // flip
    bs.flip();
    
    // check
    assert(!bs.anySet(true, indices));    // check indices
    for (let i = 0; i < MAX_INDEX; i++) { // check individually
      assert(bs.get(i) === !indices.includes(i));
    }
    assert(bs.anySet(true, 0, MAX_INDEX) && bs.anySet(false, 0, MAX_INDEX)); // mixture of true and false
    
    // set more indices
    indices = GenUtils.getRandomInts(0, MAX_INDEX, NUM_MARKINGS);
    bs.set(true, indices);
    for (let idx of indices) assert(bs.get(idx));
  });
  
  it("Can flip ranges", function() {
    throw new Error("Not implemented");
  });
  
  it("Can get the first index with a given value in a range", function() {
    
    // set random trues
    let indices = setRandom(bs, true, 0, MAX_INDEX, NUM_SETS);
    
    // can get the first true
    assert.equal(indices[0], bs.getFirst(true));
    
    // can get first false
    for (let i = 0; i < MAX_INDEX; i++) {
      if (indices.includes(i)) continue;
      assert.equal(i, bs.getFirst(false));
      break;
    }
    
    // can get first true given a start index
    for (let i = 0; i < indices.length; i++) {
      assert.equal(indices[i], bs.getFirst(true, i === 0 ? null : indices[i - 1] + 1));
    }
    
    // get can first false given a start index
    for (let i = 0; i < MAX_INDEX; i++) {
      if (indices.includes(i)) assert.notEqual(i, bs.getFirst(false, i));
      else assert.equal(i, bs.getFirst(false, i));
    }
    
    // can get first true in a range
    for (let i = 0; i < indices.length - 1; i++) {
      assert.equal(indices[i], bs.getFirst(true, indices[i], indices[i + 1]));
      if (indices[i + 1] - indices[i] > 1) {  // test cut off by range
        assert.equal(null, bs.getFirst(true, indices[i] + 1, indices[i + 1] - 1));
      }
    }
    
    // can get first false by range
    bs.clear()
    bs.flip();
    bs.set(false, 6);
    bs.set(false, 4);
    bs.set(false, 2);
    assert.equal(null, bs.getFirst(false, 0, 1));
    assert.equal(2, bs.getFirst(false, 0, 10));
    assert.equal(4, bs.getFirst(false, 3, 5));
    assert.equal(6, bs.getFirst(false, 5, 10));
    assert.equal(null, bs.getFirst(false, 7));
  });
  
  it("Can get the last index with a given value in a range", function() {
    throw new Error("Not implemented");
  });
});

function setRandom(bs, bool, start, end, count) {
  let indices = getRandomSortedIndices(start, end, count);
  for (let index of indices) bs.set(bool, index);
  return indices;
}

function getRandomSortedIndices(start, end, count) {
  let indices = GenUtils.getUniqueRandomInts(start, end, count);
  GenUtils.sort(indices);
  return indices;
}

function testClearedState(bs) {
  assert(bs.allSet(false));
  assert(bs.allSet(false, 0));
  assert(bs.allSet(false, 0, MAX_INDEX));
  assert(bs.anySet(false));
  assert(bs.anySet(false, 0));
  assert(bs.anySet(false, 0, MAX_INDEX));
  assert(!bs.anySet(true));
  assert(!bs.anySet(true, 0));
  assert(!bs.allSet(true, 0, MAX_INDEX));
  for (let i = 0; i < MAX_INDEX; i++) assert(!bs.get(i));
  assert.equal(0, bs.getFirst(false));
  assert.equal(0, bs.getFirst(false, 0));
  assert.equal(0, bs.getFirst(false, MAX_INDEX));
  assert.equal(null, bs.getFirst(true));
  assert.equal(undefined, bs.getLast(false)); // infinite falses
  assert.equal(null, bs.getLast(true));
  assert.equal(null, bs.getLast(true, 0));
  assert.equal(null, bs.getLast(true, MAX_INDEX));
}
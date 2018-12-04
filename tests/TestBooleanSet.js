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
  
  it("Can set a range", function() {
    throw new Error("Not implemented");
  });
  
  it("Can flip all", function() {
    throw new Error("Not implemented");
  });
  
  it("Can flip ranges", function() {
    throw new Error("Not implemented");
  });
  
  it("Can the first value in a range", function() {
    throw new Error("Not implemented");
  });
  
  it("Can get the last value in a range", function() {
    throw new Error("Not implemented");
  });
  
  it("Can determine if all values in a range are a given value", function() {
    throw new Error("Not implemented");
  });
  
  it("Can determine if any value in a range is a given value", function() {
    throw new Error("Not implemented");z
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
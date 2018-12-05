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
      let bs2 = bs.set(true, index);
      assert(bs2 === bs);
      assert(bs.get(index));
    }
    
    // test all indices
    for (let i = 0; i <= MAX_INDEX; i++) {
      if (indices.includes(i)) assert(bs.get(i));
      else assert(!bs.get(i));
    }
  });
  
  it("Gets cleared before each test (assumes prior test sets at least one to true)", function() {
    assert(bs.allSet(false));
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
  
  it("Has a length", function() {
    
    // set the first few
    for (let i = 0; i < 5; i++) {
      bs.set(true, i);
      assert.equal(i + 1, bs.length());
    }
    
    // set random trues
    let indices = setRandom(bs, true, 0, MAX_INDEX, NUM_SETS);
    let trueLength = Math.max(4, indices[indices.length - 1]) + 1;
    assert.equal(trueLength, bs.length());
    
    // flip
    bs.flip();
    assert.equal(bs.getLast(false) + 1, bs.length());
    
    // flip back
    bs.flip();
    assert.equal(trueLength, bs.length());
  });
  
  it("Can be converted to an array", function() {
    
    // set random trues
    let indices = setRandom(bs, true, 0, MAX_INDEX, NUM_SETS);
    assert.equal(indices[indices.length - 1] + 1, bs.length());
    
    // convert to an array
    let arr = bs.toArray();
    
    // test array
    assert.equal(bs.length(), arr.length);
    for (let i = 0; i < arr.length; i++) {
      assert(indices.includes(i) ? arr[i] : !arr[i]);
    }
    
    // convert range to an array
    let third = Math.floor(10 / 3);
    arr = bs.toArray(third, third * 2);
    assert.equal(third * 2 - third, arr.length);
    for (let i = third; i < third * 2; i++) {
      assert.equal(bs.get(i), arr[i - third]);
    }
  })
  
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
    assert(state === bs2.getState());  // these have the same state
    
    // the states are linked unless explicitly deep copied
    let idx = MAX_INDEX + 5;
    bs.set(true, idx);
    assert(bs2.get(idx));
    bs.set(false, idx);
    assert(!bs2.get(idx));
  });
  
  it("Can set all", function() {
    
    // set random trues
    setRandom(bs, true, 0, MAX_INDEX, NUM_SETS);
    
    // set all to true
    bs.set(true);
    assert(bs.allSet(true));
    for (let i = 0; i <= MAX_INDEX; i++) assert(bs.get(i));
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
    for (let i = 0; i <= MAX_INDEX; i++) assert(!bs.get(i));
    assert.equal(0, bs.getFirst(false));
    assert.equal(null, bs.getFirst(true));
    assert.equal(undefined, bs.getLast(false));
    assert.equal(null, bs.getLast(true));
  });
  
  it("Can set bounded ranges to true", function() {
    
    const REPEAT = 1000;
    const MAX_INDEX = 99;    
    
    // repeat this test
    for (let i = 0; i < REPEAT; i++) {
      bs.clear();
      
      // get random start and end indices
      let rands = GenUtils.getRandomInts(0, MAX_INDEX, 2);
      let start = Math.min(rands[0], rands[1]);
      let end = Math.max(rands[0], rands[1]);
      
      // set the range to true
      bs.setRange(true, start, end);
      
      // test range
      assert(bs.allSet(true, start, end));                          // check as range
      for (let idx = start; idx < end; idx++) assert(bs.get(idx));  // check individually
      
      // test others
      assert(!bs.allSet(true));
      if (start > 1) assert(!bs.anySet(true, 0, start - 1));
      if (end < MAX_INDEX) assert(!bs.anySet(true, end + 1, MAX_INDEX));
    }
  });
  
  it("Can set bounded ranges to false", function() {
    
    const REPEAT = 1000;
    const MAX_INDEX = 99;
    
    // repeat this test
    for (let i = 0; i < REPEAT; i++) {
      bs.clear();
      
      // get random start and end indices
      let rands = GenUtils.getRandomInts(0, MAX_INDEX, 2);
      let start = Math.min(rands[0], rands[1]);
      let end = Math.max(rands[0], rands[1]);
      
      // set the range to true
      bs.setRange(true, start, end);
      assert(bs.allSet(true, start, end));
      
      // set the range to false
      bs.setRange(false, start, end);
      
      // test all are false
      for (let idx = start; idx < end; idx++) assert(!bs.get(idx)); // check individually
      assert(bs.allSet(false));
      assert(bs.allSet(false, start, end));
      assert(bs.allSet(false, 0, MAX_INDEX));
      assert(bs.anySet(false, start, end));
      assert(!bs.anySet(true, start, end));   // check range
      assert(!bs.anySet(true, 0, MAX_INDEX)); // check max range
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
    assert(!bs.allSet(true));
    
    // set from end indices to infinity while flipping
    let flipped = false;
    for (let i = indicesCutoff; i >= 0; i--) {
      bs.setRange(flipped, indices[i]);
      assert(bs.allSet(flipped, indices[i]));
      if (i > 0 && indices[i] < cutoff) assert(!bs.get(indices[i - 1]));  // before cutoff unchanged
      flipped = !flipped;
    }
  });
  
  it("Can flip indices individually", function() {
    
    // set random trues
    let indices = setRandom(bs, true, 0, MAX_INDEX, NUM_SETS);
    
    // flip each
    for (let index of indices) {
      bs.flip(index);
      assert(!bs.get(index));
      bs.flip(index);
      assert(bs.get(index));
      bs.flip(index);
      assert(!bs.get(index));
    }
    
    // everything was flipped back
    assert(!bs.anySet(true));
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
    for (let i = 0; i <= MAX_INDEX; i++) { // check individually
      assert(bs.get(i) === !indices.includes(i));
    }
    assert(bs.anySet(true, 0, MAX_INDEX) && bs.anySet(false, 0, MAX_INDEX)); // mixture of true and false
    
    // set more indices
    indices = GenUtils.getRandomInts(0, MAX_INDEX, NUM_SETS);
    for (let index of indices) bs.set(true, index);
    for (let idx of indices) assert(bs.get(idx));
  });
  
  it("Can flip bounded ranges", function() {
    
    // flip and unflip random ranges repeatedly
    const repeat = 5;
    for (let i = 0; i < repeat; i++) {
      
      // set random trues
      bs.clear();
      let indices = setRandom(bs, true, 0, MAX_INDEX, NUM_SETS);
      
      // remember before modifying
      let before = new BooleanSet(bs);
      
      // flip first few
      bs.flipRange(0, 5);
      for (let i = 0; i < 5; i++) assert.notEqual(before.get(i), bs.get(i));
      bs.flipRange(0, 5);
      for (let i = 0; i < 5; i++) assert.equal(before.get(i), bs.get(i));
      
      // flip last few
      bs.flipRange(MAX_INDEX - 5, MAX_INDEX);
      for (let i = MAX_INDEX - 5; i < MAX_INDEX; i++) assert.notEqual(before.get(i), bs.get(i));
      bs.flipRange(MAX_INDEX - 5, MAX_INDEX);
      for (let i = MAX_INDEX - 5; i < MAX_INDEX; i++) assert.equal(before.get(i), bs.get(i));
      
      // get random start and end indices
      let rands = GenUtils.getRandomInts(0, MAX_INDEX, 2);
      let start = Math.min(rands[0], rands[1]);
      let end = Math.max(rands[0], rands[1]);
      
      // flip the range
      bs.flipRange(start, end);    

      // confirm only the range is flipped
      for (let i = 0; i <= MAX_INDEX; i++) {
        if (i >= start && i <= end) assert.notEqual(bs.get(i), before.get(i));
        else assert.equal(bs.get(i), before.get(i));
      }
      
      // flip back
      bs.flipRange(start, end);

      // confirm before and after are same
      assert.deepEqual(before.getState(), bs.getState());
    }
  });
  
  it("Can flip unbounded ranges", function() {
    
    // repeat test
    const repeat = 5;
    for (let i = 0; i < repeat; i++) {
      
      // set random trues
      bs.clear();
      setRandom(bs, true, 0, MAX_INDEX, NUM_SETS);
      
      // flip starting at random point
      let before = new BooleanSet(bs);
      let start = GenUtils.getRandomInt(0, MAX_INDEX);
      bs.flipRange(start);
      
      // check that only start and after is flipped
      for (let idx = 0; idx <= MAX_INDEX; idx++) {
        if (idx < start) assert(before.get(idx) === bs.get(idx))
        else assert(before.get(idx) !== bs.get(idx));
      }
    }
  });
  
  it("Can get the first index with a given value in a range", function() {
    
    // set random trues
    let indices = setRandom(bs, true, 0, MAX_INDEX, NUM_SETS);
    
    // can get first true
    assert.equal(indices[0], bs.getFirst(true));
    
    // can get first false
    for (let i = 0; i <= MAX_INDEX; i++) {
      if (indices.includes(i)) continue;
      assert.equal(i, bs.getFirst(false));
      break;
    }
    
    // can get first true given a start index
    for (let i = 0; i < indices.length; i++) {
      assert.equal(indices[i], bs.getFirst(true, i === 0 ? null : indices[i - 1] + 1));
    }
    
    // get can first false given a start index
    for (let i = 0; i <= MAX_INDEX; i++) {
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
    
    // can get first false in a range
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
    
    // set random trues
    let indices = setRandom(bs, true, 0, MAX_INDEX, NUM_SETS);
    
    // can get last true
    assert.equal(indices[indices.length - 1], bs.getLast(true));
    
    // last unbounded false is infinity
    assert.equal(undefined, bs.getLast(false));
    
    // can get last bounded false
    for (let i = MAX_INDEX; i > 0; i--) {
      let lastFalseIdx = i;
      while (indices.includes(lastFalseIdx) && lastFalseIdx >= 0) {
        lastFalseIdx--;
      }
      assert.equal(lastFalseIdx, bs.getLast(false, 0, i));
      break;
    }
    
    // can get last true given an end index
    for (let i = 0; i < indices.length; i++) {
      assert.equal(indices[i], bs.getLast(true, 0, i === indices.length - 1 ? null : indices[i + 1] - 1));
    }
    
    // get can last false given an end index
    for (let i = MAX_INDEX; i > 0; i--) {
      if (indices.includes(i)) assert.notEqual(i, bs.getLast(false, 0, i));
      else assert.equal(i, bs.getLast(false, 0, i));
    }
    
    // can get last true in a range
    for (let i = indices.length - 1; i >= 0; i--) {
      assert.equal(indices[i], bs.getLast(true, indices[i - 1], indices[i]));
      if (indices[i] - indices[i - 1] > 1) {  // test cut off by range
        assert.equal(null, bs.getLast(true, indices[i - 1] + 1, indices[i] - 1));
      }
    }
    
    // can get last false in a range
    bs.clear()
    bs.flip();
    bs.set(false, 6);
    bs.set(false, 4);
    bs.set(false, 2);
    assert.equal(null, bs.getLast(false, 0, 1));
    assert.equal(2, bs.getLast(false, 0, 2));
    assert.equal(4, bs.getLast(false, 3, 5));
    assert.equal(6, bs.getLast(false, 5, 10));
    assert.equal(6, bs.getLast(false, 0, 10));
    assert.equal(null, bs.getLast(false, 7));
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
  for (let i = 0; i <= MAX_INDEX; i++) assert(!bs.get(i));
  assert.equal(0, bs.getFirst(false));
  assert.equal(0, bs.getFirst(false, 0));
  assert.equal(0, bs.getFirst(false, 0, MAX_INDEX));
  assert.equal(MAX_INDEX, bs.getFirst(false, MAX_INDEX));
  assert.equal(null, bs.getFirst(true));
  assert.equal(undefined, bs.getLast(false)); // infinite falses
  assert.equal(null, bs.getLast(true));
  assert.equal(null, bs.getLast(true, 0));
  assert.equal(null, bs.getLast(true, MAX_INDEX));
}
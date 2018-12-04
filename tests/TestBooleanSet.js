const assert = require("assert");
const GenUtils = require("../src/utils/GenUtils");
const BooleanSet = require("../src/utils/BooleanSet");

const MAX_INDEX = 10000;        // maximum index to mark
const NUM_SETS = 5000;          // number of times to apply markings across indices
assert(MAX_INDEX >= NUM_SETS);  // most tests assume some indices in the range will remain unmarked

/**
 * Tests the BooeleanSet class.
 */
let bs = new BooleanSet();
describe("Test BooleanSet", function() {
  
  beforeEach(function() {
    bs.reset();
  });
  
  it("Starts with nothing set", function() {
    assert(bs.allSet(false));
    assert(bs.anySet(false));
    assert(!bs.anySet(true));
    assert(!bs.allSet(true));
  }
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
    let indices = GenUtils.getRandomInts(0, MAX_INDEX, NUM_SETS);
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
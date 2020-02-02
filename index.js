'use strict'

/**
 * Load production models to "this".
 */
require("./src/main/js/MoneroModel")();

/**
 * Load test models to "this".
 * 
 * TODO: dynamically include this in dev build
 */
require("./src/test/MoneroTestModel")();
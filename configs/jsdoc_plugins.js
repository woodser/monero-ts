/**
 * Plugin to generate jsdoc for undocumented methods.
 */
'use strict';

const INHERITS = ["MoneroWalletRpc", "MoneroWalletWasm", "MoneroWalletKeys", "MoneroDaemonRpc"] // classes to not override undocumented which will lose jsdoc inheritance
const GenUtils = require("../src/main/js/common/GenUtils");

module.exports.handlers = {
  newDoclet : function(e) {
    if (e.doclet.undocumented && e.doclet.kind === "function" && 
        e.doclet.scope === "instance" && 
        !e.doclet.name.startsWith("_") && 
        !GenUtils.arrayContains(INHERITS, e.doclet.memberof)) {
      e.doclet.undocumented = false;
    }
  },
//  symbolFound : function(e) {
//    if (e.astnode.type === "FunctionDeclaration") {
//      // if (e.undocumented) {
//      // console.log("undocumented!");
//      // e.undocumented = false;
//      // }
//      if ((e.comment === "@undocumented")) {
//        e.comment = '/** undocumented */';
//      }
//    }
//  }
};
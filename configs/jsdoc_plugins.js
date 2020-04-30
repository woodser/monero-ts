/**
 * Plugin to generate jsdoc for undocumented methods.
 */
'use strict';

const GenUtils = require("../src/main/js/common/GenUtils");

// classes to not override undocumented which will lose jsdoc inheritance
const INHERITS = ["MoneroWalletRpc", "MoneroWalletWasm", "MoneroWalletKeys", "MoneroDaemonRpc", "MoneroWalletListener", "MoneroIncomingTransfer", "MoneroOutgoingTransfer", "MoneroTxWallet", "MoneroOutputWallet", "MoneroTxQuery", "MoneroTransferQuery", "MoneroOutputQuery", "MoneroBlock", "MoneroCheckTx", "MoneroCheckReserve"];

module.exports.handlers = {
  newDoclet : function(e) {
    if (e.doclet.name.startsWith("_")) e.doclet.undocumented = true;
    else if (e.doclet.undocumented && e.doclet.kind === "function" && e.doclet.scope === "instance" && !GenUtils.arrayContains(INHERITS, e.doclet.memberof)) {
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
const nettype = require("../mymonero_core_js/cryptonote_utils/nettype");

class MoneroWalletMM {
  
  constructor(monero_utils) {
    this.monero_utils = monero_utils;
  }
  
  getSeed() {
    console.log("Ok lets get the seed");
    console.log(this.monero_utils);
    console.log(nettype);
    
    const ret = this.monero_utils.newly_created_wallet(
     "en",
     nettype.network_type.MAINNET
    );
    return ret.mnemonic_string;
  }
  
  getHeight() {
    throw "dangit";
  }
}

module.exports = MoneroWalletMM;
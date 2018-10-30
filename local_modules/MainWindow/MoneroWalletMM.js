const nettype = require("../mymonero_core_js/cryptonote_utils/nettype");

class MoneroWalletMM {
  
  constructor(daemon, monero_utils) {
    this.monero_utils = monero_utils;
    this.daemon = daemon;
    
    // collect keys
    const keys = this.monero_utils.newly_created_wallet("en", nettype.network_type.MAINNET);
    this.seed = keys.mnemonic_string;
    this.seedLang = keys.mnemonic_language;
    this.seedHex = keys.sec_seed_string;
    this.viewKeyPub = keys.pub_viewKey_string;
    this.viewKeySec = keys.sec_viewKey_string;
    this.spendKeyPub = keys.pub_spendKey_string;
    this.spendKeySec = keys.sec_spendKey_string;
    this.primaryAddress = keys.address_string;
  }
  
  getSeed() {
    return this.seed;
  }
  
  getHeight() {
    throw "getHeight() not implemented";
  }
  
  sync() {
    
    /*
     * https://stackoverflow.com/questions/24586110/resolve-promises-one-after-another-i-e-in-sequence
     * 
     * serial executes Promises sequentially.
     * @param {funcs} An array of funcs that return promises.
     * @example
     * const urls = ['/url1', '/url2', '/url3']
     * serial(urls.map(url => () => $.ajax(url)))
     *     .then(console.log.bind(console))
     */
    const serial = funcs =>
        funcs.reduce((promise, func) =>
            promise.then(result => func().then(Array.prototype.concat.bind(result))), Promise.resolve([]))
    
    this.daemon.get_height().then(resp => {
      console.log("Height: " + resp.height);
      
      const NUM_BLOCKS = 10;
      let endHeight = resp.height - 1;
      let startHeight = endHeight - NUM_BLOCKS + 1;
      console.log("Getting blocks from range: [" + startHeight + ", " + endHeight + "]");
      this.daemon.get_block_headers_range(startHeight, endHeight)
        .then(headersResp => {
          
          // fetch blocks
          let requests = headersResp.headers.map(header => () => this.daemon.getblock_by_height(header.height));
          serial(requests).then(blocks => {
            for (let block of blocks) {
              console.log(block);
              
              
              
            }
          }).catch(err => {
            console.log(err);
          })
        })
        .catch(errResp => {
          console.log("Error get headers range! " + errResp);
        });
    });
  }
}

module.exports = MoneroWalletMM;
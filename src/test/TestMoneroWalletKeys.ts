import assert from "assert";
import TestUtils from "./utils/TestUtils";
import WalletEqualityUtils from "./utils/WalletEqualityUtils";
import TestMoneroWalletCommon from "./TestMoneroWalletCommon";
import {createWalletKeys, MoneroWalletConfig, MoneroWalletKeys, GenUtils, MoneroUtils} from "../../index";

/**
 * Tests the implementation of MoneroWallet which only manages keys using WebAssembly.
 */
export default class TestMoneroWalletKeys extends TestMoneroWalletCommon {
  
  constructor(config) {
    super(config);
  }
  
  async beforeAll() {
    await super.beforeAll();
  }
  
  async beforeEach(currentTest) {
    await super.beforeEach(currentTest);
  }
  
  async afterAll() {
    console.log("After all");
    await this.wallet.close();
  }
  
  async afterEach(currentTest) {
    await super.afterEach(currentTest);
  }
  
  async getTestWallet() {
    return TestUtils.getWalletKeys();
  }
  
  async getTestDaemon() {
    return await TestUtils.getDaemonRpc();
  }
  
  async openWallet(config?): Promise<MoneroWalletKeys> {
    throw new Error("TestMoneroWalletKeys.openWallet(config) not applicable, use createWallet()");
  }
  
  async createWallet(config) {
    
    // assign defaults
    config = new MoneroWalletConfig(config);
    if (!config.getPassword()) config.setPassword(TestUtils.WALLET_PASSWORD);
    if (config.getNetworkType() === undefined) config.setNetworkType(TestUtils.NETWORK_TYPE);
    if (config.getServer()) throw new Error("Cannot initialize keys wallet with connection");
    
    // create wallet
    return await createWalletKeys(config);
  }
  
  async closeWallet(wallet, save) {
    await wallet.close(save);
  }

  async getSeedLanguages(): Promise<string[]> {
    return await MoneroWalletKeys.getSeedLanguages();
  }
  
  runTests() {
    let that = this;
    describe("TEST MONERO WALLET KEYS", function() {
      
      // register handlers to run before and after tests
      before(async function() { await that.beforeAll(); });
      beforeEach(async function() { await that.beforeEach(this.currentTest); });
      after(async function() { await that.afterAll(); });
      afterEach(async function() { await that.afterEach(this.currentTest); });
      
      // run tests specific to keys wallet
      that.testWalletKeys();
      
      // run common tests
      that.runCommonTests();
    });
  }
  
  // ---------------------------------- PRIVATE -------------------------------
  
  protected testWalletKeys() {
    let that = this;
    let config = this.testConfig;
    let daemon = this.daemon;
    
    describe("Tests specific to keys wallet", function() {
      
      it("Has the same keys as the RPC wallet", async function() {
        await WalletEqualityUtils.testWalletEqualityKeys(await TestUtils.getWalletRpc(), await that.getTestWallet());
      });
      
      it("Has the same keys as the RPC wallet with a seed offset", async function() {
        
        // use common offset to compare wallet implementations
        let seedOffset = "my super secret offset!";
        
        // create rpc wallet with offset
        let walletRpc = await TestUtils.getWalletRpc();
        await walletRpc.createWallet({path: GenUtils.getUUID(), password: TestUtils.WALLET_PASSWORD, seed: await walletRpc.getSeed(), restoreHeight: TestUtils.FIRST_RECEIVE_HEIGHT, seedOffset: seedOffset});
        
        // create keys-only wallet with offset
        let walletKeys = await createWalletKeys({
            networkType: TestUtils.NETWORK_TYPE,
            seed: TestUtils.SEED,
            seedOffset: seedOffset
        });
        
        // deep compare
        await WalletEqualityUtils.testWalletEqualityKeys(walletRpc, walletKeys);
      });
      
      it("Can get the address of a specified account and subaddress index", async function() {
        for (let accountIdx= 0; accountIdx < 5; accountIdx++) {
          for (let subaddressIdx = 0; subaddressIdx < 5; subaddressIdx++) {
            await MoneroUtils.validateAddress(await that.wallet.getAddress(accountIdx, subaddressIdx), TestUtils.NETWORK_TYPE);
          }
        }
      });
    });
  }
}


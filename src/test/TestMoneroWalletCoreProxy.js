const TestMoneroWalletCommon = require("./TestMoneroWalletCommon");
const MoneroWalletCoreProxy = require("../main/js/wallet/MoneroWalletCoreProxy");

/**
 * Tests the proxy wrapper to a web worker running MoneroWalletCore.
 */
class TestMoneroWalletCoreProxy extends TestMoneroWalletCore {
  
  constructor() {
    super();
    this.savedWallets = {};
  }
  
  async getTestWallet() {
    if (this.testWallet === undefined || await this.testWallet.isClosed()) { 
      this.testWallet = await MoneroWalletCoreProxy.createWalletFromMnemonic(TestUtils.WALLET_PASSWORD, TestUtils.NETWORK_TYPE, TestUtils.MNEMONIC, (await TestUtils.getDaemonRpc()).getRpcConnection(), TestUtils.FIRST_RECEIVE_HEIGHT);
      await this.testWallet.setAttribute("id", GenUtils.uuidv4());  // assign id
      assert.equal(await this.testWallet.getRestoreHeight(), TestUtils.FIRST_RECEIVE_HEIGHT);
      await this.testWallet.sync(new WalletSyncPrinter());
      await this.testWallet.startSyncing();
      await this.saveWallet(this.testWallet);
    }
    
    // return cached wallet
    return this.testWallet;
  }
  
  async openWallet(path) {
    let walletData = this.savedWallets[path];
    let wallet = await MoneroWalletCoreProxy.openWalletData(TestUtils.WALLET_PASSWORD, TestUtils.NETWORK_TYPE, walletData[0], walletData[1], await daemon.getRpcConnection());
    //await wallet.startSyncing();  // TODO
    return wallet;
  }
  
  async openWalletCustom(path, password, networkType, daemonConnection) {
    // TODO: fetch wallet data from memory and open wallet
    let walletData = this.savedWallets[path];
    let wallet = await MoneroWalletCoreProxy.openWalletData(password, networkType, walletData[0], walletData[1], daemonConnection);
    //await wallet.startSyncing();  // TODO
    return wallet;
  }
  
  async createWalletRandom() {
    let wallet = await MoneroWalletCoreProxy.createWalletRandom(TestUtils.WALLET_PASSWORD, TestUtils.NETWORK_TYPE, TestUtils.getDaemonRpc().getRpcConnection());
    await wallet.setAttribute("id", GenUtils.uuidv4());  // assign id
    //await wallet.startSyncing();  // TODO
    return wallet;
  }
  
  /**
   * Create a random wallet with custom configuration using a method which subclasses may override.
   */
  async createWalletRandomCustom(password, networkType, daemonConnection, language) {
    let wallet = await MoneroWalletCoreProxy.createWalletRandom(password, networkType, daemonConnection, language);
    await wallet.setAttribute("id", GenUtils.uuidv4());  // assign id
    //await wallet.startSyncing();  // TODO
    return wallet;
  }
  
  async createWalletFromMnemonic(mnemonic, restoreHeight, seedOffset) {
    let wallet = await MoneroWalletCoreProxy.createWalletFromMnemonic( TestUtils.WALLET_PASSWORD, TestUtils.NETWORK_TYPE, mnemonic, TestUtils.getDaemonRpc().getRpcConnection(), restoreHeight, seedOffset);
    await wallet.setAttribute("id", GenUtils.uuidv4());  // assign id
    //await wallet.startSyncing();  // TODO
    return wallet;
  }
  
  /**
   * Create a wallet from mnemonic with custom configuration using a method which subclasses may override.
   */
  async createWalletFromMnemonicCustom(password, networkType, mnemonic, daemonConnection, restoreHeight, seedOffset) {
    let wallet = await MoneroWalletCoreProxy.createWalletFromMnemonic( password, networkType, mnemonic, daemonConnection, restoreHeight, seedOffset);
    await wallet.setAttribute("id", GenUtils.uuidv4());  // assign id
    //await wallet.startSyncing();  // TODO
    return wallet;
  }
  
  async createWalletFromKeys(address, privateViewKey, privateSpendKey, daemonConnection, firstReceiveHeight, language) {
    let path = TestUtils.TEST_WALLETS_DIR + "/" + GenUtils.uuidv4();
    let wallet = await MoneroWalletCoreProxy.createWalletFromKeys( TestUtils.WALLET_PASSWORD, TestUtils.NETWORK_TYPE, address, privateViewKey, privateSpendKey, daemonConnection, firstReceiveHeight, language);
    await wallet.setAttribute("id", GenUtils.uuidv4());  // assign id
    assert.equal(await wallet.getPath(), path);
    //await wallet.startSyncing();  // TODO
    return wallet;
  }
  
  async createWalletFromKeysCustom(password, networkType, address, privateViewKey, privateSpendKey, daemonConnection, firstReceiveHeight, language) {
    let wallet = await MoneroWalletCoreProxy.createWalletFromKeys( password, networkType, address, privateViewKey, privateSpendKey, daemonConnection, firstReceiveHeight, language);
    await wallet.setAttribute("id", GenUtils.uuidv4());  // assign id
    //await wallet.startSyncing();  // TODO
    return wallet;
  }
  
  async createWalletGroundTruth(networkType, mnemonic, restoreHeight) {
    let gtWallet = await MoneroWalletCoreProxy.createWalletFromMnemonic(TestUtils.WALLET_PASSWORD, networkType, mnemonic, (await TestUtils.getDaemonRpc()).getRpcConnection(), restoreHeight, undefined);
    assert.equal(await gtWallet.getRestoreHeight(), restoreHeight === undefined ? 0 : restoreHeight);
    await gtWallet.sync();
    //await gtWallet.startSyncing();  // TODO
    return gtWallet;
  }
  
  async saveWallet(wallet) {
    let id = await wallet.getAttribute("id");
    this.savedWallets[id] = await wallet.getData();
  }
  
  async getPath(wallet) {
    return await wallet.getAttribute("id"); // use id as path
  }
  
  async getMnemonicLanguages() {
    return await MoneroWalletCoreProxy.getMnemonicLanguages();
  }
  
  // ------------------------------- BEGIN TESTS ------------------------------
  
  runTests(config) {
    super.runTests(config);
  }
}

module.exports = TestMoneroWalletCoreProxy;
/**
 * Configuration to create a Monero wallet.
 */
class MoneroWalletConfig {
  
  constructor(config) {
    
    // initialize internal config
    if (!config) config = {};
    else if (config instanceof MoneroWalletConfig) config = config.toJson();
    else if (typeof config === "object") config = Object.assign({}, config);
    else throw new MoneroError("config must be a MoneroWalletConfig or JavaScript object");
    this.config = config;
    
    // normalize config
    this.setNetworkType(config.networkType);
    if (config.server) this.setServer(config.server);
    delete this.config.server;
    
    // check for unsupported fields
    for (let key of Object.keys(this.config)) {
      if (!GenUtils.arrayContains(MoneroWalletConfig.SUPPORTED_FIELDS, key)) {
        throw new MoneroError("Wallet config includes unsupported field: '" + key + "'");
      }
    }
  }
  
  toJson() {
    return Object.assign({}, this.config);
  }
  
  getPath() {
    return this.config.path;
  }
  
  setPath(path) {
    this.config.path = path;
    return this;
  }
  
  getPassword() {
    return this.config.password;
  }
  
  setPassword(password) {
    this.config.password = password;
    return this;
  }
  
  getNetworkType() {
    return this.config.networkType;
  }
  
  setNetworkType(networkTypeOrStr) {
    this.config.networkType = typeof networkTypeOrStr === "string" ? MoneroNetworkType.parse(networkTypeOrStr) : networkTypeOrStr;
    return this;
  }
  
  getServer() {
    return !this.config.serverUri ? undefined : new MoneroRpcConnection({uri: this.config.serverUri, username: this.config.serverUsername, password: this.config.serverPassword, rejectUnauthorized: this.config.rejectUnauthorized})
  }
  
  setServer(server) {
    if (server && !(server instanceof MoneroRpcConnection)) server = new MoneroRpcConnection(server);
    this.config.serverUri = server === undefined ? undefined : server.getUri();
    this.config.serverUsername = server === undefined ? undefined : server.getUsername();
    this.config.serverPassword = server === undefined ? undefined : server.getPassword();
    this.config.rejectUnauthorized = server === undefined ? undefined : server.getRejectUnauthorized();
    return this;
  }
  
  getServerUri() {
    return this.config.serverUri;
  }
  
  setServerUri(serverUri) {
    this.config.serverUri = serverUri;
    return this;
  }
  
  getServerUsername() {
    return this.config.serverUsername;
  }
  
  setServerUsername(serverUsername) {
    this.config.serverUsername = serverUsername;
    return this;
  }
  
  getServerPassword() {
    return this.config.serverPassword;
  }
  
  setServerPassword(serverPassword) {
    this.config.serverPassword = serverPassword;
    return this;
  }
  
  getRejectUnauthorized() {
    return this.config.rejectUnauthorized;
  }
  
  setRejectUnauthorized(rejectUnauthorized) {
    this.config.rejectUnauthorized = rejectUnauthorized;
    return this;
  }
  
  getMnemonic() {
    return this.config.mnemonic;
  }
  
  setMnemonic(mnemonic) {
    this.config.mnemonic = mnemonic;
    return this;
  }
  
  getSeedOffset() {
    return this.config.seedOffset;
  }
  
  setSeedOffset(seedOffset) {
    this.config.seedOffset = seedOffset;
    return this;
  }
  
  getPrimaryAddress() {
    return this.config.primaryAddress;
  }
  
  setPrimaryAddress(primaryAddress) {
    this.config.primaryAddress = primaryAddress;
    return this;
  }
  
  getPrivateViewKey() {
    return this.config.privateViewKey;
  }
  
  setPrivateViewKey(privateViewKey) {
    this.config.privateViewKey = privateViewKey;
    return this;
  }
  
  getPrivateSpendKey() {
    return this.config.privateSpendKey;
  }
  
  setPrivateSpendKey(privateSpendKey) {
    this.config.privateSpendKey = privateSpendKey;
    return this;
  }
  
  getRestoreHeight() {
    return this.config.restoreHeight;
  }
  
  setRestoreHeight(restoreHeight) {
    this.config.restoreHeight = restoreHeight;
    return this;
  }
  
  getLanguage() {
    return this.config.language;
  }
  
  setLanguage(language) {
    this.config.language = language;
    return this;
  }
  
  getSaveCurrent() {
    return this.config.saveCurrent;
  }
  
  setSaveCurrent(saveCurrent) {
    this.config.saveCurrent = saveCurrent;
    return this;
  }
  
  getProxyToWorker() {
    return this.config.proxyToWorker;
  }
  
  setProxyToWorker(proxyToWorker) {
    this.config.proxyToWorker = proxyToWorker;
    return this;
  }
  
  getFs() {
    return this.config.fs;
  }
  
  setFs(fs) {
    this.config.fs = fs;
    return this;
  }
  
  getKeysData() {
    return this.config.keysData;
  }
  
  setKeysData(keysData) {
    this.config.keysData = keysData;
    return this;
  }
  
  getCacheData() {
    return this.config.cacheData;
  }
  
  setCacheData(cacheData) {
    this.config.cacheData = cacheData;
    return this;
  }
}

MoneroWalletConfig.SUPPORTED_FIELDS = ["path", "password", "networkType", "serverUri", "serverUsername", "serverPassword", "rejectUnauthorized", "mnemonic", "seedOffset", "primaryAddress", "privateViewKey", "privateSpendKey", "restoreHeight", "language", "saveCurrent", "proxyToWorker", "fs", "keysData", "cacheData"];

module.exports = MoneroWalletConfig;
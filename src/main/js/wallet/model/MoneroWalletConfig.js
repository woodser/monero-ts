/**
 * Configuration to create a Monero wallet.
 */
class MoneroWalletConfig {
  
  constructor(config) {
    throw new MoneroError("Not implemented");
  }
  
  getPath() {
    return path;
  }
  
  setPath(path) {
    this.path = path;
    return this;
  }
  
  getPassword() {
    return password;
  }
  
  setPassword(password) {
    this.password = password;
    return this;
  }
  
  public MoneroNetworkType getNetworkType() {
    return networkType;
  }
  
  setNetworkType(networkTypeOrStr) {
    this.networkType = typeof networkTypeOrStr === "string" ? MoneroNetworkType.parse(networkTypeOrStr) : networkTypeOrStr;
    return this;
  }
  
  getServer() {
    return new MoneroRpcConnection({uri: this.serverUri, username: this.serverUsername, password: this.serverPassword, rejectUnauthorized: this.rejectUnauthorized});
  }
  
  setServer(server) {
    this.serverUri = server === undefined ? undefined : server.getUri();
    this.serverUsername = server === undefined ? undefined : server.getUsername();
    this.serverPassword = server === undefined ? undefined : server.getPassword();
    this.rejectUnauthorized = server === undefined ? undefined : server.getConfig().rejectUnauthorized;
    return this;
  }
  
  getServerUri() {
    return serverUri;
  }
  
  setServerUri(serverUri) {
    this.serverUri = serverUri;
    return this;
  }
  
  getServerUsername() {
    return serverUsername;
  }
  
  setServerUsername(serverUsername) {
    this.serverUsername = serverUsername;
    return this;
  }
  
  getServerPassword() {
    return serverPassword;
  }
  
  setServerPassword(serverPassword) {
    this.serverPassword = serverPassword;
    return this;
  }
  
  getRejectUnauthorized() {
    return this.rejectUnauthorized;
  }
  
  setRejectUnauthorized(rejectUnauthorized) {
    this.rejectUnauthorized = rejectUnauthorized;
    return this;
  }
  
  getMnemonic() {
    return mnemonic;
  }
  
  setMnemonic(mnemonic) {
    this.mnemonic = mnemonic;
    return this;
  }
  
  getSeedOffset() {
    return seedOffset;
  }
  
  setSeedOffset(seedOffset) {
    this.seedOffset = seedOffset;
    return this;
  }
  
  getPrimaryAddress() {
    return primaryAddress;
  }
  
  setPrimaryAddress(primaryAddress) {
    this.primaryAddress = primaryAddress;
    return this;
  }
  
  getPrivateViewKey() {
    return privateViewKey;
  }
  
  setPrivateViewKey(privateViewKey) {
    this.privateViewKey = privateViewKey;
    return this;
  }
  
  getPrivateSpendKey() {
    return privateSpendKey;
  }
  
  setPrivateSpendKey(privateSpendKey) {
    this.privateSpendKey = privateSpendKey;
    return this;
  }
  
  getRestoreHeight() {
    return restoreHeight;
  }
  
  setRestoreHeight(restoreHeight) {
    this.restoreHeight = restoreHeight;
    return this;
  }
  
  getLanguage() {
    return language;
  }
  
  setLanguage(language) {
    this.language = language;
    return this;
  }
  
  getSaveCurrent() {
    return saveCurrent;
  }
  
  setSaveCurrent(saveCurrent) {
    this.saveCurrent = saveCurrent;
    return this;
  }
}

module.exports = MoneroWalletConfig;
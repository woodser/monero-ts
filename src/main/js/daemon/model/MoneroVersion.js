/**
 * Models a Monero version.
 */
class MoneroVersion {
  
  /**
   * Construct the model.
   * 
   * @param versionNumber is the version number
   * @param isRelease indicates if this version is a release
   */
  constructor(versionNumber, isRelease) {
    this.state = {};
    this.state.versionNumber = versionNumber;
    this.state.isRelease = isRelease;
  }

  getVersionNumber() {
    return this.state.versionNumber;
  }

  setVersionNumber(versionNumber) {
    this.state.versionNumber = versionNumber;
    return this;
  }

  isRelease() {
    return this.state.isRelease;
  }

  setIsRelease(isRelease) {
    this.state.isRelease = isRelease;
    return this;
  }
  
  copy() {
    return new MoneroKeyImage(this);
  }
  
  toJson() {
    return Object.assign({}, this.state);
  }
}

module.exports = MoneroVersion;
/**
 * SSL options for remote endpoints.
 */
class SslOptions {
  
  constructor(state) {
    this.state = Object.assign({}, state);
  }
  
  getPrivateKeyPath() {
    return this.state.privateKeyPath;
  }
  
  setPrivateKeyPath(privateKeyPath) {
    this.state.privateKeyPath = privateKeyPath;
    return this;
  }
  
  getCertificatePath() {
    return this.state.certificatePath;
  }
  
  setCertificatePath(certificatePath) {
    this.state.certificatePath = certificatePath;
    return this;
  }
  
  getCertificateAuthorityFile() {
    return this.state.certificateAuthorityFile;
  }
  
  setCertificateAuthorityFile(certificateAuthorityFile) {
    this.state.certificateAuthorityFile = certificateAuthorityFile;
    return this;
  }
  
  getAllowedFingerprints() {
    return this.state.allowedFingerprints;
  }
  
  setAllowedFingerprints(allowedFingerprints) {
    this.state.allowedFingerprints = allowedFingerprints;
    return this;
  }
  
  getAllowAnyCert() {
    return this.state.allowAnyCert;
  }
  
  setAllowAnyCert(allowAnyCert) {
    this.state.allowAnyCert = allowAnyCert;
    return this;
  }
}

module.exports = SslOptions;
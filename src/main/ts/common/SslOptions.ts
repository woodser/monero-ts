/**
 * SSL options for remote endpoints.
 */
export default class SslOptions {

  privateKeyPath: string;
  certificatePath: string;
  certificateAuthorityFile: string;
  allowedFingerprints: string[];
  allowAnyCert: boolean;

  constructor(options?: Partial<SslOptions>) {
    Object.assign(this, options);
  }
  
  getPrivateKeyPath() {
    return this.privateKeyPath;
  }
  
  setPrivateKeyPath(privateKeyPath) {
    this.privateKeyPath = privateKeyPath;
    return this;
  }
  
  getCertificatePath() {
    return this.certificatePath;
  }
  
  setCertificatePath(certificatePath) {
    this.certificatePath = certificatePath;
    return this;
  }
  
  getCertificateAuthorityFile() {
    return this.certificateAuthorityFile;
  }
  
  setCertificateAuthorityFile(certificateAuthorityFile) {
    this.certificateAuthorityFile = certificateAuthorityFile;
    return this;
  }
  
  getAllowedFingerprints() {
    return this.allowedFingerprints;
  }
  
  setAllowedFingerprints(allowedFingerprints) {
    this.allowedFingerprints = allowedFingerprints;
    return this;
  }
  
  getAllowAnyCert() {
    return this.allowAnyCert;
  }
  
  setAllowAnyCert(allowAnyCert) {
    this.allowAnyCert = allowAnyCert;
    return this;
  }
}

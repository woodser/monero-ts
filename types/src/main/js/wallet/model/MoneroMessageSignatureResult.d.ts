export = MoneroMessageSignatureResult;
/**
 * Message signature verification result.
 *
 * @class
 */
declare class MoneroMessageSignatureResult {
    constructor(stateOrIsGood: any, isOld: any, signatureType: any, version: any);
    state: any;
    toJson(): any;
    isGood(): any;
    setIsGood(isGood: any): this;
    isOld(): any;
    setIsOld(isOld: any): this;
    getSignatureType(): any;
    setSignatureType(signatureType: any): this;
    getVersion(): any;
    setVersion(version: any): this;
}

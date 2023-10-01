import MoneroMessageSignatureType from "./MoneroMessageSignatureType";
/**
 * Message signature verification result.
 */
export default class MoneroMessageSignatureResult {
    isGood: boolean;
    isOld: boolean;
    signatureType: MoneroMessageSignatureType;
    version: number;
    constructor(result?: Partial<MoneroMessageSignatureResult>);
    toJson(): any;
    getIsGood(): boolean;
    setIsGood(isGood: boolean): MoneroMessageSignatureResult;
    getIsOld(): boolean;
    setIsOld(isOld: boolean): MoneroMessageSignatureResult;
    getSignatureType(): MoneroMessageSignatureType;
    setSignatureType(signatureType: MoneroMessageSignatureType): MoneroMessageSignatureResult;
    getVersion(): number;
    setVersion(version: number): MoneroMessageSignatureResult;
}

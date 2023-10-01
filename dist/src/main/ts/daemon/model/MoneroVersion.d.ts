/**
 * Models a Monero version.
 */
export default class MoneroVersion {
    number: number;
    isRelease: boolean;
    constructor(number: number, isRelease: boolean);
    getNumber(): number;
    setNumber(number: number): MoneroVersion;
    getIsRelease(): boolean;
    setIsRelease(isRelease: boolean): MoneroVersion;
    copy(): MoneroVersion;
    toJson(): any;
}

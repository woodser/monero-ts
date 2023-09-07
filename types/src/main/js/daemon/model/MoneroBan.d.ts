export = MoneroBan;
/**
 * Monero banhammer.
 */
declare class MoneroBan {
    constructor(state: any);
    state: any;
    toJson(): any;
    getHost(): any;
    setHost(host: any): this;
    getIp(): any;
    setIp(ip: any): this;
    isBanned(): any;
    setIsBanned(isBanned: any): this;
    getSeconds(): any;
    setSeconds(seconds: any): this;
}

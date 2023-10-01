/**
 * Monero banhammer.
 */
export default class MoneroBan {
    host: string;
    ip: string;
    isBanned: boolean;
    seconds: number;
    constructor(ban?: Partial<MoneroBan>);
    toJson(): any;
    getHost(): string;
    setHost(host: string): MoneroBan;
    getIp(): string;
    setIp(ip: string): MoneroBan;
    getIsBanned(): boolean;
    setIsBanned(isBanned: boolean): MoneroBan;
    getSeconds(): number;
    setSeconds(seconds: number): MoneroBan;
}

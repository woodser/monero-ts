/**
 * Monero banhammer.
 */
export default class MoneroBan {

  host: string;
  ip: string;
  isBanned: boolean;
  seconds: number;
  
  constructor(ban?: Partial<MoneroBan>) {
    Object.assign(this, ban);
  }
  
  toJson(): any {
    return Object.assign({}, this);
  }
  
  getHost(): string {
    return this.host;
  }
  
  setHost(host: string): MoneroBan {
    this.host = host;
    return this;
  }
  
  getIp(): string {
    return this.ip;
  }
  
  setIp(ip: string): MoneroBan {
    this.ip = ip;
    return this;
  }
  
  getIsBanned(): boolean {
    return this.isBanned;
  }
  
  setIsBanned(isBanned: boolean): MoneroBan {
    this.isBanned = isBanned;
    return this;
  }
  
  getSeconds(): number {
    return this.seconds;
  }
  
  setSeconds(seconds: number): MoneroBan {
    this.seconds = seconds;
    return this;
  }
}

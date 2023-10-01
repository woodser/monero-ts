/**
 * Monero daemon connection span.
 */
export default class MoneroConnectionSpan {

  connectionId: string;
  numBlocks: number;
  remoteAddress: string;
  rate: number;
  speed: number;
  size: number;
  startHeight: number;
  
  constructor(span?: any) {
    Object.assign(this, span);
  }
  
  toJson(): any {
    return Object.assign({}, this);
  }
  
  getConnectionId(): string {
    return this.connectionId;
  }

  setConnectionId(connectionId: string): MoneroConnectionSpan {
    this.connectionId = connectionId;
    return this;
  }
  
  getNumBlocks(): number {
    return this.numBlocks;
  }

  setNumBlocks(numBlocks: number): MoneroConnectionSpan {
    this.numBlocks = numBlocks;
    return this;
  }
  
  getRemoteAddress(): string {
    return this.remoteAddress;
  }

  setRemoteAddress(remoteAddress: string): MoneroConnectionSpan {
    this.remoteAddress = remoteAddress;
    return this;
  }
  
  getRate(): number {
    return this.rate;
  }

  setRate(rate: number): MoneroConnectionSpan {
    this.rate = rate;
    return this;
  }
  
  getSpeed(): number {
    return this.speed;
  }

  setSpeed(speed: number): MoneroConnectionSpan {
    this.speed = speed;
    return this;
  }
  
  getSize(): number {
    return this.size;
  }
  
  setSize(size: number): MoneroConnectionSpan {
    this.size = size;
    return this;
  }
  
  getStartHeight(): number {
    return this.startHeight;
  }
  
  setStartHeight(startHeight: number): MoneroConnectionSpan {
    this.startHeight = startHeight;
    return this;
  }
}

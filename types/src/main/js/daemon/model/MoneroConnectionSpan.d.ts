export = MoneroConnectionSpan;
/**
 * Monero daemon connection span.
 */
declare class MoneroConnectionSpan {
    constructor(state: any);
    state: any;
    toJson(): any;
    getConnectionId(): any;
    setConnectionId(connectionId: any): this;
    getNumBlocks(): any;
    setNumBlocks(numBlocks: any): this;
    getRemoteAddress(): any;
    setRemoteAddress(remoteAddress: any): this;
    getRate(): any;
    setRate(rate: any): this;
    getSpeed(): any;
    setSpeed(speed: any): this;
    getSize(): any;
    setSize(size: any): this;
    getStartHeight(): any;
    setStartHeight(startHeight: any): this;
}

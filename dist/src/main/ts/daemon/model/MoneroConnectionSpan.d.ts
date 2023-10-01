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
    constructor(span?: any);
    toJson(): any;
    getConnectionId(): string;
    setConnectionId(connectionId: string): MoneroConnectionSpan;
    getNumBlocks(): number;
    setNumBlocks(numBlocks: number): MoneroConnectionSpan;
    getRemoteAddress(): string;
    setRemoteAddress(remoteAddress: string): MoneroConnectionSpan;
    getRate(): number;
    setRate(rate: number): MoneroConnectionSpan;
    getSpeed(): number;
    setSpeed(speed: number): MoneroConnectionSpan;
    getSize(): number;
    setSize(size: number): MoneroConnectionSpan;
    getStartHeight(): number;
    setStartHeight(startHeight: number): MoneroConnectionSpan;
}

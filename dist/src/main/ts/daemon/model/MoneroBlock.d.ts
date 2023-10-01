import MoneroBlockHeader from "./MoneroBlockHeader";
import MoneroTx from "./MoneroTx";
/**
 * Enumerates types to deserialize to.
 */
declare enum DeserializationType {
    TX = 0,
    TX_WALLET = 1,
    TX_QUERY = 2
}
/**
 * Models a Monero block in the blockchain.
 */
export default class MoneroBlock extends MoneroBlockHeader {
    static DeserializationType: typeof DeserializationType;
    hex: string;
    minerTx: MoneroTx;
    txs: MoneroTx[];
    txHashes: string[];
    constructor(block?: Partial<MoneroBlock>, txType?: DeserializationType);
    getHex(): string;
    setHex(hex: string): MoneroBlock;
    getMinerTx(): MoneroTx;
    setMinerTx(minerTx: MoneroTx): MoneroBlock;
    getTxs(): MoneroTx[];
    setTxs(txs: MoneroTx[]): MoneroBlock;
    getTxHashes(): string[];
    setTxHashes(txHashes: string[]): MoneroBlock;
    copy(): MoneroBlock;
    toJson(): any;
    merge(block: MoneroBlock): MoneroBlock;
    toString(indent?: number): string;
    protected static mergeTx(txs: any, tx: any): void;
    setHeight(height: number): MoneroBlock;
    setTimestamp(timestamp: number): MoneroBlock;
    setSize(size: number): MoneroBlock;
    setWeight(weight: number): MoneroBlock;
    setLongTermWeight(longTermWeight: number): MoneroBlock;
    setDepth(depth: number): MoneroBlock;
    setDifficulty(difficulty: bigint): MoneroBlock;
    setCumulativeDifficulty(cumulativeDifficulty: bigint): MoneroBlock;
    setMajorVersion(majorVersion: number): MoneroBlock;
    setMinorVersion(minorVersion: number): MoneroBlock;
    setNonce(nonce: number): MoneroBlock;
    setMinerTxHash(minerTxHash: string): MoneroBlock;
    setNumTxs(numTxs: number): MoneroBlock;
    setOrphanStatus(orphanStatus: boolean): MoneroBlock;
    setPrevHash(prevHash: string): MoneroBlock;
    setReward(reward: bigint): MoneroBlock;
    setPowHash(powHash: string): MoneroBlock;
    protected deserializeTx(tx: any, txType?: DeserializationType): MoneroTx;
}
export {};

export = MoneroBlock;
/**
 * Models a Monero block in the blockchain.
 *
 * @extends {MoneroBlockHeader}
 */
declare class MoneroBlock extends MoneroBlockHeader {
    static _mergeTx(txs: any, tx: any): void;
    /**
     * Construct the model.
     *
     * @param {MoneroBlock|MoneroBlockHeader|object} state is existing state to initialize from (optional)
     * @param {MoneroBlock.DeserializationType} txType informs the tx deserialization type (MoneroTx, MoneroTxWallet, MoneroTxQuery)
     */
    constructor(state: MoneroBlock | MoneroBlockHeader | object, txType: {
        TX: number;
        TX_WALLET: number;
        TX_QUERY: number;
    });
    getHex(): any;
    setHex(hex: any): this;
    getMinerTx(): any;
    setMinerTx(minerTx: any): this;
    getTxs(): any;
    setTxs(txs: any): this;
    getTxHashes(): any;
    setTxHashes(txHashes: any): this;
    copy(): MoneroBlock;
    merge(block: any): this;
}
declare namespace MoneroBlock {
    namespace DeserializationType {
        let TX: number;
        let TX_WALLET: number;
        let TX_QUERY: number;
    }
}
import MoneroBlockHeader = require("./MoneroBlockHeader");

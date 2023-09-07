export = MoneroOutput;
/**
 * Models a Monero transaction output.
 *
 * @class
 */
declare class MoneroOutput {
    /**
     * Construct the model.
     *
     * @param {MoneroOutput|object} state is existing state to initialize from (optional)
     */
    constructor(state: MoneroOutput | object);
    state: any;
    getTx(): any;
    setTx(tx: any): this;
    getKeyImage(): any;
    setKeyImage(keyImage: any): this;
    getAmount(): any;
    setAmount(amount: any): this;
    getIndex(): any;
    setIndex(index: any): this;
    getRingOutputIndices(): any;
    setRingOutputIndices(ringOutputIndices: any): this;
    getStealthPublicKey(): any;
    setStealthPublicKey(stealthPublicKey: any): this;
    copy(): MoneroOutput;
    toJson(): any;
    merge(output: any): this;
    toString(indent?: number): string;
}

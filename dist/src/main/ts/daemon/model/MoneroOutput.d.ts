import MoneroKeyImage from "./MoneroKeyImage";
import MoneroTx from "./MoneroTx";
/**
 * Models a Monero transaction output.
 */
export default class MoneroOutput {
    tx: MoneroTx;
    keyImage: Partial<MoneroKeyImage>;
    amount: bigint;
    index: number;
    ringOutputIndices: number[];
    stealthPublicKey: string;
    /**
     * Construct the model.
     *
     * @param {MoneroOutput} [output] is existing state to initialize from (optional)
     */
    constructor(output?: Partial<MoneroOutput>);
    getTx(): MoneroTx;
    setTx(tx: MoneroTx): MoneroOutput;
    getKeyImage(): MoneroKeyImage;
    setKeyImage(keyImage: MoneroKeyImage): MoneroOutput;
    getAmount(): bigint;
    setAmount(amount: bigint): MoneroOutput;
    getIndex(): number;
    setIndex(index: number): MoneroOutput;
    getRingOutputIndices(): number[];
    setRingOutputIndices(ringOutputIndices: number[]): MoneroOutput;
    getStealthPublicKey(): string;
    setStealthPublicKey(stealthPublicKey: string): MoneroOutput;
    copy(): MoneroOutput;
    toJson(): any;
    merge(output: MoneroOutput): MoneroOutput;
    toString(indent?: number): string;
}

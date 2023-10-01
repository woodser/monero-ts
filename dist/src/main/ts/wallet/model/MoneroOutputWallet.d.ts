import MoneroKeyImage from "../../daemon/model/MoneroKeyImage";
import MoneroOutput from "../../daemon/model/MoneroOutput";
import MoneroTx from "../../daemon/model/MoneroTx";
import MoneroTxWallet from "./MoneroTxWallet";
/**
 * Models a Monero output with wallet extensions.
 */
export default class MoneroOutputWallet extends MoneroOutput {
    accountIndex: number;
    subaddressIndex: number;
    isSpent: boolean;
    isFrozen: boolean;
    isLocked: boolean;
    /**
     * Construct the model.
     *
     * @param {MoneroOutputWallet} [output] is existing state to initialize from (optional)
     */
    constructor(output?: Partial<MoneroOutputWallet>);
    getTx(): MoneroTxWallet;
    setTx(tx: MoneroTx): MoneroOutputWallet;
    getAccountIndex(): number;
    setAccountIndex(accountIndex: number): MoneroOutputWallet;
    getSubaddressIndex(): number;
    setSubaddressIndex(subaddressIndex: number): MoneroOutputWallet;
    getIsSpent(): boolean;
    setIsSpent(isSpent: boolean): MoneroOutputWallet;
    /**
     * Indicates if this output has been deemed 'malicious' and will therefore
     * not be spent by the wallet.
     *
     * @return Boolean is whether or not this output is frozen
     */
    getIsFrozen(): boolean;
    setIsFrozen(isFrozen: boolean): MoneroOutputWallet;
    getIsLocked(): boolean;
    copy(): MoneroOutputWallet;
    toJson(): any;
    /**
     * Updates this output by merging the latest information from the given
     * output.
     *
     * Merging can modify or build references to the output given so it
     * should not be re-used or it should be copied before calling this method.
     *
     * @param output is the output to merge into this one
     */
    merge(output: MoneroOutputWallet): MoneroOutputWallet;
    toString(indent?: number): string;
    setKeyImage(keyImage: MoneroKeyImage): MoneroOutputWallet;
    setAmount(amount: bigint): MoneroOutputWallet;
    setIndex(index: number): MoneroOutputWallet;
    setRingOutputIndices(ringOutputIndices: number[]): MoneroOutputWallet;
    setStealthPublicKey(stealthPublicKey: string): MoneroOutputWallet;
}

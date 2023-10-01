/**
 * Monero subaddress model.
 */
export default class MoneroSubaddress {
    accountIndex: number;
    index: number;
    address: string;
    label: string;
    balance: bigint;
    unlockedBalance: bigint;
    numUnspentOutputs: number;
    isUsed: boolean;
    numBlocksToUnlock: number;
    constructor(subaddress?: Partial<MoneroSubaddress>);
    toJson(): any;
    getAccountIndex(): number;
    setAccountIndex(accountIndex: number): MoneroSubaddress;
    getIndex(): number;
    setIndex(index: number): MoneroSubaddress;
    getAddress(): string;
    setAddress(address: string): MoneroSubaddress;
    getLabel(): string;
    setLabel(label: string): MoneroSubaddress;
    getBalance(): bigint;
    setBalance(balance: bigint): MoneroSubaddress;
    getUnlockedBalance(): bigint;
    setUnlockedBalance(unlockedBalance: bigint): MoneroSubaddress;
    getNumUnspentOutputs(): number;
    setNumUnspentOutputs(numUnspentOutputs: number): MoneroSubaddress;
    getIsUsed(): boolean;
    setIsUsed(isUsed: boolean): MoneroSubaddress;
    getNumBlocksToUnlock(): number;
    setNumBlocksToUnlock(numBlocksToUnlock: number): MoneroSubaddress;
    toString(indent?: number): string;
}

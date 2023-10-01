import MoneroSubaddress from "./MoneroSubaddress";
/**
 * Monero account model.
 */
export default class MoneroAccount {
    index: number;
    primaryAddress: string;
    balance: bigint;
    unlockedBalance: bigint;
    label: string;
    tag: string;
    subaddresses: MoneroSubaddress[];
    constructor(account?: Partial<MoneroAccount>);
    toJson(): any;
    getIndex(): number;
    setIndex(index: number): MoneroAccount;
    getPrimaryAddress(): string;
    setPrimaryAddress(primaryAddress: string): MoneroAccount;
    getBalance(): bigint;
    setBalance(balance: bigint): MoneroAccount;
    getUnlockedBalance(): bigint;
    setUnlockedBalance(unlockedBalance: bigint): MoneroAccount;
    getLabel(): string;
    setLabel(label: string): MoneroAccount;
    getTag(): string;
    setTag(tag: string): MoneroAccount;
    getSubaddresses(): MoneroSubaddress[];
    setSubaddresses(subaddresses: MoneroSubaddress[]): MoneroAccount;
    toString(indent?: number): string;
}

export = MoneroAccount;
/**
 * Monero account model.
 */
declare class MoneroAccount {
    constructor(stateOrIndex: any, primaryAddress: any, balance: any, unlockedBalance: any, subaddresses: any);
    state: any;
    toJson(): any;
    getIndex(): any;
    setIndex(index: any): this;
    getPrimaryAddress(): any;
    setPrimaryAddress(primaryAddress: any): this;
    getBalance(): any;
    setBalance(balance: any): this;
    getUnlockedBalance(): any;
    setUnlockedBalance(unlockedBalance: any): this;
    getTag(): any;
    setTag(tag: any): this;
    getSubaddresses(): any;
    setSubaddresses(subaddresses: any): this;
    toString(indent?: number): string;
}

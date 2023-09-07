export = MoneroAccountTag;
/**
 * Represents an account tag.
 */
declare class MoneroAccountTag {
    constructor(tag: any, label: any, accountIndices: any);
    tag: any;
    label: any;
    accountIndices: any;
    getTag(): any;
    setTag(tag: any): this;
    getLabel(): any;
    setLabel(label: any): this;
    getAccountIndices(): any;
    setAccountIndices(accountIndices: any): this;
    accoutIndices: any;
}

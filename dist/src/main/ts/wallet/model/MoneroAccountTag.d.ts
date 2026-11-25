/**
 * Represents an account tag.
 */
export default class MoneroAccountTag {
    tag: string;
    label: string;
    accountIndices: number[];
    constructor(accountTag?: Partial<MoneroAccountTag>);
    toJson(): any;
    getTag(): string;
    setTag(tag: string): MoneroAccountTag;
    getLabel(): string;
    setLabel(label: string): MoneroAccountTag;
    getAccountIndices(): number[];
    setAccountIndices(accountIndices: number[]): MoneroAccountTag;
}

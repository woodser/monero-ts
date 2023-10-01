/**
 * Models a Monero key image.
 */
export default class MoneroKeyImage {
    hex: string;
    signature: string;
    /**
     * Construct the model.
     *
     * @param {string|Partial<MoneroKeyImage>} [keyImageOrHex] is a MoneroKeyImage or hex string to initialize from (optional)
     * @param {string} [signature] is the key image's signature
     */
    constructor(hexOrKeyImage?: string | Partial<MoneroKeyImage>, signature?: string);
    getHex(): string;
    setHex(hex: string): MoneroKeyImage;
    getSignature(): string;
    setSignature(signature: string): MoneroKeyImage;
    copy(): MoneroKeyImage;
    toJson(): {} & this;
    merge(keyImage: MoneroKeyImage): MoneroKeyImage;
    toString(indent?: number): string;
}

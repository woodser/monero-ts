/**
 * Exception when interacting with a Monero wallet or daemon.
 */
export default class MoneroError extends Error {
    code: number;
    /**
     * Constructs the error.
     *
     * @param {string} message is a human-readable message of the error
     * @param {number} [code] is the error code (optional)
     */
    constructor(message: any, code?: any);
    getCode(): number;
    toString(): string;
}

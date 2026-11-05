/**
 * Exception when interacting with a Monero wallet or daemon.
 */
export default class MoneroError extends Error {
    code: number;
    /**
     * Constructs the error.
     *
     * @param {string|Error} message is a human-readable message or the error to wrap
     * @param {number} [code] is the error code (optional)
     */
    constructor(message: any, code?: any);
    getCode(): number;
    toString(): string;
}

export = MoneroError;
/**
 * Exception when interacting with a Monero wallet or daemon.
 */
declare class MoneroError extends Error {
    /**
     * Constructs the error.
     *
     * @param {string} message is a human-readable message of the error
     * @param {int} code is the error code (optional)
     */
    constructor(message: string, code: int);
    code: int;
    getCode(): int;
}

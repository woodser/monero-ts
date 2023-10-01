import MoneroError from "./MoneroError";
/**
 * Error when interacting with Monero RPC.
 */
export default class MoneroRpcError extends MoneroError {
    protected rpcMethod: any;
    protected rpcParams: any;
    /**
     * Constructs the error.
     *
     * @param {string} rpcDescription is a description of the error from rpc
     * @param {number} rpcCode is the error code from rpc
     * @param {string} [rpcMethod] is the rpc method invoked
     * @param {object} [rpcParams] are parameters sent with the rpc request
     */
    constructor(rpcDescription: any, rpcCode: any, rpcMethod?: any, rpcParams?: any);
    getRpcMethod(): any;
    getRpcParams(): any;
    toString(): string;
}

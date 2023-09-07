export = ConnectionType;
/**
 * Enumerates connection types.
 *
 * Based on enums.h in monero-project.
 *
 * @hideconstructor
 */
declare class ConnectionType {
    /**
     * Asserts that the given connection type is valid.
     */
    static validate(type: any): void;
    /**
     * Indicates if the given connection type is valid or not.
     */
    static isValid(type: any): true | 3;
}
declare namespace ConnectionType {
    let INVALID: number;
    let IPV4: number;
    let IPV6: number;
    let TOR: number;
    let I2P: number;
}

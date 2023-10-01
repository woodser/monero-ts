/**
 * Enumerates connection types.
 *
 * Based on enums.h in monero-project.
 */
declare enum ConnectionType {
    /**
     * Invalid connection type (value=0).
     */
    INVALID = 0,
    /**
     * IPV4 connection type (value=1).
     */
    IPV4 = 1,
    /**
     * IPV6 connection type (value=2).
     */
    IPV6 = 2,
    /**
     * TOR connection type (value=3).
     */
    TOR = 3,
    /**
     * I2P connection type (value=4).
     */
    I2P = 4
}
export default ConnectionType;

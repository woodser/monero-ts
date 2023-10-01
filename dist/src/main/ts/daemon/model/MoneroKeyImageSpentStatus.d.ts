/**
 * Enumerates connection types.
 *
 * Based on enums.h in monero-project.
 */
declare enum MoneroKeyImageSpentStatus {
    /**
     * Key image is not spent (value=0).
     */
    NOT_SPENT = 0,
    /**
     * Key image is confirmed (value=1).
     */
    CONFIRMED = 1,
    /**
     * Key image is in the pool (value=2).
     */
    TX_POOL = 2
}
export default MoneroKeyImageSpentStatus;

/**
 * Enumerates send priorities.
 */
declare enum MoneroTxPriority {
    /**
     * Default priority (i.e. normal) (value=0).
     */
    DEFAULT = 0,
    /**
     * Unimportant priority (value=1).
     */
    UNIMPORTANT = 1,
    /**
     * Normal priority (value=2).
     */
    NORMAL = 2,
    /**
     * Elevated priority (value=3).
     */
    ELEVATED = 3
}
export default MoneroTxPriority;

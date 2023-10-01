/**
 * Enumerate message signature types.
 */
declare enum MoneroMessageSignatureType {
    /**
     * Sign with spend key (value=0).
     */
    SIGN_WITH_SPEND_KEY = 0,
    /**
     * Sign with the view key (value=1).
     */
    SIGN_WITH_VIEW_KEY = 1
}
export default MoneroMessageSignatureType;

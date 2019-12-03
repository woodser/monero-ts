/**
 * Defines the Monero network types (mainnet, testnet, and stagenet).
 */
MoneroNetworkType = {
    
    /**
     * Enumerates the network types.
     */
    MAINNET: 0,
    TESTNET: 1,
    STAGENET: 2,
    
    /**
     * Asserts that the given network type is valid.
     */
    validate: function(networkType) {
      assert(networkType === 0 || networkType === 1 || networkType === 2, "Network type is invalid: " + networkType);
    },
    
    /**
     * Indicates if the given network type is valid or not.
     */
    isValid: function(networkType) {
      return networkType === 0 || networkType === 1 || networkType === 2;
    }
}

module.exports = MoneroNetworkType;
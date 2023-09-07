export = MoneroOutputHistogramEntry;
/**
 * Entry in a Monero output histogram (see get_output_histogram of Daemon RPC documentation).
 */
declare class MoneroOutputHistogramEntry {
    constructor(state: any);
    state: any;
    toJson(): any;
    getAmount(): any;
    setAmount(amount: any): this;
    getNumInstances(): any;
    setNumInstances(numInstances: any): this;
    getNumUnlockedInstances(): any;
    setNumUnlockedInstances(numUnlockedInstances: any): this;
    getNumRecentInstances(): any;
    setNumRecentInstances(numRecentInstances: any): this;
}

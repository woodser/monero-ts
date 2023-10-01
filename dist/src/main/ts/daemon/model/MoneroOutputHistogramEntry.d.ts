/**
 * Entry in a Monero output histogram (see get_output_histogram of Daemon RPC documentation).
 */
export default class MoneroOutputHistogramEntry {
    amount: bigint;
    numInstances: number;
    numUnlockedInstances: number;
    numRecentInstances: number;
    constructor(entry?: MoneroOutputHistogramEntry);
    toJson(): any;
    getAmount(): bigint;
    setAmount(amount: bigint): MoneroOutputHistogramEntry;
    getNumInstances(): number;
    setNumInstances(numInstances: number): MoneroOutputHistogramEntry;
    getNumUnlockedInstances(): number;
    setNumUnlockedInstances(numUnlockedInstances: number): this;
    getNumRecentInstances(): number;
    setNumRecentInstances(numRecentInstances: number): MoneroOutputHistogramEntry;
}

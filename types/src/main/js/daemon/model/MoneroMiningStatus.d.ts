export = MoneroMiningStatus;
/**
 * Models daemon mining status.
 */
declare class MoneroMiningStatus {
    constructor(state: any);
    state: any;
    toJson(): any;
    isActive(): any;
    setIsActive(isActive: any): this;
    getAddress(): any;
    setAddress(address: any): this;
    getSpeed(): any;
    setSpeed(speed: any): this;
    getNumThreads(): any;
    setNumThreads(numThreads: any): this;
    isBackground(): any;
    setIsBackground(isBackground: any): this;
}

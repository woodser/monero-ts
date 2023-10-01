/**
 * Models daemon mining status.
 */
export default class MoneroMiningStatus {
    isActive: boolean;
    address: string;
    speed: number;
    numThreads: number;
    isBackground: boolean;
    constructor(status?: Partial<MoneroMiningStatus>);
    toJson(): {} & this;
    getIsActive(): boolean;
    setIsActive(isActive: boolean): MoneroMiningStatus;
    getAddress(): string;
    setAddress(address: string): MoneroMiningStatus;
    getSpeed(): number;
    setSpeed(speed: number): MoneroMiningStatus;
    getNumThreads(): number;
    setNumThreads(numThreads: number): MoneroMiningStatus;
    getIsBackground(): boolean;
    setIsBackground(isBackground: boolean): MoneroMiningStatus;
}

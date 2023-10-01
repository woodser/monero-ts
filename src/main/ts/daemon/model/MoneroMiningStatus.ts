/**
 * Models daemon mining status.
 */
export default class MoneroMiningStatus {

  isActive: boolean;
  address: string;
  speed: number;
  numThreads: number;
  isBackground: boolean;
  
  constructor(status?: Partial<MoneroMiningStatus>) {
    Object.assign(this, status);
  }
  
  toJson() {
    return Object.assign({}, this);
  }
  
  getIsActive(): boolean {
    return this.isActive;
  }
  
  setIsActive(isActive: boolean): MoneroMiningStatus {
    this.isActive = isActive;
    return this;
  }
  
  getAddress(): string {
    return this.address;
  }
  
  setAddress(address: string): MoneroMiningStatus {
    this.address = address;
    return this;
  }
  
  getSpeed(): number {
    return this.speed;
  }
  
  setSpeed(speed: number): MoneroMiningStatus {
    this.speed = speed;
    return this;
  }
  
  getNumThreads(): number {
    return this.numThreads;
  }
  
  setNumThreads(numThreads: number): MoneroMiningStatus {
    this.numThreads = numThreads;
    return this;
  }
  
  getIsBackground(): boolean {
    return this.isBackground;
  }
  
  setIsBackground(isBackground: boolean): MoneroMiningStatus {
    this.isBackground = isBackground;
    return this;
  }
}

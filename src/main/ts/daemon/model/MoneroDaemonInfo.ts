/**
 * Monero daemon info.
 */
export default class MoneroDaemonInfo {

  version: string;
  numAltBlocks: number;
  blockSizeLimit: number;
  blockSizeMedian: number;
  blockWeightLimit: number;
  blockWeightMedian: number;
  bootstrapDaemonAddress: string;
  difficulty: bigint;
  cumulativeDifficulty: bigint;
  freeSpace: bigint;
  numOfflinePeers: number;
  numOnlinePeers: number;
  height: number;
  heightWithoutBootstrap: number;
  networkType: string;
  isOffline: boolean;
  numIncomingConnections: number;
  numOutgoingConnections: number;
  numRpcConnections: number;
  startTimestamp: number;
  adjustedTimestamp: number;
  target: number;
  targetHeight: number;
  topBlockHash: string;
  numTxs: number;
  numTxsPool: number;
  wasBootstrapEverUsed: boolean;
  databaseSize: number;
  updateAvailable: boolean;
  credits: bigint;
  isBusySyncing: boolean;
  isSynchronized: boolean;
  isRestricted: boolean;
  
  constructor(info?: Partial<MoneroDaemonInfo>) {
    Object.assign(this, info);

    // deserialize bigints
    if (this.difficulty !== undefined && typeof this.difficulty !== "bigint") this.difficulty = BigInt(this.difficulty);
    if (this.cumulativeDifficulty !== undefined && typeof this.cumulativeDifficulty !== "bigint") this.cumulativeDifficulty = BigInt(this.cumulativeDifficulty);
    if (this.credits !== undefined && typeof this.credits !== "bigint") this.credits = BigInt(this.credits);
  }
  
  toJson(): any {
    let json: any = Object.assign([], this);
    if (json.difficulty !== undefined) json.difficulty = json.difficulty.toString();
    if (json.cumulativeDifficulty !== undefined) json.cumulativeDifficulty = json.cumulativeDifficulty.toString();
    if (json.credits !== undefined) json.credits = json.credits.toString();
    return json;
  }
  
  getVersion(): string {
    return this.version;
  }
  
  setVersion(version: string): MoneroDaemonInfo {
    this.version = version;
    return this;
  }
  
  getNumAltBlocks(): number {
    return this.numAltBlocks;
  }
  
  setNumAltBlocks(numAltBlocks: number): MoneroDaemonInfo {
    this.numAltBlocks = numAltBlocks;
    return this;
  }
  
  getBlockSizeLimit(): number {
    return this.blockSizeLimit;
  }
  
  setBlockSizeLimit(blockSizeLimit: number): MoneroDaemonInfo {
    this.blockSizeLimit = blockSizeLimit;
    return this;
  }
  
  getBlockSizeMedian(): number {
    return this.blockSizeMedian;
  }
  
  setBlockSizeMedian(blockSizeMedian: number): MoneroDaemonInfo {
    this.blockSizeMedian = blockSizeMedian;
    return this;
  }
  
  getBlockWeightLimit(): number {
    return this.blockWeightLimit;
  }
  
  setBlockWeightLimit(blockWeightLimit: number): MoneroDaemonInfo {
    this.blockWeightLimit = blockWeightLimit;
    return this;
  }
  
  getBlockWeightMedian(): number {
    return this.blockWeightMedian;
  }
  
  setBlockWeightMedian(blockWeightMedian: number): MoneroDaemonInfo {
    this.blockWeightMedian = blockWeightMedian;
    return this;
  }
  
  getBootstrapDaemonAddress(): string {
    return this.bootstrapDaemonAddress;
  }
  
  setBootstrapDaemonAddress(bootstrapDaemonAddress): MoneroDaemonInfo {
    this.bootstrapDaemonAddress = bootstrapDaemonAddress;
    return this;
  }
  
  getDifficulty(): bigint {
    return this.difficulty;
  }
  
  setDifficulty(difficulty: bigint): MoneroDaemonInfo {
    this.difficulty = difficulty;
    return this;
  }
  
  getCumulativeDifficulty(): bigint {
    return this.cumulativeDifficulty;
  }
  
  setCumulativeDifficulty(cumulativeDifficulty: bigint): MoneroDaemonInfo {
    this.cumulativeDifficulty = cumulativeDifficulty;
    return this;
  }
  
  getFreeSpace(): bigint {
    return this.freeSpace;
  }
  
  setFreeSpace(freeSpace: bigint): MoneroDaemonInfo {
    this.freeSpace = freeSpace;
    return this;
  }
  
  getNumOfflinePeers(): number {
    return this.numOfflinePeers;
  }
  
  setNumOfflinePeers(numOfflinePeers: number): MoneroDaemonInfo {
    this.numOfflinePeers = numOfflinePeers;
    return this;
  }
  
  getNumOnlinePeers(): number {
    return this.numOnlinePeers;
  }
  
  setNumOnlinePeers(numOnlinePeers: number): MoneroDaemonInfo {
    this.numOnlinePeers = numOnlinePeers;
    return this;
  }
  
  getHeight(): number {
    return this.height;
  }
  
  setHeight(height: number): MoneroDaemonInfo {
    this.height = height;
    return this;
  }
  
  getHeightWithoutBootstrap(): number {
    return this.heightWithoutBootstrap;
  }
  
  setHeightWithoutBootstrap(heightWithoutBootstrap: number): MoneroDaemonInfo {
    this.heightWithoutBootstrap = heightWithoutBootstrap;
    return this;
  }
  
  getNetworkType(): string {
    return this.networkType;
  }

  setNetworkType(networkType: string) {
    this.networkType = networkType;
    return this;
  }

  getIsOffline(): boolean {
    return this.isOffline;
  }
  
  setIsOffline(isOffline: boolean): MoneroDaemonInfo {
    this.isOffline = isOffline;
    return this;
  }
  
  getNumIncomingConnections(): number {
    return this.numIncomingConnections;
  }
  
  setNumIncomingConnections(numIncomingConnections: number): MoneroDaemonInfo {
    this.numIncomingConnections = numIncomingConnections;
    return this;
  }
  
  getNumOutgoingConnections(): number {
    return this.numOutgoingConnections;
  }
  
  setNumOutgoingConnections(numOutgoingConnections: number): MoneroDaemonInfo {
    this.numOutgoingConnections = numOutgoingConnections;
    return this;
  }
  
  getNumRpcConnections(): number {
    return this.numRpcConnections;
  }
  
  setNumRpcConnections(numRpcConnections: number): MoneroDaemonInfo {
    this.numRpcConnections = numRpcConnections;
    return this;
  }
  
  getStartTimestamp(): number {
    return this.startTimestamp;
  }
  
  setStartTimestamp(startTimestamp: number): MoneroDaemonInfo {
    this.startTimestamp = startTimestamp;
    return this;
  }
  
  getAdjustedTimestamp(): number {
    return this.adjustedTimestamp;
  }
  
  setAdjustedTimestamp(adjustedTimestamp: number): MoneroDaemonInfo {
    this.adjustedTimestamp = adjustedTimestamp;
    return this;
  }
  
  getTarget(): number {
    return this.target;
  }
  
  setTarget(target: number): MoneroDaemonInfo {
    this.target = target;
    return this;
  }
  
  getTargetHeight(): number {
    return this.targetHeight;
  }
  
  setTargetHeight(targetHeight: number): MoneroDaemonInfo {
    this.targetHeight = targetHeight;
    return this;
  }
  
  getTopBlockHash(): string {
    return this.topBlockHash;
  }
  
  setTopBlockHash(topBlockHash): MoneroDaemonInfo {
    this.topBlockHash = topBlockHash;
    return this;
  }
  
  getNumTxs(): number {
    return this.numTxs;
  }
  
  setNumTxs(numTxs: number): MoneroDaemonInfo {
    this.numTxs = numTxs;
    return this;
  }
  
  getNumTxsPool(): number {
    return this.numTxsPool;
  }
  
  setNumTxsPool(numTxsPool): MoneroDaemonInfo {
    this.numTxsPool = numTxsPool;
    return this;
  }
  
  getWasBootstrapEverUsed(): boolean {
    return this.wasBootstrapEverUsed;
  }
  
  setWasBootstrapEverUsed(wasBootstrapEverUsed): MoneroDaemonInfo {
    this.wasBootstrapEverUsed = wasBootstrapEverUsed;
    return this;
  }
  
  getDatabaseSize(): number {
    return this.databaseSize;
  }
  
  setDatabaseSize(databaseSize: number): MoneroDaemonInfo {
    this.databaseSize = databaseSize;
    return this;
  }
  
  getUpdateAvailable(): boolean {
    return this.updateAvailable;
  }
  
  setUpdateAvailable(updateAvailable: boolean): MoneroDaemonInfo {
    this.updateAvailable = updateAvailable;
    return this;
  }
  
  getCredits(): bigint {
    return this.credits;
  }
  
  setCredits(credits: bigint): MoneroDaemonInfo {
    this.credits = credits;
    return this;
  }
  
  getIsBusySyncing(): boolean {
    return this.isBusySyncing;
  }
  
  setIsBusySyncing(isBusySyncing: boolean): MoneroDaemonInfo {
    this.isBusySyncing = isBusySyncing;
    return this;
  }
  
  getIsSynchronized(): boolean {
    return this.isSynchronized;
  }
  
  setIsSynchronized(isSynchronized: boolean): MoneroDaemonInfo {
    this.isSynchronized = isSynchronized;
    return this;
  }
  
  getIsRestricted(): boolean {
    return this.isRestricted;
  }
  
  setIsRestricted(isRestricted: boolean): MoneroDaemonInfo {
    this.isRestricted = isRestricted;
    return this;
  }
}

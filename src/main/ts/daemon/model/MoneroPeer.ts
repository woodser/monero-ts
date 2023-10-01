import ConnectionType from "./ConnectionType";

/**
 * Models a peer to the daemon.
 */
export default class MoneroPeer {

  id: string;
  address: string;
  host: string;
  port: number;
  isOnline: boolean;
  lastSeenTimestamp: number;
  pruningSeed: number;
  rpcPort: number;
  rpcCreditsPerHash: bigint;
  avgDownload: number;
  avgUpload: number;
  currentDownload: number;
  currentUpload: number;
  height: number;
  isIncoming: boolean;
  liveTime: number;
  isLocalIp: boolean;
  isLocalHost: boolean;
  numReceives: number;
  numSends: number;
  receiveIdleTime: number;
  sendIdleTime: number;
  state: string;
  numSupportFlags: number;
  type: ConnectionType;
  
  constructor(peer?: MoneroPeer) {
    Object.assign(this, peer);
    if (this.rpcCreditsPerHash !== undefined && typeof this.rpcCreditsPerHash !== "bigint") this.rpcCreditsPerHash = BigInt(this.rpcCreditsPerHash);
  }
  
  toJson(): any {
    let json: any = Object.assign({}, this);
    if (json.rpcCreditsPerHash !== undefined) json.rpcCreditsPerHash = json.rpcCreditsPerHash.toString();
    return json;
  }
  
  getId(): string {
    return this.id;
  }

  setId(id: string): MoneroPeer {
    this.id = id;
    return this;
  }

  getAddress(): string {
    return this.address;
  }

  setAddress(address: string): MoneroPeer {
    this.address = address;
    return this;
  }

  getHost(): string {
    return this.host;
  }

  setHost(host: string): MoneroPeer {
    this.host = host;
    return this;
  }

  getPort(): number {
    return this.port;
  }

  setPort(port: number): MoneroPeer {
    this.port = port;
    return this;
  }
  
  /**
   * Indicates if the peer was online when last checked (aka "white listed" as
   * opposed to "gray listed").
   * 
   * @return {boolean} true if peer was online when last checked, false otherwise
   */
  getIsOnline(): boolean {
    return this.isOnline;
  }
  
  setIsOnline(isOnline: boolean): MoneroPeer {
    this.isOnline = isOnline;
    return this;
  }
  
  getLastSeenTimestamp(): number {
    return this.lastSeenTimestamp;
  }
  
  setLastSeenTimestamp(lastSeenTimestamp: number): MoneroPeer {
    this.lastSeenTimestamp = lastSeenTimestamp;
    return this;
  }
  
  getPruningSeed(): number {
    return this.pruningSeed;
  }
  
  setPruningSeed(pruningSeed: number): MoneroPeer {
    this.pruningSeed = pruningSeed;
    return this;
  }
  
  getRpcPort(): number {
    return this.rpcPort;
  }

  setRpcPort(rpcPort: number): MoneroPeer {
    this.rpcPort = rpcPort;
    return this;
  }
  
  getRpcCreditsPerHash(): bigint {
    return this.rpcCreditsPerHash;
  }
  
  setRpcCreditsPerHash(rpcCreditsPerHash: bigint): MoneroPeer {
    this.rpcCreditsPerHash = rpcCreditsPerHash;
    return this;
  }
  
  getAvgDownload(): number {
    return this.avgDownload;
  }

  setAvgDownload(avgDownload: number): MoneroPeer {
    this.avgDownload = avgDownload;
    return this;
  }

  getAvgUpload(): number {
    return this.avgUpload;
  }

  setAvgUpload(avgUpload: number): MoneroPeer {
    this.avgUpload = avgUpload;
    return this;
  }

  getCurrentDownload(): number {
    return this.currentDownload;
  }

  setCurrentDownload(currentDownload: number): MoneroPeer {
    this.currentDownload = currentDownload;
    return this;
  }

  getCurrentUpload(): number {
    return this.currentUpload;
  }

  setCurrentUpload(currentUpload: number): MoneroPeer {
    this.currentUpload = currentUpload;
    return this;
  }

  getHeight(): number {
    return this.height;
  }

  setHeight(height: number): MoneroPeer {
    this.height = height;
    return this;
  }

  getIsIncoming(): boolean {
    return this.isIncoming;
  }

  setIsIncoming(isIncoming: boolean): MoneroPeer {
    this.isIncoming = isIncoming;
    return this;
  }

  getLiveTime(): number {
    return this.liveTime;
  }

  setLiveTime(liveTime: number) {
    this.liveTime = liveTime;
    return this;
  }

  getIsLocalIp(): boolean {
    return this.isLocalIp;
  }

  setIsLocalIp(isLocalIp: boolean): MoneroPeer {
    this.isLocalIp = isLocalIp;
    return this;
  }

  getIsLocalHost(): boolean {
    return this.isLocalHost;
  }

  setIsLocalHost(isLocalHost: boolean): MoneroPeer {
    this.isLocalHost = isLocalHost;
    return this;
  }

  getNumReceives(): number {
    return this.numReceives;
  }

  setNumReceives(numReceives: number): MoneroPeer {
    this.numReceives = numReceives;
    return this;
  }

  getNumSends(): number {
    return this.numSends;
  }

  setNumSends(numSends: number): MoneroPeer {
    this.numSends = numSends;
    return this;
  }

  getReceiveIdleTime(): number {
    return this.receiveIdleTime;
  }

  setReceiveIdleTime(receiveIdleTime: number): MoneroPeer {
    this.receiveIdleTime = receiveIdleTime;
    return this;
  }

  getSendIdleTime(): number {
    return this.sendIdleTime;
  }

  setSendIdleTime(sendIdleTime: number): MoneroPeer {
    this.sendIdleTime = sendIdleTime;
    return this;
  }

  getState(): string {
    return this.state;
  }

  setState(state: string): MoneroPeer {
    this.state = state;
    return this;
  }

  getNumSupportFlags(): number {
    return this.numSupportFlags;
  }

  setNumSupportFlags(numSupportFlags: number): MoneroPeer {
    this.numSupportFlags = numSupportFlags;
    return this;
  }
  
  getType(): ConnectionType {
    return this.type;
  }
  
  setType(type: ConnectionType): MoneroPeer {
    this.type = type;
    return this;
  }
}

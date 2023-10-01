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
    constructor(peer?: MoneroPeer);
    toJson(): any;
    getId(): string;
    setId(id: string): MoneroPeer;
    getAddress(): string;
    setAddress(address: string): MoneroPeer;
    getHost(): string;
    setHost(host: string): MoneroPeer;
    getPort(): number;
    setPort(port: number): MoneroPeer;
    /**
     * Indicates if the peer was online when last checked (aka "white listed" as
     * opposed to "gray listed").
     *
     * @return {boolean} true if peer was online when last checked, false otherwise
     */
    getIsOnline(): boolean;
    setIsOnline(isOnline: boolean): MoneroPeer;
    getLastSeenTimestamp(): number;
    setLastSeenTimestamp(lastSeenTimestamp: number): MoneroPeer;
    getPruningSeed(): number;
    setPruningSeed(pruningSeed: number): MoneroPeer;
    getRpcPort(): number;
    setRpcPort(rpcPort: number): MoneroPeer;
    getRpcCreditsPerHash(): bigint;
    setRpcCreditsPerHash(rpcCreditsPerHash: bigint): MoneroPeer;
    getAvgDownload(): number;
    setAvgDownload(avgDownload: number): MoneroPeer;
    getAvgUpload(): number;
    setAvgUpload(avgUpload: number): MoneroPeer;
    getCurrentDownload(): number;
    setCurrentDownload(currentDownload: number): MoneroPeer;
    getCurrentUpload(): number;
    setCurrentUpload(currentUpload: number): MoneroPeer;
    getHeight(): number;
    setHeight(height: number): MoneroPeer;
    getIsIncoming(): boolean;
    setIsIncoming(isIncoming: boolean): MoneroPeer;
    getLiveTime(): number;
    setLiveTime(liveTime: number): this;
    getIsLocalIp(): boolean;
    setIsLocalIp(isLocalIp: boolean): MoneroPeer;
    getIsLocalHost(): boolean;
    setIsLocalHost(isLocalHost: boolean): MoneroPeer;
    getNumReceives(): number;
    setNumReceives(numReceives: number): MoneroPeer;
    getNumSends(): number;
    setNumSends(numSends: number): MoneroPeer;
    getReceiveIdleTime(): number;
    setReceiveIdleTime(receiveIdleTime: number): MoneroPeer;
    getSendIdleTime(): number;
    setSendIdleTime(sendIdleTime: number): MoneroPeer;
    getState(): string;
    setState(state: string): MoneroPeer;
    getNumSupportFlags(): number;
    setNumSupportFlags(numSupportFlags: number): MoneroPeer;
    getType(): ConnectionType;
    setType(type: ConnectionType): MoneroPeer;
}

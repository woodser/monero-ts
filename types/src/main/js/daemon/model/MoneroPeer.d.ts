export = MoneroPeer;
/**
 * Models a peer to the daemon.
 */
declare class MoneroPeer {
    constructor(state: any);
    state: any;
    toJson(): any;
    getId(): any;
    getId(): any;
    setId(id: any): this;
    setId(id: any): this;
    getAddress(): any;
    setAddress(address: any): this;
    getHost(): any;
    setHost(host: any): this;
    getPort(): any;
    setPort(port: any): this;
    /**
     * Indicates if the peer was online when last checked (aka "white listed" as
     * opposed to "gray listed").
     *
     * @return {boolean} true if peer was online when last checked, false otherwise
     */
    isOnline(): boolean;
    setIsOnline(isOnline: any): this;
    getLastSeenTimestamp(): any;
    setLastSeenTimestamp(lastSeenTimestamp: any): this;
    getPruningSeed(): any;
    setPruningSeed(pruningSeed: any): this;
    getRpcPort(): any;
    setRpcPort(rpcPort: any): this;
    getRpcCreditsPerHash(): any;
    setRpcCreditsPerHash(rpcCreditsPerHash: any): this;
    getAvgDownload(): any;
    setAvgDownload(avgDownload: any): this;
    getAvgUpload(): any;
    setAvgUpload(avgUpload: any): this;
    getCurrentDownload(): any;
    setCurrentDownload(currentDownload: any): this;
    getCurrentUpload(): any;
    setCurrentUpload(currentUpload: any): this;
    getHeight(): any;
    setHeight(height: any): this;
    isIncoming(): any;
    setIsIncoming(isIncoming: any): this;
    getLiveTime(): any;
    setLiveTime(liveTime: any): this;
    isLocalIp(): any;
    setIsLocalIp(isLocalIp: any): this;
    isLocalHost(): any;
    setIsLocalHost(isLocalHost: any): this;
    getNumReceives(): any;
    setNumReceives(numReceives: any): this;
    getNumSends(): any;
    setNumSends(numSends: any): this;
    getReceiveIdleTime(): any;
    setReceiveIdleTime(receiveIdleTime: any): this;
    getSendIdleTime(): any;
    setSendIdleTime(sendIdleTime: any): this;
    getState(): any;
    setState(state: any): this;
    getNumSupportFlags(): any;
    setNumSupportFlags(numSupportFlags: any): this;
    getType(): any;
    setType(type: any): this;
}

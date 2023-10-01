import MoneroConnectionSpan from "./MoneroConnectionSpan";
import MoneroPeer from "./MoneroPeer";

/**
 * Models daemon synchronization information.
 */
export default class MoneroDaemonSyncInfo {

  height: number;
  peers: MoneroPeer[];
  spans: MoneroConnectionSpan[];
  targetHeight: number;
  nextNeededPruningSeed: number;
  overview: string;
  credits: bigint;
  topBlockHash: string;
  
  constructor(info?: Partial<MoneroDaemonSyncInfo>) {
    Object.assign(this, info);

    // deserialize bigints
    if (this.credits !== undefined && typeof this.credits !== "bigint") this.credits = BigInt(this.credits);
    
    // copy peers
    if (this.peers) {
      for (let i = 0; i < this.peers.length; i++) {
        this.peers[i] = new MoneroPeer(this.peers[i]);
      }
    }

    // copy spans
    if (this.spans) {
      for (let i = 0; i < this.spans.length; i++) {
        this.spans[i] = new MoneroConnectionSpan(this.spans[i]);
      }
    }
  }
  
  toJson() {
    let json: any = Object.assign({}, this);
    if (json.peers !== undefined) {
      for (let i = 0; i < json.peers.length; i++) {
        json.peers[i] = json.peers[i].toJson();
      }
    }
    if (json.spans !== undefined) {
      for (let i = 0; i < json.spans.length; i++) {
        json.spans[i] = json.spans[i].toJson();
      }
    }
    if (json.credits !== undefined) json.credits = json.credits.toString();
    return json;
  }
  
  getHeight(): number {
    return this.height;
  }
  
  setHeight(height: number): MoneroDaemonSyncInfo {
    this.height = height;
    return this;
  }
  
  getPeers(): MoneroPeer[] {
    return this.peers;
  }
  
  setPeers(peers: MoneroPeer[]): MoneroDaemonSyncInfo {
    this.peers = peers;
    return this;
  }
  
  getSpans(): MoneroConnectionSpan[] {
    return this.spans;
  }
  
  setSpans(spans: MoneroConnectionSpan[]): MoneroDaemonSyncInfo {
    this.spans = spans;
    return this;
  }
  
  getTargetHeight(): number {
    return this.targetHeight;
  }
  
  setTargetHeight(targetHeight: number): MoneroDaemonSyncInfo {
    this.targetHeight = targetHeight;
    return this;
  }
  
  getNextNeededPruningSeed(): number {
    return this.nextNeededPruningSeed;
  }
  
  setNextNeededPruningSeed(nextNeededPruningSeed: number): MoneroDaemonSyncInfo {
    this.nextNeededPruningSeed = nextNeededPruningSeed;
    return this;
  }
  
  getOverview(): string {
    return this.overview;
  }
  
  setOverview(overview: string): MoneroDaemonSyncInfo {
    this.overview = overview;
    return this;
  }
  
  getCredits(): bigint {
    return this.credits;
  }
  
  setCredits(credits: bigint): MoneroDaemonSyncInfo {
    this.credits = credits;
    return this;
  }
  
  getTopBlockHash(): string {
    return this.topBlockHash;
  }
  
  setTopBlockHash(topBlockHash: string): MoneroDaemonSyncInfo {
    this.topBlockHash = topBlockHash;
    return this;
  }
}

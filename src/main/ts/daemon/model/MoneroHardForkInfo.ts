/**
 * Monero hard fork info.
 */
export default class MoneroHardForkInfo {

  earliestHeight: number;
  isEnabled: boolean;
  state: string;
  threshold: number;
  version: number;
  numVotes: number;
  window: number;
  voting: number;
  credits: bigint;
  topBlockHash: string;

  constructor(info?: Partial<MoneroHardForkInfo>) {
    Object.assign(this, info);
    if (this.credits !== undefined && typeof this.credits !== "bigint") this.credits = BigInt(this.credits);
  }
  
  toJson(): any {
    let json: any = Object.assign({}, this);
    if (json.credits !== undefined) json.credits = json.credits.toString();
    return json;
  }
  
  getEarliestHeight(): number {
    return this.earliestHeight;
  }

  setEarliestHeight(earliestHeight: number): MoneroHardForkInfo {
    this.earliestHeight = earliestHeight;
    return this;
  }

  getIsEnabled(): boolean {
    return this.isEnabled;
  }

  setIsEnabled(isEnabled: boolean): MoneroHardForkInfo {
    this.isEnabled = isEnabled;
    return this;
  }

  getState(): string {
    return this.state;
  }

  setState(state: string): MoneroHardForkInfo {
    this.state = state;
    return this;
  }

  getThreshold(): number {
    return this.threshold;
  }

  setThreshold(threshold: number): MoneroHardForkInfo {
    this.threshold = threshold;
    return this;
  }

  getVersion(): number {
    return this.version;
  }

  setVersion(version: number): MoneroHardForkInfo {
    this.version = version;
    return this;
  }

  getNumVotes(): number {
    return this.numVotes;
  }

  setNumVotes(numVotes: number): MoneroHardForkInfo {
    this.numVotes = numVotes;
    return this;
  }

  getWindow(): number {
    return this.window;
  }

  setWindow(window: number): MoneroHardForkInfo {
    this.window = window;
    return this;
  }

  getVoting(): number {
    return this.voting;
  }

  setVoting(voting: number): MoneroHardForkInfo {
    this.voting = voting;
    return this;
  }
  
  getCredits(): bigint{
    return this.credits;
  }
  
  setCredits(credits: bigint): MoneroHardForkInfo {
    this.credits = credits;
    return this;
  }
  
  getTopBlockHash(): string {
    return this.topBlockHash;
  }
  
  setTopBlockHash(topBlockHash: string): MoneroHardForkInfo {
    this.topBlockHash = topBlockHash;
    return this;
  }
}

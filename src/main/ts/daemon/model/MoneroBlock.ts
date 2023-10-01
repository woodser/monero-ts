import assert from "assert";
import GenUtils from "../../common/GenUtils";
import MoneroBlockHeader from "./MoneroBlockHeader";
import MoneroTx from "./MoneroTx";
import MoneroTxQuery from "../../wallet/model/MoneroTxQuery";
import MoneroTxWallet from "../../wallet/model/MoneroTxWallet";

/**
 * Enumerates types to deserialize to.
 */
enum DeserializationType {
  TX = 0,
  TX_WALLET = 1,
  TX_QUERY = 2
}

/**
 * Models a Monero block in the blockchain.
 */
export default class MoneroBlock extends MoneroBlockHeader {

  static DeserializationType = DeserializationType;

  hex: string;
  minerTx: MoneroTx;
  txs: MoneroTx[];
  txHashes: string[];

  constructor(block?: Partial<MoneroBlock>, txType?: DeserializationType) {
    super(block);
    
    // copy miner tx
    if (this.minerTx) {
      this.minerTx = this.deserializeTx(this.minerTx, txType).setBlock(this);
    }
    
    // copy non-miner txs
    if (this.txs) {
      this.txs = this.txs.slice();
      for (let i = 0; i < this.txs.length; i++) {
        this.txs[i] = this.deserializeTx(this.txs[i], txType).setBlock(this);
      }
    }
  }

  getHex(): string {
    return this.hex;
  }
  
  setHex(hex: string): MoneroBlock {
    this.hex = hex;
    return this;
  }
  
  getMinerTx(): MoneroTx {
    return this.minerTx;
  }
  
  setMinerTx(minerTx: MoneroTx): MoneroBlock {
    this.minerTx = minerTx;
    return this;
  }
  
  getTxs(): MoneroTx[] {
    return this.txs;
  }
  
  setTxs(txs: MoneroTx[]): MoneroBlock {
    this.txs = txs;
    return this;
  }
  
  getTxHashes(): string[] {
    return this.txHashes;
  }
  
  setTxHashes(txHashes: string[]): MoneroBlock {
    this.txHashes = txHashes;
    return this;
  }
  
  copy(): MoneroBlock {
    return new MoneroBlock(this);
  }
  
  toJson(): any {
    let json = super.toJson();
    if (this.getMinerTx() !== undefined) json.minerTx = this.getMinerTx().toJson();
    if (this.getTxs() !== undefined) {
      json.txs = [];
      for (let tx of this.getTxs()) json.txs.push(tx.toJson());
    }
    return json;
  }
  
  merge(block: MoneroBlock): MoneroBlock {
    assert(block instanceof MoneroBlock);
    if (this === block) return this;
    
    // merge header fields
    super.merge(block);
    
    // merge reconcilable block extensions
    this.setHex(GenUtils.reconcile(this.getHex(), block.getHex()));
    this.setTxHashes(GenUtils.reconcile(this.getTxHashes(), block.getTxHashes()));
    
    // merge miner tx
    if (this.getMinerTx() === undefined) this.setMinerTx(block.getMinerTx());
    if (block.getMinerTx() !== undefined) {
      block.getMinerTx().setBlock(this);
      this.getMinerTx().merge(block.getMinerTx());
    }
    
    // merge non-miner txs
    if (block.getTxs() !== undefined) {
      for (let tx of block.getTxs()) {
        tx.setBlock(this);
        MoneroBlock.mergeTx(this.getTxs(), tx);
      }
    }

    return this;
  }
  
  toString(indent = 0): string {
    let str = super.toString(indent) + "\n";
    str += GenUtils.kvLine("Hex", this.getHex(), indent);
    if (this.getTxs() !== undefined) {
      str += GenUtils.kvLine("Txs", "", indent);
      for (let tx of this.getTxs()) {
        str += tx.toString(indent + 1) + "\n";
      }
    }
    if (this.getMinerTx() !== undefined) {
      str += GenUtils.kvLine("Miner tx", "", indent);
      str += this.getMinerTx().toString(indent + 1) + "\n";
    }
    str += GenUtils.kvLine("Txs hashes", this.getTxHashes(), indent);
    return str[str.length - 1] === "\n" ? str.slice(0, str.length - 1) : str  // strip last newline
  }
  
  // helper to merge txs
  protected static mergeTx(txs, tx) {
    for (let aTx of txs) {
      if (aTx.getHash() === tx.getHash()) {
        aTx.merge(tx);
        return;
      }
    }
    txs.push(tx);
  }

  // -------------------- OVERRIDE COVARIANT RETURN TYPES ---------------------

  setHeight(height: number): MoneroBlock {
    super.setHeight(height);
    return this;
  }
  
  setTimestamp(timestamp: number): MoneroBlock {
    super.setTimestamp(timestamp);
    return this;
  }
  
  setSize(size: number): MoneroBlock {
    super.setSize(size);
    return this;
  }
  
  setWeight(weight: number): MoneroBlock {
    super.setWeight(weight);
    return this;
  }
  
  setLongTermWeight(longTermWeight: number): MoneroBlock {
    super.setLongTermWeight(longTermWeight);
    return this;
  }
  
  setDepth(depth: number): MoneroBlock {
    super.setDepth(depth);
    return this;
  }
  
  setDifficulty(difficulty: bigint): MoneroBlock {
    super.setDifficulty(difficulty);
    return this;
  }
  
  setCumulativeDifficulty(cumulativeDifficulty: bigint): MoneroBlock {
    super.setCumulativeDifficulty(cumulativeDifficulty);
    return this;
  }
  
  setMajorVersion(majorVersion: number): MoneroBlock {
    super.setMajorVersion(majorVersion);
    return this;
  }
  
  setMinorVersion(minorVersion: number): MoneroBlock {
    super.setMinorVersion(minorVersion);
    return this;
  }
  
  setNonce(nonce: number): MoneroBlock {
    super.setNonce(nonce);
    return this;
  }
  
  setMinerTxHash(minerTxHash: string): MoneroBlock {
    super.setMinerTxHash(minerTxHash);
    return this;
  }
  
  setNumTxs(numTxs: number): MoneroBlock {
    super.setNumTxs(numTxs);
    return this;
  }
  
  setOrphanStatus(orphanStatus: boolean): MoneroBlock {
    super.setOrphanStatus(orphanStatus);
    return this;
  }
  
  setPrevHash(prevHash: string): MoneroBlock {
    super.setPrevHash(prevHash);
    return this;
  }
  
  setReward(reward: bigint): MoneroBlock {
    super.setReward(reward);
    return this;
  }
  
  setPowHash(powHash: string): MoneroBlock {
    super.setPowHash(powHash);
    return this;
  }

  protected deserializeTx(tx: any, txType?: DeserializationType): MoneroTx {
    if (txType === undefined) {
      if (!(tx instanceof MoneroTx)) throw new Error("Must provide DeserializationType if tx is not instanceof MoneroTx");
      return tx.copy();
    } else if (txType === MoneroBlock.DeserializationType.TX || txType === undefined) {
      return new MoneroTx(tx);
    } else if (txType === MoneroBlock.DeserializationType.TX_WALLET) {
      return new MoneroTxWallet(tx);
    } else if (txType === MoneroBlock.DeserializationType.TX_QUERY) {
      return new MoneroTxQuery(tx);
    } else {
      throw new Error("Unrecognized tx deserialization type: " + txType);
    }
  }
}

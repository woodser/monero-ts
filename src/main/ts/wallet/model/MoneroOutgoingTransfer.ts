import assert from "assert";
import GenUtils from "../../common/GenUtils";
import MoneroDestination from "./MoneroDestination";
import MoneroTransfer from "./MoneroTransfer";
import MoneroTxWallet from "./MoneroTxWallet";

/**
 * Models an outgoing transfer of funds from the wallet.
 */
export default class MoneroOutgoingTransfer extends MoneroTransfer {

  subaddressIndices: number[];
  addresses: string[];
  destinations: MoneroDestination[];

  /**
   * Construct the model.
   * 
   * @param {MoneroOutgoingTranser [transfer] existing state to initialize from (optional)
   */
  constructor(transfer?: Partial<MoneroOutgoingTransfer>) {
    super(transfer);
    
    // copy destinations
    if (this.destinations) {
      this.destinations = this.destinations.slice();
      for (let i = 0; i < this.destinations.length; i++) {
        this.destinations[i] = new MoneroDestination(this.destinations[i]);
      }
    }
  }
  
  getIsIncoming(): boolean {
    return false;
  }
  
  getSubaddressIndices(): number[] {
    return this.subaddressIndices;
  }

  setSubaddressIndices(subaddressIndices: number[]): MoneroOutgoingTransfer {
    this.subaddressIndices = subaddressIndices;
    return this;
  }
  
  getAddresses(): string[] {
    return this.addresses;
  }

  setAddresses(addresses: string[]): MoneroOutgoingTransfer {
    this.addresses = addresses;
    return this;
  }

  getDestinations(): MoneroDestination[] {
    return this.destinations;
  }
  
  setDestinations(destinations: MoneroDestination[]): MoneroOutgoingTransfer {
    this.destinations = destinations;
    return this;
  }
  
  copy(): MoneroOutgoingTransfer {
    return new MoneroOutgoingTransfer(this);
  }
  
  toJson(): any {
    let json = Object.assign({}, this, super.toJson()); // merge json onto inherited state
    if (this.getDestinations() !== undefined) {
      json.destinations = [];
      for (let destination of this.getDestinations()) json.destinations.push(destination.toJson());
    }
    delete json.tx; // parent tx is not serialized
    return json;
  }
  
  /**
   * Updates this transaction by merging the latest information from the given
   * transaction.
   * 
   * Merging can modify or build references to the transfer given so it
   * should not be re-used or it should be copied before calling this method.
   * 
   * @param transfer is the transfer to merge into this one
   */
  merge(transfer: MoneroOutgoingTransfer): MoneroOutgoingTransfer {
    super.merge(transfer);
    assert(transfer instanceof MoneroOutgoingTransfer);
    if (this === transfer) return this;
    this.setSubaddressIndices(GenUtils.reconcile(this.getSubaddressIndices(), transfer.getSubaddressIndices()));
    this.setAddresses(GenUtils.reconcile(this.getAddresses(), transfer.getAddresses()));
    this.setDestinations(GenUtils.reconcile(this.getDestinations(), transfer.getDestinations()));
    return this;
  }

  toString(indent = 0): string {
    let str = super.toString(indent) + "\n";
    str += GenUtils.kvLine("Subaddress indices", this.getSubaddressIndices(), indent);
    str += GenUtils.kvLine("Addresses", this.getAddresses(), indent);
    if (this.getDestinations() !== undefined) {
      str += GenUtils.kvLine("Destinations", "", indent);
      for (let i = 0; i < this.getDestinations().length; i++) {
        str += GenUtils.kvLine(i + 1, "", indent + 1);
        str += this.getDestinations()[i].toString(indent + 2) + "\n";
      }
    }
    return str.slice(0, str.length - 1);  // strip last newline
  }

  // -------------------- OVERRIDE COVARIANT RETURN TYPES ---------------------

  setTx(tx: MoneroTxWallet): MoneroOutgoingTransfer {
    super.setTx(tx);
    return this;
  }

  setAmount(amount: bigint): MoneroOutgoingTransfer {
    super.setAmount(amount);
    return this;
  }

  setAccountIndex(accountIndex: number): MoneroOutgoingTransfer {
    super.setAccountIndex(accountIndex);
    return this;
  }
}

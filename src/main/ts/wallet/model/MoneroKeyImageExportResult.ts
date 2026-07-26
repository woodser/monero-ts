import MoneroKeyImage from "../../daemon/model/MoneroKeyImage";

/**
 * Models results from exporting signed key images.
 */
export default class MoneroKeyImageExportResult {

  offset: number;
  keyImages: MoneroKeyImage[];

  constructor(result?: Partial<MoneroKeyImageExportResult>) {
    Object.assign(this, result);
    if (this.keyImages) this.keyImages = this.keyImages.map(keyImage => keyImage instanceof MoneroKeyImage ? keyImage : new MoneroKeyImage(keyImage));
  }

  toJson(): any {
    let json: any = Object.assign({}, this);
    if (this.getKeyImages() !== undefined) json.keyImages = this.getKeyImages().map(keyImage => keyImage.toJson());
    return json;
  }

  getOffset(): number {
    return this.offset;
  }

  setOffset(offset: number): MoneroKeyImageExportResult {
    this.offset = offset;
    return this;
  }

  getKeyImages(): MoneroKeyImage[] {
    return this.keyImages;
  }

  setKeyImages(keyImages: MoneroKeyImage[]): MoneroKeyImageExportResult {
    this.keyImages = keyImages;
    return this;
  }
}

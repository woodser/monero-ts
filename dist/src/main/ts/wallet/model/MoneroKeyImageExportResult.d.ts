import MoneroKeyImage from "../../daemon/model/MoneroKeyImage";
/**
 * Models results from exporting signed key images.
 */
export default class MoneroKeyImageExportResult {
    offset: number;
    keyImages: MoneroKeyImage[];
    constructor(result?: Partial<MoneroKeyImageExportResult>);
    toJson(): any;
    getOffset(): number;
    setOffset(offset: number): MoneroKeyImageExportResult;
    getKeyImages(): MoneroKeyImage[];
    setKeyImages(keyImages: MoneroKeyImage[]): MoneroKeyImageExportResult;
}

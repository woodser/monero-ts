import fs from "fs";
import { Buffer } from "buffer";

const fileNames = ["./dist/monero_wallet_full.js", "./dist/monero_wallet_keys.js"];


const postprocess = async (fileName) => {
  // read input file
  const source = await fs.promises.readFile(fileName, "utf8");

  // do not recompress again
  if (source.includes("DecompressionStream")) {
    console.log(`Skipping already compressed file ${fileName}`);
    return;
  }

  // find wasmBinaryFile base64 string
  const match = source.match(/wasmBinaryFile=\"data:application\/octet-stream;base64,(.+?(?=\"))/gm);
  if (!match?.length) {
    console.log(`Skipping ${fileName}. wasmBinaryFile not base64 encoded`);
    return;
  }
  const b64 = match[0].split('wasmBinaryFile="data:application/octet-stream;base64,')[1];
  const buf = Buffer.from(b64, 'base64');

  // compress wasmBinaryFile
  const compression = new CompressionStream("deflate");
  const compressedStream = new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array(buf));
      controller.close();
    },
  }).pipeThrough(compression);
  const compressedData = await new Response(compressedStream).arrayBuffer();

  // convert compressed wasmBinaryFile to base64
  const cb64 = Buffer.from(compressedData).toString("base64");

  // replace wasmBinaryFile with compressed wasmBinaryFile and add extra code to decompress it
  const replaced = source
    .replace(b64, cb64)
    .replace(
      "return intArrayFromBase64(filename.slice(dataURIPrefix.length))",
      'const data=filename.slice(dataURIPrefix.length);if(data.startsWith("AGFzbQ"))return intArrayFromBase64(data);else{const bin=intArrayFromBase64(data);const ds = new DecompressionStream("deflate");const decompressedStream = new ReadableStream({start(controller){controller.enqueue(bin);controller.close();}}).pipeThrough(ds);return (new Response(decompressedStream)).arrayBuffer();}'
    )
    .replace(
      "!wasmBinary&&(ENVIRONMENT_IS_WEB||ENVIRONMENT_IS_WORKER)",
      "!wasmBinary&&false"
    );

  // write output file
  await fs.promises.writeFile(fileName, replaced);
}

for (const fileName of fileNames) {
  await postprocess(fileName);
}
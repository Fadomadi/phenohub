declare module "heic-convert" {
  type HeicConvertOptions = {
    buffer: Buffer | ArrayBuffer;
    format: "JPEG" | "PNG";
    quality?: number;
  };

  function convert(options: HeicConvertOptions): Promise<Buffer | ArrayBuffer>;

  export = convert;
}

declare module "heic-decode" {
  export type HeicDecodeResult = {
    width: number;
    height: number;
    data: Uint8Array;
    channels?: number;
    components?: number;
  };

  function decode(input: { buffer: ArrayBuffer | Uint8Array }): Promise<HeicDecodeResult>;

  export = decode;
}

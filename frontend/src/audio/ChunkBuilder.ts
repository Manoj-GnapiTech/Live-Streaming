export class ChunkBuilder {

  static toPCM(
    floatSamples: Float32Array
  ): ArrayBuffer {

    const pcm =
      new Int16Array(
        floatSamples.length
      );

    for (
      let i = 0;
      i < floatSamples.length;
      i++
    ) {

      const sample =
        Math.max(
          -1,
          Math.min(
            1,
            floatSamples[i]
          )
        );

      pcm[i] = sample * 32767;
    }

    return pcm.buffer;
  }
}
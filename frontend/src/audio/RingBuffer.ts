export class RingBuffer {

  private buffer: number[] = [];

  push(samples: Float32Array) {
    this.buffer.push(...samples);
  }

  size(): number {
    return this.buffer.length;
  }

  read(count: number): Float32Array {

    const chunk =
      this.buffer.splice(0, count);

    return new Float32Array(chunk);
  }
}
class MicProcessor extends AudioWorkletProcessor {

  /**
   * Called automatically by the AudioWorklet for every audio block.
   */
  process(inputs) {

    const input = inputs[0];

    if (input && input.length > 0) {
      this.port.postMessage(input[0]);
    }

    return true;
  }
}

registerProcessor(
  "mic-processor",
  MicProcessor
);
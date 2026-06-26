import { RingBuffer } from "./RingBuffer";
import { ChunkBuilder } from "./ChunkBuilder";
import { OutgoingQueue } from "./OutgoingQueue";

export class AudioStreamer {
  private ws: WebSocket | null = null;

  private ringBuffer = new RingBuffer();

  private outgoingQueue = new OutgoingQueue();

  private readonly chunkSize = 1600;

  private audioContext: AudioContext | null = null;

  private mediaStream: MediaStream | null = null;

  private source: MediaStreamAudioSourceNode | null = null;

  private worklet: AudioWorkletNode | null = null;

  private chunkBuilderTimer: number | null = null;

  private senderTimer: number | null = null;

  async start() {
    try {
      console.log("START CALLED");

      console.log("Requesting microphone...");

      this.mediaStream =
        await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

      console.log("Microphone granted");

      this.connectWebSocket();

      this.audioContext =
        new AudioContext({
          sampleRate: 16000,
        });

      console.log("AudioContext created");

      await this.audioContext.audioWorklet.addModule(
        "/mic-processor.js"
      );

      console.log("Worklet loaded");

      this.source =
        this.audioContext.createMediaStreamSource(
          this.mediaStream
        );

      console.log("Media source created");

      this.worklet =
        new AudioWorkletNode(
          this.audioContext,
          "mic-processor"
        );

      console.log("Worklet node created");

      this.worklet.port.onmessage = (
        event
      ) => {
        const samples =
          event.data as Float32Array;

        this.ringBuffer.push(samples);
      };

      this.source.connect(
        this.worklet
      );

      console.log(
        "Audio pipeline connected"
      );

      this.startChunkBuilder();

      this.startSender();

      console.log(
        "Streaming started"
      );
    } catch (error) {
      console.error(
        "MIC ERROR:",
        error
      );
    }
  }

  private connectWebSocket() {
    this.ws =
      new WebSocket(
        "ws://localhost:8000"
      );

    this.ws.binaryType =
      "arraybuffer";

    this.ws.onopen = () => {
      console.log(
        "WebSocket Connected"
      );
    };

    this.ws.onclose = () => {
      console.log(
        "WebSocket Closed"
      );
    };

    this.ws.onerror = (
      error
    ) => {
      console.error(
        "WebSocket Error:",
        error
      );
    };
  }

  private startChunkBuilder() {
    this.chunkBuilderTimer =
      window.setInterval(() => {

        while (
          this.ringBuffer.size() >=
          this.chunkSize
        ) {

          const chunk =
            this.ringBuffer.read(
              this.chunkSize
            );

          const pcm =
            ChunkBuilder.toPCM(
              chunk
            );

          this.outgoingQueue.push(
            pcm
          );

          console.log(
            "Chunk Created"
          );
        }

      }, 20);
  }

  private startSender() {

    this.senderTimer =
      window.setInterval(() => {

        if (
          !this.ws ||
          this.ws.readyState !==
            WebSocket.OPEN
        ) {
          return;
        }

        const chunk =
          this.outgoingQueue.pop();

        if (!chunk) {
          return;
        }

        this.ws.send(chunk);

        console.log(
          "Chunk Sent"
        );

      }, 10);
  }

  public stop() {

    console.log(
      "Stopping stream..."
    );

    if (
      this.chunkBuilderTimer
    ) {
      clearInterval(
        this.chunkBuilderTimer
      );

      this.chunkBuilderTimer =
        null;
    }

    if (
      this.senderTimer
    ) {
      clearInterval(
        this.senderTimer
      );

      this.senderTimer =
        null;
    }

    this.worklet?.disconnect();

    this.source?.disconnect();

    if (
      this.mediaStream
    ) {

      this.mediaStream
        .getTracks()
        .forEach(
          (track) =>
            track.stop()
        );

      this.mediaStream =
        null;
    }

    if (
      this.audioContext
    ) {

      this.audioContext.close();

      this.audioContext =
        null;
    }

    if (
      this.ws &&
      this.ws.readyState ===
        WebSocket.OPEN
    ) {

      this.ws.close();
    }

    this.ws = null;

    console.log(
      "Streaming stopped"
    );
  }
}
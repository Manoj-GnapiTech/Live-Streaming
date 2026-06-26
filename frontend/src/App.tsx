import { useRef } from "react";
import { AudioStreamer } from "./audio/AudioStreamer";

function App() {

  const streamerRef =
    useRef<AudioStreamer | null>(
      null
    );

  const startStreaming =
    async () => {

      if (
        streamerRef.current
      ) {
        return;
      }

      const streamer =
        new AudioStreamer();

      streamerRef.current =
        streamer;

      await streamer.start();
    };

  const stopStreaming =
    () => {

      streamerRef.current?.stop();

      streamerRef.current =
        null;
    };

  return (
    <div
      style={{
        padding: "20px",
      }}
    >
      <h1>
        Audio Streaming
      </h1>

      <button
        onClick={
          startStreaming
        }
      >
        Start
      </button>

      <button
        onClick={
          stopStreaming
        }
        style={{
          marginLeft:
            "10px",
        }}
      >
        Stop
      </button>
    </div>
  );
}

export default App;
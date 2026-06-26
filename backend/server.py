import asyncio
import websockets
import numpy as np
import sounddevice as sd

HOST = "0.0.0.0"
PORT = 8000

SAMPLE_RATE = 16000
CHANNELS = 1

audio_queue = asyncio.Queue()


class SpeakerWorker:
    def __init__(self):
        self.stream = None

    def start(self):
        self.stream = sd.OutputStream(
            samplerate=SAMPLE_RATE,
            channels=CHANNELS,
            dtype=np.float32,
            blocksize=0
        )
        self.stream.start()

        print("Speaker started")

    def play_chunk(self, chunk: bytes):
        try:
            audio = np.frombuffer(
                chunk,
                dtype=np.int16
            )

            print(len(audio))

            audio = (
                audio.astype(np.float32)
                / 32768.0
            )

            self.stream.write(audio)

        except Exception as e:
            print(
                f"Speaker Error: {e}"
            )

    def stop(self):
        if self.stream:
            self.stream.stop()
            self.stream.close()


speaker = SpeakerWorker()


async def speaker_worker():
    print("Speaker worker started")

    while True:
        chunk = await audio_queue.get()

        print(
            f"Playing chunk: {len(chunk)} bytes"
        )

        speaker.play_chunk(chunk)

        audio_queue.task_done()


async def handle_client(websocket):

    print(
        "Client Connected"
    )

    try:

        async for message in websocket:

            print(
                f"Received {len(message)} bytes"
            )

            await audio_queue.put(
                message
            )

    except websockets.ConnectionClosed:

        print(
            "Client Disconnected"
        )

async def main():

    speaker.start()

    asyncio.create_task(
        speaker_worker()
    )

    server = await websockets.serve(
        handle_client,
        HOST,
        PORT,
        max_size=None,
        ping_interval=20,
        ping_timeout=20
    )

    print(
        f"Server running on ws://{HOST}:{PORT}"
    )

    await server.wait_closed()


if __name__ == "__main__":
    try:
        asyncio.run(main())

    except KeyboardInterrupt:
        print("Stopping server...")
        speaker.stop()
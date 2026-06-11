const webStreams = require("node:stream/web");
const os = require("node:os");
const stream = require("node:stream");

if (!os.availableParallelism) {
  os.availableParallelism = function availableParallelism() {
    return Math.max(1, os.cpus().length);
  };
}

if (!globalThis.ReadableStream) {
  globalThis.ReadableStream = webStreams.ReadableStream;
}

if (!globalThis.WritableStream) {
  globalThis.WritableStream = webStreams.WritableStream;
}

if (!globalThis.TransformStream) {
  globalThis.TransformStream = webStreams.TransformStream;
}

if (!stream.Readable.fromWeb) {
  stream.Readable.fromWeb = function fromWeb(readableStream) {
    const reader = readableStream.getReader();

    async function* readChunks() {
      while (true) {
        const result = await reader.read();
        if (result.done) {
          return;
        }
        yield Buffer.from(result.value);
      }
    }

    return stream.Readable.from(readChunks());
  };
}

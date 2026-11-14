const PYODIDE_INDEX = "https://cdn.jsdelivr.net/pyodide/v314.0.8/full/";
const STATE_EMPTY = 0;
const STATE_READY = 1;
const STATE_EOF = -1;
const WAIT_TIMEOUT_MS = 100;

let pyodide = null;
let state = null;
let byteLength = null;
let bytes = null;
let interrupt = null;
const stdoutDecoder = new TextDecoder();

function flushStdout() {
  const remainder = stdoutDecoder.decode();
  if (remainder) {
    self.postMessage({ type: "stdout", text: remainder });
  }
}

function readStdinLine() {
  Atomics.store(state, 0, STATE_EMPTY);
  self.postMessage({ type: "stdin" });
  while (true) {
    const waitResult = Atomics.wait(state, 0, STATE_EMPTY, WAIT_TIMEOUT_MS);
    if (waitResult === "timed-out") {
      pyodide.checkInterrupt();
      continue;
    }
    const status = Atomics.load(state, 0);
    if (status === STATE_EMPTY) {
      continue;
    }
    Atomics.store(state, 0, STATE_EMPTY);
    if (status === STATE_EOF) {
      pyodide.checkInterrupt();
      return null;
    }
    const length = Atomics.load(byteLength, 0);
    const copy = new Uint8Array(length);
    copy.set(bytes.subarray(0, length));
    return new TextDecoder().decode(copy);
  }
}

function isKeyboardInterrupt(error) {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("KeyboardInterrupt");
}

self.onmessage = async (event) => {
  const message = event.data;
  if (message.type === "init") {
    try {
    state = new Int32Array(message.stdin, 0, 1);
    byteLength = new Int32Array(message.stdin, 4, 1);
    bytes = new Uint8Array(message.stdin, 8);
    interrupt = new Int32Array(message.interrupt);
    const { loadPyodide } = await import(`${PYODIDE_INDEX}pyodide.mjs`);
    pyodide = await loadPyodide({ indexURL: PYODIDE_INDEX });
    pyodide.setInterruptBuffer(interrupt);
    pyodide.setStdin({ stdin: readStdinLine, autoEOF: true, isatty: true });
    pyodide.setStdout({
      isatty: true,
      write(buffer) {
        const text = stdoutDecoder.decode(buffer, { stream: true });
        if (text) {
          self.postMessage({ type: "stdout", text });
        }
        return buffer.length;
      },
    });
    pyodide.setStderr({
      write(buffer) {
        const text = new TextDecoder().decode(buffer);
        if (text) {
          self.postMessage({ type: "stderr", text });
        }
        return buffer.length;
      },
    });
    self.postMessage({ type: "ready" });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      self.postMessage({ type: "error", message: errorMessage });
    }
    return;
  }
  if (message.type !== "run" || pyodide === null) {
    return;
  }
  interrupt[0] = 0;
  Atomics.store(state, 0, STATE_EMPTY);
  try {
    await pyodide.runPythonAsync(message.code);
    flushStdout();
    self.postMessage({ type: "done" });
  } catch (error) {
    flushStdout();
    if (isKeyboardInterrupt(error)) {
      self.postMessage({ type: "stopped" });
      return;
    }
    const errorMessage = error instanceof Error ? error.message : String(error);
    self.postMessage({ type: "error", message: errorMessage });
  }
};

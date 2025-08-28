// Enhanced polyfills for Node environments where Web APIs may be missing (CommonJS)
try {
  // Force load undici for fetch polyfill
  const undici = require('undici');
  
  // Web Streams
  if (typeof ReadableStream === 'undefined') {
    const webStreams = require('stream/web');
    if (webStreams && webStreams.ReadableStream) {
      global.ReadableStream = webStreams.ReadableStream;
    }
    if (webStreams && webStreams.WritableStream && typeof WritableStream === 'undefined') {
      global.WritableStream = webStreams.WritableStream;
    }
    if (webStreams && webStreams.TransformStream && typeof TransformStream === 'undefined') {
      global.TransformStream = webStreams.TransformStream;
    }
  }

  // fetch and related Web APIs - force override
  global.fetch = undici.fetch;
  global.Headers = undici.Headers;
  global.Request = undici.Request;
  global.Response = undici.Response;
  global.FormData = undici.FormData;
  global.Blob = undici.Blob;
  if (undici.File) global.File = undici.File;

  // crypto (webcrypto)
  if (typeof crypto === 'undefined' || !global.crypto?.getRandomValues) {
    const { webcrypto } = require('node:crypto');
    if (webcrypto) {
      global.crypto = webcrypto;
    }
  }
} catch (_) {
  // Ignore – best-effort polyfill
}

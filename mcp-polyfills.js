// Minimal polyfills for Node environments (ESM-compatible)
// This file runs in Node (vite config and dev server). Keep it side-effect only.

// 1) Web Streams (Node 18+ provides stream/web)
try {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore - works in Node environments
  if (typeof ReadableStream === 'undefined') {
    // Use ESM import
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    // Note: In ESM context, this import form is valid at top-level
  }
} catch (_) {}

import { ReadableStream as RS, WritableStream as WS, TransformStream as TS } from 'stream/web';

try {
  if (typeof globalThis.ReadableStream === 'undefined' && typeof RS !== 'undefined') {
    // @ts-ignore
    globalThis.ReadableStream = RS;
  }
  if (typeof globalThis.WritableStream === 'undefined' && typeof WS !== 'undefined') {
    // @ts-ignore
    globalThis.WritableStream = WS;
  }
  if (typeof globalThis.TransformStream === 'undefined' && typeof TS !== 'undefined') {
    // @ts-ignore
    globalThis.TransformStream = TS;
  }
} catch (_) {}

// 2) Web Crypto (provide crypto.getRandomValues)
import { webcrypto } from 'node:crypto';

try {
  if (typeof globalThis.crypto === 'undefined' || typeof globalThis.crypto.getRandomValues !== 'function') {
    // @ts-ignore
    globalThis.crypto = webcrypto;
  }
} catch (_) {}

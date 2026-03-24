
// Minimal Polyfill for PDF.js in Node.js
// This fixes "DOMMatrix is not defined" errors when parsing PDFs server-side

if (typeof Promise.withResolvers === 'undefined') {
  // @ts-expect-error - Polyfill for Node < 22
  Promise.withResolvers = function () {
    let resolve, reject;
    const promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };
}

if (typeof global.DOMMatrix === 'undefined') {
  // @ts-ignore - Polyfill for pdfjs-dist
  global.DOMMatrix = class DOMMatrix {
    a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
    constructor() {}
    multiply() { return this; }
    translate() { return this; }
    scale() { return this; }
    toString() { return "matrix(1, 0, 0, 1, 0, 0)"; }
  };
}

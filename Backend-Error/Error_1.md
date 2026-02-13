Warning: Cannot load "@napi-rs/canvas" package: "Error: Cannot find module '@napi-rs/canvas'
Require stack:
- /ROOT/Documents/Synthetic Mind/synthesis-engine/node_modules/pdf-parse/dist/pdf-parse/cjs/index.cjs".
Warning: Cannot polyfill `ImageData`, rendering may be broken.
Warning: Cannot polyfill `Path2D`, rendering may be broken.
Failed to process PDF entropy.pdf: TypeError: pdfParse is not a function
    at extractTextFromPDF (src/lib/extractors/pdf-extractor.ts:44:22)
    at processPDF (src/lib/extractors/pdf-extractor.ts:161:28)
    at <unknown> (src/lib/extractors/pdf-extractor.ts:182:25)
    at Array.map (<anonymous>)
    at processMultiplePDFs (src/lib/extractors/pdf-extractor.ts:182:11)
    at POST (src/app/api/hybrid-synthesize/route.ts:68:51)
  42 |   // console.log("pdfParse type:", typeof pdfParse); // Debug log if needed (commented out)
  43 |
> 44 |   const data = await pdfParse(Buffer.from(buffer));
     |                      ^
  45 |   
  46 |   return {
  47 |     fileName,
Failed to process PDF Complexity_-_A_Guided_Tour.pdf: TypeError: pdfParse is not a function
    at extractTextFromPDF (src/lib/extractors/pdf-extractor.ts:44:22)
    at processPDF (src/lib/extractors/pdf-extractor.ts:161:28)
    at <unknown> (src/lib/extractors/pdf-extractor.ts:182:25)
    at Array.map (<anonymous>)
    at processMultiplePDFs (src/lib/extractors/pdf-extractor.ts:182:11)
    at POST (src/app/api/hybrid-synthesize/route.ts:68:51)
  42 |   // console.log("pdfParse type:", typeof pdfParse); // Debug log if needed (commented out)
  43 |
> 44 |   const data = await pdfParse(Buffer.from(buffer));
     |                      ^
  45 |   
  46 |   return {
  47 |     fileName,
Failed to process PDF The Beginning of Infinity PDF.pdf: TypeError: pdfParse is not a function
    at extractTextFromPDF (src/lib/extractors/pdf-extractor.ts:44:22)
    at processPDF (src/lib/extractors/pdf-extractor.ts:161:28)
    at <unknown> (src/lib/extractors/pdf-extractor.ts:182:25)
    at Array.map (<anonymous>)
    at processMultiplePDFs (src/lib/extractors/pdf-extractor.ts:182:11)
    at POST (src/app/api/hybrid-synthesize/route.ts:68:51)
  42 |   // console.log("pdfParse type:", typeof pdfParse); // Debug log if needed (commented out)
  43 |
> 44 |   const data = await pdfParse(Buffer.from(buffer));
     |                      ^
  45 |   
  46 |   return {
  47 |     fileName,
Failed to process PDF mackay03information.pdf: TypeError: pdfParse is not a function
    at extractTextFromPDF (src/lib/extractors/pdf-extractor.ts:44:22)
    at processPDF (src/lib/extractors/pdf-extractor.ts:161:28)
    at <unknown> (src/lib/extractors/pdf-extractor.ts:182:25)
    at Array.map (<anonymous>)
    at processMultiplePDFs (src/lib/extractors/pdf-extractor.ts:182:11)
    at POST (src/app/api/hybrid-synthesize/route.ts:68:51)
  42 |   // console.log("pdfParse type:", typeof pdfParse); // Debug log if needed (commented out)
  43 |
> 44 |   const data = await pdfParse(Buffer.from(buffer));
     |                      ^
  45 |   
  46 |   return {
  47 |     fileName,
Claude API attempt 1 failed: Error: 401 {"type":"error","error":{"type":"authentication_error","message":"invalid x-api-key"},"request_id":"req_011CXGmCdvrUKLEQD8rmcq2h"}
    at async ClaudeAdapter.generateContent (src/lib/ai/anthropic.ts:28:21)
    at async extractCompanyData (src/lib/extractors/company-extractor.ts:147:18)
    at async processCompany (src/lib/extractors/company-extractor.ts:249:23)
    at async processMultipleCompanies (src/lib/extractors/company-extractor.ts:270:19)
    at async POST (src/app/api/hybrid-synthesize/route.ts:86:30)
  26 |     while (attempts < maxAttempts) {
  27 |       try {
> 28 |         const msg = await anthropic.messages.create({
     |                     ^
  29 |           model: this.model,
  30 |           max_tokens: 8192,
  31 |           messages: [{ role: "user", content: prompt }], {
  status: 401,
  headers: Headers {
    date: 'Mon, 19 Jan 2026 12:48:17 GMT',
    'content-type': 'application/json',
    'content-length': '130',
    connection: 'keep-alive',
    'x-should-retry': 'false',
    'request-id': 'req_011CXGmCdvrUKLEQD8rmcq2h',
    'strict-transport-security': 'max-age=31536000; includeSubDomains; preload',
    server: 'cloudflare',
    'x-envoy-upstream-service-time': '53',
    'cf-cache-status': 'DYNAMIC',
    'x-robots-tag': 'none',
    'cf-ray': '9c0672099acedb24-MNL'
  },
  requestID: 'req_011CXGmCdvrUKLEQD8rmcq2h',
  error: [Object]
}
Claude API attempt 1 failed: Error: 401 {"type":"error","error":{"type":"authentication_error","message":"invalid x-api-key"},"request_id":"req_011CXGmCgYcfFUqJyanurHMn"}
    at async ClaudeAdapter.generateContent (src/lib/ai/anthropic.ts:28:21)
    at async extractCompanyData (src/lib/extractors/company-extractor.ts:147:18)
    at async processCompany (src/lib/extractors/company-extractor.ts:249:23)
    at async processMultipleCompanies (src/lib/extractors/company-extractor.ts:270:19)
    at async POST (src/app/api/hybrid-synthesize/route.ts:86:30)
  26 |     while (attempts < maxAttempts) {
  27 |       try {
> 28 |         const msg = await anthropic.messages.create({
     |                     ^
  29 |           model: this.model,
  30 |           max_tokens: 8192,
  31 |           messages: [{ role: "user", content: prompt }], {
  status: 401,
  headers: Headers {
    date: 'Mon, 19 Jan 2026 12:48:17 GMT',
    'content-type': 'application/json',
    'content-length': '130',
    connection: 'keep-alive',
    'x-should-retry': 'false',
    'request-id': 'req_011CXGmCgYcfFUqJyanurHMn',
    'strict-transport-security': 'max-age=31536000; includeSubDomains; preload',
    server: 'cloudflare',
    'x-envoy-upstream-service-time': '26',
    'cf-cache-status': 'DYNAMIC',
    'x-robots-tag': 'none',
    'cf-ray': '9c06720d7b9adb22-MNL'
  },
  requestID: 'req_011CXGmCgYcfFUqJyanurHMn',
  error: [Object]
}
Claude API attempt 1 failed: Error: 401 {"type":"error","error":{"type":"authentication_error","message":"invalid x-api-key"},"request_id":"req_011CXGmCggoYRb1944j8GQTC"}
    at async ClaudeAdapter.generateContent (src/lib/ai/anthropic.ts:28:21)
    at async extractCompanyData (src/lib/extractors/company-extractor.ts:147:18)
    at async processCompany (src/lib/extractors/company-extractor.ts:249:23)
    at async processMultipleCompanies (src/lib/extractors/company-extractor.ts:270:19)
    at async POST (src/app/api/hybrid-synthesize/route.ts:86:30)
  26 |     while (attempts < maxAttempts) {
  27 |       try {
> 28 |         const msg = await anthropic.messages.create({
     |                     ^
  29 |           model: this.model,
  30 |           max_tokens: 8192,
  31 |           messages: [{ role: "user", content: prompt }], {
  status: 401,
  headers: Headers {
    date: 'Mon, 19 Jan 2026 12:48:17 GMT',
    'content-type': 'application/json',
    'content-length': '130',
    connection: 'keep-alive',
    'x-should-retry': 'false',
    'request-id': 'req_011CXGmCggoYRb1944j8GQTC',
    'strict-transport-security': 'max-age=31536000; includeSubDomains; preload',
    server: 'cloudflare',
    'cf-cache-status': 'DYNAMIC',
    'x-robots-tag': 'none',
    'cf-ray': '9c06720c6c74db24-MNL'
  },
  requestID: 'req_011CXGmCggoYRb1944j8GQTC',
  error: [Object]
}
Claude API attempt 2 failed: Error: 401 {"type":"error","error":{"type":"authentication_error","message":"invalid x-api-key"},"request_id":"req_011CXGmCkMoqyF5SAremyYM3"}
    at async ClaudeAdapter.generateContent (src/lib/ai/anthropic.ts:28:21)
    at async extractCompanyData (src/lib/extractors/company-extractor.ts:147:18)
    at async processCompany (src/lib/extractors/company-extractor.ts:249:23)
    at async processMultipleCompanies (src/lib/extractors/company-extractor.ts:270:19)
    at async POST (src/app/api/hybrid-synthesize/route.ts:86:30)
  26 |     while (attempts < maxAttempts) {
  27 |       try {
> 28 |         const msg = await anthropic.messages.create({
     |                     ^
  29 |           model: this.model,
  30 |           max_tokens: 8192,
  31 |           messages: [{ role: "user", content: prompt }], {
  status: 401,
  headers: Headers {
    date: 'Mon, 19 Jan 2026 12:48:18 GMT',
    'content-type': 'application/json',
    'content-length': '130',
    connection: 'keep-alive',
    'x-should-retry': 'false',
    'request-id': 'req_011CXGmCkMoqyF5SAremyYM3',
    'strict-transport-security': 'max-age=31536000; includeSubDomains; preload',
    server: 'cloudflare',
    'x-envoy-upstream-service-time': '19',
    'cf-cache-status': 'DYNAMIC',
    'x-robots-tag': 'none',
    'cf-ray': '9c0672120809db24-MNL'
  },
  requestID: 'req_011CXGmCkMoqyF5SAremyYM3',
  error: [Object]
}
Claude API attempt 1 failed: Error: 401 {"type":"error","error":{"type":"authentication_error","message":"invalid x-api-key"},"request_id":"req_011CXGmCmznaQeYt24bqJWjM"}
    at async ClaudeAdapter.generateContent (src/lib/ai/anthropic.ts:28:21)
    at async extractCompanyData (src/lib/extractors/company-extractor.ts:147:18)
    at async processCompany (src/lib/extractors/company-extractor.ts:249:23)
    at async processMultipleCompanies (src/lib/extractors/company-extractor.ts:270:19)
    at async POST (src/app/api/hybrid-synthesize/route.ts:86:30)
  26 |     while (attempts < maxAttempts) {
  27 |       try {
> 28 |         const msg = await anthropic.messages.create({
     |                     ^
  29 |           model: this.model,
  30 |           max_tokens: 8192,
  31 |           messages: [{ role: "user", content: prompt }], {
  status: 401,
  headers: Headers {
    date: 'Mon, 19 Jan 2026 12:48:19 GMT',
    'content-type': 'application/json',
    'content-length': '130',
    connection: 'keep-alive',
    'x-should-retry': 'false',
    'request-id': 'req_011CXGmCmznaQeYt24bqJWjM',
    'strict-transport-security': 'max-age=31536000; includeSubDomains; preload',
    server: 'cloudflare',
    'x-envoy-upstream-service-time': '27',
    'cf-cache-status': 'DYNAMIC',
    'x-robots-tag': 'none',
    'cf-ray': '9c0672156b38db24-MNL'
  },
  requestID: 'req_011CXGmCmznaQeYt24bqJWjM',
  error: [Object]
}
Claude API attempt 2 failed: Error: 401 {"type":"error","error":{"type":"authentication_error","message":"invalid x-api-key"},"request_id":"req_011CXGmCnBSio5pcS2AwZ4Eh"}
    at async ClaudeAdapter.generateContent (src/lib/ai/anthropic.ts:28:21)
    at async extractCompanyData (src/lib/extractors/company-extractor.ts:147:18)
    at async processCompany (src/lib/extractors/company-extractor.ts:249:23)
    at async processMultipleCompanies (src/lib/extractors/company-extractor.ts:270:19)
    at async POST (src/app/api/hybrid-synthesize/route.ts:86:30)
  26 |     while (attempts < maxAttempts) {
  27 |       try {
> 28 |         const msg = await anthropic.messages.create({
     |                     ^
  29 |           model: this.model,
  30 |           max_tokens: 8192,
  31 |           messages: [{ role: "user", content: prompt }], {
  status: 401,
  headers: Headers {
    date: 'Mon, 19 Jan 2026 12:48:19 GMT',
    'content-type': 'application/json',
    'content-length': '130',
    connection: 'keep-alive',
    'x-should-retry': 'false',
    'request-id': 'req_011CXGmCnBSio5pcS2AwZ4Eh',
    'strict-transport-security': 'max-age=31536000; includeSubDomains; preload',
    server: 'cloudflare',
    'x-envoy-upstream-service-time': '23',
    'cf-cache-status': 'DYNAMIC',
    'x-robots-tag': 'none',
    'cf-ray': '9c067215aeb7db22-MNL'
  },
  requestID: 'req_011CXGmCnBSio5pcS2AwZ4Eh',
  error: [Object]
}
Claude API attempt 2 failed: Error: 401 {"type":"error","error":{"type":"authentication_error","message":"invalid x-api-key"},"request_id":"req_011CXGmCneUq8AuBDkNVBkRN"}
    at async ClaudeAdapter.generateContent (src/lib/ai/anthropic.ts:28:21)
    at async extractCompanyData (src/lib/extractors/company-extractor.ts:147:18)
    at async processCompany (src/lib/extractors/company-extractor.ts:249:23)
    at async processMultipleCompanies (src/lib/extractors/company-extractor.ts:270:19)
    at async POST (src/app/api/hybrid-synthesize/route.ts:86:30)
  26 |     while (attempts < maxAttempts) {
  27 |       try {
> 28 |         const msg = await anthropic.messages.create({
     |                     ^
  29 |           model: this.model,
  30 |           max_tokens: 8192,
  31 |           messages: [{ role: "user", content: prompt }], {
  status: 401,
  headers: Headers {
    date: 'Mon, 19 Jan 2026 12:48:19 GMT',
    'content-type': 'application/json',
    'content-length': '130',
    connection: 'keep-alive',
    'x-should-retry': 'false',
    'request-id': 'req_011CXGmCneUq8AuBDkNVBkRN',
    'strict-transport-security': 'max-age=31536000; includeSubDomains; preload',
    server: 'cloudflare',
    'x-envoy-upstream-service-time': '23',
    'cf-cache-status': 'DYNAMIC',
    'x-robots-tag': 'none',
    'cf-ray': '9c06721659a6db1e-MNL'
  },
  requestID: 'req_011CXGmCneUq8AuBDkNVBkRN',
  error: [Object]
}
Claude API attempt 2 failed: Error: 401 {"type":"error","error":{"type":"authentication_error","message":"invalid x-api-key"},"request_id":"req_011CXGmCsbPJwGvdfW26zBYc"}
    at async ClaudeAdapter.generateContent (src/lib/ai/anthropic.ts:28:21)
    at async extractCompanyData (src/lib/extractors/company-extractor.ts:147:18)
    at async processCompany (src/lib/extractors/company-extractor.ts:249:23)
    at async processMultipleCompanies (src/lib/extractors/company-extractor.ts:270:19)
    at async POST (src/app/api/hybrid-synthesize/route.ts:86:30)
  26 |     while (attempts < maxAttempts) {
  27 |       try {
> 28 |         const msg = await anthropic.messages.create({
     |                     ^
  29 |           model: this.model,
  30 |           max_tokens: 8192,
  31 |           messages: [{ role: "user", content: prompt }], {
  status: 401,
  headers: Headers {
    date: 'Mon, 19 Jan 2026 12:48:20 GMT',
    'content-type': 'application/json',
    'content-length': '130',
    connection: 'keep-alive',
    'x-should-retry': 'false',
    'request-id': 'req_011CXGmCsbPJwGvdfW26zBYc',
    'strict-transport-security': 'max-age=31536000; includeSubDomains; preload',
    server: 'cloudflare',
    'x-envoy-upstream-service-time': '16',
    'cf-cache-status': 'DYNAMIC',
    'x-robots-tag': 'none',
    'cf-ray': '9c06721d9bebdb24-MNL'
  },
  requestID: 'req_011CXGmCsbPJwGvdfW26zBYc',
  error: [Object]
}
Claude API attempt 3 failed: Error: 401 {"type":"error","error":{"type":"authentication_error","message":"invalid x-api-key"},"request_id":"req_011CXGmCvGNCT36sZePGJFKP"}
    at async ClaudeAdapter.generateContent (src/lib/ai/anthropic.ts:28:21)
    at async extractCompanyData (src/lib/extractors/company-extractor.ts:147:18)
    at async processCompany (src/lib/extractors/company-extractor.ts:249:23)
    at async processMultipleCompanies (src/lib/extractors/company-extractor.ts:270:19)
    at async POST (src/app/api/hybrid-synthesize/route.ts:86:30)
  26 |     while (attempts < maxAttempts) {
  27 |       try {
> 28 |         const msg = await anthropic.messages.create({
     |                     ^
  29 |           model: this.model,
  30 |           max_tokens: 8192,
  31 |           messages: [{ role: "user", content: prompt }], {
  status: 401,
  headers: Headers {
    date: 'Mon, 19 Jan 2026 12:48:20 GMT',
    'content-type': 'application/json',
    'content-length': '130',
    connection: 'keep-alive',
    'x-should-retry': 'false',
    'request-id': 'req_011CXGmCvGNCT36sZePGJFKP',
    'strict-transport-security': 'max-age=31536000; includeSubDomains; preload',
    server: 'cloudflare',
    'x-envoy-upstream-service-time': '65',
    'cf-cache-status': 'DYNAMIC',
    'x-robots-tag': 'none',
    'cf-ray': '9c0672217cfedb24-MNL'
  },
  requestID: 'req_011CXGmCvGNCT36sZePGJFKP',
  error: [Object]
}
Claude API attempt 3 failed: Error: 401 {"type":"error","error":{"type":"authentication_error","message":"invalid x-api-key"},"request_id":"req_011CXGmCxZnGz56DzXKdS6LQ"}
    at async ClaudeAdapter.generateContent (src/lib/ai/anthropic.ts:28:21)
    at async extractCompanyData (src/lib/extractors/company-extractor.ts:147:18)
    at async processCompany (src/lib/extractors/company-extractor.ts:249:23)
    at async processMultipleCompanies (src/lib/extractors/company-extractor.ts:270:19)
    at async POST (src/app/api/hybrid-synthesize/route.ts:86:30)
  26 |     while (attempts < maxAttempts) {
  27 |       try {
> 28 |         const msg = await anthropic.messages.create({
     |                     ^
  29 |           model: this.model,
  30 |           max_tokens: 8192,
  31 |           messages: [{ role: "user", content: prompt }], {
  status: 401,
  headers: Headers {
    date: 'Mon, 19 Jan 2026 12:48:21 GMT',
    'content-type': 'application/json',
    'content-length': '130',
    connection: 'keep-alive',
    'x-should-retry': 'false',
    'request-id': 'req_011CXGmCxZnGz56DzXKdS6LQ',
    'strict-transport-security': 'max-age=31536000; includeSubDomains; preload',
    server: 'cloudflare',
    'x-envoy-upstream-service-time': '19',
    'cf-cache-status': 'DYNAMIC',
    'x-robots-tag': 'none',
    'cf-ray': '9c067224ddbfdb22-MNL'
  },
  requestID: 'req_011CXGmCxZnGz56DzXKdS6LQ',
  error: [Object]
}
Claude API attempt 3 failed: Error: 401 {"type":"error","error":{"type":"authentication_error","message":"invalid x-api-key"},"request_id":"req_011CXGmCyBysHoLjMWTeVxYy"}
    at async ClaudeAdapter.generateContent (src/lib/ai/anthropic.ts:28:21)
    at async extractCompanyData (src/lib/extractors/company-extractor.ts:147:18)
    at async processCompany (src/lib/extractors/company-extractor.ts:249:23)
    at async processMultipleCompanies (src/lib/extractors/company-extractor.ts:270:19)
    at async POST (src/app/api/hybrid-synthesize/route.ts:86:30)
  26 |     while (attempts < maxAttempts) {
  27 |       try {
> 28 |         const msg = await anthropic.messages.create({
     |                     ^
  29 |           model: this.model,
  30 |           max_tokens: 8192,
  31 |           messages: [{ role: "user", content: prompt }], {
  status: 401,
  headers: Headers {
    date: 'Mon, 19 Jan 2026 12:48:21 GMT',
    'content-type': 'application/json',
    'content-length': '130',
    connection: 'keep-alive',
    'x-should-retry': 'false',
    'request-id': 'req_011CXGmCyBysHoLjMWTeVxYy',
    'strict-transport-security': 'max-age=31536000; includeSubDomains; preload',
    server: 'cloudflare',
    'x-envoy-upstream-service-time': '27',
    'cf-cache-status': 'DYNAMIC',
    'x-robots-tag': 'none',
    'cf-ray': '9c0672241f09db24-MNL'
  },
  requestID: 'req_011CXGmCyBysHoLjMWTeVxYy',
  error: [Object]
}
Claude API attempt 3 failed: Error: 401 {"type":"error","error":{"type":"authentication_error","message":"invalid x-api-key"},"request_id":"req_011CXGmD3TTZtCCTS73iBbeL"}
    at async ClaudeAdapter.generateContent (src/lib/ai/anthropic.ts:28:21)
    at async extractCompanyData (src/lib/extractors/company-extractor.ts:147:18)
    at async processCompany (src/lib/extractors/company-extractor.ts:249:23)
    at async processMultipleCompanies (src/lib/extractors/company-extractor.ts:270:19)
    at async POST (src/app/api/hybrid-synthesize/route.ts:86:30)
  26 |     while (attempts < maxAttempts) {
  27 |       try {
> 28 |         const msg = await anthropic.messages.create({
     |                     ^
  29 |           model: this.model,
  30 |           max_tokens: 8192,
  31 |           messages: [{ role: "user", content: prompt }], {
  status: 401,
  headers: Headers {
    date: 'Mon, 19 Jan 2026 12:48:22 GMT',
    'content-type': 'application/json',
    'content-length': '130',
    connection: 'keep-alive',
    'x-should-retry': 'false',
    'request-id': 'req_011CXGmD3TTZtCCTS73iBbeL',
    'strict-transport-security': 'max-age=31536000; includeSubDomains; preload',
    server: 'cloudflare',
    'x-envoy-upstream-service-time': '21',
    'cf-cache-status': 'DYNAMIC',
    'x-robots-tag': 'none',
    'cf-ray': '9c06722bfad1db24-MNL'
  },
  requestID: 'req_011CXGmD3TTZtCCTS73iBbeL',
  error: [Object]
}
Failed to process company Sakana AI: Error: 401 {"type":"error","error":{"type":"authentication_error","message":"invalid x-api-key"},"request_id":"req_011CXGmCyBysHoLjMWTeVxYy"}
    at async ClaudeAdapter.generateContent (src/lib/ai/anthropic.ts:28:21)
    at async extractCompanyData (src/lib/extractors/company-extractor.ts:147:18)
    at async processCompany (src/lib/extractors/company-extractor.ts:249:23)
    at async processMultipleCompanies (src/lib/extractors/company-extractor.ts:270:19)
    at async POST (src/app/api/hybrid-synthesize/route.ts:86:30)
  26 |     while (attempts < maxAttempts) {
  27 |       try {
> 28 |         const msg = await anthropic.messages.create({
     |                     ^
  29 |           model: this.model,
  30 |           max_tokens: 8192,
  31 |           messages: [{ role: "user", content: prompt }], {
  status: 401,
  headers: Headers {
    date: 'Mon, 19 Jan 2026 12:48:21 GMT',
    'content-type': 'application/json',
    'content-length': '130',
    connection: 'keep-alive',
    'x-should-retry': 'false',
    'request-id': 'req_011CXGmCyBysHoLjMWTeVxYy',
    'strict-transport-security': 'max-age=31536000; includeSubDomains; preload',
    server: 'cloudflare',
    'x-envoy-upstream-service-time': '27',
    'cf-cache-status': 'DYNAMIC',
    'x-robots-tag': 'none',
    'cf-ray': '9c0672241f09db24-MNL'
  },
  requestID: 'req_011CXGmCyBysHoLjMWTeVxYy',
  error: [Object]
}
Failed to process company Future House: Error: 401 {"type":"error","error":{"type":"authentication_error","message":"invalid x-api-key"},"request_id":"req_011CXGmCxZnGz56DzXKdS6LQ"}
    at async ClaudeAdapter.generateContent (src/lib/ai/anthropic.ts:28:21)
    at async extractCompanyData (src/lib/extractors/company-extractor.ts:147:18)
    at async processCompany (src/lib/extractors/company-extractor.ts:249:23)
    at async processMultipleCompanies (src/lib/extractors/company-extractor.ts:270:19)
    at async POST (src/app/api/hybrid-synthesize/route.ts:86:30)
  26 |     while (attempts < maxAttempts) {
  27 |       try {
> 28 |         const msg = await anthropic.messages.create({
     |                     ^
  29 |           model: this.model,
  30 |           max_tokens: 8192,
  31 |           messages: [{ role: "user", content: prompt }], {
  status: 401,
  headers: Headers {
    date: 'Mon, 19 Jan 2026 12:48:21 GMT',
    'content-type': 'application/json',
    'content-length': '130',
    connection: 'keep-alive',
    'x-should-retry': 'false',
    'request-id': 'req_011CXGmCxZnGz56DzXKdS6LQ',
    'strict-transport-security': 'max-age=31536000; includeSubDomains; preload',
    server: 'cloudflare',
    'x-envoy-upstream-service-time': '19',
    'cf-cache-status': 'DYNAMIC',
    'x-robots-tag': 'none',
    'cf-ray': '9c067224ddbfdb22-MNL'
  },
  requestID: 'req_011CXGmCxZnGz56DzXKdS6LQ',
  error: [Object]
}
Failed to process company Isomorphic Labs: Error: 401 {"type":"error","error":{"type":"authentication_error","message":"invalid x-api-key"},"request_id":"req_011CXGmD3TTZtCCTS73iBbeL"}
    at async ClaudeAdapter.generateContent (src/lib/ai/anthropic.ts:28:21)
    at async extractCompanyData (src/lib/extractors/company-extractor.ts:147:18)
    at async processCompany (src/lib/extractors/company-extractor.ts:249:23)
    at async processMultipleCompanies (src/lib/extractors/company-extractor.ts:270:19)
    at async POST (src/app/api/hybrid-synthesize/route.ts:86:30)
  26 |     while (attempts < maxAttempts) {
  27 |       try {
> 28 |         const msg = await anthropic.messages.create({
     |                     ^
  29 |           model: this.model,
  30 |           max_tokens: 8192,
  31 |           messages: [{ role: "user", content: prompt }], {
  status: 401,
  headers: Headers {
    date: 'Mon, 19 Jan 2026 12:48:22 GMT',
    'content-type': 'application/json',
    'content-length': '130',
    connection: 'keep-alive',
    'x-should-retry': 'false',
    'request-id': 'req_011CXGmD3TTZtCCTS73iBbeL',
    'strict-transport-security': 'max-age=31536000; includeSubDomains; preload',
    server: 'cloudflare',
    'x-envoy-upstream-service-time': '21',
    'cf-cache-status': 'DYNAMIC',
    'x-robots-tag': 'none',
    'cf-ray': '9c06722bfad1db24-MNL'
  },
  requestID: 'req_011CXGmD3TTZtCCTS73iBbeL',
  error: [Object]
}
Failed to process company Imbue: Error: 401 {"type":"error","error":{"type":"authentication_error","message":"invalid x-api-key"},"request_id":"req_011CXGmCvGNCT36sZePGJFKP"}
    at async ClaudeAdapter.generateContent (src/lib/ai/anthropic.ts:28:21)
    at async extractCompanyData (src/lib/extractors/company-extractor.ts:147:18)
    at async processCompany (src/lib/extractors/company-extractor.ts:249:23)
    at async processMultipleCompanies (src/lib/extractors/company-extractor.ts:270:19)
    at async POST (src/app/api/hybrid-synthesize/route.ts:86:30)
  26 |     while (attempts < maxAttempts) {
  27 |       try {
> 28 |         const msg = await anthropic.messages.create({
     |                     ^
  29 |           model: this.model,
  30 |           max_tokens: 8192,
  31 |           messages: [{ role: "user", content: prompt }], {
  status: 401,
  headers: Headers {
    date: 'Mon, 19 Jan 2026 12:48:20 GMT',
    'content-type': 'application/json',
    'content-length': '130',
    connection: 'keep-alive',
    'x-should-retry': 'false',
    'request-id': 'req_011CXGmCvGNCT36sZePGJFKP',
    'strict-transport-security': 'max-age=31536000; includeSubDomains; preload',
    server: 'cloudflare',
    'x-envoy-upstream-service-time': '65',
    'cf-cache-status': 'DYNAMIC',
    'x-robots-tag': 'none',
    'cf-ray': '9c0672217cfedb24-MNL'
  },
  requestID: 'req_011CXGmCvGNCT36sZePGJFKP',
  error: [Object]
}
 POST /api/hybrid-synthesize 422 in 8.6s (compile: 701ms, render: 7.9s)
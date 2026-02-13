Prior Art] Scholar returned 0 results
[Tier 1] Using base SCM (physics only) for domain: AI Alignment
[SCM] Validation result: true
[do-Calculus] Pyodide initialization failed: Error: Cannot find module 'file:///Users/lesz/Documents/Synthetic-Mind/synthesis-engine/https:/cdn.jsdelivr.net/pyodide/v0.29.1/full/pyodide.asm.js'
    at async CausalInterventionTester.initialize (src/lib/services/causal-interventions.ts:57:22)
    at async MasaAuditor.audit (src/lib/ai/masa-auditor.ts:242:5)
    at async eval (src/lib/ai/synthesis-engine.ts:1136:22)
    at async Semaphore.run (src/lib/ai/concurrency-semaphore.ts:46:14)
    at async runEnhancedSynthesisPipeline (src/lib/ai/synthesis-engine.ts:1288:16)
    at async Object.start (src/app/api/hybrid-synthesize/route.ts:137:43)
  55 |       // This resolves the issue where WASM and Python stdlib files are not bundled correctly
  56 |       const { loadPyodide } = await import('pyodide');
> 57 |       this.pyodide = await loadPyodide({
     |                      ^
  58 |         indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.29.1/full/'
  59 |       });
  60 |       await this.pyodide.loadPackage(['numpy', 'scipy']); {
  code: 'MODULE_NOT_FOUND'
}
[do-Calculus] Interventional tests will be disabled for this session
[Counterfactual] Skipping (mechanism too brief for counterfactual analysis)
[Error: ENOENT: no such file or directory, open '/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/https:/cdn.jsdelivr.net/pyodide/v0.29.1/full/python_stdlib.zip'] {
  errno: -2,
  code: 'ENOENT',
  syscall: 'open',
  path: '/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/https:/cdn.jsdelivr.net/pyodide/v0.29.1/full/python_stdlib.zip'
}
 ⨯ unhandledRejection: [Error: ENOENT: no such file or directory, open '/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/https:/cdn.jsdelivr.net/pyodide/v0.29.1/full/python_stdlib.zip'] {
  errno: -2,
  code: 'ENOENT',
  syscall: 'open',
  path: '/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/https:/cdn.jsdelivr.net/pyodide/v0.29.1/full/python_stdlib.zip'
}
 ⨯ unhandledRejection:  [Error: ENOENT: no such file or directory, open '/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/https:/cdn.jsdelivr.net/pyodide/v0.29.1/full/python_stdlib.zip'] {
  errno: -2,
  code: 'ENOENT',
  syscall: 'open',
  path: '/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/https:/cdn.jsdelivr.net/pyodide/v0.29.1/full/python_stdlib.zip'
}
[Error: ENOENT: no such file or directory, open '/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/https:/cdn.jsdelivr.net/pyodide/v0.29.1/full/pyodide.asm.wasm'] {
  errno: -2,
  code: 'ENOENT',
  syscall: 'open',
  path: '/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/https:/cdn.jsdelivr.net/pyodide/v0.29.1/full/pyodide.asm.wasm'
}
 ⨯ unhandledRejection: [Error: ENOENT: no such file or directory, open '/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/https:/cdn.jsdelivr.net/pyodide/v0.29.1/full/pyodide.asm.wasm'] {
  errno: -2,
  code: 'ENOENT',
  syscall: 'open',
  path: '/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/https:/cdn.jsdelivr.net/pyodide/v0.29.1/full/pyodide.asm.wasm'
}
 ⨯ unhandledRejection:  [Error: ENOENT: no such file or directory, open '/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/https:/cdn.jsdelivr.net/pyodide/v0.29.1/full/pyodide.asm.wasm'] {
  errno: -2,
  code: 'ENOENT',
  syscall: 'open',
  path: '/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/https:/cdn.jsdelivr.net/pyodide/v0.29.1/full/pyodide.asm.wasm'
}
[Error: ENOENT: no such file or directory, open '/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/https:/cdn.jsdelivr.net/pyodide/v0.29.1/full/pyodide-lock.json'] {
  errno: -2,
  code: 'ENOENT',
  syscall: 'open',
  path: '/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/https:/cdn.jsdelivr.net/pyodide/v0.29.1/full/pyodide-lock.json'
}
 ⨯ unhandledRejection: [Error: ENOENT: no such file or directory, open '/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/https:/cdn.jsdelivr.net/pyodide/v0.29.1/full/pyodide-lock.json'] {
  errno: -2,
  code: 'ENOENT',
  syscall: 'open',
  path: '/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/https:/cdn.jsdelivr.net/pyodide/v0.29.1/full/pyodide-lock.json'
}
 ⨯ unhandledRejection:  [Error: ENOENT: no such file or directory, open '/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/https:/cdn.jsdelivr.net/pyodide/v0.29.1/full/pyodide-lock.json'] {
  errno: -2,
  code: 'ENOENT',
  syscall: 'open',
  path: '/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/https:/cdn.jsdelivr.net/pyodide/v0.29.1/full/pyodide-lock.json'
}
[Tier 1] Using base SCM (physics only) for domain: AI Alignment
[SCM] Validation result: true
[do-Calculus] Pyodide initialization failed: Error: Cannot find module 'file:///Users/lesz/Documents/Synthetic-Mind/synthesis-engine/https:/cdn.jsdelivr.net/pyodide/v0.29.1/full/pyodide.asm.js'
    at async CausalInterventionTester.initialize (src/lib/services/causal-interventions.ts:57:22)
    at async MasaAuditor.audit (src/lib/ai/masa-auditor.ts:242:5)
    at async eval (src/lib/ai/synthesis-engine.ts:1136:22)
    at async Semaphore.run (src/lib/ai/concurrency-semaphore.ts:46:14)
    at async runEnhancedSynthesisPipeline (src/lib/ai/synthesis-engine.ts:1288:16)
    at async Object.start (src/app/api/hybrid-synthesize/route.ts:137:43)
  55 |       // This resolves the issue where WASM and Python stdlib files are not bundled correctly
  56 |       const { loadPyodide } = await import('pyodide');
> 57 |       this.pyodide = await loadPyodide({
     |                      ^
  58 |         indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.29.1/full/'
  59 |       });
  60 |       await this.pyodide.loadPackage(['numpy', 'scipy']); {
  code: 'MODULE_NOT_FOUND'
}
[do-Calculus] Interventional tests will be disabled for this session
[Counterfactual] Generating scenarios to test mechanism robustness
[Error: ENOENT: no such file or directory, open '/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/https:/cdn.jsdelivr.net/pyodide/v0.29.1/full/python_stdlib.zip'] {
  errno: -2,
  code: 'ENOENT',
  syscall: 'open',
  path: '/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/https:/cdn.jsdelivr.net/pyodide/v0.29.1/full/python_stdlib.zip'
}
 ⨯ unhandledRejection: [Error: ENOENT: no such file or directory, open '/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/https:/cdn.jsdelivr.net/pyodide/v0.29.1/full/python_stdlib.zip'] {
  errno: -2,
  code: 'ENOENT',
  syscall: 'open',
  path: '/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/https:/cdn.jsdelivr.net/pyodide/v0.29.1/full/python_stdlib.zip'
}
 ⨯ unhandledRejection:  [Error: ENOENT: no such file or directory, open '/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/https:/cdn.jsdelivr.net/pyodide/v0.29.1/full/python_stdlib.zip'] {
  errno: -2,
  code: 'ENOENT',
  syscall: 'open',
  path: '/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/https:/cdn.jsdelivr.net/pyodide/v0.29.1/full/python_stdlib.zip'
}
[Error: ENOENT: no such file or directory, open '/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/https:/cdn.jsdelivr.net/pyodide/v0.29.1/full/pyodide.asm.wasm'] {
  errno: -2,
  code: 'ENOENT',
  syscall: 'open',
  path: '/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/https:/cdn.jsdelivr.net/pyodide/v0.29.1/full/pyodide.asm.wasm'
}
 ⨯ unhandledRejection: [Error: ENOENT: no such file or directory, open '/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/https:/cdn.jsdelivr.net/pyodide/v0.29.1/full/pyodide.asm.wasm'] {
  errno: -2,
  code: 'ENOENT',
  syscall: 'open',
  path: '/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/https:/cdn.jsdelivr.net/pyodide/v0.29.1/full/pyodide.asm.wasm'
}
 ⨯ unhandledRejection:  [Error: ENOENT: no such file or directory, open '/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/https:/cdn.jsdelivr.net/pyodide/v0.29.1/full/pyodide.asm.wasm'] {
  errno: -2,
  code: 'ENOENT',
  syscall: 'open',
  path: '/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/https:/cdn.jsdelivr.net/pyodide/v0.29.1/full/pyodide.asm.wasm'
}
[Error: ENOENT: no such file or directory, open '/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/https:/cdn.jsdelivr.net/pyodide/v0.29.1/full/pyodide-lock.json'] {
  errno: -2,
  code: 'ENOENT',
  syscall: 'open',
  path: '/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/https:/cdn.jsdelivr.net/pyodide/v0.29.1/full/pyodide-lock.json'
}
 ⨯ unhandledRejection: [Error: ENOENT: no such file or directory, open '/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/https:/cdn.jsdelivr.net/pyodide/v0.29.1/full/pyodide-lock.json'] {
  errno: -2,
  code: 'ENOENT',
  syscall: 'open',
  path: '/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/https:/cdn.jsdelivr.net/pyodide/v0.29.1/full/pyodide-lock.json'
}
 ⨯ unhandledRejection:  [Error: ENOENT: no such file or directory, open '/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/https:/cdn.jsdelivr.net/pyodide/v0.29.1/full/pyodide-lock.json'] {
  errno: -2,
  code: 'ENOENT',
  syscall: 'open',
  path: '/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/https:/cdn.jsdelivr.net/pyodide/v0.29.1/full/pyodide-lock.json'
}
[Tier 1] Using base SCM (physics only) for domain: Mechanistic Interpretability
[SCM] Validation result: true
[do-Calculus] Pyodide initialization failed: Error: Cannot find module 'file:///Users/lesz/Documents/Synthetic-Mind/synthesis-engine/https:/cdn.jsdelivr.net/pyodide/v0.29.1/full/pyodide.asm.js'
    at async CausalInterventionTester.initialize (src/lib/services/causal-interventions.ts:57:22)
    at async MasaAuditor.audit (src/lib/ai/masa-auditor.ts:242:5)
    at async eval (src/lib/ai/synthesis-engine.ts:1136:22)
    at async Semaphore.run (src/lib/ai/concurrency-semaphore.ts:46:14)
    at async runEnhancedSynthesisPipeline (src/lib/ai/synthesis-engine.ts:1288:16)
    at async Object.start (src/app/api/hybrid-synthesize/route.ts:137:43)
  55 |       // This resolves the issue where WASM and Python stdlib files are not bundled correctly
  56 |       const { loadPyodide } = await import('pyodide');
> 57 |       this.pyodide = await loadPyodide({
     |                      ^
  58 |         indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.29.1/full/'
  59 |       });
  60 |       await this.pyodide.loadPackage(['numpy', 'scipy']); {
  code: 'MODULE_NOT_FOUND'
}
[do-Calculus] Interventional tests will be disabled for this session
[Counterfactual] Generating scenarios to test mechanism robustness
[Error: ENOENT: no such file or directory, open '/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/https:/cdn.jsdelivr.net/pyodide/v0.29.1/full/python_stdlib.zip'] {
  errno: -2,
  code: 'ENOENT',
  syscall: 'open',
  path: '/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/https:/cdn.jsdelivr.net/pyodide/v0.29.1/full/python_stdlib.zip'
}
 ⨯ unhandledRejection: [Error: ENOENT: no such file or directory, open '/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/https:/cdn.jsdelivr.net/pyodide/v0.29.1/full/python_stdlib.zip'] {
  errno: -2,
  code: 'ENOENT',
  syscall: 'open',
  path: '/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/https:/cdn.jsdelivr.net/pyodide/v0.29.1/full/python_stdlib.zip'
}
 ⨯ unhandledRejection:  [Error: ENOENT: no such file or directory, open '/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/https:/cdn.jsdelivr.net/pyodide/v0.29.1/full/python_stdlib.zip'] {
  errno: -2,
  code: 'ENOENT',
  syscall: 'open',
  path: '/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/https:/cdn.jsdelivr.net/pyodide/v0.29.1/full/python_stdlib.zip'
}
[Error: ENOENT: no such file or directory, open '/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/https:/cdn.jsdelivr.net/pyodide/v0.29.1/full/pyodide.asm.wasm'] {
  errno: -2,
  code: 'ENOENT',
  syscall: 'open',
  path: '/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/https:/cdn.jsdelivr.net/pyodide/v0.29.1/full/pyodide.asm.wasm'
}
 ⨯ unhandledRejection: [Error: ENOENT: no such file or directory, open '/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/https:/cdn.jsdelivr.net/pyodide/v0.29.1/full/pyodide.asm.wasm'] {
  errno: -2,
  code: 'ENOENT',
  syscall: 'open',
  path: '/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/https:/cdn.jsdelivr.net/pyodide/v0.29.1/full/pyodide.asm.wasm'
}
 ⨯ unhandledRejection:  [Error: ENOENT: no such file or directory, open '/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/https:/cdn.jsdelivr.net/pyodide/v0.29.1/full/pyodide.asm.wasm'] {
  errno: -2,
  code: 'ENOENT',
  syscall: 'open',
  path: '/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/https:/cdn.jsdelivr.net/pyodide/v0.29.1/full/pyodide.asm.wasm'
}
[Error: ENOENT: no such file or directory, open '/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/https:/cdn.jsdelivr.net/pyodide/v0.29.1/full/pyodide-lock.json'] {
  errno: -2,
  code: 'ENOENT',
  syscall: 'open',
  path: '/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/https:/cdn.jsdelivr.net/pyodide/v0.29.1/full/pyodide-lock.json'
}
 ⨯ unhandledRejection: [Error: ENOENT: no such file or directory, open '/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/https:/cdn.jsdelivr.net/pyodide/v0.29.1/full/pyodide-lock.json'] {
  errno: -2,
  code: 'ENOENT',
  syscall: 'open',
  path: '/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/https:/cdn.jsdelivr.net/pyodide/v0.29.1/full/pyodide-lock.json'
}
 ⨯ unhandledRejection:  [Error: ENOENT: no such file or directory, open '/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/https:/cdn.jsdelivr.net/pyodide/v0.29.1/full/pyodide-lock.json'] {
  errno: -2,
  code: 'ENOENT',
  syscall: 'open',
  path: '/Users/lesz/Documents/Synthetic-Mind/synthesis-engine/https:/cdn.jsdelivr.net/pyodide/v0.29.1/full/pyodide-lock.json'
}
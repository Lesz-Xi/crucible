// vitest-setup.ts — runs before any test file in each worker
// Fix: Next.js SWC binary uses TMPDIR to create an SSR temp dir.
// /var/folders is EPERM in the sandbox — override to /tmp.
process.env.TMPDIR = '/tmp';

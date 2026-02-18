// Stub for next/server in vitest environment
export const NextResponse = {
    json: (data: unknown, init?: ResponseInit) => new Response(JSON.stringify(data), {
        ...init,
        headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    }),
    next: () => new Response(null, { status: 200 }),
    redirect: (url: string) => new Response(null, { status: 302, headers: { Location: url } }),
};

export const NextRequest = class {
    url: string;
    method: string;
    headers: Headers;
    body: ReadableStream | null;
    constructor(url: string, init?: RequestInit) {
        this.url = url;
        this.method = init?.method || 'GET';
        this.headers = new Headers(init?.headers as HeadersInit);
        this.body = null;
    }
    async json() { return {}; }
    async text() { return ''; }
};

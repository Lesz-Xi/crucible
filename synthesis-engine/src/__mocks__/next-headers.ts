// Stub for next/headers in vitest environment
export const headers = () => new Headers();
export const cookies = () => ({
    get: (_name: string) => undefined,
    set: (_name: string, _value: string) => { },
    delete: (_name: string) => { },
    has: (_name: string) => false,
    getAll: () => [],
});

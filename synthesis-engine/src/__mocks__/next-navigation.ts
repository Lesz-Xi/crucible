// Stub for next/navigation in vitest environment
export const useRouter = () => ({
    push: (_url: string) => { },
    replace: (_url: string) => { },
    back: () => { },
    forward: () => { },
    refresh: () => { },
    prefetch: (_url: string) => { },
});
export const usePathname = () => '/';
export const useSearchParams = () => new URLSearchParams();
export const redirect = (_url: string) => { };
export const notFound = () => { };

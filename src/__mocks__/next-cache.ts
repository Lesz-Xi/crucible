// Stub for next/cache in vitest environment
export const revalidatePath = (_path: string) => { };
export const revalidateTag = (_tag: string) => { };
export const unstable_cache = <T>(fn: () => Promise<T>) => fn;
export const cache = <T extends (...args: unknown[]) => unknown>(fn: T) => fn;

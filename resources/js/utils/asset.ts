/**
 * Returns the proper asset path, dynamically detecting if the app is hosted
 * under a subpath (such as /test or /v2) or at the domain root.
 */
export function asset(path: string): string {
    const clean = path.startsWith('/') ? path.slice(1) : path;
    if (typeof window !== 'undefined') {
        const pathname = window.location.pathname;
        if (pathname.startsWith('/test')) {
            return `/test/${clean}`;
        }
        if (pathname.startsWith('/v2')) {
            return `/v2/${clean}`;
        }
        if (pathname.startsWith('/nueva')) {
            return `/nueva/${clean}`;
        }
    }
    return `/${clean}`;
}

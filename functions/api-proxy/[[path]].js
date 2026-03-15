/**
 * Cloudflare Pages Function — CORS proxy for api.xmoj-bbs.me
 *
 * All fetch() calls in messages.html are directed here (same-origin, so no
 * CORS preflight is ever blocked).  This function forwards the POST body
 * server-side to https://api.xmoj-bbs.me/, adds CORS response headers, and
 * streams the reply back to the client.
 *
 * Security:
 *  • Only POST and OPTIONS (CORS preflight) methods are handled.
 *  • The constructed target URL is verified to still start with API_TARGET
 *    before the upstream request is made, preventing SSRF via absolute-URL
 *    injection in the path parameter.
 *  • Only a fixed allow-list of request headers is forwarded upstream.
 */

const API_TARGET = 'https://api.xmoj-bbs.me/';

// Headers from the client that we forward to the upstream API.
const FORWARD_REQUEST_HEADERS = [
    'content-type',
    'cache-control',
    'xmoj-userid',
    'xmoj-script-version',
];

const CORS_HEADERS = {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Cache-Control, XMOJ-UserID, XMOJ-Script-Version',
    'Access-Control-Max-Age':       '86400',
};

/** Handle CORS preflight. */
export async function onRequestOptions() {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
}

/** Proxy POST requests to api.xmoj-bbs.me. */
export async function onRequestPost({ request, params }) {
    // Build the path from the catch-all route parameter.
    const pathSegments = Array.isArray(params.path)
        ? params.path
        : (params.path ? [params.path] : []);
    const path = pathSegments.join('/');

    // Resolve the target URL. new URL() normalises path traversal
    // (e.g. "../../" stays within the same origin), but an absolute-URL
    // payload would override the base — the guard below catches that.
    let targetUrl;
    try {
        targetUrl = new URL(path, API_TARGET).href;
    } catch (_) {
        return new Response('Bad Request', { status: 400, headers: CORS_HEADERS });
    }

    // SSRF guard: the resolved URL must still point at api.xmoj-bbs.me.
    if (!targetUrl.startsWith(API_TARGET)) {
        return new Response('Forbidden', { status: 403, headers: CORS_HEADERS });
    }

    // Forward only the allow-listed headers to avoid leaking cookies etc.
    const forwardHeaders = new Headers();
    for (const name of FORWARD_REQUEST_HEADERS) {
        const value = request.headers.get(name);
        if (value) forwardHeaders.set(name, value);
    }

    let upstream;
    try {
        upstream = await fetch(targetUrl, {
            method:  'POST',
            headers: forwardHeaders,
            body:    request.body,
        });
    } catch (err) {
        return new Response(
            JSON.stringify({ Success: false, Message: 'Proxy upstream error: ' + err.message }),
            { status: 502, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
        );
    }

    const responseHeaders = new Headers(CORS_HEADERS);
    const ct = upstream.headers.get('content-type');
    if (ct) responseHeaders.set('Content-Type', ct);

    return new Response(upstream.body, {
        status:  upstream.status,
        headers: responseHeaders,
    });
}

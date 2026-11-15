import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'

import { Client } from '@lib/request'

/**
 * The dashboard may be served at `/ui/` or behind a reverse-proxy prefix such
 * as `/clash/ui/`. The API is expected to live at the parent path. Deployments
 * whose API is elsewhere can add this tag to their `index.html`:
 *
 *   <meta name="clash-api-base" content="/clash">
 *
 * Only same-origin paths are accepted.
 */
export function getAPIBase () {
    const content = document.querySelector('meta[name="clash-api-base"]')?.getAttribute('content')?.trim()
    if (content) {
        try {
            const url = new URL(content, window.location.origin)
            if (url.origin === window.location.origin) {
                return url.pathname.replace(/\/$/, '') || '/'
            }
        } catch {
            // Fall through to the path-based guess.
        }
    }

    const path = window.location.pathname
    const index = path.lastIndexOf('/ui')
    if (index !== -1 && (path.length === index + 3 || path[index + 3] === '/')) {
        return path.slice(0, index) || '/'
    }

    return '/'
}

/**
 * Prefer a secret in the hash route query (`#/overview?secret=...`) so it is
 * never sent to the server or external referrers. The outer query is kept for
 * backward compatibility with older bookmarks.
 */
export function useAPISecret () {
    const location = useLocation()
    const hashSecret = new URLSearchParams(location.search).get('secret')
    if (hashSecret != null) {
        return hashSecret
    }

    return new URLSearchParams(window.location.search).get('secret') ?? ''
}

export function useClient () {
    const secret = useAPISecret()

    return useMemo(() => new Client(getAPIBase(), secret), [secret])
}

export function getWebSocketBase () {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const base = getAPIBase().replace(/\/$/, '')
    return `${protocol}//${window.location.host}${base}`
}

function base64UrlEncode (value: string) {
    const bytes = new TextEncoder().encode(value)
    let binary = ''
    for (const byte of bytes) {
        binary += String.fromCharCode(byte)
    }

    return btoa(binary)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '')
}

/**
 * WebSocket URLs end up in proxy and access logs. Browsers cannot set an
 * Authorization header for WebSocket connections, so send the secret as a
 * subprotocol instead. `clash` is echoed by the server; the secret-bearing
 * entry stays out of the request target.
 */
export function getWebSocketProtocols (secret: string) {
    const protocols = ['clash']
    if (secret) {
        protocols.push(`clash-secret.${base64UrlEncode(secret)}`)
    }

    return protocols
}

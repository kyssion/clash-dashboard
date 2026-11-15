import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'

import { Client } from '@lib/request'

/**
 * The dashboard may be served at `/ui/` or behind a reverse-proxy prefix such
 * as `/clash/ui/`. The API is expected to live at the parent path.
 */
export function getAPIBase () {
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

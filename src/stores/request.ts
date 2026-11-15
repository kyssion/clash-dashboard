import { useMemo } from 'react'

import { Client } from '@lib/request'

/**
 * The dashboard is served by clash itself, so the API is always on the same
 * origin as the page. Only the secret (if the controller requires one) needs
 * to be provided, e.g. http://127.0.0.1:9090/ui/?secret=xxx#/proxies
 */
export function useAPISecret () {
    return new URLSearchParams(window.location.search).get('secret') ?? ''
}

export function useClient () {
    const secret = useAPISecret()

    return useMemo(() => new Client(window.location.origin, secret), [secret])
}

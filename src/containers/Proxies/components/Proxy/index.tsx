import type { AxiosError } from 'axios'
import classnames from 'classnames'
import { useSetAtom } from 'jotai'
import { ResultAsync } from 'neverthrow'
import { useMemo, useLayoutEffect, useCallback } from 'react'

import EE, { Action } from '@lib/event'
import { type Proxy as IProxy } from '@lib/request'
import { type BaseComponentProps } from '@models'
import { useClient, useProxy, proxyProvider } from '@stores'

import './style.scss'

interface ProxyProps extends BaseComponentProps {
    config: IProxy
    providerName?: string
}

const TagColors = {
    '#909399': 0,
    '#00c520': 260,
    '#ff9a28': 600,
    '#ff3e5e': Infinity,
}

export function Proxy (props: ProxyProps) {
    const { config, className, providerName } = props
    const { set } = useProxy()
    const setProviders = useSetAtom(proxyProvider)
    const client = useClient()

    const getDelay = useCallback(async (name: string) => {
        const { data: { delay } } = providerName
            ? await client.getProviderProxyDelay(providerName, name)
            : await client.getProxyDelay(name)
        return delay
    }, [client, providerName])

    const speedTest = useCallback(async function () {
        const result = await ResultAsync.fromPromise(getDelay(config.name), e => e as AxiosError)

        const validDelay = result.isErr() ? 0 : result.value
        set(draft => {
            const proxy = draft.proxies.find(p => p.name === config.name)
            if (proxy != null) {
                proxy.history.push({ time: Date.now().toString(), delay: validDelay })
            }
        })
        setProviders(providers => providers.map(provider => ({
            ...provider,
            proxies: provider.proxies.map(proxy => (
                proxy.name === config.name
                    ? { ...proxy, history: [...proxy.history, { time: Date.now().toString(), delay: validDelay }] }
                    : proxy
            )),
        })))
    }, [config.name, getDelay, set, setProviders])

    const delay = config.history?.length ? config.history.slice(-1)[0].delay : 0
    const meanDelay = config.history?.length ? config.history.slice(-1)[0].meanDelay : undefined

    const delayText = delay === 0 ? '-' : `${delay}ms`
    const meanDelayText = !meanDelay ? '' : `(${meanDelay}ms)`

    useLayoutEffect(() => {
        const handler = () => { speedTest() }
        EE.subscribe(Action.SPEED_NOTIFY, handler)
        return () => EE.unsubscribe(Action.SPEED_NOTIFY, handler)
    }, [speedTest])

    const hasError = useMemo(() => delay === 0, [delay])
    const color = useMemo(
        () => Object.keys(TagColors).find(
             
            threshold => (meanDelay || delay) <= TagColors[threshold as keyof typeof TagColors],
        ),
        [delay, meanDelay],
    )

    const backgroundColor = hasError ? '#E5E7EB' : color
    return (
        <div className={classnames('proxy-item', { 'opacity-50': hasError }, className)}>
            <div className="flex-1">
                <span
                    className={classnames('rounded-sm py-[3px] px-1 text-[10px] text-white', { 'text-gray-600': hasError })}
                    style={{ backgroundColor }}>
                    {config.type}
                </span>
                <p className="proxy-name">{config.name}</p>
            </div>
            <div className="h-full flex flex-col items-center justify-center text-[10px] md:h-[18px] md:flex-row md:justify-between space-y-3 md:space-y-0">
                <p >{delayText}{meanDelayText}</p>
                { config.udp && <p className="rounded bg-gray-200 p-[3px] text-gray-600">UDP</p> }
            </div>
        </div>
    )
}

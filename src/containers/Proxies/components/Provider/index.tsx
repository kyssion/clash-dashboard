import { useEffect, useMemo, useRef } from 'react'

import { Card, Tag, Icon, Loading, error as showError } from '@components'
import { compareDesc } from '@containers/Proxies'
import { Proxy } from '@containers/Proxies/components/Proxy'
import { fromNow } from '@lib/date'
import { useVisible } from '@lib/hook'
import { type Provider as IProvider, type Proxy as IProxy } from '@lib/request'
import { useClient, useI18n, useProxyProviders } from '@stores'

import './style.scss'

interface ProvidersProps {
    provider: IProvider
}

export function Provider (props: ProvidersProps) {
    const { update } = useProxyProviders()
    const { translation, lang } = useI18n()
    const client = useClient()

    const { provider } = props
    const { t } = translation('Proxies')

    const { visible, hide, show } = useVisible()

    const mountedRef = useRef(true)
    const pollingRef = useRef(false)

    useEffect(() => {
        mountedRef.current = true
        return () => {
            mountedRef.current = false
        }
    }, [])

    async function handleHealthChech () {
        if (pollingRef.current) {
            return
        }

        pollingRef.current = true
        show()
        try {
            await client.healthCheckProvider(provider.name, false)

            let finished = false
            for (let i = 0; i < 120; i++) {
                await new Promise(resolve => setTimeout(resolve, 500))
                if (!mountedRef.current) {
                    return
                }

                const status = await client.getProviderHealthCheckStatus(provider.name)
                if (status.status === 204) {
                    finished = true
                    break
                }
            }

            if (!mountedRef.current) {
                return
            }

            await update()
            if (!finished) {
                showError(t('providerActionError'))
            }
        } catch {
            if (mountedRef.current) {
                showError(t('providerActionError'))
            }
        } finally {
            pollingRef.current = false
            if (mountedRef.current) {
                hide()
            }
        }
    }

    function handleUpdate () {
        show()
        client.updateProvider(provider.name)
            .then(async () => await update())
            .catch(() => showError(t('providerActionError')))
            .finally(() => hide())
    }

    const proxies = useMemo(() => {
        return (provider.proxies as IProxy[]).slice().sort((a, b) => -1 * compareDesc(a, b))
    }, [provider.proxies])

    return (
        <Card className="proxy-provider">
            <Loading visible={visible} />
            <div className="flex flex-col justify-between md:flex-row md:items-center">
                <div className="flex items-center">
                    <span className="mr-6">{ provider.name }</span>
                    <Tag>{ provider.vehicleType }</Tag>
                </div>
                <div className="flex items-center pt-3 md:pt-0">
                    {
                        provider.updatedAt &&
                        <span className="text-sm">{ `${t('providerUpdateTime')}: ${fromNow(new Date(provider.updatedAt), lang)}`}</span>
                    }
                    <Icon className="cursor-pointer pl-5 text-red" type="healthcheck" size={18} onClick={handleHealthChech} />
                    <Icon className="cursor-pointer pl-5" type="update" size={18} onClick={handleUpdate} />
                </div>
            </div>
            <ul className="proxies-list">
                {
                    proxies.map((p: IProxy) => (
                        <li key={p.name}>
                            <Proxy className="proxy-provider-item" config={p} providerName={provider.name} />
                        </li>
                    ))
                }
            </ul>
        </Card>
    )
}

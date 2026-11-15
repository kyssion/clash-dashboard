import { capitalize } from 'lodash-es'
import { useEffect, useMemo, useState } from 'react'

import {
    Header,
    Card,
    Switch,
    ButtonSelect,
    Input,
    Select,
    Button,
    type ButtonSelectOptions,
    success as showSuccess,
    error as showError,
} from '@components'
import { type Lang } from '@i18n'
import { useObject } from '@lib/hook'
import { useI18n, useGeneral, useVersion, useClient } from '@stores'
import './style.scss'

const languageOptions: ButtonSelectOptions[] = [{ label: '中文', value: 'zh_CN' }, { label: 'English', value: 'en_US' }]

const logLevelOptions = [
    { label: 'Debug', value: 'debug' },
    { label: 'Info', value: 'info' },
    { label: 'Warning', value: 'warning' },
    { label: 'Error', value: 'error' },
    { label: 'Silent', value: 'silent' },
]

function isValidPort (port: number) {
    return Number.isInteger(port) && port >= 0 && port <= 65535
}

export default function Settings () {
    const { premium } = useVersion()
    const { general, update: fetchGeneral } = useGeneral()
    const { translation, setLang, lang } = useI18n()
    const { t } = translation('Settings')
    const client = useClient()
    const [reloading, setReloading] = useState(false)
    const [info, set] = useObject({
        socks5ProxyPort: 7891,
        httpProxyPort: 7890,
        mixedProxyPort: 0,
        redirProxyPort: 0,
        tproxyProxyPort: 0,
        bindAddress: '*',
    })

    useEffect(() => {
        set('socks5ProxyPort', general?.socksPort ?? 0)
        set('httpProxyPort', general?.port ?? 0)
        set('mixedProxyPort', general?.mixedPort ?? 0)
        set('redirProxyPort', general?.redirPort ?? 0)
        set('tproxyProxyPort', general?.tproxyPort ?? 0)
        set('bindAddress', general?.bindAddress ?? '*')
    }, [general, set])

    async function handleProxyModeChange (mode: string) {
        await client.updateConfig({ mode })
        await fetchGeneral()
    }

    function changeLanguage (language: Lang) {
        setLang(language)
    }

    async function handleHttpPortSave () {
        if (!isValidPort(info.httpProxyPort)) {
            set('httpProxyPort', general?.port ?? 0)
            return
        }

        await client.updateConfig({ port: info.httpProxyPort })
        await fetchGeneral()
    }

    async function handleSocksPortSave () {
        if (!isValidPort(info.socks5ProxyPort)) {
            set('socks5ProxyPort', general?.socksPort ?? 0)
            return
        }

        await client.updateConfig({ 'socks-port': info.socks5ProxyPort })
        await fetchGeneral()
    }

    async function handleMixedPortSave () {
        if (!isValidPort(info.mixedProxyPort)) {
            set('mixedProxyPort', general?.mixedPort ?? 0)
            return
        }

        await client.updateConfig({ 'mixed-port': info.mixedProxyPort })
        await fetchGeneral()
    }

    async function handleRedirPortSave () {
        if (!isValidPort(info.redirProxyPort)) {
            set('redirProxyPort', general?.redirPort ?? 0)
            return
        }

        await client.updateConfig({ 'redir-port': info.redirProxyPort })
        await fetchGeneral()
    }

    async function handleTProxyPortSave () {
        if (!isValidPort(info.tproxyProxyPort)) {
            set('tproxyProxyPort', general?.tproxyPort ?? 0)
            return
        }

        await client.updateConfig({ 'tproxy-port': info.tproxyProxyPort })
        await fetchGeneral()
    }

    async function handleBindAddressSave () {
        if (!info.bindAddress.trim()) {
            set('bindAddress', general?.bindAddress ?? '*')
            return
        }

        await client.updateConfig({ 'bind-address': info.bindAddress.trim() })
        await fetchGeneral()
    }

    async function handleAllowLanChange (state: boolean) {
        await client.updateConfig({ 'allow-lan': state })
        await fetchGeneral()
    }

    async function handleIPv6Change (state: boolean) {
        await client.updateConfig({ ipv6: state })
        await fetchGeneral()
    }

    async function handleLogLevelChange (level: string) {
        await client.updateConfig({ 'log-level': level })
        await fetchGeneral()
    }

    async function handleReloadConfig () {
        setReloading(true)
        try {
            await client.reloadConfig()
            await fetchGeneral()
            showSuccess(t('reloadSuccess'))
        } catch {
            showError(t('reloadError'))
        } finally {
            setReloading(false)
        }
    }

    const { allowLan, mode, ipv6, logLevel, authentication } = general

    const proxyModeOptions = useMemo(() => {
        const options = [
            { label: t('values.global'), value: 'Global' },
            { label: t('values.rules'), value: 'Rule' },
            { label: t('values.direct'), value: 'Direct' },
        ] as Array<{ label: string, value: string }>
        if (premium) {
            options.push({ label: t('values.script'), value: 'Script' })
        }
        return options
    }, [t, premium])

    return (
        <div className="page">
            <Header title={t('title')}>
                <Button type="primary" onClick={handleReloadConfig} disabled={reloading}>
                    {reloading ? t('reloading') : t('reloadConfig')}
                </Button>
            </Header>

            <Card className="settings-card">
                <div className="flex flex-wrap">
                    <div className="w-full flex items-center justify-between px-8 py-3 md:w-1/2">
                        <span className="label font-bold">{t('labels.language')}</span>
                        <ButtonSelect options={languageOptions} value={lang} onSelect={(lang) => changeLanguage(lang as Lang)} />
                    </div>
                    <div className="w-full flex items-center justify-between px-8 py-3 md:w-1/2">
                        <span className="label font-bold">{t('labels.allowConnectFromLan')}</span>
                        <Switch checked={allowLan} onChange={handleAllowLanChange} />
                    </div>
                </div>
                <div className="flex flex-wrap">
                    <div className="w-full flex items-center justify-between px-8 py-3 md:w-1/2">
                        <span className="label font-bold">{t('labels.ipv6')}</span>
                        <Switch checked={ipv6 ?? false} onChange={handleIPv6Change} />
                    </div>
                    <div className="w-full flex items-center justify-between px-8 py-3 md:w-1/2">
                        <span className="label font-bold">{t('labels.logLevel')}</span>
                        <Select
                            className="w-32"
                            options={logLevelOptions}
                            value={logLevel ?? 'info'}
                            onSelect={handleLogLevelChange}
                        />
                    </div>
                </div>
            </Card>

            <Card className="settings-card">
                <div className="flex flex-wrap">
                    <div className="w-full flex items-center justify-between px-8 py-3 md:w-1/2">
                        <span className="label font-bold">{t('labels.proxyMode')}</span>
                        <ButtonSelect
                            options={proxyModeOptions}
                            value={capitalize(mode)}
                            onSelect={handleProxyModeChange}
                        />
                    </div>
                    <div className="w-full flex items-center justify-between px-8 py-3 md:w-1/2">
                        <span className="label font-bold">{t('labels.socks5ProxyPort')}</span>
                        <Input
                            className="w-28"
                            value={info.socks5ProxyPort}
                            onChange={socks5ProxyPort => set('socks5ProxyPort', +socks5ProxyPort)}
                            onBlur={handleSocksPortSave}
                        />
                    </div>
                </div>
                <div className="flex flex-wrap">
                    <div className="w-full flex items-center justify-between px-8 py-3 md:w-1/2">
                        <span className="label font-bold">{t('labels.httpProxyPort')}</span>
                        <Input
                            className="w-28"
                            value={info.httpProxyPort}
                            onChange={httpProxyPort => set('httpProxyPort', +httpProxyPort)}
                            onBlur={handleHttpPortSave}
                        />
                    </div>
                    <div className="w-full flex items-center justify-between px-8 py-3 md:w-1/2">
                        <span className="label font-bold">{t('labels.mixedProxyPort')}</span>
                        <Input
                            className="w-28"
                            value={info.mixedProxyPort}
                            onChange={mixedProxyPort => set('mixedProxyPort', +mixedProxyPort)}
                            onBlur={handleMixedPortSave}
                        />
                    </div>
                </div>
                <div className="flex flex-wrap">
                    <div className="w-full flex items-center justify-between px-8 py-3 md:w-1/2">
                        <span className="label font-bold">{t('labels.bindAddress')}</span>
                        <Input
                            className="w-40"
                            value={info.bindAddress}
                            onChange={bindAddress => set('bindAddress', bindAddress)}
                            onBlur={handleBindAddressSave}
                        />
                    </div>
                    <div className="w-full flex items-center justify-between px-8 py-3 md:w-1/2">
                        <span className="label font-bold">{t('labels.externalController')}</span>
                        <span className="external-controller">{window.location.host}</span>
                    </div>
                </div>
            </Card>

            <Card className="settings-card">
                <div className="flex flex-wrap">
                    <div className="w-full flex items-center justify-between px-8 py-3 md:w-1/2">
                        <span className="label font-bold">{t('labels.redirProxyPort')}</span>
                        <Input
                            className="w-28"
                            value={info.redirProxyPort}
                            onChange={redirProxyPort => set('redirProxyPort', +redirProxyPort)}
                            onBlur={handleRedirPortSave}
                        />
                    </div>
                    <div className="w-full flex items-center justify-between px-8 py-3 md:w-1/2">
                        <span className="label font-bold">{t('labels.tproxyProxyPort')}</span>
                        <Input
                            className="w-28"
                            value={info.tproxyProxyPort}
                            onChange={tproxyProxyPort => set('tproxyProxyPort', +tproxyProxyPort)}
                            onBlur={handleTProxyPortSave}
                        />
                    </div>
                </div>
                <div className="flex flex-wrap">
                    <div className="w-full flex items-center justify-between px-8 py-3 md:w-1/2">
                        <span className="label font-bold">{t('labels.authentication')}</span>
                        <span className="external-controller">
                            {authentication?.length ? authentication.join(', ') : '-'}
                        </span>
                    </div>
                    <div className="w-1/2 px-8"></div>
                </div>
            </Card>
        </div>
    )
}

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
import { type Config } from '@lib/request'
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

function displayPort (port: number) {
    return Number.isNaN(port) ? '' : port
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

    const configLoaded = general?.port != null || general?.socksPort != null

    useEffect(() => {
        if (!configLoaded) {
            return
        }

        set('socks5ProxyPort', general?.socksPort ?? 0)
        set('httpProxyPort', general?.port ?? 0)
        set('mixedProxyPort', general?.mixedPort ?? 0)
        set('redirProxyPort', general?.redirPort ?? 0)
        set('tproxyProxyPort', general?.tproxyPort ?? 0)
        set('bindAddress', general?.bindAddress ?? '*')
    }, [configLoaded, general, set])

    async function saveConfig (config: Partial<Config>) {
        try {
            await client.updateConfig(config)
            await fetchGeneral()
        } catch {
            showError(t('updateError'))
        }
    }

    async function handleProxyModeChange (mode: string) {
        await saveConfig({ mode })
    }

    function changeLanguage (language: Lang) {
        setLang(language)
    }

    async function handleHttpPortSave () {
        if (!isValidPort(info.httpProxyPort)) {
            set('httpProxyPort', general?.port ?? 0)
            return
        }
        if (info.httpProxyPort === general?.port) {
            return
        }

        await saveConfig({ port: info.httpProxyPort })
    }

    async function handleSocksPortSave () {
        if (!isValidPort(info.socks5ProxyPort)) {
            set('socks5ProxyPort', general?.socksPort ?? 0)
            return
        }
        if (info.socks5ProxyPort === general?.socksPort) {
            return
        }

        await saveConfig({ 'socks-port': info.socks5ProxyPort })
    }

    async function handleMixedPortSave () {
        if (!isValidPort(info.mixedProxyPort)) {
            set('mixedProxyPort', general?.mixedPort ?? 0)
            return
        }
        if (info.mixedProxyPort === general?.mixedPort) {
            return
        }

        await saveConfig({ 'mixed-port': info.mixedProxyPort })
    }

    async function handleRedirPortSave () {
        if (!isValidPort(info.redirProxyPort)) {
            set('redirProxyPort', general?.redirPort ?? 0)
            return
        }
        if (info.redirProxyPort === general?.redirPort) {
            return
        }

        await saveConfig({ 'redir-port': info.redirProxyPort })
    }

    async function handleTProxyPortSave () {
        if (!isValidPort(info.tproxyProxyPort)) {
            set('tproxyProxyPort', general?.tproxyPort ?? 0)
            return
        }
        if (info.tproxyProxyPort === general?.tproxyPort) {
            return
        }

        await saveConfig({ 'tproxy-port': info.tproxyProxyPort })
    }

    async function handleBindAddressSave () {
        const bindAddress = info.bindAddress.trim()
        if (!bindAddress) {
            set('bindAddress', general?.bindAddress ?? '*')
            return
        }
        if (bindAddress === general?.bindAddress) {
            return
        }

        await saveConfig({ 'bind-address': bindAddress })
    }

    async function handleAllowLanChange (state: boolean) {
        if (state === general?.allowLan) {
            return
        }
        await saveConfig({ 'allow-lan': state })
    }

    async function handleIPv6Change (state: boolean) {
        if (state === general?.ipv6) {
            return
        }
        await saveConfig({ ipv6: state })
    }

    async function handleLogLevelChange (level: string) {
        if (level === general?.logLevel) {
            return
        }
        await saveConfig({ 'log-level': level })
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
                            value={displayPort(info.socks5ProxyPort)}
                            onChange={socks5ProxyPort => set('socks5ProxyPort', socks5ProxyPort === '' ? NaN : +socks5ProxyPort)}
                            onBlur={handleSocksPortSave}
                        />
                    </div>
                </div>
                <div className="flex flex-wrap">
                    <div className="w-full flex items-center justify-between px-8 py-3 md:w-1/2">
                        <span className="label font-bold">{t('labels.httpProxyPort')}</span>
                        <Input
                            className="w-28"
                            value={displayPort(info.httpProxyPort)}
                            onChange={httpProxyPort => set('httpProxyPort', httpProxyPort === '' ? NaN : +httpProxyPort)}
                            onBlur={handleHttpPortSave}
                        />
                    </div>
                    <div className="w-full flex items-center justify-between px-8 py-3 md:w-1/2">
                        <span className="label font-bold">{t('labels.mixedProxyPort')}</span>
                        <Input
                            className="w-28"
                            value={displayPort(info.mixedProxyPort)}
                            onChange={mixedProxyPort => set('mixedProxyPort', mixedProxyPort === '' ? NaN : +mixedProxyPort)}
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
                            value={displayPort(info.redirProxyPort)}
                            onChange={redirProxyPort => set('redirProxyPort', redirProxyPort === '' ? NaN : +redirProxyPort)}
                            onBlur={handleRedirPortSave}
                        />
                    </div>
                    <div className="w-full flex items-center justify-between px-8 py-3 md:w-1/2">
                        <span className="label font-bold">{t('labels.tproxyProxyPort')}</span>
                        <Input
                            className="w-28"
                            value={displayPort(info.tproxyProxyPort)}
                            onChange={tproxyProxyPort => set('tproxyProxyPort', tproxyProxyPort === '' ? NaN : +tproxyProxyPort)}
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

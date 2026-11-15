import dayjs from 'dayjs'
import { lowerCase } from 'lodash-es'
import { useLayoutEffect, useEffect, useRef, useState } from 'react'

import { Select, Card, Header, Button } from '@components'
import { type Log } from '@models/Log'
import { useConfig, useGeneral, useI18n, useLogsStreamReader } from '@stores'

import './style.scss'

const logLevelOptions = [
    { label: 'Default', value: '' },
    { label: 'Debug', value: 'debug' },
    { label: 'Info', value: 'info' },
    { label: 'Warn', value: 'warning' },
    { label: 'Error', value: 'error' },
    { label: 'Silent', value: 'silent' },
]
const logMap = new Map([
    ['debug', 'text-teal-500'],
    ['info', 'text-sky-500'],
    ['warning', 'text-pink-500'],
    ['error', 'text-rose-500'],
])
const maxLogs = 1000

export default function Logs () {
    const listRef = useRef<HTMLUListElement>(null)
    const logsRef = useRef<Log[]>([])
    const [logs, setLogs] = useState<Log[]>([])
    const { translation } = useI18n()
    const { data: { logLevel }, set: setConfig } = useConfig()
    const { general: { logLevel: configLevel } } = useGeneral()
    const { t } = translation('Logs')
    const logsStreamReader = useLogsStreamReader()
    const autoScrollRef = useRef(true)

    const isConfigSilent = lowerCase(configLevel) === 'silent'

    useLayoutEffect(() => {
        const ul = listRef.current
        if (ul != null && autoScrollRef.current) {
            ul.scrollTop = ul.scrollHeight
        }
    })

    function handleScroll () {
        const ul = listRef.current
        if (ul == null) {
            return
        }

        autoScrollRef.current = ul.scrollTop + ul.clientHeight >= ul.scrollHeight - 10
    }

    function handleClear () {
        logsStreamReader.clear()
        logsRef.current = []
        setLogs([])
    }

    useEffect(() => {
        function handleLog (newLogs: Log[]) {
            const logs = logsRef.current.concat(newLogs.map(d => ({ ...d, time: new Date() })))
            logsRef.current = logs.length > maxLogs ? logs.slice(logs.length - maxLogs) : logs
            setLogs(logsRef.current)
        }

        if (logsStreamReader != null) {
            logsStreamReader.subscribe('data', handleLog)
            logsRef.current = logsStreamReader.buffer().map(log => ({ ...log, time: new Date() }))
            setLogs(logsRef.current)
        }
        return () => logsStreamReader?.unsubscribe('data', handleLog)
    }, [logsStreamReader])

    return (
        <div className="page">
            <Header title={ t('title') } >
                <span className="mr-2 text-sm text-primary-darken">{t('levelLabel')}:</span>
                <Select
                    disabled={isConfigSilent}
                    options={logLevelOptions}
                    value={isConfigSilent ? 'silent' : logLevel}
                    onSelect={level => setConfig(c => { c.logLevel = level })}
                />
                <Button className="ml-2" onClick={handleClear}>{t('clear')}</Button>
            </Header>

            <Card className="mt-2.5 flex flex-1 flex-col md:mt-4">
                <ul className="logs-panel" ref={listRef} onScroll={handleScroll}>
                    {
                        logs.map(
                            (log, index) => (
                                <li className="inline-block text-[11px] leading-5" key={index}>
                                    <span className="mr-2 text-orange-400">[{ dayjs(log.time).format('YYYY-MM-DD HH:mm:ss') }]</span>
                                    <span className={logMap.get(log.type)}>[{ log.type.toUpperCase() }]</span>
                                    <span> { log.payload }</span>
                                </li>
                            ),
                        )
                    }
                </ul>
            </Card>
        </div>
    )
}

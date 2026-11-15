import { useEffect, useMemo, useRef, useState } from 'react'
import useSWR from 'swr'

import { Card, Header } from '@components'
import { formatTraffic } from '@lib/helper'
import type * as API from '@lib/request'
import { StreamReader } from '@lib/streamer'
import { getWebSocketBase, useAPISecret, useClient, useGeneral, useI18n, useVersion } from '@stores'
import './style.scss'

const chartWidth = 600
const chartHeight = 160
const maxPoints = 60

export default function Overview () {
    const { translation } = useI18n()
    const { t } = translation('Overview')
    const client = useClient()
    const secret = useAPISecret()
    const { general } = useGeneral()
    const { version } = useVersion()

    const { data: snapshot } = useSWR(['overview-connections', client], async () => {
        const resp = await client.getConnections()
        return resp.data
    }, { refreshInterval: 5000 })

    const readerRef = useRef<StreamReader<API.Traffic> | null>(null)
    if (readerRef.current == null) {
        readerRef.current = new StreamReader<API.Traffic>({ bufferLength: maxPoints })
    }

    const [points, setPoints] = useState<API.Traffic[]>([])
    const url = `${getWebSocketBase()}/traffic?token=${encodeURIComponent(secret)}`

    useEffect(() => {
        const reader = readerRef.current!
        reader.connect(url)

        function handleData (items: API.Traffic[]) {
            setPoints(previous => [...previous, ...items].slice(-maxPoints))
        }

        reader.subscribe('data', handleData)
        return () => {
            reader.unsubscribe('data', handleData)
            reader.destroy()
        }
    }, [url])

    const current = points[points.length - 1] ?? { up: 0, down: 0 }
    const maxValue = useMemo(
        () => Math.max(1024, ...points.flatMap(point => [point.up, point.down])),
        [points],
    )

    const lastPoint = points[points.length - 1]
    const lastY = (value: number) => chartHeight - (value / maxValue) * (chartHeight - 10)

    const chartPoints = useMemo(() => {
        function line (key: 'up' | 'down') {
            return points.map((point, index) => {
                const x = chartWidth - (points.length - 1 - index) * (chartWidth / (maxPoints - 1))
                const y = chartHeight - (point[key] / maxValue) * (chartHeight - 10)
                return `${x},${y}`
            }).join(' ')
        }

        return {
            up: line('up'),
            down: line('down'),
        }
    }, [maxValue, points])

    return (
        <div className="page overview-page">
            <Header title={t('title')} />
            <div className="overview-cards">
                <Card className="overview-card">
                    <span>{t('mode')}</span>
                    <strong>{general.mode?.toUpperCase() ?? '-'}</strong>
                </Card>
                <Card className="overview-card">
                    <span>{t('version')}</span>
                    <strong>{version || '-'}</strong>
                </Card>
                <Card className="overview-card">
                    <span>{t('connections')}</span>
                    <strong>{snapshot?.connections.length ?? 0}</strong>
                </Card>
                <Card className="overview-card">
                    <span>{t('uploadTotal')}</span>
                    <strong>{formatTraffic(snapshot?.uploadTotal ?? 0)}</strong>
                </Card>
                <Card className="overview-card">
                    <span>{t('downloadTotal')}</span>
                    <strong>{formatTraffic(snapshot?.downloadTotal ?? 0)}</strong>
                </Card>
            </div>

            <Card className="overview-chart-card">
                <div className="overview-chart-header">
                    <div>
                        <h2>{t('traffic')}</h2>
                        <div className="overview-speed">
                            <span className="up">↑ {formatTraffic(current.up)}/s</span>
                            <span className="down">↓ {formatTraffic(current.down)}/s</span>
                        </div>
                    </div>
                    <span className="overview-chart-hint">{t('lastMinute')}</span>
                </div>
                {points.length === 0
                    ? <div className="overview-empty">{t('waiting')}</div>
                    : (
                        <svg
                            className="overview-chart"
                            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                            preserveAspectRatio="none"
                            role="img"
                            aria-label={t('traffic')}
                        >
                            <polyline className="line-up" points={chartPoints.up} />
                            <polyline className="line-down" points={chartPoints.down} />
                            {lastPoint != null && (
                                <>
                                    <circle className="dot-up" cx={chartWidth} cy={lastY(lastPoint.up)} r={3} />
                                    <circle className="dot-down" cx={chartWidth} cy={lastY(lastPoint.down)} r={3} />
                                </>
                            )}
                        </svg>
                    )}
                <div className="overview-legend">
                    <span><i className="up" />{t('uploadSpeed')}</span>
                    <span><i className="down" />{t('downloadSpeed')}</span>
                </div>
            </Card>
        </div>
    )
}

import { isAxiosError } from 'axios'
import { useRef, useState } from 'react'

import { Header, Card, Input, Select, Button } from '@components'
import type * as API from '@lib/request'
import { useClient, useI18n } from '@stores'
import './style.scss'

const queryTypes = [
    { label: 'A', value: 'A' },
    { label: 'AAAA', value: 'AAAA' },
    { label: 'CNAME', value: 'CNAME' },
    { label: 'MX', value: 'MX' },
    { label: 'NS', value: 'NS' },
    { label: 'TXT', value: 'TXT' },
    { label: 'SOA', value: 'SOA' },
    { label: 'SRV', value: 'SRV' },
    { label: 'PTR', value: 'PTR' },
]

const rcodeText: Record<number, string> = {
    0: 'NOERROR',
    1: 'FORMERR',
    2: 'SERVFAIL',
    3: 'NXDOMAIN',
    4: 'NOTIMP',
    5: 'REFUSED',
}

const dnsTypeText: Record<number, string> = {
    1: 'A',
    2: 'NS',
    5: 'CNAME',
    6: 'SOA',
    12: 'PTR',
    15: 'MX',
    16: 'TXT',
    28: 'AAAA',
    33: 'SRV',
}

function getErrorMessage (error: unknown) {
    if (isAxiosError<{ message?: string }>(error)) {
        return error.response?.data?.message ?? error.message
    }
    return error instanceof Error ? error.message : String(error)
}

interface RecordLabels {
    name: string
    type: string
    ttl: string
    data: string
}

function RecordTable ({ title, records, labels }: { title: string, records?: API.DNSRecord[], labels: RecordLabels }) {
    const visibleRecords = records?.filter(record => record.type !== 41) ?? []
    if (!visibleRecords.length) {
        return null
    }

    return (
        <section className="dns-section">
            <h3>{title}</h3>
            <div className="dns-table-wrap">
                <table className="dns-table">
                    <thead>
                        <tr>
                            <th>{labels.name}</th>
                            <th>{labels.type}</th>
                            <th>{labels.ttl}</th>
                            <th>{labels.data}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {visibleRecords.map((record, index) => (
                            <tr key={`${record.name}-${record.type}-${index}`}>
                                <td className="font-mono">{record.name}</td>
                                <td className="text-center">
                                    {dnsTypeText[record.type] ?? record.type}
                                </td>
                                <td className="text-center">{record.TTL}</td>
                                <td className="break-all font-mono">{record.data}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    )
}

export default function Dns () {
    const { translation } = useI18n()
    const { t } = translation('Dns')
    const client = useClient()
    const [name, setName] = useState('')
    const [type, setType] = useState('A')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [result, setResult] = useState<API.DNSResult | null>(null)
    const requestId = useRef(0)

    function invalidateResult () {
        requestId.current += 1
        setResult(null)
        setError(null)
        setLoading(false)
    }

    function handleNameChange (value: string) {
        setName(value)
        invalidateResult()
    }

    function handleTypeChange (value: string) {
        setType(value)
        invalidateResult()
    }

    async function handleQuery () {
        if (!name.trim() || loading) {
            return
        }

        const currentRequest = ++requestId.current
        setLoading(true)
        setError(null)
        try {
            const resp = await client.queryDNS(name.trim(), type)
            if (currentRequest !== requestId.current) {
                return
            }
            setResult(resp.data)
        } catch (err) {
            if (currentRequest !== requestId.current) {
                return
            }
            setResult(null)
            setError(getErrorMessage(err))
        } finally {
            if (currentRequest === requestId.current) {
                setLoading(false)
            }
        }
    }

    const recordLabels: RecordLabels = {
        name: t('name'),
        type: t('type'),
        ttl: t('ttl'),
        data: t('data'),
    }

    return (
        <div className="page dns-page">
            <Header title={t('title')} />
            <Card className="dns-query-card">
                <div className="dns-query-form">
                    <Input
                        className="flex-1"
                        value={name}
                        placeholder={t('placeholder')}
                        onChange={handleNameChange}
                        onEnter={handleQuery}
                    />
                    <Select
                        className="w-28"
                        options={queryTypes}
                        value={type}
                        onSelect={handleTypeChange}
                    />
                    <Button type="primary" disabled={loading || !name.trim()} onClick={handleQuery}>
                        {loading ? t('querying') : t('query')}
                    </Button>
                </div>
            </Card>

            {error != null && (
                <Card className="dns-error">
                    {error}
                </Card>
            )}

            {result != null && (
                <Card className="dns-result">
                    <div className="dns-summary">
                        <span>{t('status')}: <strong>{rcodeText[result.Status] ?? result.Status}</strong></span>
                        <span>{t('flags')}: {[
                            result.TC && 'TC',
                            result.RD && 'RD',
                            result.RA && 'RA',
                            result.AD && 'AD',
                            result.CD && 'CD',
                        ].filter(Boolean).join(' ') || '-'}</span>
                    </div>
                    <RecordTable title={t('answer')} records={result.Answer} labels={recordLabels} />
                    <RecordTable title={t('authority')} records={result.Authority} labels={recordLabels} />
                    <RecordTable title={t('additional')} records={result.Additional} labels={recordLabels} />
                    {![result.Answer, result.Authority, result.Additional].some(records => (
                        records?.some(record => record.type !== 41)
                    )) && (
                        <div className="dns-empty">{t('empty')}</div>
                    )}
                </Card>
            )}
        </div>
    )
}

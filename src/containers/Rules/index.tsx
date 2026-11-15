import { useMemo, useState } from 'react'
import AutoSizer from 'react-virtualized-auto-sizer'
import { FixedSizeList as List } from 'react-window'
import useSWR from 'swr'

import { Header, Card, Input } from '@components'
import { useClient, useI18n, useRule, useRuleProviders } from '@stores'

import { Provider } from './Provider'
import './style.scss'

function RuleProviders () {
    const { providers } = useRuleProviders()
    const { translation } = useI18n()
    const { t } = translation('Rules')

    return <>
        {
            providers.length !== 0 &&
            <div className="flex flex-col">
                <Header title={t('providerTitle')} />
                <Card className="mt-4 rounded p-0 shadow-primary divide-y">
                    {
                        providers.map(p => (
                            <Provider key={p.name} provider={p} />
                        ))
                    }
                </Card>
            </div>
        }
    </>
}

export default function Rules () {
    const { rules, update } = useRule()
    const client = useClient()
    const { translation } = useI18n()
    const { t } = translation('Rules')
    const [keyword, setKeyword] = useState('')

    useSWR(['rules', client], update)

    const filteredRules = useMemo(() => {
        const query = keyword.trim().toLowerCase()
        if (!query) {
            return rules
        }

        return rules.filter(rule => (
            rule.type.toLowerCase().includes(query) ||
            rule.payload.toLowerCase().includes(query) ||
            rule.proxy.toLowerCase().includes(query)
        ))
    }, [keyword, rules])

    function renderRuleItem ({ index, style }: { index: number, style: React.CSSProperties }) {
        const rule = filteredRules[index]
        return (
            <li className="rule-item" style={style}>
                <div className="flex py-1">
                    <div className="rule-type w-40 text-center">{ rule.type }</div>
                    <div className="payload flex-1 text-center">{ rule.payload }</div>
                    <div className="rule-proxy w-40 text-center">{ rule.proxy }</div>
                </div>
            </li>
        )
    }

    return (
        <div className="page">
            <RuleProviders />
            <Header className="not-first:mt-7.5" title={t('title')}>
                <Input
                    className="w-64"
                    value={keyword}
                    placeholder={t('searchPlaceholder')}
                    onChange={setKeyword}
                />
                <span className="ml-3 text-sm text-primary-darken">
                    {filteredRules.length} / {rules.length}
                </span>
            </Header>
            <Card className="rules-card mt-2.5 flex flex-1 flex-col p-0 md:mt-4 focus:outline-none">
                {filteredRules.length === 0 && <div className="rules-empty">{t('noResults')}</div>}
                <AutoSizer className="min-h-120">
                    {
                        ({ height, width }) => (
                            <List
                                height={height ?? 0}
                                width={width ?? 0}
                                itemCount={filteredRules.length}
                                itemSize={50}
                            >
                                { renderRuleItem }
                            </List>
                        )
                    }
                </AutoSizer>
            </Card>
        </div>
    )
}

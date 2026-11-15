import { type IsEqual } from 'type-fest'

import { type Infer } from '@lib/type'

import en_US from './en_US'
import zh_CN from './zh_CN'

export const Language = {
    en_US,
    zh_CN,
}

export type Lang = keyof typeof Language

type US = typeof Language.en_US
type CN = typeof Language.zh_CN

// type guard for US and CN
type TrueGuard<T extends true> = T
 
type _equalGuard = TrueGuard<IsEqual<Infer<US>, Infer<CN>>>

export type LocalizedType = US

export const locales = Object.keys(Language)

export function getDefaultLanguage (): Lang {
    const language = window.navigator.languages?.[0] ?? window.navigator.language
    return language?.toLowerCase().startsWith('zh') ? 'zh_CN' : 'en_US'
}

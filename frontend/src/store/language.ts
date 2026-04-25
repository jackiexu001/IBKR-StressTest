import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Lang = 'zh' | 'en'

interface LanguageStore {
  lang: Lang
  toggle: () => void
}

export const useLanguageStore = create<LanguageStore>()(
  persist(
    (set, get) => ({
      lang: 'zh',
      toggle: () => set({ lang: get().lang === 'zh' ? 'en' : 'zh' }),
    }),
    { name: 'ib-risk-lang' }
  )
)

export function t(zh: string, en: string, lang: Lang): string {
  return lang === 'zh' ? zh : en
}

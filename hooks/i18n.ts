// The pane speaks English or Vietnamese, as the `language` option says.
export type Lang = 'en' | 'vi'

let lang: Lang = 'en'

export const setLang = (value: unknown) => {
  lang = value === 'vi' ? 'vi' : 'en'
}

/** The English text, or its Vietnamese twin when the option says `vi`. */
export const tr = (en: string, vi: string) => (lang === 'vi' ? vi : en)

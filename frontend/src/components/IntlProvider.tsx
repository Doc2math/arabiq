'use client'
import { useState, useEffect } from 'react'
import { NextIntlClientProvider } from 'next-intl'
import frMessages from '../../messages/fr.json'

const LOCALES = ['fr', 'en', 'es', 'de', 'nl']

export default function IntlProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale]     = useState('fr')
  const [messages, setMessages] = useState<any>(frMessages)

  useEffect(() => {
    const saved = localStorage.getItem('langdad_lang') ?? 'fr'
    const lang  = LOCALES.includes(saved) ? saved : 'fr'
    setLocale(lang)
    if (lang === 'fr') return
    import(`../../messages/${lang}.json`)
      .then(m => setMessages(m.default))
      .catch(() => setMessages(frMessages))
  }, [])

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  )
}
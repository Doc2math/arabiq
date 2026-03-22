import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/hooks/useAuth'

export default function LoginPage() {
  const { t } = useTranslation()
  const { login, isLoading, loginError } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await login(form)
      navigate('/dashboard')
    } catch { /* handled by hook */ }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-10">
          <h1 className="font-display text-4xl font-bold text-brand-teal tracking-tight">
            {t('app.name')}
          </h1>
          <p className="mt-2 text-sm text-gray-500">{t('app.tagline')}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('auth.loginTitle')}</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.email')}</label>
              <input
                type="email" required autoComplete="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/30 focus:border-brand-teal transition-colors"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.password')}</label>
              <input
                type="password" required autoComplete="current-password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/30 focus:border-brand-teal transition-colors"
                placeholder="••••••••"
              />
            </div>

            {loginError && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2"
              >
                {t('auth.errors.invalidCredentials')}
              </motion.p>
            )}

            <button
              type="submit" disabled={isLoading}
              className="w-full py-2.5 rounded-lg bg-brand-teal text-white text-sm font-medium hover:bg-brand-teal-dark transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isLoading && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
              {t('auth.login')}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            {t('auth.noAccount')}{' '}
            <Link to="/register" className="text-brand-teal font-medium hover:underline">
              {t('auth.register')}
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
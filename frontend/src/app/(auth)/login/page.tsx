'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useAuthStore } from '@/store/authStore'
import { ArrowLeft } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const { login, isLoading, error, clearError } = useAuthStore()
  const t = useTranslations('auth.login')
  const tCommon = useTranslations('common')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    try {
      await login(email, password)
      const { user } = useAuthStore.getState()
      if (!user) { router.push('/dashboard'); return }
      const role = (user as any).role
      if (role === 'superadmin') {
        router.push('/superadmin')
      } else if (user.is_admin) {
        router.push('/admin')
      } else {
        router.push('/dashboard')
      }
    } catch {
      // error handled in store
    }
  }

  return (
    <>
      <p style={{ textAlign: 'left', marginTop: 20, marginLeft: 20, fontSize: 16, color: '#5A5A7A' }}>
        <Link href="/"
          style={{ color: '#6C3FC5', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          <ArrowLeft strokeWidth={2.25} size={18} color="#6C3FC5" />
          {tCommon('home')}
        </Link>
      </p>

      <div style={{ minHeight: '100vh', background: '#F8F7FF', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ width: '100%', maxWidth: 620 }}>

          <div style={{ background: '#FFFFFF', borderRadius: 24, padding: '32px 28px', border: '2px solid #EDE8FB', boxShadow: '0 8px 32px rgba(108, 63, 197, 0.08)' }}>
            <h2 style={{ fontSize: 32, fontWeight: 700, color: '#1A1A2E', marginBottom: 24, textAlign: 'center' }}>
              {t('title')}
            </h2>

            {error && (
              <div style={{ background: '#FCEBEB', border: '2px solid #E24B4A', borderRadius: 12, padding: '12px 16px', marginBottom: 20, fontSize: 14, color: '#A32D2D', display: 'flex', gap: 8 }}>
                <span>✗</span> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#5A5A7A', display: 'block', marginBottom: 6 }}>
                  {t('email')}
                </label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  placeholder="votre@email.com"
                  style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '2px solid #E8E4F8', fontSize: 15, color: '#1A1A2E', outline: 'none', background: '#FAFAFA', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = '#6C3FC5'}
                  onBlur={e => e.target.style.borderColor = '#E8E4F8'} />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#5A5A7A', display: 'block', marginBottom: 6 }}>
                  {t('password')}
                </label>
                <div style={{ position: 'relative' }}>
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                    placeholder="••••••••"
                    style={{ width: '100%', padding: '12px 48px 12px 16px', borderRadius: 12, border: '2px solid #E8E4F8', fontSize: 15, color: '#1A1A2E', outline: 'none', background: '#FAFAFA', boxSizing: 'border-box' }}
                    onFocus={e => e.target.style.borderColor = '#6C3FC5'}
                    onBlur={e => e.target.style.borderColor = '#E8E4F8'} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#9A9AB0' }}>
                    {showPassword ? '🙈' : '👁'}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={isLoading}
                style={{ width: '100%', padding: '14px', borderRadius: 14, border: 'none', background: isLoading ? '#B8A0E8' : '#6C3FC5', color: '#FFFFFF', fontSize: 16, fontWeight: 700, cursor: isLoading ? 'default' : 'pointer', marginTop: 4 }}>
                {isLoading ? t('loading') : t('submitBtn')}
              </button>
            </form>
          </div>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#5A5A7A' }}>
            {t('noAccount')}{' '}
            <Link href="/register" style={{ color: '#6C3FC5', fontWeight: 700, textDecoration: 'none' }}>
              {tCommon('register')}
            </Link>
          </p>

        </div>
      </div>
    </>
  )
}
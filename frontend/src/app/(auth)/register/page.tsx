'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/authStore'

export default function RegisterPage() {
  const router = useRouter()
  const { register, isLoading, error, clearError } = useAuthStore()
  const [form, setForm] = useState({ email: '', username: '', password: '', confirm: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [localError, setLocalError] = useState('')

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [field]: e.target.value }))
    clearError()
    setLocalError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password !== form.confirm) {
      setLocalError('Les mots de passe ne correspondent pas')
      return
    }
    if (form.password.length < 8) {
      setLocalError('Le mot de passe doit contenir au moins 8 caractères')
      return
    }
    if (!/\d/.test(form.password)) {
      setLocalError('Le mot de passe doit contenir au moins un chiffre')
      return
    }
    try {
      await register(form.email, form.username, form.password)
      router.push('/dashboard')
    } catch {
      // error handled in store
    }
  }

  const displayError = localError || error

  const inputStyle = {
    width: '100%', padding: '12px 16px',
    borderRadius: 12, border: '2px solid #E8E4F8',
    fontSize: 15, color: '#1A1A2E', outline: 'none',
    background: '#FAFAFA', boxSizing: 'border-box' as const,
    transition: 'border-color .2s',
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#F8F7FF',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px', fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20,
            background: '#6C3FC5', margin: '0 auto 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 36,
          }}>🌙</div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#1A1A2E', margin: 0 }}>LangDad</h1>
          <p style={{ fontSize: 14, color: '#5A5A7A', marginTop: 6 }}>Créez votre compte gratuit</p>
        </div>

        {/* Card */}
        <div style={{
          background: '#FFFFFF', borderRadius: 24, padding: '32px 28px',
          border: '2px solid #EDE8FB', boxShadow: '0 8px 32px rgba(108,63,197,.08)',
        }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1A1A2E', marginBottom: 24, textAlign: 'center' }}>
            Inscription
          </h2>

          {displayError && (
            <div style={{
              background: '#FCEBEB', border: '2px solid #E24B4A',
              borderRadius: 12, padding: '12px 16px', marginBottom: 20,
              fontSize: 14, color: '#A32D2D', display: 'flex', gap: 8,
            }}>
              <span>✗</span> {displayError}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#5A5A7A', display: 'block', marginBottom: 6 }}>
                Email
              </label>
              <input type="email" value={form.email} onChange={handleChange('email')}
                required placeholder="votre@email.com" style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#6C3FC5'}
                onBlur={e => e.target.style.borderColor = '#E8E4F8'} />
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#5A5A7A', display: 'block', marginBottom: 6 }}>
                Nom d&apos;utilisateur
              </label>
              <input type="text" value={form.username} onChange={handleChange('username')}
                required placeholder="ex: aziz123" minLength={3} maxLength={30}
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#6C3FC5'}
                onBlur={e => e.target.style.borderColor = '#E8E4F8'} />
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#5A5A7A', display: 'block', marginBottom: 6 }}>
                Mot de passe
              </label>
              <div style={{ position: 'relative' }}>
                <input type={showPassword ? 'text' : 'password'} value={form.password}
                  onChange={handleChange('password')} required placeholder="Min. 8 caractères avec un chiffre"
                  style={{ ...inputStyle, paddingRight: 48 }}
                  onFocus={e => e.target.style.borderColor = '#6C3FC5'}
                  onBlur={e => e.target.style.borderColor = '#E8E4F8'} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#9A9AB0' }}>
                  {showPassword ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#5A5A7A', display: 'block', marginBottom: 6 }}>
                Confirmer le mot de passe
              </label>
              <input type="password" value={form.confirm} onChange={handleChange('confirm')}
                required placeholder="••••••••" style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#6C3FC5'}
                onBlur={e => e.target.style.borderColor = '#E8E4F8'} />
            </div>

            <button type="submit" disabled={isLoading}
              style={{
                width: '100%', padding: '14px', borderRadius: 14, border: 'none',
                background: isLoading ? '#B8A0E8' : '#6C3FC5',
                color: '#FFFFFF', fontSize: 16, fontWeight: 700,
                cursor: isLoading ? 'default' : 'pointer',
                transition: 'all .2s', marginTop: 4,
              }}
              onMouseEnter={e => { if (!isLoading) (e.currentTarget as HTMLElement).style.background = '#4A2A8A' }}
              onMouseLeave={e => { if (!isLoading) (e.currentTarget as HTMLElement).style.background = '#6C3FC5' }}>
              {isLoading ? 'Création…' : 'Créer mon compte'}
            </button>

          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#5A5A7A' }}>
          Déjà un compte ?{' '}
          <Link href="/login" style={{ color: '#6C3FC5', fontWeight: 700, textDecoration: 'none' }}>
            Se connecter
          </Link>
        </p>

      </div>
    </div>
  )
}

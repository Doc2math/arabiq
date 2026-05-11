'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useAuthStore } from '@/store/authStore'
import { ArrowLeft } from "lucide-react"

const C = {
  violet: '#6C3FC5', violetLt: '#EDE8FB', violetDk: '#4A2A8A',
  orange: '#F07C1E', orangeLt: '#FEF0E3',
  green:  '#2BA84A', greenLt:  '#E3F7E8',
  bg: '#F8F7FF', white: '#FFFFFF',
  text: '#1A1A2E', text2: '#5A5A7A', text3: '#9A9AB0',
  border: '#E8E4F8', red: '#E24B4A',
}

export default function RegisterPage() {
  const router = useRouter()
  const { register, isLoading, error, clearError } = useAuthStore()
  const t       = useTranslations('auth.register')
  const tCommon = useTranslations('common')

  const ACCOUNT_TYPES = [
    { key: 'student',     icon: '🎓', label: t('accountTypes.student.label'),     desc: t('accountTypes.student.desc'),     color: C.violet, bg: C.violetLt },
    { key: 'teacher',     icon: '👨‍🏫', label: t('accountTypes.teacher.label'),     desc: t('accountTypes.teacher.desc'),     color: C.orange, bg: C.orangeLt },
    { key: 'institution', icon: '🏫', label: t('accountTypes.institution.label'), desc: t('accountTypes.institution.desc'), color: C.green,  bg: C.greenLt  },
  ]

  const [step, setStep]               = useState<'type' | 'form'>('type')
  const [accountType, setAccountType] = useState<string>('student')
  const [form, setForm]               = useState({ email: '', username: '', password: '', confirm: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [localError, setLocalError]   = useState('')

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [field]: e.target.value }))
    clearError(); setLocalError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password !== form.confirm) { setLocalError(t('passwordMismatch')); return }
    if (form.password.length < 8)       { setLocalError(t('passwordTooShort')); return }
    if (!/\d/.test(form.password))      { setLocalError(t('passwordNoDigit'));  return }
    try {
      await register(form.email, form.username, form.password, accountType)
      if (accountType === 'teacher' || accountType === 'institution') {
        router.push('/institution/create')
      } else {
        router.push('/dashboard')
      }
    } catch {}
  }

  const displayError  = localError || error
  const selectedType  = ACCOUNT_TYPES.find(type => type.key === accountType)!

  const inputStyle = {
    width: '100%', padding: '12px 16px',
    borderRadius: 12, border: `2px solid ${C.border}`,
    fontSize: 15, color: C.text, outline: 'none',
    background: '#FAFAFA', boxSizing: 'border-box' as const,
  }

  return (
    <>
      <p style={{ textAlign: 'left', marginTop: 20, marginLeft: 20, fontSize: 16, color: C.text2 }}>
        <Link href="/" style={{ color: C.violet, fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <ArrowLeft strokeWidth={2.25} size={18} color={C.violet} />
          {tCommon('home')}
        </Link>
      </p>

      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', justifyContent: 'center', padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ width: '100%', maxWidth: 620 }}>

          {/* ── Step 1 : Type ── */}
          {step === 'type' && (
            <div style={{ background: C.white, borderRadius: 24, padding: '32px 28px', border: `2px solid ${C.violetLt}`, boxShadow: '0 8px 32px rgba(108,63,197,.08)' }}>
              <h2 style={{ fontSize: 26, fontWeight: 700, color: C.text, marginBottom: 8, textAlign: 'center' }}>{t('title')}</h2>
              <p style={{ fontSize: 14, color: C.text2, textAlign: 'center', marginBottom: 28 }}>{t('chooseType')}</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
                {ACCOUNT_TYPES.map(type => (
                  <button key={type.key} onClick={() => setAccountType(type.key)}
                    style={{ padding: '18px 20px', borderRadius: 16, textAlign: 'left', border: `2px solid ${accountType === type.key ? type.color : C.border}`, background: accountType === type.key ? type.bg : C.white, cursor: 'pointer', transition: 'all .15s', display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ fontSize: 32, flexShrink: 0 }}>{type.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: accountType === type.key ? type.color : C.text, marginBottom: 3 }}>{type.label}</div>
                      <div style={{ fontSize: 13, color: C.text2 }}>{type.desc}</div>
                    </div>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, border: `2px solid ${accountType === type.key ? type.color : C.border}`, background: accountType === type.key ? type.color : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#fff' }}>
                      {accountType === type.key && '✓'}
                    </div>
                  </button>
                ))}
              </div>

              {(accountType === 'teacher' || accountType === 'institution') && (
                <div style={{ background: C.orangeLt, border: `2px solid ${C.orange}30`, borderRadius: 12, padding: '12px 16px', marginBottom: 20 }}>
                  <p style={{ fontSize: 13, color: C.orange, lineHeight: 1.6, margin: 0 }}>💡 {t('teacherNote')}</p>
                </div>
              )}

              <button onClick={() => setStep('form')}
                style={{ width: '100%', padding: '14px', borderRadius: 14, border: 'none', background: selectedType.color, color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>
                {t('continueAs', { type: selectedType.label })}
              </button>

              <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: C.text2 }}>
                {t('alreadyAccount')}{' '}
                <Link href="/login" style={{ color: C.violet, fontWeight: 700, textDecoration: 'none' }}>{tCommon('login')}</Link>
              </p>
            </div>
          )}

          {/* ── Step 2 : Formulaire ── */}
          {step === 'form' && (
            <div style={{ background: C.white, borderRadius: 24, padding: '32px 28px', border: `2px solid ${C.violetLt}`, boxShadow: '0 8px 32px rgba(108,63,197,.08)' }}>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, padding: '10px 14px', background: selectedType.bg, borderRadius: 12, border: `2px solid ${selectedType.color}30` }}>
                <span style={{ fontSize: 20 }}>{selectedType.icon}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: selectedType.color }}>{selectedType.label}</span>
                <button onClick={() => setStep('type')}
                  style={{ marginLeft: 'auto', fontSize: 12, color: C.text3, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                  {tCommon('back')}
                </button>
              </div>

              <h2 style={{ fontSize: 24, fontWeight: 700, color: C.text, marginBottom: 24, textAlign: 'center' }}>{t('title')}</h2>

              {displayError && (
                <div style={{ background: '#FCEBEB', border: `2px solid ${C.red}`, borderRadius: 12, padding: '12px 16px', marginBottom: 20, fontSize: 14, color: '#A32D2D', display: 'flex', gap: 8 }}>
                  <span>✗</span> {displayError}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  { label: t('email'),    key: 'email',    type: 'email',    placeholder: 'votre@email.com' },
                  { label: t('username'), key: 'username', type: 'text',     placeholder: 'ex: aziz123'     },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: C.text2, display: 'block', marginBottom: 6 }}>{f.label}</label>
                    <input type={f.type} value={(form as any)[f.key]} onChange={handleChange(f.key)}
                      required placeholder={f.placeholder} style={inputStyle}
                      onFocus={e => e.target.style.borderColor = selectedType.color}
                      onBlur={e => e.target.style.borderColor = C.border} />
                  </div>
                ))}

                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: C.text2, display: 'block', marginBottom: 6 }}>{t('password')}</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={handleChange('password')}
                      required placeholder={t('passwordHint')} style={{ ...inputStyle, paddingRight: 48 }}
                      onFocus={e => e.target.style.borderColor = selectedType.color}
                      onBlur={e => e.target.style.borderColor = C.border} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: C.text3 }}>
                      {showPassword ? '🙈' : '👁'}
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: C.text2, display: 'block', marginBottom: 6 }}>{t('confirmPassword')}</label>
                  <input type="password" value={form.confirm} onChange={handleChange('confirm')}
                    required placeholder="••••••••" style={inputStyle}
                    onFocus={e => e.target.style.borderColor = selectedType.color}
                    onBlur={e => e.target.style.borderColor = C.border} />
                </div>

                <button type="submit" disabled={isLoading}
                  style={{ width: '100%', padding: '14px', borderRadius: 14, border: 'none', background: isLoading ? '#B8A0E8' : selectedType.color, color: '#fff', fontSize: 16, fontWeight: 700, cursor: isLoading ? 'default' : 'pointer', marginTop: 4 }}>
                  {isLoading ? t('loading') : t('submitBtn')}
                </button>
              </form>

              <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: C.text2 }}>
                {t('alreadyAccount')}{' '}
                <Link href="/login" style={{ color: C.violet, fontWeight: 700, textDecoration: 'none' }}>{tCommon('login')}</Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
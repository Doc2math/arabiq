import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import { useAuth } from '@/hooks/useAuth'
import type { RegisterPayload } from '@/types'

const LANGUAGES = [
  { code: 'fr' as const, label: 'Français', flag: '🇫🇷', hint: 'Langue native' },
  { code: 'es' as const, label: 'Español',  flag: '🇪🇸', hint: 'Idioma nativo' },
  { code: 'en' as const, label: 'English',  flag: '🇬🇧', hint: 'Native language' },
]

const STEPS = [
  { num: 1, label: 'Votre compte' },
  { num: 2, label: 'Votre langue'  },
  { num: 3, label: 'Confirmation'  },
]

function LangDadLogoSmall() {
  return (
    <svg width="130" height="38" viewBox="0 0 144 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 40 C6 24 14 13 24 10 C34 13 42 24 42 40" stroke="#1A8A8A" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="24" y1="10" x2="24" y2="40" stroke="#C9953A" strokeWidth="2" strokeLinecap="round"/>
      <line x1="6"  y1="40" x2="42" y2="40" stroke="#1A8A8A" strokeWidth="2.4" strokeLinecap="round"/>
      <circle cx="24" cy="10" r="2.6" fill="#C9953A"/>
      <text x="10" y="34" fontFamily="'Noto Naskh Arabic',serif" fontSize="15" fill="#C9953A" fontWeight="700">لد</text>
      <text x="52" y="27" fontFamily="'Cormorant Garamond',Georgia,serif" fontSize="22" fill="#2C3E50" fontWeight="600" letterSpacing="0.4">Lang</text>
      <text x="96" y="27" fontFamily="'Cormorant Garamond',Georgia,serif" fontSize="22" fill="#1A8A8A" fontWeight="600" letterSpacing="0.4">Dad</text>
      <line x1="52" y1="32" x2="138" y2="32" stroke="#E4DDD2" strokeWidth="0.8"/>
      <text x="52" y="43" fontFamily="'DM Sans',sans-serif" fontSize="8.5" fill="#8A9BB0" letterSpacing="2.2">LEARN ARABIC</text>
    </svg>
  )
}

export default function RegisterPage() {
  const { register, isLoading, registerError } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [form, setForm] = useState<RegisterPayload>({
    email: '', username: '', password: '', nativeLanguage: 'fr',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)

  const containerRef = useRef<HTMLDivElement>(null)
  const cardRef      = useRef<HTMLDivElement>(null)
  const stepRef      = useRef<HTMLDivElement>(null)

  // ── Entrée initiale ─────────────────────────────────────────
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(cardRef.current,
        { opacity: 0, y: 32, scale: 0.97 },
        { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'power3.out' }
      )
    })
    return () => ctx.revert()
  }, [])

  // ── Transition entre steps ──────────────────────────────────
  const goToStep = (next: 1 | 2 | 3) => {
    if (!stepRef.current) { setStep(next); return }
    gsap.to(stepRef.current, {
      opacity: 0, x: -24, duration: 0.2, ease: 'power2.in',
      onComplete: () => {
        setStep(next)
        gsap.fromTo(stepRef.current,
          { opacity: 0, x: 24 },
          { opacity: 1, x: 0, duration: 0.3, ease: 'power2.out' }
        )
      },
    })
  }

  // ── Force mot de passe ──────────────────────────────────────
  const checkStrength = (pwd: string) => {
    let s = 0
    if (pwd.length >= 8)          s++
    if (/[A-Z]/.test(pwd))        s++
    if (/[0-9]/.test(pwd))        s++
    if (/[^A-Za-z0-9]/.test(pwd)) s++
    setPasswordStrength(s)
  }

  const strengthColor = ['#E4DDD2', '#E24B4A', '#C9953A', '#1A8A8A', '#0D5C5C'][passwordStrength]
  const strengthLabel = ['', 'Faible', 'Moyen', 'Fort', 'Excellent'][passwordStrength]

  // ── Submit ──────────────────────────────────────────────────
  const handleSubmit = async () => {
    try {
      await register(form)
      // Succès — animation avant redirect
      gsap.to(cardRef.current, {
        scale: 1.02, opacity: 0, duration: 0.35, ease: 'power2.in',
        onComplete: () => navigate('/dashboard'),
      })
    } catch { /* error handled by hook */ }
  }

  return (
    <div ref={containerRef} style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #F7F3EE 0%, #EEE8DF 50%, #E8F4F4 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px 16px', fontFamily: "'DM Sans', sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&family=DM+Sans:wght@300;400;500&family=Noto+Naskh+Arabic:wght@400;700&display=swap');
        *{box-sizing:border-box}
        .reg-input{width:100%;padding:11px 14px;border:1.5px solid #E4DDD2;border-radius:8px;font-family:'DM Sans',sans-serif;font-size:14px;color:#2C3E50;background:#fff;outline:none;transition:border-color .2s,box-shadow .2s}
        .reg-input:focus{border-color:#1A8A8A;box-shadow:0 0 0 3px rgba(26,138,138,.1)}
        .reg-input::placeholder{color:#B0BCC8}
        .reg-label{display:block;font-size:13px;font-weight:500;color:#5A7080;margin-bottom:6px;letter-spacing:.02em}
        .btn-teal{width:100%;padding:13px;background:#1A8A8A;color:#fff;border:none;border-radius:8px;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:500;cursor:pointer;transition:background .2s;letter-spacing:.02em}
        .btn-teal:hover{background:#0D5C5C}
        .btn-teal:disabled{opacity:.6;cursor:not-allowed}
        .btn-ghost{width:100%;padding:13px;background:transparent;color:#5A7080;border:1.5px solid #E4DDD2;border-radius:8px;font-family:'DM Sans',sans-serif;font-size:14px;cursor:pointer;transition:all .2s}
        .btn-ghost:hover{border-color:#1A8A8A;color:#1A8A8A}
        .lang-btn{flex:1;padding:14px 8px;border:1.5px solid #E4DDD2;border-radius:10px;background:#fff;cursor:pointer;transition:all .2s;text-align:center;font-family:'DM Sans',sans-serif}
        .lang-btn:hover{border-color:#2DB8B8}
        .lang-btn.active{border-color:#1A8A8A;background:rgba(26,138,138,.06)}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes check{from{stroke-dashoffset:24}to{stroke-dashoffset:0}}
      `}</style>

      <div ref={cardRef} style={{ width: '100%', maxWidth: 460 }}>

        {/* Logo */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
          <Link to="/"><LangDadLogoSmall /></Link>
        </div>

        {/* Card */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #E4DDD2', boxShadow: '0 4px 32px rgba(44,62,80,.08)', padding: '36px 36px 32px', overflow: 'hidden' }}>

          {/* Step indicator */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 32, gap: 0 }}>
            {STEPS.map(({ num, label }, i) => (
              <div key={num} style={{ display: 'flex', alignItems: 'center', flex: i < 2 ? 1 : 'none' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: step > num ? '#1A8A8A' : step === num ? '#1A8A8A' : '#E4DDD2',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'background .3s',
                  }}>
                    {step > num ? (
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M2.5 7L5.5 10L11.5 4" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                          strokeDasharray="24" strokeDashoffset="0" style={{ animation: 'check .3s ease-out' }}/>
                      </svg>
                    ) : (
                      <span style={{ fontSize: 12, fontWeight: 500, color: step === num ? '#fff' : '#B0BCC8' }}>{num}</span>
                    )}
                  </div>
                  <span style={{ fontSize: 10, color: step === num ? '#1A8A8A' : '#B0BCC8', letterSpacing: '.04em', whiteSpace: 'nowrap', fontWeight: step === num ? 500 : 400 }}>{label}</span>
                </div>
                {i < 2 && (
                  <div style={{ flex: 1, height: 2, background: step > num ? '#1A8A8A' : '#E4DDD2', margin: '0 8px', marginBottom: 16, borderRadius: 2, transition: 'background .3s' }} />
                )}
              </div>
            ))}
          </div>

          {/* Step content */}
          <div ref={stepRef}>

            {/* ── STEP 1 : Compte ── */}
            {step === 1 && (
              <div>
                <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 400, color: '#2C3E50', marginBottom: 6, letterSpacing: '-.01em' }}>
                  Créez votre compte
                </h2>
                <p style={{ fontSize: 14, color: '#8A9BB0', marginBottom: 28, lineHeight: 1.6 }}>
                  Commencez votre voyage vers la maîtrise de l'arabe.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label className="reg-label">Adresse email</label>
                    <input className="reg-input" type="email" required placeholder="vous@exemple.com"
                      value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
                  </div>
                  <div>
                    <label className="reg-label">Nom d'utilisateur</label>
                    <input className="reg-input" type="text" required minLength={3} maxLength={30}
                      placeholder="votre_pseudo" value={form.username}
                      onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} />
                    <p style={{ fontSize: 12, color: '#B0BCC8', marginTop: 4 }}>Entre 3 et 30 caractères</p>
                  </div>

                  <button className="btn-teal" onClick={() => {
                    if (form.email && form.username.length >= 3) goToStep(2)
                  }}>
                    Continuer →
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 2 : Langue ── */}
            {step === 2 && (
              <div>
                <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 400, color: '#2C3E50', marginBottom: 6 }}>
                  Votre langue native
                </h2>
                <p style={{ fontSize: 14, color: '#8A9BB0', marginBottom: 28, lineHeight: 1.6 }}>
                  Les explications seront dans votre langue pour faciliter l'apprentissage.
                </p>

                <div style={{ display: 'flex', gap: 10, marginBottom: 28 }}>
                  {LANGUAGES.map(({ code, label, flag, hint }) => (
                    <button key={code} className={`lang-btn ${form.nativeLanguage === code ? 'active' : ''}`}
                      onClick={() => setForm((f) => ({ ...f, nativeLanguage: code }))}>
                      <div style={{ fontSize: 28, marginBottom: 6 }}>{flag}</div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: form.nativeLanguage === code ? '#1A8A8A' : '#2C3E50', marginBottom: 2 }}>{label}</div>
                      <div style={{ fontSize: 11, color: '#B0BCC8' }}>{hint}</div>
                    </button>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn-ghost" onClick={() => goToStep(1)}>← Retour</button>
                  <button className="btn-teal" style={{ flex: 2 }} onClick={() => goToStep(3)}>Continuer →</button>
                </div>
              </div>
            )}

            {/* ── STEP 3 : Mot de passe ── */}
            {step === 3 && (
              <div>
                <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 400, color: '#2C3E50', marginBottom: 6 }}>
                  Sécurisez votre compte
                </h2>
                <p style={{ fontSize: 14, color: '#8A9BB0', marginBottom: 28, lineHeight: 1.6 }}>
                  Choisissez un mot de passe solide pour protéger votre progression.
                </p>

                {/* Récap */}
                <div style={{ background: 'rgba(26,138,138,.06)', border: '1px solid rgba(26,138,138,.15)', borderRadius: 8, padding: '12px 14px', marginBottom: 20, display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#1A8A8A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#fff', fontWeight: 600, shrink: 0 }}>
                    {form.username[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 500, color: '#2C3E50' }}>{form.username}</p>
                    <p style={{ fontSize: 12, color: '#8A9BB0' }}>{form.email}</p>
                  </div>
                  <div style={{ marginLeft: 'auto', fontSize: 18 }}>
                    {form.nativeLanguage === 'fr' ? '🇫🇷' : form.nativeLanguage === 'es' ? '🇪🇸' : '🇬🇧'}
                  </div>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label className="reg-label">Mot de passe</label>
                  <div style={{ position: 'relative' }}>
                    <input className="reg-input" type={showPassword ? 'text' : 'password'} required minLength={8}
                      placeholder="8+ caractères, 1 chiffre"
                      value={form.password}
                      onChange={(e) => { setForm((f) => ({ ...f, password: e.target.value })); checkStrength(e.target.value) }}
                      style={{ paddingRight: 44 }}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#8A9BB0', padding: 0 }}>
                      {showPassword ? '🙈' : '👁'}
                    </button>
                  </div>

                  {/* Force indicator */}
                  {form.password.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                        {[1,2,3,4].map((i) => (
                          <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= passwordStrength ? strengthColor : '#E4DDD2', transition: 'background .3s' }} />
                        ))}
                      </div>
                      <p style={{ fontSize: 12, color: strengthColor, fontWeight: 500, transition: 'color .3s' }}>{strengthLabel}</p>
                    </div>
                  )}
                </div>

                {registerError && (
                  <div style={{ background: 'rgba(226,75,74,.08)', border: '1px solid rgba(226,75,74,.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#A32D2D' }}>
                    Une erreur est survenue. Vérifiez vos informations.
                  </div>
                )}

                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn-ghost" onClick={() => goToStep(2)}>← Retour</button>
                  <button className="btn-teal" style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                    disabled={isLoading || form.password.length < 8}
                    onClick={handleSubmit}>
                    {isLoading && <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />}
                    {isLoading ? 'Création...' : 'Créer mon compte'}
                  </button>
                </div>

                <p style={{ fontSize: 12, color: '#B0BCC8', textAlign: 'center', marginTop: 16, lineHeight: 1.6 }}>
                  En créant un compte, vous acceptez nos{' '}
                  <a href="#" style={{ color: '#1A8A8A', textDecoration: 'none' }}>CGU</a>{' '}et notre{' '}
                  <a href="#" style={{ color: '#1A8A8A', textDecoration: 'none' }}>politique de confidentialité</a>.
                </p>
              </div>
            )}

          </div>

          {/* Lien connexion */}
          <div style={{ borderTop: '1px solid #F0EBE3', marginTop: 28, paddingTop: 20, textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: '#8A9BB0' }}>
              Déjà un compte ?{' '}
              <Link to="/login" style={{ color: '#1A8A8A', textDecoration: 'none', fontWeight: 500 }}>Se connecter</Link>
            </p>
          </div>
        </div>

        {/* Message bas de page */}
        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: '#B0BCC8' }}>
          Gratuit · Sans carte bancaire · Module 1 complet offert
        </p>

      </div>
    </div>
  )
}
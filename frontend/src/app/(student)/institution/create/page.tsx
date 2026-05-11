'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { api } from '@/lib/api'

const C = {
  violet:   '#6C3FC5', violetLt: '#EDE8FB', violetDk: '#4A2A8A',
  orange:   '#F07C1E', orangeLt: '#FEF0E3', orangeDk: '#B85A0E',
  green:    '#2BA84A', greenLt:  '#E3F7E8',
  blue:     '#1976D2', blueLt:   '#E6F1FB',
  bg:       '#F8F7FF', white:    '#FFFFFF',
  text:     '#1A1A2E', text2:    '#5A5A7A', text3: '#9A9AB0',
  border:   '#E8E4F8',
}

const PLANS = [
  {
    key: 'starter',
    label: 'Starter',
    max: 100,
    price: '29€/mois',
    color: C.blue,
    bg: C.blueLt,
    features: ['100 élèves max', 'Dashboard classe', 'Rapports de progression', 'Support email'],
  },
  {
    key: 'medium',
    label: 'Medium',
    max: 200,
    price: '49€/mois',
    color: C.violet,
    bg: C.violetLt,
    features: ['200 élèves max', 'Dashboard classe', 'Rapports de progression', 'Groupes/classes', 'Support prioritaire'],
    popular: true,
  },
  {
    key: 'school',
    label: 'School',
    max: 500,
    price: '99€/mois',
    color: C.orange,
    bg: C.orangeLt,
    features: ['500 élèves max', 'Dashboard classe', 'Rapports de progression', 'Groupes/classes', 'Statistiques avancées', 'Support dédié'],
  },
  {
    key: 'premium',
    label: 'Premium',
    max: 1000,
    price: '179€/mois',
    color: C.green,
    bg: C.greenLt,
    features: ['1000 élèves max', 'Tout inclus', 'API access', 'Intégration LMS', 'Account manager'],
  },
]

const TYPES = [
  { key: 'school',  label: '🏫 École',               desc: 'École primaire, secondaire, université' },
  { key: 'teacher', label: '👨‍🏫 Professeur indépendant', desc: 'Cours particuliers ou en groupe'       },
  { key: 'center',  label: '🏢 Centre de langues',    desc: 'Institut, centre culturel, association'  },
]

export default function CreateInstitutionPage() {
  const router = useRouter()
  const { user, fetchMe } = useAuthStore()

  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    name: '',
    institution_type: 'school',
    plan: 'starter',
    country: 'BE',
    city: '',
    contact_email: user?.email ?? '',
    website: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const update = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  const submit = async () => {
    if (!form.name.trim()) { setError('Le nom est requis'); return }
    setLoading(true); setError('')
    try {
      await api.post('/api/v1/institution/create', form)
      await fetchMe()
      router.push('/institution')
    } catch (e: any) {
      setError(e.response?.data?.detail ?? 'Erreur lors de la création')
    } finally {
      setLoading(false)
    }
  }

  const selectedPlan = PLANS.find(p => p.key === form.plan) ?? PLANS[0]

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 20px 48px' }}>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🏫</div>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: C.text, marginBottom: 8 }}>
          Créer votre espace institution
        </h1>
        <p style={{ fontSize: 15, color: C.text2, lineHeight: 1.7 }}>
          Gérez vos élèves, suivez leur progression et accédez à des rapports pédagogiques détaillés.
          <br />Essai gratuit de 30 jours — sans carte bancaire.
        </p>
      </div>

      {/* Steps */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: 40 }}>
        {[
          { n: 1, label: 'Type' },
          { n: 2, label: 'Plan' },
          { n: 3, label: 'Infos' },
        ].map((s, i) => (
          <div key={s.n} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: step >= s.n ? C.violet : C.border,
                color: step >= s.n ? '#fff' : C.text3,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 700, transition: 'all .2s',
              }}>
                {step > s.n ? '✓' : s.n}
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: step >= s.n ? C.violet : C.text3 }}>{s.label}</span>
            </div>
            {i < 2 && (
              <div style={{ width: 80, height: 2, background: step > s.n ? C.violet : C.border, margin: '0 4px', marginBottom: 20, transition: 'all .2s' }} />
            )}
          </div>
        ))}
      </div>

      {/* ── Step 1 : Type ── */}
      {step === 1 && (
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 20, textAlign: 'center' }}>
            Quel type d&apos;institution êtes-vous ?
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 560, margin: '0 auto' }}>
            {TYPES.map(t => (
              <button key={t.key} onClick={() => update('institution_type', t.key)}
                style={{
                  padding: '18px 22px', borderRadius: 16, textAlign: 'left',
                  border: `2px solid ${form.institution_type === t.key ? C.violet : C.border}`,
                  background: form.institution_type === t.key ? C.violetLt : C.white,
                  cursor: 'pointer', transition: 'all .15s',
                  display: 'flex', alignItems: 'center', gap: 16,
                }}>
                <div style={{ fontSize: 28, flexShrink: 0 }}>{t.label.split(' ')[0]}</div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: form.institution_type === t.key ? C.violetDk : C.text, marginBottom: 3 }}>
                    {t.label.split(' ').slice(1).join(' ')}
                  </div>
                  <div style={{ fontSize: 13, color: C.text2 }}>{t.desc}</div>
                </div>
                {form.institution_type === t.key && (
                  <div style={{ marginLeft: 'auto', width: 24, height: 24, borderRadius: '50%', background: C.violet, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0 }}>✓</div>
                )}
              </button>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 28 }}>
            <button onClick={() => setStep(2)}
              style={{ padding: '14px 40px', borderRadius: 14, background: C.violet, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 700 }}>
              Continuer →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2 : Plan ── */}
      {step === 2 && (
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 8, textAlign: 'center' }}>
            Choisissez votre plan
          </h2>
          <p style={{ fontSize: 13, color: C.text3, textAlign: 'center', marginBottom: 28 }}>
            30 jours d&apos;essai gratuit sur tous les plans
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16, marginBottom: 28 }}>
            {PLANS.map(p => (
              <button key={p.key} onClick={() => update('plan', p.key)}
                style={{
                  padding: '20px', borderRadius: 18, textAlign: 'left',
                  border: `2px solid ${form.plan === p.key ? p.color : C.border}`,
                  background: form.plan === p.key ? p.bg : C.white,
                  cursor: 'pointer', transition: 'all .15s', position: 'relative',
                }}>
                {p.popular && (
                  <div style={{ position: 'absolute', top: -10, right: 16, background: C.orange, color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 10px', borderRadius: 10 }}>
                    POPULAIRE
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: p.color }}>{p.label}</div>
                    <div style={{ fontSize: 12, color: C.text3 }}>jusqu&apos;à {p.max} élèves</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>{p.price}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {p.features.map(f => (
                    <div key={f} style={{ fontSize: 12, color: C.text2, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ color: p.color, fontWeight: 700 }}>✓</span> {f}
                    </div>
                  ))}
                </div>
                {form.plan === p.key && (
                  <div style={{ marginTop: 12, padding: '4px 0', borderTop: `1px solid ${p.color}30`, fontSize: 12, fontWeight: 700, color: p.color }}>
                    ✓ Sélectionné
                  </div>
                )}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button onClick={() => setStep(1)}
              style={{ padding: '12px 28px', borderRadius: 12, border: `2px solid ${C.border}`, background: C.white, cursor: 'pointer', fontSize: 14, color: C.text2 }}>
              ← Retour
            </button>
            <button onClick={() => setStep(3)}
              style={{ padding: '12px 40px', borderRadius: 12, background: C.violet, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>
              Continuer →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3 : Infos ── */}
      {step === 3 && (
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 24, textAlign: 'center' }}>
            Informations de l&apos;institution
          </h2>

          {/* Résumé plan */}
          <div style={{ background: selectedPlan.bg, border: `2px solid ${selectedPlan.color}30`, borderRadius: 14, padding: '12px 16px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 20 }}>📋</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: selectedPlan.color }}>Plan {selectedPlan.label}</div>
              <div style={{ fontSize: 12, color: C.text2 }}>{selectedPlan.max} élèves · {selectedPlan.price} · 30j essai gratuit</div>
            </div>
            <button onClick={() => setStep(2)} style={{ marginLeft: 'auto', fontSize: 12, color: C.text3, background: 'none', border: 'none', cursor: 'pointer' }}>Changer</button>
          </div>

          {[
            { label: 'Nom de l\'institution *', key: 'name', type: 'text', placeholder: 'École Al-Mustaqbal, Prof. Martin...' },
            { label: 'Email de contact', key: 'contact_email', type: 'email', placeholder: 'contact@exemple.com' },
            { label: 'Ville', key: 'city', type: 'text', placeholder: 'Bruxelles, Paris...' },
            { label: 'Site web (optionnel)', key: 'website', type: 'url', placeholder: 'https://...' },
          ].map(f => (
            <div key={f.key} style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: C.text2, display: 'block', marginBottom: 6 }}>{f.label}</label>
              <input
                type={f.type}
                placeholder={f.placeholder}
                value={(form as any)[f.key]}
                onChange={e => update(f.key, e.target.value)}
                style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => (e.currentTarget.style.borderColor = C.violet)}
                onBlur={e => (e.currentTarget.style.borderColor = C.border)}
              />
            </div>
          ))}

          {error && (
            <div style={{ padding: '10px 14px', borderRadius: 10, background: '#FCEBEB', border: '1px solid #E24B4A40', color: '#E24B4A', fontSize: 13, marginBottom: 18 }}>
              {error}
            </div>
          )}

          <div style={{ background: C.violetLt, borderRadius: 12, padding: '12px 16px', marginBottom: 24 }}>
            <p style={{ fontSize: 12, color: C.violetDk, lineHeight: 1.7, margin: 0 }}>
              ✅ En créant votre espace, vous bénéficiez de <strong>30 jours d&apos;essai gratuit</strong>.
              Aucune carte bancaire requise. Vous pourrez upgrader ou annuler à tout moment.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setStep(2)}
              style={{ flex: 1, padding: '13px', borderRadius: 12, border: `2px solid ${C.border}`, background: C.white, cursor: 'pointer', fontSize: 14, color: C.text2 }}>
              ← Retour
            </button>
            <button onClick={submit} disabled={loading || !form.name.trim()}
              style={{ flex: 2, padding: '13px', borderRadius: 12, background: loading || !form.name.trim() ? C.border : C.violet, color: '#fff', border: 'none', cursor: loading || !form.name.trim() ? 'default' : 'pointer', fontSize: 14, fontWeight: 700, transition: 'all .15s' }}>
              {loading ? 'Création en cours...' : '🏫 Créer mon institution'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
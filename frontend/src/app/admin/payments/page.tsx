'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { api } from '@/lib/api'

const C = {
  violet:'#6C3FC5', violetLt:'#EDE8FB', violetDk:'#4A2A8A',
  orange:'#F07C1E', orangeLt:'#FEF0E3',
  green:'#2BA84A', greenLt:'#E3F7E8',
  red:'#E24B4A', redLt:'#FCEBEB',
  blue:'#1976D2', blueLt:'#E6F1FB',
  gold:'#F9A825', goldLt:'#FFF8E1',
  bg:'#F8F7FF', white:'#fff',
  text:'#1A1A2E', text2:'#5A5A7A', text3:'#9A9AB0',
  border:'#E8E4F8',
}

const PLANS = [
  { id: 'monthly', name: 'Mensuel',    price: '9,99 €',  period: '/mois',   color: C.violet, bg: C.violetLt, popular: false },
  { id: 'yearly',  name: 'Annuel',     price: '79,99 €', period: '/an',     color: C.orange, bg: C.orangeLt, popular: true  },
  { id: 'lifetime',name: 'À vie',      price: '199,99 €',period: 'une fois', color: C.gold,  bg: C.goldLt,   popular: false },
]

interface Subscriber {
  id: string
  username: string
  email: string
  plan: string
  status: 'active' | 'cancelled' | 'expired'
  next_billing: string | null
  amount: string
}

const MOCK_SUBSCRIBERS: Subscriber[] = [
  { id: '1', username: 'alice', email: 'alice@example.com', plan: 'Annuel', status: 'active', next_billing: '2027-04-01', amount: '79,99 €' },
  { id: '2', username: 'bob',   email: 'bob@example.com',   plan: 'Mensuel', status: 'active', next_billing: '2026-05-01', amount: '9,99 €' },
]

const STATUS_CONFIG = {
  active:    { label: 'Actif',    color: C.green, bg: C.greenLt },
  cancelled: { label: 'Annulé',  color: C.red,   bg: C.redLt   },
  expired:   { label: 'Expiré',  color: C.text3, bg: C.bg      },
}

export default function AdminPaymentsPage() {
  const { user } = useAuthStore()
  const [stripeConfigured, setStripeConfigured] = useState(false)
  const [subscribers] = useState<Subscriber[]>(MOCK_SUBSCRIBERS)
  const [tab, setTab] = useState<'overview'|'subscribers'|'plans'>('overview')

  if (!user) return null

  const activeCount    = subscribers.filter(s => s.status === 'active').length
  const mrr            = subscribers.filter(s => s.status === 'active' && s.plan === 'Mensuel').length * 9.99
  const annualRevenue  = subscribers.filter(s => s.status === 'active' && s.plan === 'Annuel').length * 79.99

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 4 }}>💳 Paiements & Abonnements</h1>
        <p style={{ fontSize: 13, color: C.text2 }}>Gestion des abonnements premium via Stripe</p>
      </div>

      {/* Stripe non configuré */}
      {!stripeConfigured && (
        <div style={{ background: C.orangeLt, border: `2px solid ${C.orange}30`, borderLeft: `4px solid ${C.orange}`, borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 24 }}>⚠️</span>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: C.orange, marginBottom: 4 }}>Stripe non configuré</p>
            <p style={{ fontSize: 13, color: C.text2 }}>Ajoutez votre clé Stripe dans les paramètres pour activer les paiements.</p>
          </div>
          <button
            onClick={() => window.location.href = '/admin/settings'}
            style={{ padding: '9px 18px', borderRadius: 12, background: C.orange, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
            Configurer →
          </button>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8 }}>
        {(['overview','subscribers','plans'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: '9px 18px', borderRadius: 12, border: `2px solid ${tab === t ? C.violet : C.border}`, background: tab === t ? C.violetLt : C.white, color: tab === t ? C.violet : C.text2, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            {t === 'overview' ? '📊 Vue générale' : t === 'subscribers' ? '👥 Abonnés' : '💎 Plans'}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
            {[
              { label: 'Abonnés actifs',   value: activeCount,         color: C.green,  bg: C.greenLt,  icon: '👥' },
              { label: 'MRR',              value: `${mrr.toFixed(2)} €`, color: C.violet, bg: C.violetLt, icon: '📈' },
              { label: 'Revenus annuels',  value: `${annualRevenue.toFixed(2)} €`, color: C.orange, bg: C.orangeLt, icon: '💰' },
              { label: 'Taux annulation',  value: '0%',                color: C.blue,   bg: C.blueLt,   icon: '📉' },
            ].map((s, i) => (
              <div key={i} style={{ background: C.white, border: `2px solid ${C.border}`, borderRadius: 16, padding: '18px' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, marginBottom: 10 }}>{s.icon}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: s.color, marginBottom: 4 }}>{s.value}</div>
                <div style={{ fontSize: 11, color: C.text3 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Abonnés récents */}
          <div style={{ background: C.white, border: `2px solid ${C.border}`, borderRadius: 20, padding: '20px 24px' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 14 }}>Abonnés récents</h3>
            {subscribers.length === 0 ? (
              <p style={{ textAlign: 'center', color: C.text3, padding: 20, fontSize: 13 }}>Aucun abonné pour le moment</p>
            ) : subscribers.map((sub, i) => {
              const sc = STATUS_CONFIG[sub.status]
              return (
                <div key={sub.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderBottom: i < subscribers.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: C.goldLt, color: C.gold, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>
                    {sub.username.slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 2 }}>{sub.username}</p>
                    <p style={{ fontSize: 11, color: C.text3 }}>{sub.plan} — {sub.amount}</p>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 8, background: sc.bg, color: sc.color }}>{sc.label}</span>
                  {sub.next_billing && (
                    <span style={{ fontSize: 11, color: C.text3 }}>Renouvellement : {new Date(sub.next_billing).toLocaleDateString('fr-FR')}</span>
                  )}
                  <button style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${C.red}`, background: 'transparent', color: C.red, fontSize: 11, cursor: 'pointer' }}>
                    Rembourser
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Plans */}
      {tab === 'plans' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ fontSize: 13, color: C.text2 }}>Configurez les plans d'abonnement disponibles pour vos élèves.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
            {PLANS.map(plan => (
              <div key={plan.id} style={{ background: C.white, border: `2px solid ${plan.popular ? plan.color : C.border}`, borderRadius: 20, padding: '24px 20px', textAlign: 'center', position: 'relative' }}>
                {plan.popular && (
                  <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: plan.color, color: '#fff', fontSize: 10, fontWeight: 700, padding: '4px 12px', borderRadius: 10 }}>
                    POPULAIRE
                  </div>
                )}
                <div style={{ width: 48, height: 48, borderRadius: 14, background: plan.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, margin: '0 auto 12px' }}>💎</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 6 }}>{plan.name}</h3>
                <div style={{ fontSize: 28, fontWeight: 700, color: plan.color, marginBottom: 4 }}>{plan.price}</div>
                <div style={{ fontSize: 12, color: C.text3, marginBottom: 20 }}>{plan.period}</div>
                <button style={{ width: '100%', padding: '10px', borderRadius: 12, background: plan.color, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
                  Configurer
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Abonnés */}
      {tab === 'subscribers' && (
        <div style={{ background: C.white, border: `2px solid ${C.border}`, borderRadius: 20, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr 100px', padding: '11px 20px', background: C.bg, borderBottom: `2px solid ${C.border}` }}>
            {['Utilisateur','Email','Plan','Statut','Renouvellement','Action'].map(h => (
              <span key={h} style={{ fontSize: 11, fontWeight: 700, color: C.text3, textTransform: 'uppercase' }}>{h}</span>
            ))}
          </div>
          {subscribers.map((sub, i) => {
            const sc = STATUS_CONFIG[sub.status]
            return (
              <div key={sub.id} style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr 100px', padding: '13px 20px', borderBottom: i < subscribers.length - 1 ? `1px solid ${C.border}` : 'none', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{sub.username}</span>
                <span style={{ fontSize: 12, color: C.text2 }}>{sub.email}</span>
                <span style={{ fontSize: 12, color: C.text }}>{sub.plan}</span>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 8, background: sc.bg, color: sc.color, width: 'fit-content' }}>{sc.label}</span>
                <span style={{ fontSize: 11, color: C.text3 }}>{sub.next_billing ? new Date(sub.next_billing).toLocaleDateString('fr-FR') : '—'}</span>
                <button style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid ${C.red}`, background: 'transparent', color: C.red, fontSize: 11, cursor: 'pointer' }}>
                  Rembourser
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
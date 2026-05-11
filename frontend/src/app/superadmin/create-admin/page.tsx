'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { api } from '@/lib/api'

const C = {
  violet:'#6C3FC5', violetLt:'#EDE8FB', violetDk:'#4A2A8A',
  orange:'#F07C1E', orangeLt:'#FEF0E3',
  green:'#2BA84A', greenLt:'#E3F7E8',
  red:'#E24B4A', redLt:'#FCEBEB',
  bg:'#F8F7FF', white:'#fff',
  text:'#1A1A2E', text2:'#5A5A7A', text3:'#9A9AB0',
  border:'#E8E4F8',
}

const ROLE_TEMPLATES: Record<string, string[]> = {
  content_manager: ['content:view','content:create','content:edit','blog:view','blog:create','blog:edit','blog:publish'],
  moderator:       ['users:view','users:block','content:view','reports:view'],
  translator:      ['translations:view','translations:trigger','content:view'],
  admin:           ['users:view','users:edit','users:block','content:view','content:create','content:edit','content:delete','content:publish','blog:view','blog:create','blog:edit','blog:publish','blog:delete','payments:view','translations:view','translations:trigger','settings:view','reports:view'],
}

const ALL_PERMISSIONS = [
  { group: 'Utilisateurs',  perms: ['users:view','users:edit','users:block','users:delete'] },
  { group: 'Contenu',       perms: ['content:view','content:create','content:edit','content:delete','content:publish'] },
  { group: 'Blog',          perms: ['blog:view','blog:create','blog:edit','blog:publish','blog:delete'] },
  { group: 'Paiements',     perms: ['payments:view','payments:refund','payments:manage'] },
  { group: 'Traductions',   perms: ['translations:view','translations:trigger'] },
  { group: 'Paramètres',    perms: ['settings:view','settings:edit'] },
  { group: 'Rapports',      perms: ['reports:view'] },
]

export default function CreateAdminPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [form, setForm] = useState({ email: '', username: '', password: '', role: 'admin' })
  const [selectedPerms, setSelectedPerms] = useState<string[]>([])
  const [template, setTemplate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const applyTemplate = (t: string) => {
    setTemplate(t)
    setSelectedPerms(ROLE_TEMPLATES[t] ?? [])
  }

  const togglePerm = (perm: string) => {
    setSelectedPerms(prev =>
      prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(''); setSuccess('')
    if (!form.email || !form.username || !form.password) {
      setError('Tous les champs sont requis'); return
    }
    if (form.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères'); return
    }
    setLoading(true)
    try {
      // Étape 1 — Créer le compte via l'endpoint d'inscription
      const registerRes = await api.post('/api/v1/auth/register', {
        email:    form.email,
        username: form.username,
        password: form.password,
      })
      const newUserId = registerRes.data?.id ?? registerRes.data?.user?.id

      // Étape 2 — Promouvoir en admin via l'endpoint superadmin
      await api.post(`/api/v1/admin/admins/promote/${newUserId}`)

      setSuccess(`Admin "${form.username}" créé avec succès !`)
      setTimeout(() => router.push('/superadmin/admins'), 1500)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erreur lors de la création')
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  const inputStyle = {
    width: '100%', padding: '11px 14px', borderRadius: 12,
    border: `2px solid ${C.border}`, fontSize: 14, color: C.text,
    background: C.white, outline: 'none', boxSizing: 'border-box' as const,
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <button onClick={() => router.push('/superadmin/admins')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.violet, fontSize: 14, fontWeight: 600 }}>
          ← Retour
        </button>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: C.text }}>Créer un administrateur</h1>
      </div>

      {error && (
        <div style={{ background: C.redLt, border: `2px solid ${C.red}`, borderRadius: 12, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: C.red }}>
          ✗ {error}
        </div>
      )}
      {success && (
        <div style={{ background: C.greenLt, border: `2px solid ${C.green}`, borderRadius: 12, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: C.green }}>
          ✓ {success}
        </div>
      )}

      <form onSubmit={handleSubmit}>

        {/* Informations du compte */}
        <div style={{ background: C.white, border: `2px solid ${C.border}`, borderRadius: 20, padding: '24px', marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 16 }}>Informations du compte</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.text2, display: 'block', marginBottom: 6 }}>Email</label>
              <input type="email" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="admin@langdad.com" style={inputStyle}
                onFocus={e => (e.target as HTMLInputElement).style.borderColor = C.violet}
                onBlur={e => (e.target as HTMLInputElement).style.borderColor = C.border} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.text2, display: 'block', marginBottom: 6 }}>Nom d'utilisateur</label>
              <input type="text" value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                placeholder="ex: content_admin" style={inputStyle}
                onFocus={e => (e.target as HTMLInputElement).style.borderColor = C.violet}
                onBlur={e => (e.target as HTMLInputElement).style.borderColor = C.border} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.text2, display: 'block', marginBottom: 6 }}>Mot de passe</label>
              <input type="password" value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="Min. 8 caractères" style={inputStyle}
                onFocus={e => (e.target as HTMLInputElement).style.borderColor = C.violet}
                onBlur={e => (e.target as HTMLInputElement).style.borderColor = C.border} />
            </div>
          </div>

          {/* Note */}
          <div style={{ marginTop: 14, padding: '10px 14px', background: C.bg, borderRadius: 10, border: `1px solid ${C.border}` }}>
            <p style={{ fontSize: 12, color: C.text3 }}>
              ℹ️ Le compte sera créé avec le rôle <strong>admin</strong>. Communiquez le mot de passe à l'administrateur et demandez-lui de le changer à sa première connexion.
            </p>
          </div>
        </div>

        {/* Permissions */}
        <div style={{ background: C.white, border: `2px solid ${C.border}`, borderRadius: 20, padding: '24px', marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 6 }}>Permissions</h3>
          <p style={{ fontSize: 12, color: C.text3, marginBottom: 14 }}>Choisissez un modèle ou personnalisez manuellement</p>

          {/* Templates */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
            {Object.keys(ROLE_TEMPLATES).map(t => (
              <button key={t} type="button" onClick={() => applyTemplate(t)}
                style={{ padding: '7px 14px', borderRadius: 10, border: `2px solid ${template === t ? C.violet : C.border}`, background: template === t ? C.violetLt : C.white, color: template === t ? C.violet : C.text2, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                {t.replace('_', ' ')}
              </button>
            ))}
            <button type="button" onClick={() => { setTemplate(''); setSelectedPerms([]) }}
              style={{ padding: '7px 14px', borderRadius: 10, border: `2px solid ${C.border}`, background: C.white, color: C.text3, fontSize: 12, cursor: 'pointer' }}>
              Effacer tout
            </button>
          </div>

          {/* Permissions détaillées */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {ALL_PERMISSIONS.map(group => (
              <div key={group.group}>
                <p style={{ fontSize: 12, fontWeight: 700, color: C.text2, marginBottom: 8 }}>{group.group}</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {group.perms.map(perm => {
                    const active = selectedPerms.includes(perm)
                    return (
                      <button key={perm} type="button" onClick={() => togglePerm(perm)}
                        style={{ padding: '5px 12px', borderRadius: 8, border: `2px solid ${active ? C.violet : C.border}`, background: active ? C.violet : C.white, color: active ? '#fff' : C.text3, fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all .1s' }}>
                        {perm.split(':')[1]}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 14, padding: '10px 14px', background: C.bg, borderRadius: 10 }}>
            <p style={{ fontSize: 12, color: C.text3 }}>
              {selectedPerms.length} permission{selectedPerms.length !== 1 ? 's' : ''} sélectionnée{selectedPerms.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <button type="submit" disabled={loading}
          style={{ width: '100%', padding: '14px', borderRadius: 14, background: loading ? C.border : C.violet, color: '#fff', border: 'none', cursor: loading ? 'default' : 'pointer', fontSize: 15, fontWeight: 700 }}>
          {loading ? 'Création…' : 'Créer l\'administrateur'}
        </button>
      </form>
    </div>
  )
}
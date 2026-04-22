'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { api } from '@/lib/api'

const C = {
  violet:'#6C3FC5', violetLt:'#EDE8FB',
  orange:'#F07C1E', orangeLt:'#FEF0E3',
  green:'#2BA84A', greenLt:'#E3F7E8',
  red:'#E24B4A', redLt:'#FCEBEB',
  pink:'#E91E63', pinkLt:'#FCE4EC',
  blue:'#1976D2', blueLt:'#E6F1FB',
  bg:'#F8F7FF', white:'#fff',
  text:'#1A1A2E', text2:'#5A5A7A', text3:'#9A9AB0',
  border:'#E8E4F8',
}

const PERMISSION_GROUPS = [
  {
    group: 'Utilisateurs', icon: '👥', color: C.violet, bg: C.violetLt,
    perms: [
      { key: 'users:view',   label: 'Voir',     desc: 'Consulter la liste des utilisateurs' },
      { key: 'users:edit',   label: 'Modifier', desc: 'Éditer les profils utilisateurs' },
      { key: 'users:block',  label: 'Bloquer',  desc: 'Bloquer / débloquer des comptes' },
      { key: 'users:delete', label: 'Supprimer',desc: 'Supprimer définitivement un compte' },
    ]
  },
  {
    group: 'Contenu', icon: '📚', color: C.orange, bg: C.orangeLt,
    perms: [
      { key: 'content:view',    label: 'Voir',      desc: 'Consulter modules et leçons' },
      { key: 'content:create',  label: 'Créer',     desc: 'Créer de nouveaux modules/leçons' },
      { key: 'content:edit',    label: 'Modifier',  desc: 'Éditer le contenu existant' },
      { key: 'content:delete',  label: 'Supprimer', desc: 'Supprimer du contenu' },
      { key: 'content:publish', label: 'Publier',   desc: 'Rendre visible aux élèves' },
    ]
  },
  {
    group: 'Blog', icon: '📝', color: C.green, bg: C.greenLt,
    perms: [
      { key: 'blog:view',    label: 'Voir',      desc: 'Consulter les articles' },
      { key: 'blog:create',  label: 'Créer',     desc: 'Rédiger de nouveaux articles' },
      { key: 'blog:edit',    label: 'Modifier',  desc: 'Éditer les articles existants' },
      { key: 'blog:publish', label: 'Publier',   desc: 'Mettre en ligne un article' },
      { key: 'blog:delete',  label: 'Supprimer', desc: 'Supprimer un article' },
    ]
  },
  {
    group: 'Paiements', icon: '💳', color: C.blue, bg: C.blueLt,
    perms: [
      { key: 'payments:view',    label: 'Voir',       desc: 'Consulter les abonnements et revenus' },
      { key: 'payments:refund',  label: 'Rembourser', desc: 'Effectuer des remboursements' },
      { key: 'payments:manage',  label: 'Gérer',      desc: 'Modifier les plans et abonnements' },
    ]
  },
  {
    group: 'Traductions', icon: '🌍', color: '#9C27B0', bg: '#F3E5F5',
    perms: [
      { key: 'translations:view',    label: 'Voir',       desc: 'Consulter le statut des traductions' },
      { key: 'translations:trigger', label: 'Déclencher', desc: 'Lancer une nouvelle traduction' },
    ]
  },
  {
    group: 'Paramètres', icon: '⚙️', color: '#607D8B', bg: '#ECEFF1',
    perms: [
      { key: 'settings:view', label: 'Voir',     desc: 'Consulter les paramètres' },
      { key: 'settings:edit', label: 'Modifier', desc: 'Changer les paramètres de la plateforme' },
    ]
  },
  {
    group: 'Rapports', icon: '📈', color: C.orange, bg: C.orangeLt,
    perms: [
      { key: 'reports:view', label: 'Voir', desc: 'Accéder aux statistiques et rapports' },
    ]
  },
]

const ROLE_TEMPLATES = [
  {
    name: 'Content Manager', color: C.violet, bg: C.violetLt,
    desc: 'Gère le contenu pédagogique et le blog',
    perms: ['content:view','content:create','content:edit','blog:view','blog:create','blog:edit','blog:publish'],
  },
  {
    name: 'Modérateur', color: C.orange, bg: C.orangeLt,
    desc: 'Modère les utilisateurs et surveille la plateforme',
    perms: ['users:view','users:block','content:view','reports:view'],
  },
  {
    name: 'Traducteur', color: C.green, bg: C.greenLt,
    desc: 'Gère les traductions de l\'interface',
    perms: ['translations:view','translations:trigger','content:view'],
  },
  {
    name: 'Admin complet', color: C.pink, bg: C.pinkLt,
    desc: 'Accès complet sauf super admin',
    perms: ['users:view','users:edit','users:block','content:view','content:create','content:edit','content:delete','content:publish','blog:view','blog:create','blog:edit','blog:publish','blog:delete','payments:view','translations:view','translations:trigger','settings:view','reports:view'],
  },
]

export default function SuperAdminPermissionsPage() {
  const { user } = useAuthStore()
  const [admins, setAdmins] = useState<any[]>([])
  const [selectedAdmin, setSelectedAdmin] = useState<any | null>(null)
  const [previewTemplate, setPreviewTemplate] = useState<string[]>([])

  useEffect(() => {
    api.get('/api/v1/superadmin/admins')
      .then(r => setAdmins(r.data.filter((a: any) => a.role !== 'superadmin')))
      .catch(() => {})
  }, [])

  if (!user) return null

  const allPerms = PERMISSION_GROUPS.flatMap(g => g.perms.map(p => p.key))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 4 }}>🔑 Permissions</h1>
        <p style={{ fontSize: 13, color: C.text2 }}>Référence complète des permissions disponibles et modèles de rôles</p>
      </div>

      {/* Modèles de rôles */}
      <div>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 14 }}>Modèles de rôles</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14 }}>
          {ROLE_TEMPLATES.map((template, i) => (
            <div key={i}
              style={{ background: C.white, border: `2px solid ${previewTemplate === template.perms ? template.color : C.border}`, borderRadius: 18, padding: '20px', cursor: 'pointer', transition: 'all .15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = template.color; setPreviewTemplate(template.perms) }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.border; setPreviewTemplate([]) }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: template.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                  {i === 0 ? '✏️' : i === 1 ? '🛡️' : i === 2 ? '🌍' : '⚡'}
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{template.name}</p>
                  <p style={{ fontSize: 11, color: C.text3 }}>{template.perms.length} permissions</p>
                </div>
              </div>
              <p style={{ fontSize: 12, color: C.text2, marginBottom: 12 }}>{template.desc}</p>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {template.perms.slice(0, 5).map(p => (
                  <span key={p} style={{ fontSize: 9, background: template.bg, color: template.color, padding: '2px 6px', borderRadius: 5, fontWeight: 600 }}>{p}</span>
                ))}
                {template.perms.length > 5 && (
                  <span style={{ fontSize: 9, background: C.bg, color: C.text3, padding: '2px 6px', borderRadius: 5 }}>+{template.perms.length - 5}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tableau de toutes les permissions */}
      <div>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 14 }}>Référence complète</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {PERMISSION_GROUPS.map(group => (
            <div key={group.group} style={{ background: C.white, border: `2px solid ${C.border}`, borderRadius: 18, overflow: 'hidden' }}>
              {/* Header groupe */}
              <div style={{ background: group.bg, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: `1px solid ${group.color}20` }}>
                <span style={{ fontSize: 18 }}>{group.icon}</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: group.color }}>{group.group}</span>
                <span style={{ fontSize: 11, color: group.color, opacity: 0.7 }}>{group.perms.length} permission{group.perms.length > 1 ? 's' : ''}</span>
              </div>

              {/* Permissions du groupe */}
              {group.perms.map((perm, pi) => {
                const isInPreview = previewTemplate.includes(perm.key)
                return (
                  <div key={perm.key}
                    style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 20px', borderBottom: pi < group.perms.length - 1 ? `1px solid ${C.border}` : 'none', background: isInPreview ? group.bg : C.white, transition: 'background .2s' }}>
                    <code style={{ fontSize: 11, background: isInPreview ? C.white : C.bg, color: group.color, padding: '3px 10px', borderRadius: 6, fontFamily: 'monospace', fontWeight: 700, flexShrink: 0, minWidth: 160 }}>
                      {perm.key}
                    </code>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: C.text, marginRight: 8 }}>{perm.label}</span>
                      <span style={{ fontSize: 12, color: C.text3 }}>{perm.desc}</span>
                    </div>
                    {isInPreview && (
                      <span style={{ fontSize: 10, fontWeight: 700, color: group.color, background: C.white, padding: '2px 8px', borderRadius: 8 }}>✓ inclus</span>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Admins et leurs permissions */}
      {admins.length > 0 && (
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 14 }}>Permissions par admin</h2>
          <div style={{ background: C.white, border: `2px solid ${C.border}`, borderRadius: 18, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', padding: '11px 20px', background: C.bg, borderBottom: `2px solid ${C.border}` }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: C.text3, textTransform: 'uppercase' }}>Admin</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: C.text3, textTransform: 'uppercase' }}>Permissions</span>
            </div>
            {admins.map((admin, i) => (
              <div key={admin.id} style={{ display: 'grid', gridTemplateColumns: '180px 1fr', padding: '14px 20px', borderBottom: i < admins.length - 1 ? `1px solid ${C.border}` : 'none', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: C.violetLt, color: C.violet, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>
                    {admin.username.slice(0, 2).toUpperCase()}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{admin.username}</span>
                </div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {(admin.permissions ?? []).length === 0 ? (
                    <span style={{ fontSize: 12, color: C.text3, fontStyle: 'italic' }}>Aucune permission</span>
                  ) : (admin.permissions as string[]).map((p: string) => (
                    <span key={p} style={{ fontSize: 10, background: C.violetLt, color: C.violet, padding: '2px 7px', borderRadius: 6, fontWeight: 600 }}>{p}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
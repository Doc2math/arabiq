'use client'

import { useState } from 'react'
import { useAuthStore } from '@/store/authStore'

const C = {
  violet:'#6C3FC5', violetLt:'#EDE8FB', violetDk:'#4A2A8A',
  orange:'#F07C1E', orangeLt:'#FEF0E3',
  green:'#2BA84A', greenLt:'#E3F7E8',
  red:'#E24B4A', redLt:'#FCEBEB',
   blue:'#1976D2',
  bg:'#F8F7FF', white:'#fff',
  text:'#1A1A2E', text2:'#5A5A7A', text3:'#9A9AB0',
  border:'#E8E4F8',
}

interface BlogPost {
  id: number
  title: string
  slug: string
  status: 'draft' | 'published' | 'archived'
  author: string
  created_at: string
  views: number
  category: string
}

const MOCK_POSTS: BlogPost[] = [
  { id: 1, title: 'Comment apprendre l\'alphabet arabe en 30 jours', slug: 'alphabet-arabe-30-jours', status: 'published', author: 'admin', created_at: '2026-04-01', views: 1240, category: 'Pédagogie' },
  { id: 2, title: 'Les 10 erreurs courantes en calligraphie arabe', slug: 'erreurs-calligraphie', status: 'published', author: 'admin', created_at: '2026-04-10', views: 876, category: 'Calligraphie' },
  { id: 3, title: 'Module 2 — Nouvelles lettres disponibles', slug: 'module-2-nouveautes', status: 'draft', author: 'admin', created_at: '2026-04-15', views: 0, category: 'Annonces' },
]

const STATUS_CFG = {
  published: { label: 'Publié',   color: C.green,  bg: C.greenLt  },
  draft:     { label: 'Brouillon',color: C.orange, bg: C.orangeLt },
  archived:  { label: 'Archivé', color: C.text3,  bg: C.bg       },
}

const CATEGORIES = ['Pédagogie', 'Calligraphie', 'Annonces', 'Conseils', 'Culture arabe']

export default function AdminBlogPage() {
  const { user } = useAuthStore()
  const [posts, setPosts] = useState<BlogPost[]>(MOCK_POSTS)
  const [showEditor, setShowEditor] = useState(false)
  const [filter, setFilter] = useState<'all'|'published'|'draft'>('all')
  const [newPost, setNewPost] = useState({ title: '', category: 'Pédagogie', content: '' })

  if (!user) return null

  const filtered = posts.filter(p => filter === 'all' ? true : p.status === filter)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 4 }}>📝 Blog</h1>
          <p style={{ fontSize: 13, color: C.text2 }}>Gérez les articles et publications</p>
        </div>
        <button onClick={() => setShowEditor(!showEditor)}
          style={{ padding: '10px 20px', borderRadius: 12, background: showEditor ? C.red : C.violet, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
          {showEditor ? '✕ Fermer' : '+ Nouvel article'}
        </button>
      </div>

      {/* Éditeur rapide */}
      {showEditor && (
        <div style={{ background: C.white, border: `2px solid ${C.violet}`, borderRadius: 20, padding: '24px' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 16 }}>✏️ Nouvel article</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.text2, display: 'block', marginBottom: 6 }}>Titre</label>
              <input type="text" value={newPost.title} onChange={e => setNewPost(p => ({ ...p, title: e.target.value }))}
                placeholder="Titre de l'article…"
                style={{ width: '100%', padding: '11px 14px', borderRadius: 12, border: `2px solid ${C.border}`, fontSize: 14, color: C.text, outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = C.violet}
                onBlur={e => e.target.style.borderColor = C.border} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.text2, display: 'block', marginBottom: 6 }}>Catégorie</label>
              <select value={newPost.category} onChange={e => setNewPost(p => ({ ...p, category: e.target.value }))}
                style={{ padding: '10px 14px', borderRadius: 12, border: `2px solid ${C.border}`, fontSize: 13, color: C.text, outline: 'none', cursor: 'pointer' }}>
                {CATEGORIES.map(cat => <option key={cat}>{cat}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.text2, display: 'block', marginBottom: 6 }}>Contenu</label>
              <textarea value={newPost.content} onChange={e => setNewPost(p => ({ ...p, content: e.target.value }))}
                placeholder="Rédigez votre article…"
                rows={8}
                style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: `2px solid ${C.border}`, fontSize: 13, color: C.text, outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = C.violet}
                onBlur={e => e.target.style.borderColor = C.border} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button style={{ flex: 1, padding: '12px', borderRadius: 12, border: `2px solid ${C.border}`, background: 'transparent', color: C.text2, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                💾 Enregistrer brouillon
              </button>
              <button style={{ flex: 2, padding: '12px', borderRadius: 12, background: C.green, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
                🚀 Publier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
        {[
          { label: 'Total articles',  value: posts.length,                                     color: C.violet, bg: C.violetLt },
          { label: 'Publiés',         value: posts.filter(p => p.status === 'published').length, color: C.green,  bg: C.greenLt  },
          { label: 'Brouillons',      value: posts.filter(p => p.status === 'draft').length,    color: C.orange, bg: C.orangeLt },
          { label: 'Vues totales',    value: posts.reduce((s, p) => s + p.views, 0).toLocaleString(), color: C.blue, bg: '#E6F1FB' },
        ].map((s, i) => (
          <div key={i} style={{ background: C.white, border: `2px solid ${C.border}`, borderRadius: 14, padding: '14px 16px' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color, marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: C.text3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: 8 }}>
        {(['all','published','draft'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding: '7px 16px', borderRadius: 10, border: `2px solid ${filter === f ? C.violet : C.border}`, background: filter === f ? C.violetLt : C.white, color: filter === f ? C.violet : C.text2, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            {f === 'all' ? 'Tous' : f === 'published' ? 'Publiés' : 'Brouillons'}
          </button>
        ))}
      </div>

      {/* Liste des articles */}
      <div style={{ background: C.white, border: `2px solid ${C.border}`, borderRadius: 20, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr 80px 100px', padding: '11px 20px', background: C.bg, borderBottom: `2px solid ${C.border}` }}>
          {['Titre', 'Catégorie', 'Statut', 'Vues', 'Actions'].map(h => (
            <span key={h} style={{ fontSize: 11, fontWeight: 700, color: C.text3, textTransform: 'uppercase' }}>{h}</span>
          ))}
        </div>
        {filtered.map((post, i) => {
          const sc = STATUS_CFG[post.status]
          return (
            <div key={post.id}
              style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr 80px 100px', padding: '13px 20px', borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : 'none', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 2 }}>{post.title}</p>
                <p style={{ fontSize: 11, color: C.text3 }}>{post.author} · {new Date(post.created_at).toLocaleDateString('fr-FR')}</p>
              </div>
              <span style={{ fontSize: 11, background: C.violetLt, color: C.violet, padding: '3px 8px', borderRadius: 8, fontWeight: 600, width: 'fit-content' }}>{post.category}</span>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 8, background: sc.bg, color: sc.color, width: 'fit-content' }}>{sc.label}</span>
              <span style={{ fontSize: 12, color: C.text2 }}>{post.views.toLocaleString()}</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${C.violet}`, background: C.violetLt, color: C.violet, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✏️</button>
                {post.status === 'draft'
                  ? <button style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${C.green}`, background: C.greenLt, color: C.green, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🚀</button>
                  : <button style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${C.border}`, background: 'transparent', color: C.text3, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📦</button>
                }
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
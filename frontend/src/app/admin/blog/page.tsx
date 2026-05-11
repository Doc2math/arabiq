'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { api } from '@/lib/api'

const C = {
  violet:'#6C3FC5', violetLt:'#EDE8FB', violetDk:'#4A2A8A',
  orange:'#F07C1E', orangeLt:'#FEF0E3',
  green:'#2BA84A', greenLt:'#E3F7E8',
  red:'#E24B4A', redLt:'#FCEBEB',
  bg:'#F8F7FF', white:'#FFFFFF',
  text:'#1A1A2E', text2:'#5A5A7A', text3:'#9A9AB0',
  border:'#E8E4F8',
}

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  category: string
  emoji: string
  color: string
  featured: boolean
  published: boolean
  author_name: string
  created_at: string
  updated_at: string
  read_time: number
}

const CATEGORIES = ['Tous', 'Pédagogie', 'Arabe', 'Conseils', 'Actualités']

export default function AdminBlogPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('Tous')
  const [search, setSearch] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const fetchPosts = useCallback(async () => {
    try {
      const res = await api.get('/api/v1/admin/blog/posts')
      setPosts(res.data)
    } catch {
      console.error('Erreur chargement articles')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchPosts() }, [fetchPosts])

  const handleDelete = async (id: string) => {
    setDeleting(id)
    try {
      await api.delete(`/api/v1/admin/blog/posts/${id}`)
      setPosts(prev => prev.filter(p => p.id !== id))
    } catch {
      console.error('Erreur suppression')
    } finally {
      setDeleting(null)
      setConfirmDelete(null)
    }
  }

  const handleTogglePublish = async (post: BlogPost) => {
    try {
      await api.put(`/api/v1/admin/blog/posts/${post.id}`, {
        published: !post.published,
      })
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, published: !p.published } : p))
    } catch {
      console.error('Erreur mise à jour')
    }
  }

  const handleToggleFeatured = async (post: BlogPost) => {
    try {
      await api.put(`/api/v1/admin/blog/posts/${post.id}`, {
        featured: !post.featured,
      })
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, featured: !p.featured } : p))
    } catch {
      console.error('Erreur mise à jour')
    }
  }

  if (!user || !['admin', 'superadmin'].includes(user.role)) {
    return <div style={{ padding: 60, textAlign: 'center', color: C.text3 }}>Accès refusé.</div>
  }

  const filtered = posts.filter(p => {
    const matchCat = filter === 'Tous' || p.category === filter
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const published = posts.filter(p => p.published).length
  const drafts = posts.filter(p => !p.published).length

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>

      {/* En-tête */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: C.text, marginBottom: 4 }}>Blog</h1>
          <p style={{ fontSize: 13, color: C.text3 }}>
            {posts.length} articles · {published} publiés · {drafts} brouillons
          </p>
        </div>
        <button
          onClick={() => router.push('/admin/blog/editor')}
          style={{ padding: '11px 22px', borderRadius: 12, background: C.violet, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}
        >
          + Nouvel article
        </button>
      </div>

      {/* Stats rapides */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total', val: posts.length, color: C.violet, bg: C.violetLt },
          { label: 'Publiés', val: published, color: C.green, bg: C.greenLt },
          { label: 'Brouillons', val: drafts, color: C.orange, bg: C.orangeLt },
          { label: 'À la une', val: posts.filter(p => p.featured).length, color: '#F9A825', bg: '#FFF8E1' },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, borderRadius: 14, padding: '14px 16px', border: `1.5px solid ${s.color}30` }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 12, color: s.color, opacity: 0.8 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filtres + Recherche */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher un article…"
          style={{ flex: 1, minWidth: 200, padding: '9px 14px', borderRadius: 10, border: `1.5px solid ${C.border}`, fontSize: 13, outline: 'none', background: C.white }}
        />
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setFilter(cat)}
            style={{ padding: '7px 14px', borderRadius: 20, border: `1.5px solid ${filter === cat ? C.violet : C.border}`, background: filter === cat ? C.violet : C.white, color: filter === cat ? '#fff' : C.text2, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            {cat}
          </button>
        ))}
      </div>

      {/* Liste articles */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: C.text3 }}>Chargement…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: C.text3 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📝</div>
          <p>Aucun article trouvé.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(post => (
            <div key={post.id} style={{
              background: C.white, border: `1.5px solid ${C.border}`, borderRadius: 16,
              padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
            }}>
              {/* Emoji */}
              <div style={{ width: 44, height: 44, borderRadius: 12, background: `${post.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                {post.emoji}
              </div>

              {/* Infos */}
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{post.title}</span>
                  {post.featured && <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 8, background: '#FFF8E1', color: '#F9A825', fontWeight: 700 }}>⭐ UNE</span>}
                  <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 8, background: `${post.color}18`, color: post.color, fontWeight: 700 }}>{post.category}</span>
                  <span style={{
                    fontSize: 10, padding: '2px 7px', borderRadius: 8, fontWeight: 700,
                    background: post.published ? C.greenLt : C.orangeLt,
                    color: post.published ? C.green : C.orange,
                  }}>
                    {post.published ? '✓ Publié' : '○ Brouillon'}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: C.text3 }}>
                  {post.author_name} · {new Date(post.created_at).toLocaleDateString('fr-FR')} · {post.read_time} min
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
                {/* Toggle publié */}
                <button
                  onClick={() => handleTogglePublish(post)}
                  style={{ padding: '7px 12px', borderRadius: 9, border: `1.5px solid ${post.published ? C.green : C.border}`, background: post.published ? C.greenLt : C.white, color: post.published ? C.green : C.text2, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                >
                  {post.published ? 'Dépublier' : 'Publier'}
                </button>

                {/* Toggle une */}
                <button
                  onClick={() => handleToggleFeatured(post)}
                  title={post.featured ? 'Retirer de la une' : 'Mettre à la une'}
                  style={{ padding: '7px 10px', borderRadius: 9, border: `1.5px solid ${post.featured ? '#F9A825' : C.border}`, background: post.featured ? '#FFF8E1' : C.white, color: post.featured ? '#F9A825' : C.text3, fontSize: 14, cursor: 'pointer' }}
                >
                  ⭐
                </button>

                {/* Éditer */}
                <button
                  onClick={() => router.push(`/admin/blog/editor?id=${post.id}`)}
                  style={{ padding: '7px 14px', borderRadius: 9, border: `1.5px solid ${C.violet}`, background: C.violetLt, color: C.violet, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                >
                  Éditer
                </button>

                {/* Supprimer */}
                {confirmDelete === post.id ? (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => handleDelete(post.id)}
                      disabled={deleting === post.id}
                      style={{ padding: '7px 12px', borderRadius: 9, border: 'none', background: C.red, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                    >
                      {deleting === post.id ? '…' : 'Confirmer'}
                    </button>
                    <button
                      onClick={() => setConfirmDelete(null)}
                      style={{ padding: '7px 12px', borderRadius: 9, border: `1.5px solid ${C.border}`, background: C.white, color: C.text2, fontSize: 12, cursor: 'pointer' }}
                    >
                      Annuler
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(post.id)}
                    style={{ padding: '7px 10px', borderRadius: 9, border: `1.5px solid ${C.border}`, background: C.white, color: C.text3, fontSize: 14, cursor: 'pointer' }}
                  >
                    🗑
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
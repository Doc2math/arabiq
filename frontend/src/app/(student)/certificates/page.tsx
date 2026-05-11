'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
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

interface Certificate {
  id: string
  module_id: number
  module_title: string
  overall_score: number
  certificate_number: string
  issued_at: string
  pdf_url: string | null
}

export default function CertificatesPage() {
  const { user } = useAuthStore()
  const router   = useRouter()
  const t        = useTranslations('certificates')
  const tCommon  = useTranslations('common')

  const [certs, setCerts]     = useState<Certificate[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

  useEffect(() => {
    api.get('/api/v1/certifications/user')
      .then(r => setCerts(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (!user) return null

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric'
    })
  }

  const handleDownload = async (cert: Certificate) => {
    const lang = localStorage.getItem('langdad_lang') ?? 'fr'
    try {
      const res = await api.post('/api/v1/certifications/generate', {
        module_id:     cert.module_id,
        module_order:  1,
        degree:        1,
        overall_score: cert.overall_score,
        lang,
      })
      if (res.data.pdf_url) {
        window.open(`${API_URL}${res.data.pdf_url}`, '_blank')
      }
    } catch {
      if (cert.pdf_url) window.open(`${API_URL}${cert.pdf_url}`, '_blank')
    }
  }

  const handleDelete = async (cert: Certificate) => {
    if (!confirm(t('deleteConfirm'))) return
    setDeleting(cert.id)
    try {
      await api.delete(`/api/v1/certifications/${cert.id}`)
      setCerts(prev => prev.filter(c => c.id !== cert.id))
    } catch {
      alert(t('deleteError'))
    }
    setDeleting(null)
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
        <button onClick={() => router.push('/profile')}
          style={{ width: 36, height: 36, borderRadius: '50%', border: `2px solid ${C.violet}`, background: C.violetLt, color: C.violet, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>
          ←
        </button>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: C.text }}>🏅 {t('title')}</h1>
          <p style={{ fontSize: 13, color: C.text3 }}>{t('subtitle')}</p>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: C.text3 }}>
          {tCommon('loading')}
        </div>
      ) : certs.length === 0 ? (
        <div style={{ background: C.white, border: `2px solid ${C.border}`, borderRadius: 20, padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎓</div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 8 }}>
            {t('empty.title')}
          </h2>
          <p style={{ fontSize: 14, color: C.text2, marginBottom: 24, lineHeight: 1.6 }}>
            {t('empty.desc')}
          </p>
          <button onClick={() => router.push('/dashboard')}
            style={{ padding: '12px 28px', borderRadius: 14, background: C.violet, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>
            {t('empty.btn')}
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {certs.map(cert => (
            <div key={cert.id} style={{ background: C.white, border: `2px solid ${C.border}`, borderRadius: 20, overflow: 'hidden' }}>

              {/* Bande colorée */}
              <div style={{ height: 6, background: `linear-gradient(90deg, ${C.violet}, ${C.orange})` }} />

              <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>

                {/* Médaille */}
                <div style={{ width: 64, height: 64, borderRadius: 16, background: C.violetLt, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, flexShrink: 0 }}>
                  🏅
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 4 }}>
                    {cert.module_title}
                  </h3>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, background: C.orangeLt, color: C.orange, padding: '2px 10px', borderRadius: 8, fontWeight: 700 }}>
                      {t('score', { score: Math.round(cert.overall_score * 100) })}
                    </span>
                    <span style={{ fontSize: 12, color: C.text3 }}>
                      {t('issuedOn', { date: formatDate(cert.issued_at) })}
                    </span>
                  </div>
                  <p style={{ fontSize: 11, color: C.text3, fontFamily: 'monospace' }}>
                    N° {cert.certificate_number}
                  </p>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
                  <button onClick={() => handleDownload(cert)}
                    style={{ padding: '10px 20px', borderRadius: 12, background: C.violet, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>
                    ⬇ {t('downloadBtn')}
                  </button>
                  <a href={`${API_URL}/api/v1/certifications/verify/${cert.certificate_number}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{ padding: '8px 20px', borderRadius: 12, background: 'transparent', color: C.text2, border: `2px solid ${C.border}`, cursor: 'pointer', fontSize: 12, fontWeight: 600, textAlign: 'center', textDecoration: 'none' }}>
                    🔍 {t('verifyBtn')}
                  </a>
                  <button onClick={() => handleDelete(cert)} disabled={deleting === cert.id}
                    style={{ padding: '8px 20px', borderRadius: 12, background: 'transparent', color: C.red, border: `2px solid ${C.red}40`, cursor: deleting === cert.id ? 'default' : 'pointer', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {deleting === cert.id ? '...' : `🗑 ${t('deleteBtn')}`}
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Message encouragement */}
          <div style={{ background: C.violetLt, border: `2px solid ${C.violet}20`, borderRadius: 16, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: 24, flexShrink: 0 }}>💡</span>
            <p style={{ fontSize: 13, color: C.violetDk, lineHeight: 1.6 }}>
              {t('encourage')}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
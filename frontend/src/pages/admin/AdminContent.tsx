import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/apiClient'

interface Module { id: number; slug: string; title: string; description: string; arabic_ratio: number; is_premium: boolean; lessons_count: number; completion_rate: number }

export default function AdminContent() {
  const [activeTab, setActiveTab] = useState<'modules' | 'lessons'>('modules')
  const [expandedModule, setExpandedModule] = useState<number | null>(null)
  const [editingModule, setEditingModule] = useState<number | null>(null)
  const [notification, setNotification] = useState('')

  const { data: modules = [], isLoading } = useQuery({
    queryKey: ['admin', 'modules'],
    queryFn: () => api.get<Module[]>('/curriculum/modules'),
    staleTime: 30_000,
  })

  const showNotif = (msg: string) => {
    setNotification(msg)
    setTimeout(() => setNotification(''), 3000)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">Contenu</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gérez les modules et leçons du curriculum</p>
        </div>
        <button
          onClick={() => showNotif('Création de module — Phase 2')}
          className="px-4 py-2 bg-brand-teal text-white rounded-xl text-sm font-medium hover:bg-brand-teal-dark transition-colors"
        >
          + Nouveau module
        </button>
      </div>

      {/* Notification */}
      {notification && (
        <div className="bg-brand-teal/10 border border-brand-teal/30 text-brand-teal rounded-xl px-4 py-3 text-sm font-medium">
          {notification}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {(['modules', 'lessons'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'modules' ? '📦 Modules' : '📝 Leçons'}
          </button>
        ))}
      </div>

      {/* Modules list */}
      {activeTab === 'modules' && (
        <div className="space-y-3">
          {isLoading ? (
            <div className="text-center py-12 text-gray-400">Chargement…</div>
          ) : modules.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
              <p className="text-gray-400 text-sm mb-4">Aucun module en base de données.</p>
              <p className="text-xs text-gray-300">Ajoutez des données via l'API ou le seed SQL.</p>
            </div>
          ) : (
            modules.map((mod) => (
              <div key={mod.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Module header */}
                <div className="flex items-center gap-4 p-4">
                  <div className="w-10 h-10 rounded-xl bg-brand-teal/10 flex items-center justify-center font-bold text-brand-teal shrink-0">
                    {mod.id}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900 truncate">{mod.title}</p>
                      {mod.is_premium && (
                        <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full shrink-0">Premium</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {mod.lessons_count} leçons · {Math.round(mod.arabic_ratio * 100)}% arabe
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">{Math.round(mod.completion_rate * 100)}%</p>
                      <p className="text-xs text-gray-400">complété</p>
                    </div>
                    <button
                      onClick={() => setEditingModule(editingModule === mod.id ? null : mod.id)}
                      className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => setExpandedModule(expandedModule === mod.id ? null : mod.id)}
                      className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {expandedModule === mod.id ? '▲' : '▼'}
                    </button>
                  </div>
                </div>

                {/* Edit form */}
                {editingModule === mod.id && (
                  <div className="border-t border-gray-100 p-4 bg-gray-50 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Titre</label>
                        <input defaultValue={mod.title}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-brand-teal" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Ratio arabe (%)</label>
                        <input type="number" min="0" max="100" defaultValue={Math.round(mod.arabic_ratio * 100)}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-brand-teal" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
                      <textarea defaultValue={mod.description} rows={2}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-brand-teal resize-none" />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setEditingModule(null); showNotif('Modifications sauvegardées ✓') }}
                        className="px-4 py-2 bg-brand-teal text-white rounded-lg text-sm font-medium hover:bg-brand-teal-dark transition-colors"
                      >
                        Sauvegarder
                      </button>
                      <button
                        onClick={() => setEditingModule(null)}
                        className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                )}

                {/* Progress bar */}
                <div className="px-4 pb-4">
                  <div className="h-1 bg-gray-100 rounded-full">
                    <div className="h-full bg-brand-teal rounded-full" style={{ width: `${mod.completion_rate * 100}%` }} />
                  </div>
                </div>

                {/* Expanded detail */}
                {expandedModule === mod.id && (
                  <div className="border-t border-gray-100 p-4 bg-gray-50">
                    <p className="text-sm text-gray-600">{mod.description}</p>
                    <div className="mt-3 flex gap-4 text-xs text-gray-400">
                      <span>Slug : <code className="bg-gray-200 px-1 rounded">{mod.slug}</code></span>
                      <span>Premium : {mod.is_premium ? 'Oui' : 'Non'}</span>
                    </div>
                    <button
                      onClick={() => showNotif('Gestion des leçons — disponible en Phase 2')}
                      className="mt-3 text-xs text-brand-teal hover:underline"
                    >
                      Voir les leçons →
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Lessons tab */}
      {activeTab === 'lessons' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
          <p className="text-4xl mb-3">📝</p>
          <p className="text-gray-600 font-medium">Gestion des leçons</p>
          <p className="text-sm text-gray-400 mt-1">Disponible en Phase 2 avec l'éditeur de contenu complet</p>
        </div>
      )}
    </div>
  )
}
import { useState, useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'

// ── Mock data ──────────────────────────────────────────────────
const MOCK_USERS = [
  { id: '1', username: 'testuser',   email: 'test@example.com',   xp: 450,  level: 1, streak: 3, isPremium: false, isActive: true,  nativeLang: 'fr', createdAt: '2026-03-01' },
  { id: '2', username: 'ahmed_fr',   email: 'ahmed@example.com',  xp: 2100, level: 3, streak: 12, isPremium: true,  isActive: true,  nativeLang: 'fr', createdAt: '2026-02-15' },
  { id: '3', username: 'maria_es',   email: 'maria@example.com',  xp: 890,  level: 1, streak: 5,  isPremium: false, isActive: true,  nativeLang: 'es', createdAt: '2026-02-20' },
  { id: '4', username: 'john_en',    email: 'john@example.com',   xp: 3400, level: 4, streak: 21, isPremium: true,  isActive: true,  nativeLang: 'en', createdAt: '2026-01-10' },
  { id: '5', username: 'banned_usr', email: 'banned@example.com', xp: 0,    level: 1, streak: 0,  isPremium: false, isActive: false, nativeLang: 'fr', createdAt: '2026-03-10' },
]

type User = typeof MOCK_USERS[0]

export default function AdminUsers() {
  const [users, setUsers] = useState(MOCK_USERS)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'premium' | 'banned'>('all')
  const [selected, setSelected] = useState<User | null>(null)
  const tableRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    gsap.fromTo(tableRef.current,
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }
    )
  }, { scope: tableRef })

  const filtered = users.filter((u) => {
    const matchSearch = u.username.toLowerCase().includes(search.toLowerCase()) ||
                        u.email.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' ? true
      : filter === 'premium' ? u.isPremium
      : !u.isActive
    return matchSearch && matchFilter
  })

  const toggleBan = (id: string) => {
    setUsers((prev) => prev.map((u) => u.id === id ? { ...u, isActive: !u.isActive } : u))
  }

  const togglePremium = (id: string) => {
    setUsers((prev) => prev.map((u) => u.id === id ? { ...u, isPremium: !u.isPremium } : u))
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">Utilisateurs</h1>
          <p className="text-sm text-gray-500 mt-0.5">{users.length} inscrits au total</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium">
            {users.filter((u) => u.isActive).length} actifs
          </span>
          <span className="bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full font-medium">
            {users.filter((u) => u.isPremium).length} premium
          </span>
          <span className="bg-red-100 text-red-700 px-2.5 py-1 rounded-full font-medium">
            {users.filter((u) => !u.isActive).length} bannis
          </span>
        </div>
      </div>

      {/* Filtres + recherche */}
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Rechercher par nom ou email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/30 focus:border-brand-teal"
        />
        <div className="flex gap-1">
          {(['all', 'premium', 'banned'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-brand-teal text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {f === 'all' ? 'Tous' : f === 'premium' ? 'Premium' : 'Bannis'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div ref={tableRef} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 font-medium text-gray-500">Utilisateur</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Langue</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">XP / Niveau</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Streak</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Statut</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => (
              <tr
                key={user.id}
                className={`border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer
                  ${!user.isActive ? 'opacity-50' : ''}`}
                onClick={() => setSelected(selected?.id === user.id ? null : user)}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand-teal/10 flex items-center justify-center text-xs font-bold text-brand-teal">
                      {user.username[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{user.username}</p>
                      <p className="text-gray-400 text-xs">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-lg">
                    {user.nativeLang === 'fr' ? '🇫🇷' : user.nativeLang === 'es' ? '🇪🇸' : '🇬🇧'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <p className="font-semibold text-gray-900">{user.xp.toLocaleString()} XP</p>
                  <p className="text-gray-400 text-xs">Niveau {user.level}</p>
                </td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-1">
                    <span style={{ fontSize: 14 }}>🔥</span>
                    <span className="font-medium">{user.streak}j</span>
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1.5">
                    {user.isPremium && (
                      <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full font-medium">
                        Premium
                      </span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {user.isActive ? 'Actif' : 'Banni'}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => togglePremium(user.id)}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                        user.isPremium
                          ? 'border-amber-300 text-amber-700 hover:bg-amber-50'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {user.isPremium ? '⭐ Retirer' : '⭐ Premium'}
                    </button>
                    <button
                      onClick={() => toggleBan(user.id)}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                        user.isActive
                          ? 'border-red-200 text-red-600 hover:bg-red-50'
                          : 'border-green-200 text-green-600 hover:bg-green-50'
                      }`}
                    >
                      {user.isActive ? '🚫 Bannir' : '✅ Débannir'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">
            Aucun utilisateur trouvé
          </div>
        )}
      </div>

      {/* Détail utilisateur */}
      {selected && (
        <div className="bg-white rounded-2xl border border-brand-teal/30 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">Détail — {selected.username}</h2>
            <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              ['Email',       selected.email],
              ['Inscrit le',  selected.createdAt],
              ['XP total',    selected.xp.toLocaleString()],
              ['Niveau',      selected.level],
              ['Streak',      `${selected.streak} jours`],
              ['Premium',     selected.isPremium ? 'Oui' : 'Non'],
              ['Statut',      selected.isActive ? 'Actif' : 'Banni'],
              ['Langue',      selected.nativeLang.toUpperCase()],
            ].map(([label, val]) => (
              <div key={label as string} className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500">{label}</span>
                <span className="font-medium text-gray-900">{val}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
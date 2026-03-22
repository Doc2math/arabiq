import { useState, useEffect, useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'

type LogLevel = 'info' | 'warn' | 'error' | 'success'

interface LogEntry {
  id: number
  timestamp: string
  level: LogLevel
  method?: string
  path: string
  status?: number
  duration?: number
  message: string
}

// ── Générateur de logs simulés ────────────────────────────────
let logId = 1
function generateLog(): LogEntry {
  const entries: Omit<LogEntry, 'id' | 'timestamp'>[] = [
    { level: 'info',    method: 'POST', path: '/api/v1/auth/login',                 status: 200, duration: 42,  message: 'User login successful'           },
    { level: 'info',    method: 'GET',  path: '/api/v1/curriculum/modules',          status: 200, duration: 18,  message: 'Modules list fetched'            },
    { level: 'warn',    method: 'GET',  path: '/api/v1/curriculum/next-lesson',      status: 404, duration: 12,  message: 'No lessons available for user'   },
    { level: 'error',   method: 'POST', path: '/api/v1/auth/register',               status: 409, duration: 55,  message: 'Email already registered'        },
    { level: 'success', method: 'POST', path: '/api/v1/curriculum/lessons/1/complete', status: 200, duration: 89, message: '+15 XP awarded, streak updated' },
    { level: 'info',    method: 'GET',  path: '/api/v1/auth/me',                     status: 200, duration: 8,   message: 'Token validated'                 },
    { level: 'error',   path: 'SYSTEM',  message: 'GSAP target null — refs not ready (harmless in dev)' },
    { level: 'warn',    path: 'SYSTEM',  message: 'React Router v7 migration flag recommended'          },
    { level: 'success', method: 'GET',  path: '/health',                             status: 200, duration: 2,   message: 'Health check OK'                 },
  ]
  const entry = entries[Math.floor(Math.random() * entries.length)]
  return { ...entry, id: logId++, timestamp: new Date().toISOString() }
}

const LEVEL_STYLE: Record<LogLevel, string> = {
  info:    'bg-blue-50   text-blue-700   border-blue-100',
  warn:    'bg-amber-50  text-amber-700  border-amber-100',
  error:   'bg-red-50    text-red-700    border-red-100',
  success: 'bg-green-50  text-green-700  border-green-100',
}

const LEVEL_DOT: Record<LogLevel, string> = {
  info:    'bg-blue-400',
  warn:    'bg-amber-400',
  error:   'bg-red-500',
  success: 'bg-green-500',
}

export default function AdminLogs() {
  const [logs, setLogs] = useState<LogEntry[]>(() => Array.from({ length: 12 }, generateLog))
  const [filter, setFilter] = useState<LogLevel | 'all'>('all')
  const [live, setLive] = useState(false)
  const [search, setSearch] = useState('')
  const listRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    gsap.fromTo(listRef.current,
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }
    )
  }, { scope: listRef })

  // Live log simulation
  useEffect(() => {
    if (!live) return
    const interval = setInterval(() => {
      setLogs((prev) => [generateLog(), ...prev.slice(0, 49)])
    }, 1500)
    return () => clearInterval(interval)
  }, [live])

  const filtered = logs.filter((l) => {
    const matchFilter = filter === 'all' || l.level === filter
    const matchSearch = l.path.toLowerCase().includes(search.toLowerCase()) ||
                        l.message.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  const counts = {
    error:   logs.filter((l) => l.level === 'error').length,
    warn:    logs.filter((l) => l.level === 'warn').length,
    success: logs.filter((l) => l.level === 'success').length,
    info:    logs.filter((l) => l.level === 'info').length,
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">Logs & Monitoring</h1>
          <p className="text-sm text-gray-500 mt-0.5">{logs.length} entrées</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLogs([])}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            🗑 Effacer
          </button>
          <button
            onClick={() => setLive(!live)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              live ? 'bg-red-500 text-white' : 'bg-brand-teal text-white hover:bg-brand-teal-dark'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${live ? 'bg-white animate-pulse' : 'bg-white/60'}`} />
            {live ? 'Live ON' : 'Live OFF'}
          </button>
        </div>
      </div>

      {/* Compteurs */}
      <div className="grid grid-cols-4 gap-3">
        {(['error', 'warn', 'success', 'info'] as LogLevel[]).map((level) => (
          <button
            key={level}
            onClick={() => setFilter(filter === level ? 'all' : level)}
            className={`p-3 rounded-xl border text-left transition-colors ${
              filter === level ? LEVEL_STYLE[level] : 'bg-white border-gray-100 hover:bg-gray-50'
            }`}
          >
            <p className="text-xl font-bold text-gray-900">{counts[level]}</p>
            <p className="text-xs text-gray-500 capitalize mt-0.5">{level}</p>
          </button>
        ))}
      </div>

      {/* Recherche */}
      <input
        type="text"
        placeholder="Filtrer par path ou message…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/30 focus:border-brand-teal"
      />

      {/* Log list */}
      <div ref={listRef} className="space-y-1.5">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">Aucun log</div>
        )}
        {filtered.map((log) => (
          <div
            key={log.id}
            className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-sm ${LEVEL_STYLE[log.level]}`}
          >
            <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${LEVEL_DOT[log.level]}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {log.method && (
                  <span className="font-mono font-bold text-xs">{log.method}</span>
                )}
                <span className="font-mono text-xs truncate">{log.path}</span>
                {log.status && (
                  <span className={`text-xs font-bold ${log.status >= 400 ? 'text-red-600' : 'text-green-600'}`}>
                    {log.status}
                  </span>
                )}
                {log.duration && (
                  <span className="text-xs opacity-60">{log.duration}ms</span>
                )}
              </div>
              <p className="opacity-80 mt-0.5 text-xs">{log.message}</p>
            </div>
            <span className="text-xs opacity-50 shrink-0 font-mono">
              {new Date(log.timestamp).toLocaleTimeString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
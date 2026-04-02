import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Users, UserPlus, Send, UserMinus, Check, X, Mail, MapPin, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import { connectionService } from '../services/api'

type Tab = 'connections' | 'received' | 'sent'

export default function ConnectionsPage() {
  const [tab, setTab] = useState<Tab>('connections')
  const [search, setSearch] = useState('')
  const qc = useQueryClient()

  const { data: connections, isLoading: l1 } = useQuery({
    queryKey: ['connections'],
    queryFn: () => connectionService.list().then(r => r.data),
  })
  const { data: received, isLoading: l2 } = useQuery({
    queryKey: ['connections-pending'],
    queryFn: () => connectionService.pending().then(r => r.data),
  })
  const { data: sent, isLoading: l3 } = useQuery({
    queryKey: ['connections-sent'],
    queryFn: () => connectionService.sent().then(r => r.data),
  })

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ['connections'] })
    qc.invalidateQueries({ queryKey: ['connections-pending'] })
    qc.invalidateQueries({ queryKey: ['connections-sent'] })
  }

  const acceptMut = useMutation({
    mutationFn: (id: string) => connectionService.accept(id),
    onSuccess: () => { toast.success('Connection accepted!'); invalidateAll() },
    onError: (e: any) => toast.error(e?.response?.data?.detail || 'Failed'),
  })
  const rejectMut = useMutation({
    mutationFn: (id: string) => connectionService.reject(id),
    onSuccess: () => { toast.success('Request declined'); invalidateAll() },
    onError: (e: any) => toast.error(e?.response?.data?.detail || 'Failed'),
  })
  const removeMut = useMutation({
    mutationFn: (id: string) => connectionService.remove(id),
    onSuccess: () => { toast.success('Connection removed'); invalidateAll() },
    onError: (e: any) => toast.error(e?.response?.data?.detail || 'Failed'),
  })

  const connList = Array.isArray(connections) ? connections : []
  const recvList = Array.isArray(received) ? received : []
  const sentList = Array.isArray(sent) ? sent : []

  const currentList = tab === 'connections' ? connList : tab === 'received' ? recvList : sentList
  const isLoading = tab === 'connections' ? l1 : tab === 'received' ? l2 : l3

  // Filter by search
  const filtered = search
    ? currentList.filter((c: any) =>
        (c.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (c.email || '').toLowerCase().includes(search.toLowerCase()) ||
        (c.headline || '').toLowerCase().includes(search.toLowerCase())
      )
    : currentList

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'connections', label: 'Connections', count: connList.length },
    { key: 'received', label: 'Received', count: recvList.length },
    { key: 'sent', label: 'Sent', count: sentList.length },
  ]

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display font-bold text-2xl text-slate-800 dark:text-white">My Network</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your professional connections</p>
      </div>

      {/* Tabs with counts */}
      <div className="flex gap-4 border-b border-slate-200 dark:border-slate-700 mb-5">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`pb-3 text-sm font-medium border-b-2 transition-all ${
              tab === t.key
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                tab === t.key ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-500'
              }`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search within connections */}
      {currentList.length > 3 && (
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input pl-9 text-sm"
            placeholder="Search connections..."
          />
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="card p-5 h-20 animate-pulse bg-slate-50 dark:bg-slate-800" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
            {tab === 'connections' ? <Users size={28} className="text-slate-300" /> :
             tab === 'received' ? <UserPlus size={28} className="text-slate-300" /> :
             <Send size={28} className="text-slate-300" />}
          </div>
          <h3 className="font-semibold text-slate-600 dark:text-slate-300">
            {tab === 'connections' ? 'No connections yet' :
             tab === 'received' ? 'No pending requests' :
             'No sent requests'}
          </h3>
          <p className="text-sm text-slate-400 mt-1 max-w-xs mx-auto">
            {tab === 'connections' ? 'Start building your network from the People page.' :
             tab === 'received' ? 'When someone sends you a request, it shows here.' :
             'Requests you send will appear here until accepted.'}
          </p>
          {tab === 'connections' && (
            <Link to="/people" className="btn-primary mt-4 inline-flex items-center gap-2">
              <Search size={15} /> Find People
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((conn: any) => {
            const name = conn.full_name || 'Unknown'
            const initial = name[0]?.toUpperCase() || '?'
            return (
              <div key={conn.connection_id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                {/* Avatar */}
                <Link to={`/profile/${conn.user_id}`} className="flex-shrink-0">
                  {conn.avatar_url ? (
                    <img src={conn.avatar_url} alt={name} className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                      {initial}
                    </div>
                  )}
                </Link>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <Link to={`/profile/${conn.user_id}`} className="font-medium text-sm text-slate-800 dark:text-white hover:text-brand-600 transition-colors truncate block">
                    {name}
                  </Link>
                  <p className="text-xs text-slate-500 truncate">{conn.headline || conn.email}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {tab === 'connections' && (
                    <button
                      onClick={() => { if (confirm(`Remove connection with ${name}?`)) removeMut.mutate(conn.connection_id) }}
                      disabled={removeMut.isPending}
                      className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-red-500 hover:border-red-200 transition-all"
                    >
                      Remove
                    </button>
                  )}
                  {tab === 'received' && (
                    <>
                      <button
                        onClick={() => acceptMut.mutate(conn.connection_id)}
                        disabled={acceptMut.isPending}
                        className="text-xs px-3 py-1.5 rounded-lg bg-brand-600 text-white hover:bg-brand-700 transition-all"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => rejectMut.mutate(conn.connection_id)}
                        disabled={rejectMut.isPending}
                        className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-red-500 hover:border-red-200 transition-all"
                      >
                        Ignore
                      </button>
                    </>
                  )}
                  {tab === 'sent' && (
                    <span className="text-xs px-3 py-1.5 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-900/20 font-medium">
                      Pending
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

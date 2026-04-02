import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Shield, Users, Search } from 'lucide-react'
import { authService } from '../services/api'

const ROLE_BADGE: Record<string, string> = {
  superadmin: 'badge-red',
  employer:   'badge-blue',
  employee:   'badge-gray',
}
const STATUS_BADGE: Record<string, string> = {
  active:    'badge-green',
  inactive:  'badge-gray',
  suspended: 'badge-red',
  pending:   'badge-amber',
}

export default function AdminPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users', roleFilter],
    queryFn: () => authService.adminListUsers({ role: roleFilter || undefined, limit: 50 }).then(r => r.data),
  })

  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => authService.adminStats().then(r => r.data),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => authService.adminUpdateUser(id, data),
    onSuccess: () => { toast.success('User updated'); qc.invalidateQueries({ queryKey: ['admin-users'] }) },
  })

  const filtered = users?.filter((u: any) =>
    u.full_name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="flex items-center gap-3 mb-4 sm:mb-6">
        <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
          <Shield size={20} className="text-red-600" />
        </div>
        <div>
          <h1 className="font-display font-bold text-xl sm:text-2xl text-slate-800">Admin Panel</h1>
          <p className="text-slate-500 text-xs sm:text-sm">Manage all platform users</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
        {[
          { label: 'Total Users', value: stats?.total_users },
          { label: 'Employers',   value: stats?.total_employers },
          { label: 'Job Seekers', value: stats?.total_employees },
        ].map(s => (
          <div key={s.label} className="card p-4 sm:p-5 text-center">
            <p className="font-display font-bold text-2xl sm:text-3xl text-slate-800">{s.value ?? '—'}</p>
            <p className="text-xs sm:text-sm text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-3 sm:p-4 mb-4 flex flex-col sm:flex-row gap-2 sm:gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..." className="input pl-9 py-2 w-full" />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="input py-2 w-full sm:w-40">
          <option value="">All roles</option>
          <option value="employee">Employee</option>
          <option value="employer">Employer</option>
          <option value="superadmin">Superadmin</option>
        </select>
      </div>

      {/* Desktop: Table | Mobile: Card view */}
      {/* Desktop table */}
      <div className="card overflow-hidden hidden sm:block">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-5 py-3 font-medium text-slate-500">User</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Role</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Status</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Joined</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({length: 5}).map((_, i) => (
                  <tr key={i}><td colSpan={5} className="px-5 py-4"><div className="h-4 bg-slate-100 animate-pulse rounded" /></td></tr>
                ))
              ) : filtered?.map((u: any) => (
                <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-semibold text-xs flex-shrink-0">
                        {u.full_name[0]}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{u.full_name}</p>
                        <p className="text-xs text-slate-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`badge ${ROLE_BADGE[u.role] || 'badge-gray'}`}>{u.role}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`badge ${STATUS_BADGE[u.status] || 'badge-gray'}`}>{u.status}</span>
                  </td>
                  <td className="px-4 py-3.5 text-slate-400 text-xs">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex gap-2">
                      <select
                        value={u.status}
                        onChange={e => updateMutation.mutate({ id: u.id, data: { status: e.target.value } })}
                        className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white focus:ring-1 focus:ring-brand-500 focus:outline-none"
                      >
                        {['active','inactive','suspended','pending'].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile card view */}
      <div className="sm:hidden space-y-3">
        {isLoading ? (
          Array.from({length: 5}).map((_, i) => (
            <div key={i} className="card p-4 animate-pulse h-24 bg-slate-100" />
          ))
        ) : filtered?.map((u: any) => (
          <div key={u.id} className="card p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-semibold text-sm flex-shrink-0">
                {u.full_name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-800 truncate">{u.full_name}</p>
                <p className="text-xs text-slate-400 truncate">{u.email}</p>
                <div className="flex items-center gap-2 flex-wrap mt-2">
                  <span className={`badge ${ROLE_BADGE[u.role] || 'badge-gray'}`}>{u.role}</span>
                  <span className={`badge ${STATUS_BADGE[u.status] || 'badge-gray'}`}>{u.status}</span>
                  <span className="text-xs text-slate-400">{new Date(u.created_at).toLocaleDateString()}</span>
                </div>
                <div className="mt-2">
                  <select
                    value={u.status}
                    onChange={e => updateMutation.mutate({ id: u.id, data: { status: e.target.value } })}
                    className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:ring-1 focus:ring-brand-500 focus:outline-none w-full"
                  >
                    {['active','inactive','suspended','pending'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

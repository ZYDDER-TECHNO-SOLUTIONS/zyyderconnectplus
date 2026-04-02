import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  Search, MapPin, Building2, UserPlus, UserCheck, Clock, Users,
  Briefcase, X, Globe
} from 'lucide-react'
import toast from 'react-hot-toast'
import { peopleService, connectionService, followService, companyService } from '../services/api'
import { useAuthStore } from '../store/authStore'

// ─── People Card (LinkedIn style) ─────────────────────────────────────────
function PersonCard({ person, connStatus, isFollowing }: {
  person: any; connStatus: string; isFollowing: boolean
}) {
  const currentUser = useAuthStore((s) => s.user)
  const qc = useQueryClient()
  if (currentUser?.id === person.id) return null

  const connectMut = useMutation({
    mutationFn: () => connectionService.sendRequest(person.id),
    onSuccess: () => { toast.success('Connection request sent!'); qc.setQueryData(['conn-st', person.id], { status: 'pending_sent' }) },
    onError: (e: any) => toast.error(e?.response?.data?.detail || 'Failed'),
  })
  const followMut = useMutation({
    mutationFn: () => followService.follow(person.id),
    onSuccess: () => { toast.success('Following!'); qc.setQueryData(['follow-st', person.id], { is_following: true }) },
    onError: () => toast.error('Failed'),
  })
  const unfollowMut = useMutation({
    mutationFn: () => followService.unfollow(person.id),
    onSuccess: () => { toast.success('Unfollowed'); qc.setQueryData(['follow-st', person.id], { is_following: false }) },
    onError: () => toast.error('Failed'),
  })

  const initial = person.full_name?.[0]?.toUpperCase() ?? '?'
  const skills = Array.isArray(person.skills) ? person.skills.slice(0, 4) : []
  const isEmployer = person.role === 'employer'
  const connected = connStatus === 'connected' || connStatus === 'accepted'
  const pending = connStatus === 'pending_sent' || connStatus === 'pending'

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden hover:shadow-lg transition-all duration-300 group">
      <div className="h-16 bg-gradient-to-r from-brand-500 via-purple-500 to-pink-500 relative">
        <div className="absolute -bottom-8 left-4">
          <Link to={`/profile/${person.id}`}>
            {person.avatar_url ? (
              <img src={person.avatar_url} alt={person.full_name} className="w-16 h-16 rounded-xl object-cover border-[3px] border-white dark:border-slate-900 shadow-md" />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-brand-600 to-purple-600 flex items-center justify-center text-white font-bold text-xl border-[3px] border-white dark:border-slate-900 shadow-md">
                {initial}
              </div>
            )}
          </Link>
        </div>
      </div>
      <div className="pt-10 px-4 pb-4">
        <Link to={`/profile/${person.id}`} className="block mb-0.5">
          <h3 className="font-semibold text-slate-800 dark:text-white group-hover:text-brand-600 transition-colors truncate">{person.full_name}</h3>
        </Link>
        <p className="text-sm text-slate-500 dark:text-slate-400 truncate leading-tight">
          {person.headline || (isEmployer ? 'Employer' : 'Professional')}
        </p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-slate-400">
          {person.company_name && <span className="flex items-center gap-1"><Building2 size={11} />{person.company_name}</span>}
          {person.location && <span className="flex items-center gap-1"><MapPin size={11} />{person.location}</span>}
        </div>
        {skills.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {skills.map((s: string) => (
              <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">{s}</span>
            ))}
          </div>
        )}
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          {isEmployer ? (
            isFollowing ? (
              <button onClick={() => unfollowMut.mutate()} disabled={unfollowMut.isPending}
                className="w-full py-2 rounded-xl text-sm font-medium border border-brand-200 text-brand-600 hover:bg-brand-50 transition-all flex items-center justify-center gap-2">
                <UserCheck size={15} /> Following
              </button>
            ) : (
              <button onClick={() => followMut.mutate()} disabled={followMut.isPending}
                className="w-full py-2 rounded-xl text-sm font-medium bg-brand-600 text-white hover:bg-brand-700 transition-all flex items-center justify-center gap-2 shadow-sm">
                <UserPlus size={15} /> Follow
              </button>
            )
          ) : connected ? (
            <div className="w-full py-2 rounded-xl text-sm font-medium bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 flex items-center justify-center gap-2">
              <UserCheck size={15} /> Connected
            </div>
          ) : pending ? (
            <div className="w-full py-2 rounded-xl text-sm font-medium bg-amber-50 text-amber-600 dark:bg-amber-900/20 flex items-center justify-center gap-2">
              <Clock size={15} /> Pending
            </div>
          ) : (
            <button onClick={() => connectMut.mutate()} disabled={connectMut.isPending}
              className="w-full py-2 rounded-xl text-sm font-medium border-2 border-brand-600 text-brand-600 hover:bg-brand-600 hover:text-white transition-all flex items-center justify-center gap-2">
              <UserPlus size={15} /> Connect
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Company Card ──────────────────────────────────────────────────────────
function CompanyCard({ company }: { company: any }) {
  return (
    <Link to={`/company/${company.slug}`} className="block">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden hover:shadow-lg transition-all duration-300 group">
        <div className="h-16 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 relative">
          {company.banner_url && <img src={company.banner_url} alt="" className="w-full h-full object-cover" />}
          <div className="absolute -bottom-7 left-4">
            {company.logo_url ? (
              <img src={company.logo_url} alt={company.name} className="w-14 h-14 rounded-xl object-cover border-[3px] border-white dark:border-slate-900 shadow-md bg-white" />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-emerald-600 font-bold text-xl border-[3px] border-white dark:border-slate-900 shadow-md">
                {company.name?.[0]?.toUpperCase()}
              </div>
            )}
          </div>
        </div>
        <div className="pt-9 px-4 pb-4">
          <h3 className="font-semibold text-slate-800 dark:text-white group-hover:text-brand-600 transition-colors truncate">{company.name}</h3>
          {company.industry && <p className="text-xs text-slate-500 mt-0.5">{company.industry}</p>}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-slate-400">
            {company.location && <span className="flex items-center gap-1"><MapPin size={11} />{company.location}</span>}
            {company.company_size && <span className="flex items-center gap-1"><Users size={11} />{company.company_size}</span>}
          </div>
          {company.description && <p className="text-xs text-slate-500 mt-2 line-clamp-2">{company.description}</p>}
        </div>
      </div>
    </Link>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────
export default function PeoplePage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const qc = useQueryClient()
  const limit = 20

  // Fetch both people and companies together
  const { data: peopleRaw, isLoading: lp } = useQuery({
    queryKey: ['people-discover', search, page],
    queryFn: () => peopleService.discover({ q: search, page, limit }).then(r => r.data),
    placeholderData: (prev: any) => prev,
  })
  const { data: companiesRaw, isLoading: lc } = useQuery({
    queryKey: ['companies-list', search],
    queryFn: () => companyService.list({ q: search, page: 1, limit: 10 }).then(r => r.data),
    placeholderData: (prev: any) => prev,
  })

  const currentUser = useAuthStore((s) => s.user)
  const people = (Array.isArray(peopleRaw) ? peopleRaw : []).filter((p: any) => p.role !== 'superadmin' && p.id !== currentUser?.id)
  const companies = Array.isArray(companiesRaw) ? companiesRaw : []
  const isLoading = lp && lc
  const hasResults = people.length > 0 || companies.length > 0

  // Batch fetch connection/follow statuses
  useQuery({
    queryKey: ['batch-conn', people.map((p: any) => p.id).join(',')],
    queryFn: async () => {
      await Promise.allSettled(
        people.filter((p: any) => p.role === 'employee').map(async (p: any) => {
          try { const res = await connectionService.status(p.id); qc.setQueryData(['conn-st', p.id], res.data) } catch {}
        })
      )
      return true
    },
    enabled: people.length > 0, staleTime: 30000,
  })
  useQuery({
    queryKey: ['batch-follow', people.map((p: any) => p.id).join(',')],
    queryFn: async () => {
      await Promise.allSettled(
        people.filter((p: any) => p.role === 'employer').map(async (p: any) => {
          try { const res = await followService.status(p.id); qc.setQueryData(['follow-st', p.id], res.data) } catch {}
        })
      )
      return true
    },
    enabled: people.length > 0, staleTime: 30000,
  })

  const getConnStatus = (id: string) => (qc.getQueryData(['conn-st', id]) as any)?.status ?? 'none'
  const getFollowStatus = (id: string) => (qc.getQueryData(['follow-st', id]) as any)?.is_following ?? false

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      {/* Search */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 sm:p-6 mb-6">
        <h1 className="font-display font-bold text-xl text-slate-800 dark:text-white mb-4">Search</h1>
        <div className="relative">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full pl-12 pr-10 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all text-sm placeholder:text-slate-400"
            placeholder="Search people, companies, skills..."
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full" />
        </div>
      ) : !hasResults ? (
        <div className="text-center py-20">
          <Search size={56} className="mx-auto text-slate-200 dark:text-slate-700 mb-4" />
          <h2 className="font-display font-semibold text-lg text-slate-600 dark:text-slate-300">
            {search ? 'No results found' : 'Discover people and companies'}
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            {search ? 'Try a different search term' : 'Start typing to search'}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Companies Section */}
          {companies.length > 0 && (
            <div>
              <h2 className="font-display font-semibold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2 text-sm uppercase tracking-wider">
                <Building2 size={16} className="text-emerald-500" /> Companies
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {companies.map((c: any) => <CompanyCard key={c.id} company={c} />)}
              </div>
            </div>
          )}

          {/* People Section */}
          {people.length > 0 && (
            <div>
              <h2 className="font-display font-semibold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2 text-sm uppercase tracking-wider">
                <Users size={16} className="text-brand-500" /> People
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {people.map((p: any) => (
                  <PersonCard key={p.id} person={p} connStatus={getConnStatus(p.id)} isFollowing={getFollowStatus(p.id)} />
                ))}
              </div>
            </div>
          )}

          {/* Pagination */}
          {people.length >= limit && (
            <div className="flex items-center justify-center gap-3 pt-2">
              {page > 1 && <button onClick={() => setPage(p => p - 1)} className="btn-secondary text-sm px-5 py-2">Previous</button>}
              <span className="text-sm text-slate-400">Page {page}</span>
              <button onClick={() => setPage(p => p + 1)} className="btn-primary text-sm px-5 py-2">Next</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

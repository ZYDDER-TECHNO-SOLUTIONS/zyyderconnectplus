import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Send, Clock, ArrowRight, Filter, XCircle, ChevronDown, ChevronUp, CalendarDays } from 'lucide-react'
import { jobService } from '../services/api'
import { useAuthStore } from '../store/authStore'
import { formatDistanceToNow, differenceInDays } from 'date-fns'

const STATUS_BADGE: Record<string, string> = {
  applied:    'badge-blue',
  screening:  'badge-amber',
  interview:  'badge-amber',
  technical:  'badge-amber',
  offer:      'badge-green',
  hired:      'badge-green',
  rejected:   'badge-red',
  withdrawn:  'badge-gray',
}

const STATUS_BG: Record<string, string> = {
  offer:      'bg-emerald-50/50 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-900/30',
  hired:      'bg-emerald-50/50 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-900/30',
  rejected:   'bg-red-50/40 border-red-100 dark:bg-red-900/10 dark:border-red-900/30',
  withdrawn:  'bg-slate-50/50 border-slate-200 dark:bg-slate-800/50 dark:border-slate-700',
}

const FILTER_TABS = [
  { key: 'all',       label: 'All',        color: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300' },
  { key: 'applied',   label: 'Applied',    color: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  { key: 'in_review', label: 'In Review',  color: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  { key: 'interview', label: 'Interview',  color: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  { key: 'offer',     label: 'Offered',    color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  { key: 'rejected',  label: 'Rejected',   color: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
]

const EMPTY_STATES: Record<string, string> = {
  all: 'No applications yet. Start applying to jobs you like!',
  applied: 'No applications in "Applied" status.',
  in_review: 'No applications currently being reviewed.',
  interview: 'No interview invitations yet. Keep applying!',
  offer: 'No offers yet. Good things take time!',
  rejected: 'No rejected applications. That is great news!',
}

function filterApps(apps: any[], filter: string) {
  if (filter === 'all') return apps
  if (filter === 'in_review') return apps.filter((a: any) => ['screening', 'technical'].includes(a.status))
  if (filter === 'offer') return apps.filter((a: any) => ['offer', 'hired'].includes(a.status))
  return apps.filter((a: any) => a.status === filter)
}

export default function ApplicationsPage() {
  const user = useAuthStore((s) => s.user)
  const qc = useQueryClient()
  const [activeFilter, setActiveFilter] = useState('all')
  const [expandedCoverLetter, setExpandedCoverLetter] = useState<string | null>(null)

  const { data: apps, isLoading } = useQuery({
    queryKey: ['my-apps'],
    queryFn: () => jobService.myApplications().then(r => r.data),
    enabled: user?.role === 'employee',
  })

  const withdrawMutation = useMutation({
    mutationFn: (appId: string) => jobService.updateApp(appId, { status: 'withdrawn' }),
    onSuccess: () => {
      toast.success('Application withdrawn')
      qc.invalidateQueries({ queryKey: ['my-apps'] })
    },
    onError: () => toast.error('Failed to withdraw application'),
  })

  if (isLoading) return <div className="space-y-3">{Array.from({length:4}).map((_,i)=><div key={i} className="card p-5 h-20 animate-pulse bg-slate-100 dark:bg-slate-800"/>)}</div>

  const filteredApps = filterApps(apps ?? [], activeFilter)

  const ATS_STEPS = ['applied','screening','interview','technical','offer','hired']

  return (
    <div className="max-w-3xl animate-fade-in">
      <div className="mb-4 sm:mb-6">
        <h1 className="font-display font-bold text-xl sm:text-2xl text-slate-800 dark:text-white">My Applications</h1>
        <p className="text-slate-500 text-xs sm:text-sm mt-1">{apps?.length ?? 0} total applications</p>
      </div>

      {/* Filter Tabs - horizontal scroll on mobile */}
      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 mb-4 sm:mb-5 pb-1">
        <div className="flex gap-2 min-w-max sm:min-w-0 sm:flex-wrap">
          {FILTER_TABS.map(tab => {
            const count = filterApps(apps ?? [], tab.key).length
            const isActive = activeFilter === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 ${
                  isActive
                    ? tab.color + ' ring-2 ring-offset-1 ring-brand-300'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {tab.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/60 dark:bg-black/20' : 'bg-slate-200 dark:bg-slate-700'}`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {filteredApps.length === 0 ? (
        <div className="card p-8 sm:p-12 text-center">
          <Send size={48} className="mx-auto text-slate-200 mb-4" />
          <p className="text-slate-500 mb-4">{EMPTY_STATES[activeFilter] || 'No applications found.'}</p>
          {activeFilter === 'all' && <Link to="/jobs" className="btn-primary">Browse Jobs</Link>}
          {activeFilter !== 'all' && (
            <button onClick={() => setActiveFilter('all')} className="btn-secondary">
              View All Applications
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredApps.map((a: any) => {
            const daysSince = differenceInDays(new Date(), new Date(a.applied_at))
            const cardBg = STATUS_BG[a.status] || ''
            const isExpanded = expandedCoverLetter === a.id

            return (
              <div
                key={a.id}
                className={`card p-3 sm:p-5 transition-all duration-300 hover:shadow-card-hover hover:scale-[1.01] ${cardBg}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link to={`/jobs/${a.job_id}`} className="font-semibold text-sm sm:text-base text-slate-800 dark:text-slate-200 hover:text-brand-600 transition-colors">
                        View Job {'\u2192'}
                      </Link>
                      <span className={`badge ${STATUS_BADGE[a.status] || 'badge-gray'} capitalize`}>{a.status}</span>
                      {a.ai_match_score != null && (
                        <span className={`badge ${a.ai_match_score >= 70 ? 'badge-green' : a.ai_match_score >= 40 ? 'badge-amber' : 'badge-red'}`}>
                          AI: {a.ai_match_score.toFixed(0)}%
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <p className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock size={11} /> Applied {formatDistanceToNow(new Date(a.applied_at), { addSuffix: true })}
                      </p>
                      <span className="text-xs text-slate-400 flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                        <CalendarDays size={11} /> {daysSince === 0 ? 'Today' : `${daysSince}d ago`}
                      </span>
                    </div>

                    {/* Cover letter expandable */}
                    {a.cover_letter && (
                      <div className="mt-2">
                        {!isExpanded && (
                          <p className="text-sm text-slate-500 line-clamp-2">{a.cover_letter}</p>
                        )}
                        {isExpanded && (
                          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap animate-fade-in">
                            {a.cover_letter}
                          </div>
                        )}
                        <button
                          onClick={() => setExpandedCoverLetter(isExpanded ? null : a.id)}
                          className="text-xs text-brand-600 hover:text-brand-700 font-medium mt-1 inline-flex items-center gap-1 transition-colors"
                        >
                          {isExpanded ? <><ChevronUp size={12} /> Hide Cover Letter</> : <><ChevronDown size={12} /> View Cover Letter</>}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Withdraw button */}
                  {a.status !== 'withdrawn' && a.status !== 'rejected' && a.status !== 'hired' && (
                    <button
                      onClick={() => {
                        if (confirm('Withdraw this application? This cannot be undone.')) {
                          withdrawMutation.mutate(a.id)
                        }
                      }}
                      disabled={withdrawMutation.isPending}
                      className="text-xs text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1.5 rounded-lg transition-all duration-200 flex items-center gap-1 flex-shrink-0 border border-transparent hover:border-red-200 dark:hover:border-red-800"
                    >
                      <XCircle size={13} /> Withdraw
                    </button>
                  )}
                </div>

                {/* ATS pipeline - horizontal on desktop, vertical on mobile */}
                {/* Desktop: horizontal */}
                <div className="hidden sm:block mt-3 sm:mt-4 overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0 pb-1">
                  <div className="flex items-center gap-1 min-w-max sm:min-w-0">
                    {ATS_STEPS.map((step, i) => {
                      const currentIdx = ATS_STEPS.indexOf(a.status)
                      const stepIdx = ATS_STEPS.indexOf(step)
                      const done = stepIdx <= currentIdx && a.status !== 'rejected' && a.status !== 'withdrawn'
                      return (
                        <div key={step} className="flex items-center gap-1">
                          <div className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-300 ${done ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300' : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'}`}>
                            {step}
                          </div>
                          {i < 5 && <div className={`w-3 h-px flex-shrink-0 transition-colors duration-300 ${stepIdx < currentIdx ? 'bg-brand-300' : 'bg-slate-200 dark:bg-slate-700'}`} />}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Mobile: vertical timeline */}
                <div className="sm:hidden mt-3 pl-1">
                  <div className="flex flex-col gap-0">
                    {ATS_STEPS.map((step, i) => {
                      const currentIdx = ATS_STEPS.indexOf(a.status)
                      const stepIdx = ATS_STEPS.indexOf(step)
                      const done = stepIdx <= currentIdx && a.status !== 'rejected' && a.status !== 'withdrawn'
                      const isCurrent = stepIdx === currentIdx && a.status !== 'rejected' && a.status !== 'withdrawn'
                      return (
                        <div key={step} className="flex items-stretch gap-3">
                          <div className="flex flex-col items-center">
                            <div className={`w-3 h-3 rounded-full flex-shrink-0 transition-all duration-300 ${
                              isCurrent ? 'bg-brand-600 ring-4 ring-brand-100 dark:ring-brand-900/40' :
                              done ? 'bg-brand-400' : 'bg-slate-200 dark:bg-slate-700'
                            }`} />
                            {i < 5 && (
                              <div className={`w-0.5 flex-1 min-h-[16px] transition-colors duration-300 ${stepIdx < currentIdx ? 'bg-brand-300' : 'bg-slate-200 dark:bg-slate-700'}`} />
                            )}
                          </div>
                          <div className={`pb-2 -mt-0.5 text-xs font-medium transition-colors duration-300 ${
                            done ? 'text-brand-700 dark:text-brand-300' : 'text-slate-400 dark:text-slate-500'
                          } ${isCurrent ? 'font-bold' : ''}`}>
                            {step}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

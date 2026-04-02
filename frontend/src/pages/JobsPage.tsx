import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search, MapPin, Briefcase, Clock, DollarSign, Filter, Plus, Star, Bookmark, ArrowUpDown, Users, X } from 'lucide-react'
import { jobService } from '../services/api'
import { useAuthStore } from '../store/authStore'
import { formatDistanceToNow, differenceInDays } from 'date-fns'
import toast from 'react-hot-toast'
import { getSavedJobs, toggleSaveJob } from './SavedJobsPage'

const JOB_TYPES = ['full_time','part_time','contract','internship','remote','hybrid']
const EXP_LEVELS = ['entry','junior','mid','senior','lead','executive']

const SORT_OPTIONS = [
  { value: 'recent', label: 'Most Recent' },
  { value: 'salary_desc', label: 'Salary: High to Low' },
  { value: 'salary_asc', label: 'Salary: Low to High' },
  { value: 'applicants', label: 'Most Applicants' },
]

function getJobTypeBorderColor(jobType: string): string {
  switch (jobType) {
    case 'full_time': return 'border-l-blue-500'
    case 'remote': return 'border-l-emerald-500'
    case 'contract': return 'border-l-purple-500'
    case 'internship': return 'border-l-amber-500'
    case 'hybrid': return 'border-l-teal-500'
    case 'part_time': return 'border-l-pink-500'
    default: return 'border-l-slate-300'
  }
}

function getPostedAgoColor(createdAt: string): string {
  const days = differenceInDays(new Date(), new Date(createdAt))
  if (days < 3) return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400'
  if (days <= 7) return 'text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400'
  return 'text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-400'
}

function JobCard({ job, savedIds, onToggleSave }: { job: any; savedIds: string[]; onToggleSave: (id: string) => void }) {
  const saved = savedIds.includes(job.id)
  const borderColor = getJobTypeBorderColor(job.job_type)
  const postedAgoColor = getPostedAgoColor(job.created_at)
  const daysAgo = differenceInDays(new Date(), new Date(job.created_at))

  return (
    <div className={`card p-4 sm:p-5 block hover:shadow-card-hover hover:scale-[1.01] transition-all duration-200 group relative border-l-4 ${borderColor}`}>
      <Link to={`/jobs/${job.id}`} className="absolute inset-0 z-0" />
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold text-base sm:text-lg flex-shrink-0 shadow-sm">
          {job.company_name?.[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 group-hover:text-brand-600 transition-colors truncate">{job.title}</h3>
              <p className="text-sm text-slate-500 mt-0.5 truncate">{job.company_name}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {job.is_featured && (
                <span className="badge badge-amber hidden sm:inline-flex"><Star size={10} className="mr-1" />Featured</span>
              )}
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleSave(job.id) }}
                className={`relative z-10 p-1.5 rounded-lg transition-colors ${saved ? 'text-brand-600 bg-brand-50 dark:bg-brand-900/30' : 'text-slate-300 hover:text-brand-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                title={saved ? 'Remove from saved' : 'Save job'}
              >
                <Bookmark size={16} fill={saved ? 'currentColor' : 'none'} />
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3 mt-2 sm:mt-3 text-xs text-slate-500">
            <span className="flex items-center gap-1"><MapPin size={12} /><span className="truncate max-w-[100px] sm:max-w-none">{job.location}</span></span>
            <span className="flex items-center gap-1"><Briefcase size={12} />{job.job_type?.replace('_', ' ')}</span>
            <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium ${postedAgoColor}`}>
              <Clock size={11} />
              {daysAgo === 0 ? 'Today' : daysAgo === 1 ? '1 day ago' : `${daysAgo} days ago`}
            </span>
            {(job.applications_count != null) && (
              <span className="flex items-center gap-1"><Users size={12} />{job.applications_count} applicant{job.applications_count !== 1 ? 's' : ''}</span>
            )}
            {job.salary_min && (
              <span className="flex items-center gap-1">
                <DollarSign size={12} />
                {job.salary_min.toLocaleString()}{job.salary_max ? `\u2013${job.salary_max.toLocaleString()}` : ''} {job.salary_currency}
              </span>
            )}
          </div>
          {job.skills_required?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2 sm:mt-3">
              {job.skills_required.slice(0, 4).map((s: string) => (
                <span key={s} className="badge badge-blue">{s}</span>
              ))}
              {job.skills_required.length > 4 && (
                <span className="badge badge-gray">+{job.skills_required.length - 4}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function JobsPage() {
  const user = useAuthStore((s) => s.user)
  const [params, setParams] = useState<any>({ page: 1, limit: 20 })
  const [showFilters, setShowFilters] = useState(false)
  const [savedIds, setSavedIds] = useState<string[]>(getSavedJobs)
  const [sortBy, setSortBy] = useState('recent')

  const { data: jobs, isLoading } = useQuery({
    queryKey: ['jobs', params, sortBy],
    queryFn: () => jobService.listJobs({ ...params, sort: sortBy }).then(r => r.data),
  })

  const update = (key: string, val: any) => setParams((p: any) => ({ ...p, [key]: val || undefined, page: 1 }))

  const handleToggleSave = (jobId: string) => {
    const updated = toggleSaveJob(jobId)
    setSavedIds(updated)
    if (updated.includes(jobId)) {
      toast.success('Job saved!')
    } else {
      toast.success('Job removed from saved')
    }
  }

  // Check if any filters are active
  const hasActiveFilters = !!(params.q || params.location || params.job_type || params.experience_level || params.salary_min)

  const clearAllFilters = () => {
    setParams({ page: 1, limit: 20 })
    setSortBy('recent')
  }

  // Sort jobs client-side as a fallback if backend doesn't support sort param
  const sortedJobs = (() => {
    if (!jobs) return jobs
    const sorted = [...jobs]
    switch (sortBy) {
      case 'salary_desc':
        return sorted.sort((a: any, b: any) => (b.salary_max ?? b.salary_min ?? 0) - (a.salary_max ?? a.salary_min ?? 0))
      case 'salary_asc':
        return sorted.sort((a: any, b: any) => (a.salary_min ?? 0) - (b.salary_min ?? 0))
      case 'applicants':
        return sorted.sort((a: any, b: any) => (b.applications_count ?? 0) - (a.applications_count ?? 0))
      case 'recent':
      default:
        return sorted.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }
  })()

  return (
    <div>
      <div className="flex items-center justify-between mb-4 sm:mb-6 gap-3">
        <div className="min-w-0">
          <h1 className="font-display font-bold text-xl sm:text-2xl text-slate-800 dark:text-white truncate">
            {user?.role === 'employer' ? 'Job Listings' : 'Browse Jobs'}
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            {jobs?.length ?? 0} opportunities available
          </p>
        </div>
        {(user?.role === 'employer' || user?.role === 'superadmin') && (
          <Link to="/jobs/post" className="btn-primary flex-shrink-0"><Plus size={16} /><span className="hidden sm:inline">Post Job</span></Link>
        )}
      </div>

      {/* Search bar */}
      <div className="card p-3 sm:p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              placeholder="Search jobs, companies..."
              className="input pl-9 h-10 w-full"
              value={params.q || ''}
              onChange={e => update('q', e.target.value)}
            />
          </div>
          <div className="flex gap-2 sm:gap-3">
            <div className="relative flex-1 sm:flex-none sm:min-w-[160px]">
              <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                placeholder="Location"
                className="input pl-9 h-10 w-full"
                value={params.location || ''}
                onChange={e => update('location', e.target.value)}
              />
            </div>
            <button onClick={() => setShowFilters(!showFilters)} className={`btn-secondary h-10 flex-shrink-0 ${showFilters ? 'bg-brand-50 text-brand-600 border-brand-200' : ''}`}>
              <Filter size={15} /> <span className="hidden sm:inline">Filters</span>
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
            <div>
              <label className="label text-xs">Job Type</label>
              <select className="input py-2" value={params.job_type || ''} onChange={e => update('job_type', e.target.value)}>
                <option value="">All types</option>
                {JOB_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="label text-xs">Experience</label>
              <select className="input py-2" value={params.experience_level || ''} onChange={e => update('experience_level', e.target.value)}>
                <option value="">All levels</option>
                {EXP_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="label text-xs">Min Salary ($)</label>
              <input type="number" placeholder="50000" className="input py-2" value={params.salary_min || ''} onChange={e => update('salary_min', e.target.value)} />
            </div>
          </div>
        )}
      </div>

      {/* Results header: count + sort + clear filters */}
      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            <span className="font-bold text-slate-800 dark:text-white">{sortedJobs?.length ?? 0}</span> jobs found
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 font-medium px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <X size={12} />
              Clear all filters
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <ArrowUpDown size={14} className="text-slate-400" />
          <select
            className="input py-1.5 pl-2 pr-8 text-xs sm:text-sm min-w-[150px]"
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
          >
            {SORT_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card p-5 animate-pulse h-28 bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
      ) : sortedJobs?.length === 0 ? (
        <div className="card p-8 sm:p-12 text-center">
          <Briefcase size={48} className="mx-auto text-slate-200 dark:text-slate-600 mb-4" />
          {hasActiveFilters ? (
            <>
              <p className="text-slate-500 dark:text-slate-400 mb-1 font-medium">No jobs match your filters</p>
              <p className="text-slate-400 dark:text-slate-500 text-sm mb-4">Try broadening your search or removing some filters.</p>
              <button onClick={clearAllFilters} className="btn-secondary text-sm">
                <X size={14} /> Clear all filters
              </button>
            </>
          ) : (
            <>
              <p className="text-slate-500 dark:text-slate-400 mb-1 font-medium">No jobs available yet</p>
              <p className="text-slate-400 dark:text-slate-500 text-sm">Check back later for new opportunities.</p>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {sortedJobs?.map((job: any) => <JobCard key={job.id} job={job} savedIds={savedIds} onToggleSave={handleToggleSave} />)}
        </div>
      )}
    </div>
  )
}

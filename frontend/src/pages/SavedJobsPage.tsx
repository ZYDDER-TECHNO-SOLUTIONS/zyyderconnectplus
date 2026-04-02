import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Bookmark, Trash2, Briefcase, MapPin, Clock, DollarSign, ArrowRight } from 'lucide-react'
import { jobService } from '../services/api'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'

// ─── localStorage utilities ─────────────────────────────────────────────────
const SAVED_JOBS_KEY = 'sparklex-saved-jobs'

export function getSavedJobs(): string[] {
  const saved = localStorage.getItem(SAVED_JOBS_KEY)
  return saved ? JSON.parse(saved) : []
}

export function toggleSaveJob(jobId: string): string[] {
  const saved = getSavedJobs()
  const updated = saved.includes(jobId)
    ? saved.filter(id => id !== jobId)
    : [...saved, jobId]
  localStorage.setItem(SAVED_JOBS_KEY, JSON.stringify(updated))
  return updated
}

export function isJobSaved(jobId: string): boolean {
  return getSavedJobs().includes(jobId)
}

// ─── Page ───────────────────────────────────────────────────────────────────
export default function SavedJobsPage() {
  const [savedIds, setSavedIds] = useState<string[]>(getSavedJobs)

  // Fetch all jobs and filter to saved ones
  const { data: allJobs, isLoading } = useQuery({
    queryKey: ['jobs-for-saved'],
    queryFn: () => jobService.listJobs({ limit: 100 }).then(r => r.data),
  })

  const savedJobs = allJobs?.filter((j: any) => savedIds.includes(j.id)) ?? []

  const handleRemove = (jobId: string) => {
    const updated = toggleSaveJob(jobId)
    setSavedIds(updated)
    toast.success('Job removed from saved')
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="font-display font-bold text-2xl text-slate-800 dark:text-white flex items-center gap-2">
          <Bookmark size={24} className="text-brand-600" />
          Saved Jobs
        </h1>
        <p className="text-slate-500 text-sm mt-1">{savedIds.length} saved job{savedIds.length !== 1 ? 's' : ''}</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card p-5 animate-pulse h-28 bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
      ) : savedJobs.length === 0 ? (
        <div className="card p-12 text-center">
          <Bookmark size={48} className="mx-auto text-slate-200 mb-4" />
          <p className="text-slate-500 mb-2">No saved jobs yet.</p>
          <p className="text-slate-400 text-sm mb-6">Browse jobs to find ones you like.</p>
          <Link to="/jobs" className="btn-primary">
            <Briefcase size={16} /> Browse Jobs
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {savedJobs.map((job: any) => (
            <div key={job.id} className="card p-5 hover:shadow-card-hover transition-all duration-200">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-sm">
                  {job.company_name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <Link to={`/jobs/${job.id}`} className="hover:text-brand-600 transition-colors">
                      <h3 className="font-semibold text-slate-800 dark:text-slate-200">{job.title}</h3>
                      <p className="text-sm text-slate-500 mt-0.5">{job.company_name}</p>
                    </Link>
                    <button
                      onClick={() => handleRemove(job.id)}
                      className="flex-shrink-0 p-2 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-all"
                      title="Remove from saved"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-500">
                    {job.location && <span className="flex items-center gap-1"><MapPin size={12} />{job.location}</span>}
                    {job.job_type && <span className="flex items-center gap-1"><Briefcase size={12} />{job.job_type.replace('_', ' ')}</span>}
                    {job.created_at && <span className="flex items-center gap-1"><Clock size={12} />{formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}</span>}
                    {job.salary_min && (
                      <span className="flex items-center gap-1">
                        <DollarSign size={12} />
                        {job.salary_min.toLocaleString()}–{job.salary_max?.toLocaleString()} {job.salary_currency}
                      </span>
                    )}
                  </div>
                  {job.skills_required?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {job.skills_required.slice(0, 4).map((s: string) => (
                        <span key={s} className="badge badge-blue">{s}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <Link to={`/jobs/${job.id}`} className="text-sm text-brand-600 font-medium hover:underline flex items-center gap-1">
                  View Details <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

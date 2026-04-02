import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  ArrowLeft, Users, ChevronDown, ChevronUp, X,
  MessageSquare, Eye, Clock, Filter
} from 'lucide-react'
import { jobService, resumeService } from '../services/api'
import { formatDistanceToNow } from 'date-fns'

const STATUSES = ['applied', 'screening', 'interview', 'technical', 'offer', 'hired', 'rejected'] as const

const STATUS_COLORS: Record<string, string> = {
  applied: 'badge-blue',
  screening: 'badge-amber',
  interview: 'badge-purple',
  technical: 'badge-amber',
  offer: 'badge-green',
  hired: 'badge-green',
  rejected: 'badge-red',
}

function ScoreBadge({ score }: { score: number | null | undefined }) {
  if (score == null) return <span className="badge badge-gray text-xs">No score</span>
  const color = score >= 70 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
    : score >= 40 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
    : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${color}`}>
      {score.toFixed(0)}% match
    </span>
  )
}

function ResumeModal({ resumeId, onClose }: { resumeId: string; onClose: () => void }) {
  const { data: resume, isLoading } = useQuery({
    queryKey: ['resume', resumeId],
    queryFn: () => resumeService.getResume(resumeId).then(r => r.data),
    enabled: !!resumeId,
  })

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/40" onClick={onClose}>
      <div
        className="card w-full sm:max-w-2xl p-5 sm:p-7 animate-slide-up rounded-b-none sm:rounded-b-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-bold text-lg text-slate-800 dark:text-white">Resume Details</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X size={18} />
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-3/4" />
            <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-1/2" />
            <div className="h-20 bg-slate-100 dark:bg-slate-800 rounded" />
          </div>
        ) : resume ? (
          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Title</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">{resume.title || resume.file_name || 'Untitled'}</p>
            </div>

            {resume.ai_summary && (
              <div>
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">AI Summary</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{resume.ai_summary}</p>
              </div>
            )}

            {resume.skills && resume.skills.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Skills</h3>
                <div className="flex flex-wrap gap-1.5">
                  {resume.skills.map((s: string) => (
                    <span key={s} className="badge badge-blue">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {resume.parsed_data && (
              <div>
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Parsed Data</h3>
                <pre className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 rounded-xl p-3 overflow-x-auto whitespace-pre-wrap">
                  {typeof resume.parsed_data === 'string' ? resume.parsed_data : JSON.stringify(resume.parsed_data, null, 2)}
                </pre>
              </div>
            )}

            {resume.extracted_text && (
              <div>
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Extracted Text</h3>
                <div className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 rounded-xl p-3 max-h-60 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                  {resume.extracted_text}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-slate-500 text-sm">Could not load resume details.</p>
        )}
      </div>
    </div>
  )
}

export default function ApplicantReviewPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [expandedCover, setExpandedCover] = useState<string | null>(null)
  const [notesOpen, setNotesOpen] = useState<string | null>(null)
  const [notesText, setNotesText] = useState<Record<string, string>>({})
  const [resumeModal, setResumeModal] = useState<string | null>(null)

  const { data: job, isLoading: jobLoading } = useQuery({
    queryKey: ['job', id],
    queryFn: () => jobService.getJob(id!).then(r => r.data),
    enabled: !!id,
  })

  const { data: applications, isLoading: appsLoading } = useQuery({
    queryKey: ['job-applications', id],
    queryFn: () => jobService.getApplications(id!).then(r => r.data),
    enabled: !!id,
  })

  const updateMutation = useMutation({
    mutationFn: ({ appId, data }: { appId: string; data: any }) => jobService.updateApp(appId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['job-applications', id] })
    },
  })

  const handleStatusChange = (appId: string, newStatus: string) => {
    updateMutation.mutate(
      { appId, data: { status: newStatus } },
      { onSuccess: () => toast.success(`Status updated to ${newStatus}`) }
    )
  }

  const handleSaveNotes = (appId: string) => {
    const notes = notesText[appId] ?? ''
    updateMutation.mutate(
      { appId, data: { employer_notes: notes } },
      {
        onSuccess: () => {
          toast.success('Notes saved')
          setNotesOpen(null)
        },
      }
    )
  }

  const filtered = statusFilter === 'all'
    ? applications
    : applications?.filter((a: any) => a.status === statusFilter)

  // Stats
  const stats = {
    total: applications?.length ?? 0,
    applied: applications?.filter((a: any) => a.status === 'applied').length ?? 0,
    screening: applications?.filter((a: any) => a.status === 'screening' || a.status === 'technical').length ?? 0,
    shortlisted: applications?.filter((a: any) => a.status === 'interview' || a.status === 'offer' || a.status === 'hired').length ?? 0,
    rejected: applications?.filter((a: any) => a.status === 'rejected').length ?? 0,
  }

  if (jobLoading || appsLoading) {
    return (
      <div className="max-w-5xl space-y-4">
        <div className="card p-6 animate-pulse h-20" />
        <div className="card p-6 animate-pulse h-16" />
        <div className="card p-6 animate-pulse h-64" />
      </div>
    )
  }

  if (!job) {
    return <div className="card p-12 text-center text-slate-500">Job not found</div>
  }

  return (
    <div className="max-w-5xl animate-slide-up">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate(-1)} className="btn-ghost -ml-2">
          <ArrowLeft size={16} /> Back
        </button>
      </div>

      <div className="card p-4 sm:p-6 mb-4">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold text-lg shadow-lg flex-shrink-0">
            {job.company_name?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-display font-bold text-xl sm:text-2xl text-slate-800 dark:text-white">{job.title}</h1>
            <p className="text-slate-500 text-sm mt-0.5">{job.company_name} &middot; {job.location}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`badge ${job.status === 'active' ? 'badge-green' : 'badge-gray'}`}>{job.status}</span>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
        {[
          { label: 'Total', value: stats.total, color: 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200' },
          { label: 'New', value: stats.applied, color: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' },
          { label: 'In Review', value: stats.screening, color: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' },
          { label: 'Shortlisted', value: stats.shortlisted, color: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' },
          { label: 'Rejected', value: stats.rejected, color: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl p-3 text-center ${s.color}`}>
            <p className="text-xl sm:text-2xl font-display font-bold">{s.value}</p>
            <p className="text-xs opacity-75 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="card p-3 sm:p-4 mb-4 flex flex-wrap items-center gap-2">
        <Filter size={16} className="text-slate-400" />
        <span className="text-sm text-slate-500 mr-1">Filter:</span>
        {['all', ...STATUSES].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${
              statusFilter === s
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Applicant List */}
      {(!filtered || filtered.length === 0) ? (
        <div className="card p-12 text-center">
          <Users size={40} className="mx-auto text-slate-200 dark:text-slate-700 mb-3" />
          <p className="text-slate-500 text-sm">
            {statusFilter === 'all' ? 'No applicants yet for this job.' : `No applicants with status "${statusFilter}".`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((app: any) => (
            <div key={app.id} className="card p-4 sm:p-5 hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                {/* Applicant info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-slate-800 dark:text-white text-sm">
                      {app.applicant_name || app.user_name || 'Applicant'}
                    </h3>
                    <ScoreBadge score={app.ai_match_score} />
                    <span className={`badge ${STATUS_COLORS[app.status] || 'badge-gray'} text-xs`}>
                      {app.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      Applied {formatDistanceToNow(new Date(app.applied_at || app.created_at), { addSuffix: true })}
                    </span>
                    {app.user_email && (
                      <span className="text-slate-400">{app.user_email}</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  {app.resume_id && (
                    <button
                      onClick={() => setResumeModal(app.resume_id)}
                      className="btn-secondary text-xs py-1.5 px-3"
                    >
                      <Eye size={13} /> Resume
                    </button>
                  )}

                  {/* Status dropdown */}
                  <div className="relative">
                    <select
                      value={app.status}
                      onChange={e => handleStatusChange(app.id, e.target.value)}
                      className="input text-xs py-1.5 pl-3 pr-8 min-w-[130px] appearance-none cursor-pointer"
                    >
                      {STATUSES.map(s => (
                        <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>

                  <button
                    onClick={() => {
                      if (notesOpen === app.id) {
                        setNotesOpen(null)
                      } else {
                        setNotesOpen(app.id)
                        setNotesText(prev => ({ ...prev, [app.id]: app.employer_notes || '' }))
                      }
                    }}
                    className="btn-secondary text-xs py-1.5 px-3"
                  >
                    <MessageSquare size={13} /> Notes
                  </button>
                </div>
              </div>

              {/* Cover letter preview */}
              {app.cover_letter && (
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-medium text-slate-500 mb-1">Cover Letter</p>
                  <p className={`text-sm text-slate-600 dark:text-slate-400 ${expandedCover === app.id ? '' : 'line-clamp-2'}`}>
                    {app.cover_letter}
                  </p>
                  {app.cover_letter.length > 150 && (
                    <button
                      onClick={() => setExpandedCover(expandedCover === app.id ? null : app.id)}
                      className="text-xs text-brand-600 hover:underline mt-1 flex items-center gap-0.5"
                    >
                      {expandedCover === app.id ? <><ChevronUp size={12} /> Show less</> : <><ChevronDown size={12} /> Read more</>}
                    </button>
                  )}
                </div>
              )}

              {/* Notes area */}
              {notesOpen === app.id && (
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Employer Notes</label>
                  <textarea
                    className="input h-20 resize-none text-sm"
                    placeholder="Add private notes about this applicant..."
                    value={notesText[app.id] ?? ''}
                    onChange={e => setNotesText(prev => ({ ...prev, [app.id]: e.target.value }))}
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <button onClick={() => setNotesOpen(null)} className="btn-ghost text-xs py-1.5 px-3">Cancel</button>
                    <button
                      onClick={() => handleSaveNotes(app.id)}
                      disabled={updateMutation.isPending}
                      className="btn-primary text-xs py-1.5 px-3"
                    >
                      {updateMutation.isPending ? 'Saving...' : 'Save Notes'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Resume Modal */}
      {resumeModal && (
        <ResumeModal resumeId={resumeModal} onClose={() => setResumeModal(null)} />
      )}
    </div>
  )
}

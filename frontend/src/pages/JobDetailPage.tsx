import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  MapPin, Briefcase, Clock, DollarSign, Users, Eye, ArrowLeft,
  Send, Star, CheckCircle, XCircle, Sparkles, ChevronDown, ChevronUp,
  Share2, Flag, ArrowRight, Check
} from 'lucide-react'
import { jobService, resumeService } from '../services/api'
import { useAuthStore } from '../store/authStore'
import { formatDistanceToNow } from 'date-fns'

function formatTextWithBullets(text: string) {
  if (!text) return null
  const lines = text.split('\n')
  const elements: JSX.Element[] = []
  let listItems: string[] = []

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="list-none space-y-2 my-3">
          {listItems.map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-400 mt-1.5 flex-shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )
      listItems = []
    }
  }

  lines.forEach((line, i) => {
    const trimmed = line.trim()
    const bulletMatch = trimmed.match(/^[-*\u2022]\s*(.+)/)
    if (bulletMatch) {
      listItems.push(bulletMatch[1])
    } else {
      flushList()
      if (trimmed) {
        elements.push(<p key={`p-${i}`} className="text-slate-600 text-sm leading-relaxed mb-2">{trimmed}</p>)
      }
    }
  })
  flushList()

  return <div>{elements}</div>
}

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const qc = useQueryClient()

  const [showApplyModal, setShowApplyModal] = useState(false)
  const [selectedResumeId, setSelectedResumeId] = useState('')
  const [coverLetter, setCoverLetter] = useState('')
  const [aiScore, setAiScore] = useState<any>(null)
  const [scoring, setScoring] = useState(false)
  const [copied, setCopied] = useState(false)

  const { data: job, isLoading } = useQuery({
    queryKey: ['job', id],
    queryFn: () => jobService.getJob(id!).then(r => r.data),
    enabled: !!id,
  })

  const { data: resumes } = useQuery({
    queryKey: ['my-resumes'],
    queryFn: () => resumeService.myResumes().then(r => r.data),
    enabled: user?.role === 'employee',
  })

  const { data: myApps } = useQuery({
    queryKey: ['my-apps'],
    queryFn: () => jobService.myApplications().then(r => r.data),
    enabled: user?.role === 'employee',
  })

  const hasApplied = myApps?.some((a: any) => a.job_id === id)

  const applyMutation = useMutation({
    mutationFn: (d: any) => jobService.applyToJob(id!, d),
    onSuccess: () => {
      toast.success('Application submitted!')
      setShowApplyModal(false)
      qc.invalidateQueries({ queryKey: ['my-apps'] })
    },
    onError: (err: any) => toast.error(err?.response?.data?.detail || 'Failed to apply'),
  })

  const handleAiScore = async () => {
    if (!selectedResumeId || !job) return
    setScoring(true)
    try {
      const r = await resumeService.scoreAgainstJob(selectedResumeId, job.title, job.requirements)
      setAiScore(r.data)
    } catch {
      toast.error('AI scoring failed')
    } finally {
      setScoring(false)
    }
  }

  const handleShareJob = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      toast.success('Job URL copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => toast.error('Failed to copy URL'))
  }

  if (isLoading) return <div className="card p-12 animate-pulse h-64" />
  if (!job) return <div className="card p-12 text-center text-slate-500">Job not found</div>

  return (
    <div className="max-w-4xl animate-fade-in">
      <button onClick={() => navigate(-1)} className="btn-ghost mb-4 -ml-2">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="card p-4 sm:p-7 mb-4 transition-all duration-300 hover:shadow-card-hover">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-5">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold text-xl sm:text-2xl shadow-lg flex-shrink-0">
            {job.company_name?.[0]}
          </div>
          <div className="flex-1 min-w-0 w-full">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <h1 className="font-display font-bold text-xl sm:text-2xl text-slate-800">{job.title}</h1>
                <p className="text-slate-500 mt-0.5">{job.company_name}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {job.is_featured && <span className="badge badge-amber"><Star size={11} className="mr-1" />Featured</span>}
                <button
                  onClick={handleShareJob}
                  className="btn-ghost p-2 rounded-xl hover:bg-slate-100"
                  title="Share job"
                >
                  {copied ? <Check size={16} className="text-emerald-500" /> : <Share2 size={16} />}
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-4 mt-3 text-xs sm:text-sm text-slate-500">
              <span className="flex items-center gap-1 sm:gap-1.5"><MapPin size={14} />{job.location}</span>
              <span className="flex items-center gap-1 sm:gap-1.5"><Briefcase size={14} />{job.job_type?.replace('_', ' ')}</span>
              <span className="flex items-center gap-1 sm:gap-1.5"><Clock size={14} />{formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}</span>
              <span className="flex items-center gap-1 sm:gap-1.5"><Eye size={14} />{job.views_count} views</span>
              <span className="flex items-center gap-1 sm:gap-1.5"><Users size={14} />{job.applications_count} applicants</span>
            </div>
          </div>
        </div>

        {/* Salary + type chips */}
        <div className="flex flex-wrap gap-2 mt-4 sm:mt-5 pt-4 sm:pt-5 border-t border-slate-100">
          <span className="badge badge-blue capitalize">{job.experience_level}</span>
          <span className="badge badge-gray capitalize">{job.job_type?.replace('_', ' ')}</span>
          {job.salary_min && (
            <span className="badge badge-green flex items-center gap-1">
              <DollarSign size={11} />{job.salary_min.toLocaleString()}{'\u2013'}{job.salary_max?.toLocaleString()} {job.salary_currency}/yr
            </span>
          )}
        </div>

        {/* Apply button / Already Applied indicator */}
        {user?.role === 'employee' && (
          <div className="mt-4 sm:mt-5">
            {hasApplied ? (
              <div className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 font-medium text-sm border border-emerald-200">
                <CheckCircle size={18} /> Already Applied
              </div>
            ) : (
              <button onClick={() => setShowApplyModal(true)} className="btn-primary px-6 sm:px-8 py-2.5 sm:py-3 text-sm sm:text-base w-full sm:w-auto justify-center sm:justify-start">
                <Send size={18} /> Apply Now
              </button>
            )}
          </div>
        )}

        {/* Employer: View Applicants */}
        {(user?.role === 'employer' || user?.role === 'superadmin') && (
          <Link to={`/jobs/${id}/applicants`} className="btn-primary mt-4 sm:mt-5 px-6 sm:px-8 py-2.5 sm:py-3 text-sm sm:text-base w-full sm:w-auto justify-center sm:justify-start inline-flex items-center gap-2">
            <Users size={18} /> View Applicants ({job.applications_count ?? 0})
          </Link>
        )}
      </div>

      {/* Body - single column on mobile, grid on desktop */}
      <div className="flex flex-col md:grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-4">
          <div className="card p-4 sm:p-6 transition-all duration-300 hover:shadow-card-hover">
            <h2 className="font-display font-semibold text-base sm:text-lg text-slate-800 mb-3">About This Role</h2>
            {formatTextWithBullets(job.description)}
          </div>
          <div className="card p-4 sm:p-6 transition-all duration-300 hover:shadow-card-hover">
            <h2 className="font-display font-semibold text-base sm:text-lg text-slate-800 mb-3">Requirements</h2>
            {formatTextWithBullets(job.requirements)}
          </div>
          {job.responsibilities && (
            <div className="card p-4 sm:p-6 transition-all duration-300 hover:shadow-card-hover">
              <h2 className="font-display font-semibold text-base sm:text-lg text-slate-800 mb-3">Responsibilities</h2>
              {formatTextWithBullets(job.responsibilities)}
            </div>
          )}

          {/* Report link */}
          <div className="text-center py-2">
            <button
              onClick={() => toast.success('Report submitted. We will review this listing.', { duration: 3000 })}
              className="text-xs text-slate-400 hover:text-red-500 transition-colors inline-flex items-center gap-1"
            >
              <Flag size={12} /> Report this job
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {/* Company info mini-card */}
          <div className="card p-4 sm:p-5 transition-all duration-300 hover:shadow-card-hover">
            <h3 className="font-semibold text-slate-700 mb-3 text-sm">About the Company</h3>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                {job.company_name?.[0]}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm text-slate-800 truncate">{job.company_name}</p>
                <p className="text-xs text-slate-400">Employer</p>
              </div>
            </div>
            <Link
              to={`/jobs?company=${encodeURIComponent(job.company_name)}`}
              className="text-xs text-brand-600 hover:text-brand-700 font-medium inline-flex items-center gap-1 hover:underline transition-colors"
            >
              View all jobs by this company <ArrowRight size={12} />
            </Link>
          </div>

          {/* Skills */}
          {job.skills_required?.length > 0 && (
            <div className="card p-4 sm:p-5 transition-all duration-300 hover:shadow-card-hover">
              <h3 className="font-semibold text-slate-700 mb-3 text-sm">Required Skills</h3>
              <div className="flex flex-wrap gap-1.5">
                {job.skills_required.map((s: string) => <span key={s} className="badge badge-blue">{s}</span>)}
              </div>
            </div>
          )}
          {/* Benefits */}
          {job.benefits?.length > 0 && (
            <div className="card p-4 sm:p-5 transition-all duration-300 hover:shadow-card-hover">
              <h3 className="font-semibold text-slate-700 mb-3 text-sm">Benefits</h3>
              <ul className="space-y-1.5">
                {job.benefits.map((b: string) => (
                  <li key={b} className="flex items-center gap-2 text-sm text-slate-600">
                    <CheckCircle size={14} className="text-emerald-500 flex-shrink-0" />{b}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {job.application_deadline && (
            <div className="card p-4 sm:p-5 transition-all duration-300 hover:shadow-card-hover">
              <h3 className="font-semibold text-slate-700 mb-1 text-sm">Application Deadline</h3>
              <p className="text-sm text-slate-600">{new Date(job.application_deadline).toLocaleDateString()}</p>
            </div>
          )}
        </div>
      </div>

      {/* Apply Modal - full screen on mobile */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/40">
          <div className="card w-full sm:max-w-lg p-5 sm:p-7 animate-slide-up rounded-b-none sm:rounded-b-2xl max-h-[90vh] sm:max-h-[85vh] overflow-y-auto">
            <h2 className="font-display font-bold text-lg sm:text-xl text-slate-800 mb-4 sm:mb-5">Apply to {job.title}</h2>

            {resumes && resumes.length > 0 ? (
              <>
                <div className="mb-4">
                  <label className="label">Select Resume</label>
                  <select className="input" value={selectedResumeId} onChange={e => { setSelectedResumeId(e.target.value); setAiScore(null) }}>
                    <option value="">{'\u2014'} Choose a resume {'\u2014'}</option>
                    {resumes.map((r: any) => <option key={r.id} value={r.id}>{r.title} ({r.file_name})</option>)}
                  </select>
                </div>

                {selectedResumeId && (
                  <div className="mb-4">
                    <button onClick={handleAiScore} disabled={scoring} className="btn-secondary text-sm py-2 w-full justify-center">
                      <Sparkles size={15} className="text-brand-500" />
                      {scoring ? 'Scoring...' : 'Score my resume with AI'}
                    </button>
                    {aiScore && (
                      <div className={`mt-3 p-3 sm:p-4 rounded-xl text-sm border ${aiScore.score >= 70 ? 'bg-emerald-50 border-emerald-200' : aiScore.score >= 40 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}`}>
                        <div className="flex items-center gap-2 mb-2 font-semibold">
                          {aiScore.score >= 70 ? <CheckCircle size={16} className="text-emerald-600" /> : <XCircle size={16} className="text-red-500" />}
                          Match Score: {aiScore.score.toFixed(0)}%
                        </div>
                        <p className="text-slate-600 mb-2">{aiScore.summary}</p>
                        {aiScore.strengths?.length > 0 && (
                          <p className="text-emerald-700 text-xs">{'\u2713'} {aiScore.strengths.slice(0, 2).join(' \u00B7 ')}</p>
                        )}
                        {aiScore.gaps?.length > 0 && (
                          <p className="text-red-600 text-xs mt-1">{'\u25B3'} {aiScore.gaps.slice(0, 2).join(' \u00B7 ')}</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="mb-4 p-4 bg-amber-50 rounded-xl text-sm text-amber-700 border border-amber-200">
                No resumes yet. <Link to="/resumes" className="font-medium underline">Upload one first {'\u2192'}</Link>
              </div>
            )}

            <div className="mb-4 sm:mb-5">
              <label className="label">Cover Letter <span className="text-slate-400 font-normal">(optional)</span></label>
              <textarea
                className="input h-24 sm:h-28 resize-none"
                placeholder="Tell the employer why you're a great fit..."
                value={coverLetter}
                onChange={e => setCoverLetter(e.target.value)}
              />
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
              <button onClick={() => setShowApplyModal(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
              <button
                onClick={() => applyMutation.mutate({ resume_id: selectedResumeId || undefined, cover_letter: coverLetter || undefined })}
                disabled={applyMutation.isPending}
                className="btn-primary flex-1 justify-center"
              >
                {applyMutation.isPending ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

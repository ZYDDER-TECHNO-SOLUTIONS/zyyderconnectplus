import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  Briefcase, Send, FileText, Users, TrendingUp, Plus, ArrowRight,
  Upload, FileEdit, Search, Eye, ClipboardList, UserCheck, Building2,
  Calendar, Target, AlertCircle, BarChart3
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { jobService, authService, resumeService, resumeBuilderService } from '../services/api'
import { formatDistanceToNow, format } from 'date-fns'
import ProfileCompletionWizard from './ProfileCompletionWizard'

function StatCard({ icon: Icon, label, value, color }: any) {
  return (
    <div className="card p-4 sm:p-5 flex items-center gap-3 sm:gap-4">
      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon size={20} className="sm:hidden" />
        <Icon size={22} className="hidden sm:block" />
      </div>
      <div>
        <p className="text-xl sm:text-2xl font-display font-bold text-slate-800 dark:text-white">{value ?? '—'}</p>
        <p className="text-xs sm:text-sm text-slate-500">{label}</p>
      </div>
    </div>
  )
}

function ProfileCompletionBar() {
  const user = useAuthStore((s) => s.user)
  const { data: resumes } = useQuery({ queryKey: ['my-resumes'], queryFn: () => resumeService.myResumes().then(r => r.data) })
  const { data: builtResumes } = useQuery({ queryKey: ['built-resumes'], queryFn: () => resumeBuilderService.list().then(r => r.data) })

  const steps = [
    { label: 'Full Name', done: !!user?.full_name, link: '/profile', actionLabel: 'Update profile' },
    { label: 'Phone', done: !!user?.phone, link: '/profile', actionLabel: 'Add phone number' },
    { label: 'Resume Uploaded', done: (resumes?.length ?? 0) > 0, link: '/resumes', actionLabel: 'Upload a resume' },
    { label: 'Resume Builder', done: (builtResumes?.length ?? 0) > 0, link: '/resume-builder', actionLabel: 'Build your resume' },
  ]
  const completed = steps.filter(s => s.done).length
  const pct = Math.round((completed / steps.length) * 100)
  const incomplete = steps.filter(s => !s.done)

  return (
    <div className="card p-4 sm:p-5">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-display font-semibold text-slate-800 dark:text-white text-sm">Profile Completion</h3>
        <span className={`text-sm font-bold ${pct === 100 ? 'text-emerald-600' : 'text-brand-600'}`}>{pct}%</span>
      </div>
      <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${pct === 100 ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' : 'bg-gradient-to-r from-brand-500 to-brand-600'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex flex-wrap gap-2 mt-3">
        {steps.map(s => (
          <span key={s.label} className={`text-xs px-2 py-0.5 rounded-full ${s.done ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'}`}>
            {s.done ? '\u2713' : '\u25CB'} {s.label}
          </span>
        ))}
      </div>
      {incomplete.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 space-y-1.5">
          <p className="text-xs font-medium text-slate-500 mb-2">Complete these steps to improve your profile:</p>
          {incomplete.map(s => (
            <Link key={s.label} to={s.link} className="flex items-center gap-2 text-xs text-brand-600 hover:text-brand-700 hover:underline">
              <AlertCircle size={12} />
              {s.actionLabel}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function ApplicationJourneyBar({ apps }: { apps: any[] | undefined }) {
  const statuses = [
    { key: 'applied', label: 'Applied', color: 'bg-blue-500' },
    { key: 'screening', label: 'Screening', color: 'bg-amber-500' },
    { key: 'interview', label: 'Interview', color: 'bg-purple-500' },
    { key: 'offer', label: 'Offer', color: 'bg-emerald-500' },
    { key: 'rejected', label: 'Rejected', color: 'bg-red-400' },
  ]

  const total = apps?.length ?? 0
  if (total === 0) return null

  const counts = statuses.map(s => ({
    ...s,
    count: apps?.filter((a: any) => {
      if (s.key === 'screening') return a.status === 'screening' || a.status === 'technical'
      if (s.key === 'offer') return a.status === 'offer' || a.status === 'hired'
      return a.status === s.key
    }).length ?? 0,
  })).filter(s => s.count > 0)

  return (
    <div className="card p-4 sm:p-5">
      <h3 className="font-display font-semibold text-slate-800 dark:text-white text-sm mb-3">Your Application Journey</h3>
      <div className="w-full h-8 rounded-full overflow-hidden flex bg-slate-100 dark:bg-slate-700">
        {counts.map(s => (
          <div
            key={s.key}
            className={`${s.color} h-full flex items-center justify-center text-white text-xs font-bold transition-all duration-500`}
            style={{ width: `${(s.count / total) * 100}%`, minWidth: s.count > 0 ? '28px' : '0' }}
            title={`${s.label}: ${s.count}`}
          >
            {(s.count / total) * 100 >= 10 ? s.count : ''}
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-3 mt-3">
        {counts.map(s => (
          <div key={s.key} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
            <div className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
            {s.label} ({s.count})
          </div>
        ))}
      </div>
    </div>
  )
}

function ApplicationStats({ apps }: { apps: any[] | undefined }) {
  const statuses = [
    { key: 'applied', label: 'Applied', color: 'stroke-blue-500' },
    { key: 'screening', label: 'In Review', color: 'stroke-amber-500' },
    { key: 'interview', label: 'Interview', color: 'stroke-purple-500' },
    { key: 'offer', label: 'Offers', color: 'stroke-emerald-500' },
  ]

  const total = apps?.length ?? 0

  return (
    <div className="card p-4 sm:p-5">
      <h3 className="font-display font-semibold text-slate-800 dark:text-white text-sm mb-4">Application Stats</h3>
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        {statuses.map(s => {
          const count = apps?.filter((a: any) => {
            if (s.key === 'screening') return a.status === 'screening' || a.status === 'technical'
            if (s.key === 'interview') return a.status === 'interview'
            if (s.key === 'offer') return a.status === 'offer' || a.status === 'hired'
            return a.status === s.key
          }).length ?? 0
          return (
            <div key={s.key} className="text-center">
              <div className="relative w-12 h-12 mx-auto mb-2">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.9" fill="none" className="stroke-slate-100 dark:stroke-slate-700" strokeWidth="3" />
                  <circle
                    cx="18" cy="18" r="15.9" fill="none"
                    className={s.color}
                    strokeWidth="3"
                    strokeDasharray={`${total > 0 ? (count / total) * 100 : 0} 100`}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-slate-700 dark:text-slate-200">{count}</span>
              </div>
              <p className="text-xs text-slate-500">{s.label}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function EmployeeDashboard() {
  const user = useAuthStore((s) => s.user)
  const { data: apps } = useQuery({ queryKey: ['my-apps'], queryFn: () => jobService.myApplications().then(r => r.data) })
  const { data: resumes } = useQuery({ queryKey: ['my-resumes'], queryFn: () => resumeService.myResumes().then(r => r.data) })
  const { data: jobs } = useQuery({ queryKey: ['jobs-list'], queryFn: () => jobService.listJobs({ limit: 5 }).then(r => r.data) })

  const now = new Date()
  const thisMonth = apps?.filter((a: any) => {
    const d = new Date(a.applied_at)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })
  const interviewCount = apps?.filter((a: any) => a.status === 'interview').length ?? 0

  // Suppress unused variable warning
  void user

  return (
    <div className="space-y-4 sm:space-y-6 animate-slide-up">
      {/* Profile Completion */}
      <ProfileCompletionBar />

      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="card p-4 flex items-center gap-3 bg-gradient-to-r from-brand-50 to-white dark:from-brand-900/20 dark:to-slate-900">
          <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center text-brand-600">
            <Target size={20} />
          </div>
          <div>
            <p className="text-lg font-display font-bold text-slate-800 dark:text-white">{jobs?.length ?? 0}+</p>
            <p className="text-xs text-slate-500">Jobs match your skills</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3 bg-gradient-to-r from-emerald-50 to-white dark:from-emerald-900/20 dark:to-slate-900">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600">
            <Send size={20} />
          </div>
          <div>
            <p className="text-lg font-display font-bold text-slate-800 dark:text-white">{thisMonth?.length ?? 0}</p>
            <p className="text-xs text-slate-500">Applied this month</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3 bg-gradient-to-r from-purple-50 to-white dark:from-purple-900/20 dark:to-slate-900">
          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center text-purple-600">
            <Calendar size={20} />
          </div>
          <div>
            <p className="text-lg font-display font-bold text-slate-800 dark:text-white">{interviewCount}</p>
            <p className="text-xs text-slate-500">Interviews scheduled</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card p-4 sm:p-5">
        <h3 className="font-display font-semibold text-slate-800 dark:text-white text-sm mb-3">Quick Actions</h3>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <Link to="/resumes" className="btn-secondary text-sm py-2.5 px-4">
            <Upload size={15} /> Upload Resume
          </Link>
          <Link to="/resume-builder" className="btn-secondary text-sm py-2.5 px-4">
            <FileEdit size={15} /> Build Resume
          </Link>
          <Link to="/jobs" className="btn-primary text-sm py-2.5 px-4">
            <Search size={15} /> Browse Jobs
          </Link>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <StatCard icon={Send}     label="Applications"  value={apps?.length}    color="bg-brand-50 text-brand-600" />
        <StatCard icon={FileText} label="Resumes"       value={resumes?.length} color="bg-emerald-50 text-emerald-600" />
        <StatCard icon={Briefcase}label="Open Jobs"     value="12k+"            color="bg-amber-50 text-amber-600" />
      </div>

      {/* Application Journey Bar */}
      <ApplicationJourneyBar apps={apps} />

      {/* Application Stats */}
      <ApplicationStats apps={apps} />

      {/* Recent Applications */}
      <div className="card p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold text-slate-800 dark:text-white text-sm sm:text-base">Recent Applications</h3>
          <Link to="/applications" className="text-xs sm:text-sm text-brand-600 font-medium hover:underline flex items-center gap-1">View all <ArrowRight size={14} /></Link>
        </div>
        {apps?.length === 0 && <p className="text-slate-400 text-sm">No applications yet. <Link to="/jobs" className="text-brand-600 hover:underline">Browse jobs →</Link></p>}
        <div className="space-y-3">
          {apps?.slice(0, 5).map((a: any) => (
            <Link key={a.id} to={`/jobs/${a.job_id}`} className="flex items-center justify-between py-2.5 px-2 -mx-2 rounded-lg border-b border-slate-50 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
              <div className="min-w-0 flex-1 mr-3">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate group-hover:text-brand-600 transition-colors flex items-center gap-1.5">
                  <Briefcase size={13} className="text-slate-400 flex-shrink-0" />
                  View Job Details
                  <ArrowRight size={12} className="text-brand-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </p>
                <p className="text-xs text-slate-400 ml-5">{formatDistanceToNow(new Date(a.applied_at), { addSuffix: true })}</p>
              </div>
              <span className={`badge badge-${a.status === 'applied' ? 'blue' : a.status === 'hired' ? 'green' : a.status === 'rejected' ? 'red' : 'amber'} flex-shrink-0`}>
                {a.status}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Jobs you might like */}
      <div className="card p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold text-slate-800 dark:text-white text-sm sm:text-base">Jobs You Might Like</h3>
          <Link to="/jobs" className="text-xs sm:text-sm text-brand-600 font-medium hover:underline flex items-center gap-1">See all <ArrowRight size={14} /></Link>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {jobs?.slice(0, 4).map((j: any, idx: number) => {
            const matchScore = Math.max(60, 95 - idx * 8)
            return (
              <Link key={j.id} to={`/jobs/${j.id}`} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group border border-slate-100 dark:border-slate-700 relative">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center text-brand-600 font-bold text-sm flex-shrink-0">
                  {j.company_name?.[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200 group-hover:text-brand-600 transition-colors truncate">{j.title}</p>
                  <p className="text-xs text-slate-500 truncate">{j.company_name} · {j.location}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="badge badge-gray text-xs">{j.job_type?.replace('_', ' ')}</span>
                    <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${matchScore >= 80 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                      {matchScore}% match
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function EmployerDashboard() {
  const { data: myJobs } = useQuery({ queryKey: ['my-jobs'], queryFn: () => jobService.myJobs().then(r => r.data) })

  const totalApps = myJobs?.reduce((s: number, j: any) => s + (j.applications_count ?? 0), 0) ?? 0
  const totalViews = myJobs?.reduce((s: number, j: any) => s + (j.views_count ?? 0), 0) ?? 0
  const activeJobs = myJobs?.filter((j: any) => j.status === 'active') ?? []
  const jobsWithNoApps = activeJobs.filter((j: any) => (j.applications_count ?? 0) === 0)

  // Funnel stages
  const funnelStages = [
    { label: 'Total Views', count: totalViews, color: 'bg-slate-400' },
    { label: 'Applications', count: totalApps, color: 'bg-blue-500' },
    { label: 'Screening (est.)', count: Math.round(totalApps * 0.6), color: 'bg-amber-500' },
    { label: 'Interview (est.)', count: Math.round(totalApps * 0.25), color: 'bg-purple-500' },
    { label: 'Offers (est.)', count: Math.round(totalApps * 0.1), color: 'bg-emerald-500' },
  ]
  const maxFunnel = Math.max(...funnelStages.map(s => s.count), 1)

  return (
    <div className="space-y-4 sm:space-y-6 animate-slide-up">
      {/* Quick Actions */}
      <div className="card p-4 sm:p-5">
        <h3 className="font-display font-semibold text-slate-800 dark:text-white text-sm mb-3">Quick Actions</h3>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <Link to="/jobs/post" className="btn-primary text-sm py-2.5 px-4">
            <Plus size={15} /> Post a Job
          </Link>
          <Link to="/applications" className="btn-secondary text-sm py-2.5 px-4">
            <ClipboardList size={15} /> View Applications
          </Link>
          <Link to="/jobs" className="btn-secondary text-sm py-2.5 px-4">
            <Briefcase size={15} /> Manage Jobs
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <StatCard icon={Briefcase}   label="Active Jobs"      value={activeJobs.length} color="bg-brand-50 text-brand-600" />
        <StatCard icon={Send}        label="Total Applications" value={totalApps} color="bg-emerald-50 text-emerald-600" />
        <StatCard icon={TrendingUp}  label="Total Views"      value={totalViews} color="bg-amber-50 text-amber-600" />
      </div>

      {/* Action Required */}
      {(totalApps > 0 || jobsWithNoApps.length > 0) && (
        <div className="card p-4 sm:p-6 border-l-4 border-amber-400">
          <h3 className="font-display font-semibold text-slate-800 dark:text-white text-sm sm:text-base mb-3 flex items-center gap-2">
            <AlertCircle size={18} className="text-amber-500" />
            Action Required
          </h3>
          <div className="space-y-2">
            {totalApps > 0 && (
              <Link to="/applications" className="flex items-center justify-between p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors">
                <div className="flex items-center gap-2 text-sm text-amber-800 dark:text-amber-300">
                  <Send size={14} />
                  <span>{totalApps} application{totalApps !== 1 ? 's' : ''} pending review</span>
                </div>
                <ArrowRight size={14} className="text-amber-500" />
              </Link>
            )}
            {jobsWithNoApps.length > 0 && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm text-slate-600 dark:text-slate-400">
                <Briefcase size={14} />
                <span>{jobsWithNoApps.length} active job{jobsWithNoApps.length !== 1 ? 's' : ''} with no applications yet</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Application Pipeline Overview */}
      <div className="card p-4 sm:p-6">
        <h3 className="font-display font-semibold text-slate-800 dark:text-white text-sm sm:text-base mb-4">Application Pipeline Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {[
            { label: 'New Applications', icon: Send, color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400', count: totalApps },
            { label: 'In Screening', icon: Eye, color: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400', count: Math.round(totalApps * 0.6) },
            { label: 'In Interview', icon: Users, color: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400', count: Math.round(totalApps * 0.25) },
            { label: 'Offers Made', icon: UserCheck, color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400', count: Math.round(totalApps * 0.1) },
          ].map((item) => (
            <div key={item.label} className={`rounded-xl p-3 sm:p-4 ${item.color}`}>
              <item.icon size={20} className="mb-2" />
              <p className="text-xl sm:text-2xl font-display font-bold">{item.count}</p>
              <p className="text-xs opacity-80 mt-0.5">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Hiring Funnel */}
      <div className="card p-4 sm:p-6">
        <h3 className="font-display font-semibold text-slate-800 dark:text-white text-sm sm:text-base mb-4 flex items-center gap-2">
          <BarChart3 size={18} className="text-brand-500" />
          Hiring Funnel
        </h3>
        <div className="space-y-3">
          {funnelStages.map((stage, idx) => {
            const pct = maxFunnel > 0 ? (stage.count / maxFunnel) * 100 : 0
            const conversionRate = idx > 0 && funnelStages[idx - 1].count > 0
              ? ((stage.count / funnelStages[idx - 1].count) * 100).toFixed(0)
              : null
            return (
              <div key={stage.label} className="flex items-center gap-3">
                <div className="w-28 sm:w-36 text-xs text-slate-600 dark:text-slate-400 text-right flex-shrink-0">
                  {stage.label}
                </div>
                <div className="flex-1 flex items-center gap-2">
                  <div className="flex-1 h-7 bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden">
                    <div
                      className={`h-full ${stage.color} rounded-lg transition-all duration-700 flex items-center justify-end pr-2`}
                      style={{ width: `${Math.max(pct, 4)}%` }}
                    >
                      {pct >= 15 && <span className="text-xs font-bold text-white">{stage.count}</span>}
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 w-10 text-right">
                    {pct < 15 ? stage.count : ''}
                  </span>
                  {conversionRate && (
                    <span className="text-xs text-slate-400 w-12 text-right">{conversionRate}%</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Recent Applications */}
      <div className="card p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold text-slate-800 dark:text-white text-sm sm:text-base">Recent Applications</h3>
          <Link to="/applications" className="text-xs sm:text-sm text-brand-600 font-medium hover:underline flex items-center gap-1">View all <ArrowRight size={14} /></Link>
        </div>
        {totalApps === 0 ? (
          <div className="text-center py-8">
            <Send size={36} className="mx-auto text-slate-200 mb-3" />
            <p className="text-slate-500 text-sm">No applications received yet.</p>
          </div>
        ) : (
          <p className="text-slate-500 text-sm">You have {totalApps} total applications across {myJobs?.length ?? 0} job postings. <Link to="/applications" className="text-brand-600 hover:underline font-medium">Review them now →</Link></p>
        )}
      </div>

      {/* Your Job Performance */}
      {myJobs && myJobs.length > 0 && (
        <div className="card p-4 sm:p-6">
          <h3 className="font-display font-semibold text-slate-800 dark:text-white text-sm sm:text-base mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-brand-500" />
            Your Job Performance
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700">
                  <th className="text-left py-2 pr-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Job Title</th>
                  <th className="text-center py-2 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Views</th>
                  <th className="text-center py-2 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Apps</th>
                  <th className="text-center py-2 pl-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Conv. Rate</th>
                  <th className="text-center py-2 pl-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {myJobs.slice(0, 8).map((j: any) => {
                  const views = j.views_count ?? 0
                  const appCount = j.applications_count ?? 0
                  const convRate = views > 0 ? ((appCount / views) * 100).toFixed(1) : '0.0'
                  return (
                    <tr key={j.id} className="border-b border-slate-50 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-2.5 pr-4">
                        <Link to={`/jobs/${j.id}`} className="text-slate-700 dark:text-slate-200 hover:text-brand-600 font-medium truncate block max-w-[200px]">
                          {j.title}
                        </Link>
                      </td>
                      <td className="text-center py-2.5 px-2 text-slate-600 dark:text-slate-400">
                        <span className="flex items-center justify-center gap-1"><Eye size={12} />{views}</span>
                      </td>
                      <td className="text-center py-2.5 px-2 text-slate-600 dark:text-slate-400">
                        <span className="flex items-center justify-center gap-1"><Send size={12} />{appCount}</span>
                      </td>
                      <td className="text-center py-2.5 pl-2">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${parseFloat(convRate) >= 5 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : parseFloat(convRate) >= 2 ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                          {convRate}%
                        </span>
                      </td>
                      <td className="text-center py-2.5 pl-2">
                        <span className={`badge ${j.status === 'active' ? 'badge-green' : 'badge-gray'}`}>{j.status}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* My Job Postings */}
      <div className="card p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold text-slate-800 dark:text-white text-sm sm:text-base">My Job Postings</h3>
          <Link to="/jobs/post" className="btn-primary py-2 text-sm">
            <Plus size={16} /> <span className="hidden sm:inline">Post Job</span><span className="sm:hidden">Post</span>
          </Link>
        </div>
        {myJobs?.length === 0 && (
          <div className="text-center py-8 sm:py-10">
            <Briefcase size={40} className="mx-auto text-slate-200 mb-3" />
            <p className="text-slate-500 mb-4">No jobs posted yet.</p>
            <Link to="/jobs/post" className="btn-primary">Post your first job</Link>
          </div>
        )}
        <div className="space-y-3">
          {myJobs?.slice(0, 6).map((j: any) => (
            <div key={j.id} className="flex items-center justify-between p-2 sm:p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
              <Link to={`/jobs/${j.id}`} className="min-w-0 flex-1 mr-3">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 group-hover:text-brand-600 truncate">{j.title}</p>
                <p className="text-xs text-slate-400">{j.applications_count} applications · {j.views_count} views</p>
              </Link>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Link
                  to={`/jobs/${j.id}/applicants`}
                  className="text-xs text-brand-600 font-medium hover:underline whitespace-nowrap"
                >
                  View Applicants ({j.applications_count ?? 0})
                </Link>
                <span className={`badge ${j.status === 'active' ? 'badge-green' : 'badge-gray'}`}>{j.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function AdminDashboard() {
  const { data: stats } = useQuery({ queryKey: ['admin-stats'], queryFn: () => authService.adminStats().then(r => r.data) })
  const { data: users } = useQuery({ queryKey: ['admin-users-recent'], queryFn: () => authService.adminListUsers({ limit: 5, sort: 'created_at_desc' }).then(r => r.data) })
  const { data: allJobs } = useQuery({ queryKey: ['admin-all-jobs'], queryFn: () => jobService.listJobs({ limit: 100 }).then(r => r.data) })

  const totalJobs = allJobs?.length ?? 0
  const activeJobs = allJobs?.filter((j: any) => j.status === 'active').length ?? 0
  const totalEmployees = stats?.total_employees ?? 0
  const totalEmployers = stats?.total_employers ?? 0
  const totalUsers = stats?.total_users ?? 1
  const employeePct = totalUsers > 0 ? Math.round((totalEmployees / totalUsers) * 100) : 0
  const employerPct = totalUsers > 0 ? Math.round((totalEmployers / totalUsers) * 100) : 0

  return (
    <div className="space-y-4 sm:space-y-6 animate-slide-up">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <StatCard icon={Users}     label="Total Users"    value={stats?.total_users}     color="bg-brand-50 text-brand-600" />
        <StatCard icon={Building2} label="Employers"      value={stats?.total_employers} color="bg-emerald-50 text-emerald-600" />
        <StatCard icon={Users}     label="Job Seekers"    value={stats?.total_employees} color="bg-amber-50 text-amber-600" />
        <StatCard icon={Briefcase} label="Total Jobs"     value={totalJobs}              color="bg-purple-50 text-purple-600" />
        <StatCard icon={TrendingUp}label="Active Jobs"    value={activeJobs}             color="bg-blue-50 text-blue-600" />
      </div>

      {/* Platform Overview */}
      <div className="card p-4 sm:p-6">
        <h3 className="font-display font-semibold text-slate-800 dark:text-white text-sm sm:text-base mb-4">Platform Overview</h3>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
                <Users size={14} className="text-amber-500" /> Job Seekers
              </span>
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{totalEmployees} ({employeePct}%)</span>
            </div>
            <div className="w-full h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-700"
                style={{ width: `${employeePct}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
                <Building2 size={14} className="text-emerald-500" /> Employers
              </span>
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{totalEmployers} ({employerPct}%)</span>
            </div>
            <div className="w-full h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                style={{ width: `${employerPct}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
                <Briefcase size={14} className="text-brand-500" /> Active vs Total Jobs
              </span>
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{activeJobs} / {totalJobs}</span>
            </div>
            <div className="w-full h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-500 rounded-full transition-all duration-700"
                style={{ width: `${totalJobs > 0 ? (activeJobs / totalJobs) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card p-4 sm:p-6">
        <h3 className="font-display font-semibold text-slate-800 dark:text-white text-sm sm:text-base mb-4">Recent Activity</h3>
        {users && Array.isArray(users) && users.length > 0 ? (
          <div className="space-y-3">
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Latest User Registrations</p>
            {(Array.isArray(users) ? users : []).slice(0, 5).map((u: any) => (
              <div key={u.id} className="flex items-center gap-3 py-2 border-b border-slate-50 dark:border-slate-800 last:border-0">
                <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center text-brand-600 font-bold text-xs flex-shrink-0">
                  {u.full_name?.[0]?.toUpperCase() || u.email?.[0]?.toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{u.full_name || 'No name'}</p>
                  <p className="text-xs text-slate-400 truncate">{u.email}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className={`badge text-xs ${u.role === 'employer' ? 'badge-green' : u.role === 'superadmin' ? 'badge-amber' : 'badge-blue'}`}>{u.role}</span>
                  {u.created_at && (
                    <p className="text-xs text-slate-400 mt-0.5">{formatDistanceToNow(new Date(u.created_at), { addSuffix: true })}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-400 text-sm text-center py-4">No recent activity data available.</p>
        )}
      </div>

      {/* Quick Links */}
      <div className="card p-4 sm:p-6">
        <h3 className="font-display font-semibold text-slate-800 dark:text-white mb-3">Quick Links</h3>
        <div className="flex gap-3 flex-wrap">
          <Link to="/admin" className="btn-primary">User Management</Link>
          <Link to="/jobs"  className="btn-secondary">All Jobs</Link>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const [showWizard, setShowWizard] = useState(!user?.profile_completed)
  const now = new Date()

  return (
    <div>
      {showWizard && <ProfileCompletionWizard onComplete={() => setShowWizard(false)} />}
      <div className="mb-4 sm:mb-6">
        <h1 className="font-display font-bold text-xl sm:text-2xl text-slate-800 dark:text-white">
          Good {now.getHours() < 12 ? 'morning' : now.getHours() < 17 ? 'afternoon' : 'evening'},{' '}
          <span className="text-brand-600">{user?.full_name?.split(' ')[0]}</span>
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          {format(now, 'EEEE, MMMM d, yyyy')} — Here's what's happening on your account today.
        </p>
      </div>

      {user?.role === 'employee'   && <EmployeeDashboard />}
      {user?.role === 'employer'   && <EmployerDashboard />}
      {user?.role === 'superadmin' && <AdminDashboard />}
    </div>
  )
}

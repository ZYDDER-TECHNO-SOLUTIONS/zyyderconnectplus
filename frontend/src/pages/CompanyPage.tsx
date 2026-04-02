import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Building2, MapPin, Globe, Users, UserPlus, UserCheck, Briefcase,
  Calendar, ExternalLink, Tag
} from 'lucide-react'
import toast from 'react-hot-toast'
import { companyService, followService, jobService } from '../services/api'
import { useAuthStore } from '../store/authStore'

export default function CompanyPage() {
  const { slug } = useParams<{ slug: string }>()
  const currentUser = useAuthStore((s) => s.user)
  const qc = useQueryClient()

  const { data: company, isLoading } = useQuery({
    queryKey: ['company', slug],
    queryFn: () => companyService.get(slug!).then(r => r.data),
    enabled: !!slug,
  })

  const ownerId = company?.owner_id ?? company?.user_id
  const { data: followStatus } = useQuery({
    queryKey: ['follow-status', ownerId],
    queryFn: () => followService.status(ownerId!).then(r => r.data),
    enabled: !!ownerId && currentUser?.role === 'employee',
  })

  const { data: followCount } = useQuery({
    queryKey: ['follow-count', ownerId],
    queryFn: () => followService.count(ownerId!).then(r => r.data),
    enabled: !!ownerId,
  })

  const { data: jobsData } = useQuery({
    queryKey: ['company-jobs', slug],
    queryFn: () => jobService.listJobs({ company_name: company?.name, limit: 10 }).then(r => r.data),
    enabled: !!company?.name,
  })

  const isFollowing = followStatus?.is_following ?? false
  const followersCount = followCount?.followers_count ?? followCount?.followers ?? 0

  const followMut = useMutation({
    mutationFn: () => followService.follow(ownerId!),
    onSuccess: () => {
      toast.success('Now following!')
      qc.invalidateQueries({ queryKey: ['follow-status', ownerId] })
      qc.invalidateQueries({ queryKey: ['follow-count', ownerId] })
    },
    onError: () => toast.error('Failed to follow'),
  })

  const unfollowMut = useMutation({
    mutationFn: () => followService.unfollow(ownerId!),
    onSuccess: () => {
      toast.success('Unfollowed')
      qc.invalidateQueries({ queryKey: ['follow-status', ownerId] })
      qc.invalidateQueries({ queryKey: ['follow-count', ownerId] })
    },
    onError: () => toast.error('Failed to unfollow'),
  })

  const jobs = Array.isArray(jobsData) ? jobsData : jobsData?.items ?? jobsData?.jobs ?? []

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!company) {
    return (
      <div className="text-center py-24">
        <Building2 size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
        <h2 className="font-display font-semibold text-slate-700 dark:text-slate-300 text-lg">Company not found</h2>
        <p className="text-sm text-slate-400 mt-1">This company page may not exist.</p>
      </div>
    )
  }

  const initial = (company.name?.[0] ?? 'C').toUpperCase()
  const specialties = Array.isArray(company.specialties) ? company.specialties : []

  return (
    <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6 animate-fade-in">
      {/* Banner + Logo */}
      <div className="card overflow-hidden">
        {company.banner_url ? (
          <img
            src={company.banner_url}
            alt="Company banner"
            className="h-32 sm:h-44 w-full object-cover"
          />
        ) : (
          <div
            className="h-32 sm:h-44 relative"
            style={{
              background: 'linear-gradient(135deg, #4f46e5, #7c3aed, #6366f1)',
              backgroundSize: '300% 300%',
              animation: 'gradientShift 6s ease infinite',
            }}
          >
            <div className="absolute top-[-20%] right-[10%] w-32 h-32 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute bottom-[-30%] left-[20%] w-24 h-24 rounded-full bg-white/5 blur-xl" />
          </div>
        )}

        <div className="px-4 sm:px-6 pb-5 -mt-10 sm:-mt-12 relative">
          <div className="flex flex-col sm:flex-row items-start gap-4">
            {company.logo_url ? (
              <img
                src={company.logo_url}
                alt={company.name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-4 border-white dark:border-slate-900 shadow-xl flex-shrink-0 bg-white"
              />
            ) : (
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold text-3xl sm:text-4xl shadow-xl border-4 border-white dark:border-slate-900 flex-shrink-0">
                {initial}
              </div>
            )}

            <div className="flex-1 min-w-0 pt-2 sm:pt-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="min-w-0">
                  <h1 className="font-display font-bold text-xl sm:text-2xl text-slate-800 dark:text-white">{company.name}</h1>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-slate-400">
                    {company.industry && (
                      <span className="flex items-center gap-1"><Tag size={12} /> {company.industry}</span>
                    )}
                    {company.company_size && (
                      <span className="flex items-center gap-1"><Users size={12} /> {company.company_size} employees</span>
                    )}
                    {company.location && (
                      <span className="flex items-center gap-1"><MapPin size={12} /> {company.location}</span>
                    )}
                    {company.founded_year && (
                      <span className="flex items-center gap-1"><Calendar size={12} /> Founded {company.founded_year}</span>
                    )}
                  </div>
                </div>

                {/* Follow button for employees */}
                {currentUser?.role === 'employee' && ownerId && (
                  <div className="flex-shrink-0">
                    {isFollowing ? (
                      <button
                        onClick={() => unfollowMut.mutate()}
                        disabled={unfollowMut.isPending}
                        className="btn-secondary text-sm px-4 py-2 text-brand-600 border-brand-200 flex items-center gap-2"
                      >
                        <UserCheck size={16} /> Following
                      </button>
                    ) : (
                      <button
                        onClick={() => followMut.mutate()}
                        disabled={followMut.isPending}
                        className="btn-primary text-sm px-4 py-2 flex items-center gap-2"
                      >
                        <UserPlus size={16} /> Follow
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="flex items-center gap-6 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="text-center">
                  <p className="font-display font-bold text-lg text-slate-800 dark:text-white">{followersCount}</p>
                  <p className="text-xs text-slate-400">Followers</p>
                </div>
                {company.website && (
                  <a
                    href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm text-brand-600 hover:underline"
                  >
                    <Globe size={14} /> Website <ExternalLink size={12} />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* About */}
      {company.description && (
        <div className="card p-4 sm:p-6">
          <h3 className="font-display font-semibold text-slate-800 dark:text-white flex items-center gap-2 mb-3">
            <Building2 size={18} className="text-brand-600" />
            About
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
            {company.description}
          </p>
        </div>
      )}

      {/* Specialties */}
      {specialties.length > 0 && (
        <div className="card p-4 sm:p-6">
          <h3 className="font-display font-semibold text-slate-800 dark:text-white flex items-center gap-2 mb-3">
            <Tag size={18} className="text-brand-600" />
            Specialties
          </h3>
          <div className="flex flex-wrap gap-2">
            {specialties.map((s: string) => (
              <span key={s} className="badge badge-blue">{s}</span>
            ))}
          </div>
        </div>
      )}

      {/* Jobs */}
      <div className="card p-4 sm:p-6">
        <h3 className="font-display font-semibold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
          <Briefcase size={18} className="text-brand-600" />
          Jobs at {company.name}
        </h3>
        {jobs.length === 0 ? (
          <div className="text-center py-8">
            <Briefcase size={32} className="mx-auto text-slate-200 dark:text-slate-700 mb-2" />
            <p className="text-sm text-slate-400">No open positions at this time</p>
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map((job: any) => (
              <a
                key={job.id}
                href={`/jobs/${job.id}`}
                className="block p-3 sm:p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-800 dark:text-white truncate">{job.title}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-400">
                      {job.location && (
                        <span className="flex items-center gap-1"><MapPin size={12} /> {job.location}</span>
                      )}
                      {job.job_type && (
                        <span className="capitalize">{job.job_type.replace('_', ' ')}</span>
                      )}
                    </div>
                  </div>
                  <span className="badge badge-green text-[10px] flex-shrink-0">
                    {job.status === 'active' ? 'Open' : job.status}
                  </span>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

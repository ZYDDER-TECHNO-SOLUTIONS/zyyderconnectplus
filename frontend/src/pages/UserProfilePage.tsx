import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  MapPin, Briefcase, GraduationCap, Heart, Sparkles, Users,
  UserPlus, UserCheck, UserMinus, Calendar, Building2, Mail
} from 'lucide-react'
import toast from 'react-hot-toast'
import { profileService, connectionService, followService } from '../services/api'
import { useAuthStore } from '../store/authStore'

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block text-xs px-3 py-1 rounded-full bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300 font-medium">
      {children}
    </span>
  )
}

function Section({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="card p-4 sm:p-6">
      <h3 className="font-display font-semibold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
        <Icon size={18} className="text-brand-600" />
        {title}
      </h3>
      {children}
    </div>
  )
}

export default function UserProfilePage() {
  const { userId } = useParams<{ userId: string }>()
  const currentUser = useAuthStore((s) => s.user)
  const qc = useQueryClient()

  const { data: profile, isLoading } = useQuery({
    queryKey: ['user-profile', userId],
    queryFn: () => profileService.getPublic(userId!).then(r => r.data),
    enabled: !!userId,
  })

  const { data: connStatus } = useQuery({
    queryKey: ['connection-status', userId],
    queryFn: () => connectionService.status(userId!).then(r => r.data),
    enabled: !!userId && profile?.role === 'employee',
  })

  const { data: followStatus } = useQuery({
    queryKey: ['follow-status', userId],
    queryFn: () => followService.status(userId!).then(r => r.data),
    enabled: !!userId && profile?.role === 'employer',
  })

  const { data: followCount } = useQuery({
    queryKey: ['follow-count', userId],
    queryFn: () => followService.count(userId!).then(r => r.data),
    enabled: !!userId,
  })

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ['connection-status', userId] })
    qc.invalidateQueries({ queryKey: ['follow-status', userId] })
    qc.invalidateQueries({ queryKey: ['follow-count', userId] })
    qc.invalidateQueries({ queryKey: ['user-profile', userId] })
  }

  const connectMut = useMutation({
    mutationFn: () => connectionService.sendRequest(userId!),
    onSuccess: () => { toast.success('Connection request sent!'); invalidateAll() },
    onError: () => toast.error('Failed to send request'),
  })

  const removeConnMut = useMutation({
    mutationFn: () => connectionService.remove(connStatus?.connection_id ?? connStatus?.id),
    onSuccess: () => { toast.success('Connection removed'); invalidateAll() },
    onError: () => toast.error('Failed to remove connection'),
  })

  const followMut = useMutation({
    mutationFn: () => followService.follow(userId!),
    onSuccess: () => { toast.success('Now following!'); invalidateAll() },
    onError: () => toast.error('Failed to follow'),
  })

  const unfollowMut = useMutation({
    mutationFn: () => followService.unfollow(userId!),
    onSuccess: () => { toast.success('Unfollowed'); invalidateAll() },
    onError: () => toast.error('Failed to unfollow'),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center py-24">
        <Users size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
        <h2 className="font-display font-semibold text-slate-700 dark:text-slate-300 text-lg">Profile not found</h2>
        <p className="text-sm text-slate-400 mt-1">This user may not exist or their profile is private.</p>
      </div>
    )
  }

  const name = profile.full_name ?? 'Unknown User'
  const initial = name[0]?.toUpperCase() ?? 'U'
  const isOwnProfile = currentUser?.id === userId
  const connectionStatusText = connStatus?.status ?? 'none'
  const isFollowing = followStatus?.is_following ?? false
  const connectionsCount = connStatus?.connections_count ?? profile.connections_count ?? 0
  const followersCount = followCount?.followers_count ?? followCount?.followers ?? 0
  const followingCount = followCount?.following_count ?? followCount?.following ?? 0

  const currentExp = profile.current_experience
  const pastExp = Array.isArray(profile.past_experience) ? profile.past_experience : []
  const education = Array.isArray(profile.education) ? profile.education : []
  const skills = Array.isArray(profile.skills) ? profile.skills : []
  const hobbies = Array.isArray(profile.hobbies) ? profile.hobbies : []

  return (
    <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6">
      {/* Header Banner */}
      <div className="card overflow-hidden">
        <div className="h-28 sm:h-36 relative">
          {profile.banner_url ? (
            <img
              src={profile.banner_url}
              alt="Profile banner"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-brand-600 via-purple-600 to-brand-700" />
          )}
          <div className="absolute -bottom-10 left-4 sm:left-6">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-4 border-white dark:border-slate-900 shadow-lg"
              />
            ) : (
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-white font-bold text-3xl sm:text-4xl border-4 border-white dark:border-slate-900 shadow-lg">
                {initial}
              </div>
            )}
          </div>
        </div>
        <div className="pt-12 sm:pt-14 px-4 sm:px-6 pb-4 sm:pb-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <h1 className="font-display font-bold text-xl sm:text-2xl text-slate-800 dark:text-white">{name}</h1>
              {profile.headline && (
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">{profile.headline}</p>
              )}
              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-400 dark:text-slate-500">
                {profile.location && (
                  <span className="flex items-center gap-1"><MapPin size={13} /> {profile.location}</span>
                )}
                {profile.email && (
                  <span className="flex items-center gap-1"><Mail size={13} /> {profile.email}</span>
                )}
                {profile.role && (
                  <span className="flex items-center gap-1 capitalize"><Briefcase size={13} /> {profile.role}</span>
                )}
              </div>
            </div>

            {/* Action buttons */}
            {!isOwnProfile && (
              <div className="flex items-center gap-2 flex-shrink-0">
                {profile.role === 'employee' && (
                  <>
                    {connectionStatusText === 'none' && (
                      <button
                        onClick={() => connectMut.mutate()}
                        disabled={connectMut.isPending}
                        className="btn-primary text-sm px-4 py-2 flex items-center gap-2"
                      >
                        <UserPlus size={16} /> Connect
                      </button>
                    )}
                    {connectionStatusText === 'pending' && (
                      <span className="text-sm px-4 py-2 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 font-medium flex items-center gap-2">
                        <UserPlus size={16} /> Pending...
                      </span>
                    )}
                    {connectionStatusText === 'connected' && (
                      <button
                        onClick={() => removeConnMut.mutate()}
                        disabled={removeConnMut.isPending}
                        className="btn-secondary text-sm px-4 py-2 text-emerald-600 border-emerald-200 flex items-center gap-2"
                      >
                        <UserCheck size={16} /> Connected
                      </button>
                    )}
                  </>
                )}
                {profile.role === 'employer' && (
                  <>
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
                  </>
                )}
              </div>
            )}
          </div>

          {/* Stats Row */}
          <div className="flex items-center gap-6 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="text-center">
              <p className="font-display font-bold text-lg text-slate-800 dark:text-white">{connectionsCount}</p>
              <p className="text-xs text-slate-400">Connections</p>
            </div>
            <div className="text-center">
              <p className="font-display font-bold text-lg text-slate-800 dark:text-white">{followersCount}</p>
              <p className="text-xs text-slate-400">Followers</p>
            </div>
            <div className="text-center">
              <p className="font-display font-bold text-lg text-slate-800 dark:text-white">{followingCount}</p>
              <p className="text-xs text-slate-400">Following</p>
            </div>
          </div>
        </div>
      </div>

      {/* About */}
      {profile.bio && (
        <Section title="About" icon={Users}>
          <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{profile.bio}</p>
        </Section>
      )}

      {/* Current Experience */}
      {currentExp && (currentExp.title || currentExp.company) && (
        <Section title="Current Experience" icon={Briefcase}>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center flex-shrink-0">
              <Building2 size={18} className="text-brand-600" />
            </div>
            <div>
              <p className="font-medium text-slate-800 dark:text-white">{currentExp.title}</p>
              {currentExp.company && (
                <p className="text-sm text-slate-500 dark:text-slate-400">{currentExp.company}</p>
              )}
              <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-400">
                {currentExp.location && (
                  <span className="flex items-center gap-1"><MapPin size={12} /> {currentExp.location}</span>
                )}
                {currentExp.start_date && (
                  <span className="flex items-center gap-1"><Calendar size={12} /> {currentExp.start_date} - Present</span>
                )}
              </div>
            </div>
          </div>
        </Section>
      )}

      {/* Past Experience */}
      {pastExp.length > 0 && (
        <Section title="Past Experience" icon={Briefcase}>
          <div className="space-y-4">
            {pastExp.map((exp: any, i: number) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                  <Building2 size={18} className="text-slate-400" />
                </div>
                <div>
                  <p className="font-medium text-slate-800 dark:text-white">{exp.title}</p>
                  {exp.company && (
                    <p className="text-sm text-slate-500 dark:text-slate-400">{exp.company}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-400">
                    {exp.start_date && (
                      <span className="flex items-center gap-1">
                        <Calendar size={12} /> {exp.start_date}{exp.end_date ? ` - ${exp.end_date}` : ''}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Education */}
      {education.length > 0 && (
        <Section title="Education" icon={GraduationCap}>
          <div className="space-y-4">
            {education.map((edu: any, i: number) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                  <GraduationCap size={18} className="text-emerald-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-800 dark:text-white">{edu.degree}</p>
                  {edu.institution && (
                    <p className="text-sm text-slate-500 dark:text-slate-400">{edu.institution}</p>
                  )}
                  {edu.field && (
                    <p className="text-xs text-slate-400">{edu.field}</p>
                  )}
                  {(edu.start_year || edu.end_year) && (
                    <p className="text-xs text-slate-400 mt-1">
                      {edu.start_year}{edu.end_year ? ` - ${edu.end_year}` : ''}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <Section title="Skills" icon={Sparkles}>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill: string, i: number) => (
              <Badge key={i}>{skill}</Badge>
            ))}
          </div>
        </Section>
      )}

      {/* Hobbies */}
      {hobbies.length > 0 && (
        <Section title="Hobbies & Interests" icon={Heart}>
          <div className="flex flex-wrap gap-2">
            {hobbies.map((hobby: string, i: number) => (
              <Badge key={i}>{hobby}</Badge>
            ))}
          </div>
        </Section>
      )}
    </div>
  )
}

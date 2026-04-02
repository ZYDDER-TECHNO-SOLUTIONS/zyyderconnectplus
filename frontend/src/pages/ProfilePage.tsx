import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  User, Mail, Phone, Building2, Save, Lock, MapPin, Globe, Linkedin,
  Github, Bell, Shield, AlertTriangle, Trash2, Calendar, ExternalLink, Camera, Image
} from 'lucide-react'
import { authService, photoService } from '../services/api'
import { useAuthStore } from '../store/authStore'
import { formatDistanceToNow } from 'date-fns'

function ToggleSwitch({ enabled, onChange, label, description }: {
  enabled: boolean; onChange: (v: boolean) => void; label: string; description?: string
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</p>
        {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!enabled)}
        className={`relative w-11 h-6 rounded-full transition-all duration-300 ${enabled ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-600'}`}
      >
        <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-300 ${enabled ? 'left-[22px]' : 'left-0.5'}`} />
      </button>
    </div>
  )
}

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore()
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)

  const avatarMutation = useMutation({
    mutationFn: (form: FormData) => photoService.uploadAvatar(form),
    onSuccess: (res) => {
      const url = res.data?.avatar_url ?? res.data?.url
      if (url) {
        updateUser({ avatar_url: url })
        setAvatarPreview(url)
      }
      toast.success('Avatar updated!')
    },
    onError: () => toast.error('Failed to upload avatar'),
  })

  const bannerMutation = useMutation({
    mutationFn: (form: FormData) => photoService.uploadBanner(form),
    onSuccess: (res) => {
      const url = res.data?.banner_url ?? res.data?.url
      if (url) {
        updateUser({ banner_url: url })
        setBannerPreview(url)
      }
      toast.success('Banner updated!')
    },
    onError: () => toast.error('Failed to upload banner'),
  })

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const form = new FormData()
    form.append('file', file)
    avatarMutation.mutate(form)
    // Show local preview
    const reader = new FileReader()
    reader.onload = () => setAvatarPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const form = new FormData()
    form.append('file', file)
    bannerMutation.mutate(form)
    const reader = new FileReader()
    reader.onload = () => setBannerPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  // Notification preferences (UI-only state)
  const [notifPrefs, setNotifPrefs] = useState({
    emailNotifications: true,
    applicationUpdates: true,
    newJobMatches: true,
    marketingEmails: false,
  })

  const { register, handleSubmit } = useForm({
    defaultValues: {
      full_name: user?.full_name ?? '',
      phone: user?.phone ?? '',
      company_name: user?.company_name ?? '',
      headline: '',
      location: '',
      linkedin_url: '',
      github_url: '',
      portfolio_url: '',
    },
  })

  const { register: regPw, handleSubmit: handlePw, reset: resetPw } = useForm<{ current_password: string; new_password: string }>()

  const updateMutation = useMutation({
    mutationFn: (d: any) => authService.updateMe(d),
    onSuccess: (res) => { updateUser(res.data); toast.success('Profile updated') },
    onError: () => toast.error('Update failed'),
  })

  const pwMutation = useMutation({
    mutationFn: (d: any) => authService.changePassword(d),
    onSuccess: () => { toast.success('Password changed!'); resetPw() },
    onError: (err: any) => toast.error(err?.response?.data?.detail || 'Failed'),
  })

  const memberSince = user?.created_at
    ? formatDistanceToNow(new Date(user.created_at), { addSuffix: true })
    : 'N/A'

  return (
    <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6 animate-fade-in">
      {/* Profile Header Banner */}
      <div className="card overflow-hidden">
        <div
          className="h-28 sm:h-36 relative group cursor-pointer"
          onClick={() => bannerInputRef.current?.click()}
        >
          {(bannerPreview || user?.banner_url) ? (
            <img
              src={bannerPreview || user?.banner_url}
              alt="Profile banner"
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className="w-full h-full"
              style={{
                background: 'linear-gradient(135deg, #4f46e5, #6366f1, #818cf8, #a78bfa)',
                backgroundSize: '300% 300%',
                animation: 'gradientShift 6s ease infinite',
              }}
            >
              <div className="absolute top-[-20%] right-[10%] w-32 h-32 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute bottom-[-30%] left-[20%] w-24 h-24 rounded-full bg-white/5 blur-xl" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
            <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-sm font-medium flex items-center gap-2 bg-black/50 px-4 py-2 rounded-xl">
              <Image size={16} /> Change Cover
            </span>
          </div>
          <input
            ref={bannerInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleBannerChange}
          />
        </div>
        <div className="px-4 sm:px-6 pb-5 -mt-10 sm:-mt-12 relative">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4">
            <div
              className="relative w-20 h-20 sm:w-24 sm:h-24 group cursor-pointer flex-shrink-0"
              onClick={() => avatarInputRef.current?.click()}
            >
              {(avatarPreview || user?.avatar_url) ? (
                <img
                  src={avatarPreview || user?.avatar_url}
                  alt={user?.full_name}
                  className="w-full h-full rounded-2xl object-cover shadow-xl border-4 border-white dark:border-slate-900"
                />
              ) : (
                <div className="w-full h-full rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold text-3xl sm:text-4xl shadow-xl border-4 border-white dark:border-slate-900">
                  {user?.full_name?.[0]?.toUpperCase()}
                </div>
              )}
              <div className="absolute inset-0 rounded-2xl bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center border-4 border-transparent">
                <Camera size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
            <div className="text-center sm:text-left pb-1 flex-1 min-w-0">
              <h1 className="font-display font-bold text-xl sm:text-2xl text-slate-800 dark:text-white">{user?.full_name}</h1>
              <p className="text-slate-500 text-sm">{user?.email}</p>
              <div className="flex items-center gap-2 mt-2 justify-center sm:justify-start flex-wrap">
                <span className="badge badge-blue capitalize">{user?.role}</span>
                {user?.is_verified && <span className="badge badge-green">Verified</span>}
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Calendar size={11} /> Joined {memberSince}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Personal Info + Bio + Location */}
      <div className="card p-4 sm:p-6 transition-all duration-300 hover:shadow-card-hover">
        <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2"><User size={16}/>Personal Info</h3>
        <form onSubmit={handleSubmit(d => updateMutation.mutate(d))} className="space-y-4">
          <div>
            <label className="label">Full Name</label>
            <div className="relative">
              <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input {...register('full_name')} className="input pl-9" />
            </div>
          </div>

          <div>
            <label className="label">Professional Headline</label>
            <input
              {...register('headline')}
              className="input"
              placeholder="e.g. Senior React Developer | Open to opportunities"
            />
            <p className="text-xs text-slate-400 mt-1">A one-line summary that appears below your name</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Phone</label>
              <div className="relative">
                <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input {...register('phone')} className="input pl-9" placeholder="+1 555 000 0000" />
              </div>
            </div>
            <div>
              <label className="label">Location</label>
              <div className="relative">
                <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input {...register('location')} className="input pl-9" placeholder="San Francisco, CA" />
              </div>
            </div>
          </div>

          {user?.role === 'employer' && (
            <div>
              <label className="label">Company Name</label>
              <div className="relative">
                <Building2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input {...register('company_name')} className="input pl-9" />
              </div>
            </div>
          )}

          <div className="pt-2">
            <button type="submit" disabled={updateMutation.isPending} className="btn-primary w-full sm:w-auto justify-center">
              <Save size={15}/>{updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Links */}
      <div className="card p-4 sm:p-6 transition-all duration-300 hover:shadow-card-hover">
        <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2"><Globe size={16}/>Online Presence</h3>
        <div className="space-y-4">
          <div>
            <label className="label">LinkedIn URL</label>
            <div className="relative">
              <Linkedin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input {...register('linkedin_url')} className="input pl-9" placeholder="https://linkedin.com/in/yourname" />
            </div>
          </div>
          <div>
            <label className="label">GitHub URL</label>
            <div className="relative">
              <Github size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input {...register('github_url')} className="input pl-9" placeholder="https://github.com/yourname" />
            </div>
          </div>
          <div>
            <label className="label">Portfolio URL</label>
            <div className="relative">
              <ExternalLink size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input {...register('portfolio_url')} className="input pl-9" placeholder="https://yourportfolio.com" />
            </div>
          </div>
        </div>
      </div>

      {/* Email (read only) */}
      <div className="card p-4 sm:p-6 transition-all duration-300 hover:shadow-card-hover">
        <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2"><Mail size={16}/>Account</h3>
        <div>
          <label className="label">Email</label>
          <div className="relative">
            <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={user?.email} readOnly className="input pl-9 bg-slate-50 cursor-not-allowed text-slate-400 dark:bg-slate-800" />
          </div>
          <p className="text-xs text-slate-400 mt-1">Email cannot be changed</p>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="card p-4 sm:p-6 transition-all duration-300 hover:shadow-card-hover">
        <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-2"><Bell size={16}/>Notification Preferences</h3>
        <p className="text-xs text-slate-400 mb-3">Choose what updates you want to receive</p>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          <ToggleSwitch
            enabled={notifPrefs.emailNotifications}
            onChange={(v) => { setNotifPrefs(p => ({ ...p, emailNotifications: v })); toast.success(v ? 'Email notifications enabled' : 'Email notifications disabled') }}
            label="Email Notifications"
            description="Receive important updates via email"
          />
          <ToggleSwitch
            enabled={notifPrefs.applicationUpdates}
            onChange={(v) => { setNotifPrefs(p => ({ ...p, applicationUpdates: v })); toast.success('Preference saved') }}
            label="Application Updates"
            description="Get notified when your application status changes"
          />
          <ToggleSwitch
            enabled={notifPrefs.newJobMatches}
            onChange={(v) => { setNotifPrefs(p => ({ ...p, newJobMatches: v })); toast.success('Preference saved') }}
            label="New Job Matches"
            description="AI-matched job recommendations based on your profile"
          />
          <ToggleSwitch
            enabled={notifPrefs.marketingEmails}
            onChange={(v) => { setNotifPrefs(p => ({ ...p, marketingEmails: v })); toast.success('Preference saved') }}
            label="Marketing Emails"
            description="Tips, product updates, and career advice"
          />
        </div>
      </div>

      {/* Change password */}
      <div className="card p-4 sm:p-6 transition-all duration-300 hover:shadow-card-hover">
        <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2"><Lock size={16}/>Change Password</h3>
        <form onSubmit={handlePw(d => pwMutation.mutate(d))} className="space-y-4">
          <div>
            <label className="label">Current Password</label>
            <input {...regPw('current_password', { required: true })} type="password" className="input" placeholder="••••••••" />
          </div>
          <div>
            <label className="label">New Password</label>
            <input {...regPw('new_password', { required: true, minLength: { value: 8, message: 'Min 8 chars' } })} type="password" className="input" placeholder="••••••••" />
          </div>
          <button type="submit" disabled={pwMutation.isPending} className="btn-primary w-full sm:w-auto justify-center">
            <Lock size={15}/>{pwMutation.isPending ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* Danger Zone */}
      <div className="card p-4 sm:p-6 border-red-200 dark:border-red-900/50 transition-all duration-300">
        <h3 className="font-semibold text-red-600 dark:text-red-400 mb-2 flex items-center gap-2">
          <AlertTriangle size={16}/>Danger Zone
        </h3>
        <p className="text-xs text-slate-500 mb-4">Irreversible and destructive actions</p>
        <button
          onClick={() => toast.error('Contact admin to delete your account', { icon: '\u{1F6AB}', duration: 4000 })}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-50 text-red-600 font-medium text-sm border border-red-200 hover:bg-red-100 active:scale-[.98] transition-all duration-150 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/30"
        >
          <Trash2 size={15} /> Delete Account
        </button>
      </div>
    </div>
  )
}

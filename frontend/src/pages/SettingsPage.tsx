import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  Settings, User, Lock, Bell, Shield, Eye, Globe, Trash2, AlertTriangle,
  Save, Moon, Sun, Monitor, ChevronRight, LogOut, Smartphone, Mail,
  MapPin, Phone, Building2, Linkedin, Github, ExternalLink, Camera, Image,
  Calendar, Check, X, Download, FileText, ToggleLeft
} from 'lucide-react'
import { authService, photoService } from '../services/api'
import { useAuthStore } from '../store/authStore'
import { formatDistanceToNow } from 'date-fns'

// ─── Toggle Switch ───────────────────────────────────────────────────────
function Toggle({ enabled, onChange, label, description }: {
  enabled: boolean; onChange: (v: boolean) => void; label: string; description?: string
}) {
  return (
    <div className="flex items-center justify-between py-3.5 group">
      <div className="pr-4">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</p>
        {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!enabled)}
        className={`relative w-11 h-6 rounded-full transition-all duration-300 flex-shrink-0 ${enabled ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-600'}`}
      >
        <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-300 ${enabled ? 'left-[22px]' : 'left-0.5'}`} />
      </button>
    </div>
  )
}

// ─── Section Header ──────────────────────────────────────────────────────
function SectionTitle({ icon: Icon, title, description }: { icon: any; title: string; description?: string }) {
  return (
    <div className="mb-5">
      <h3 className="font-display font-semibold text-slate-800 dark:text-white flex items-center gap-2 text-base">
        <Icon size={18} className="text-brand-500" />{title}
      </h3>
      {description && <p className="text-xs text-slate-400 mt-1 ml-7">{description}</p>}
    </div>
  )
}

// ─── Tabs ────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'privacy', label: 'Privacy', icon: Eye },
  { id: 'appearance', label: 'Appearance', icon: Moon },
  { id: 'data', label: 'Data & Export', icon: Download },
  { id: 'deactivation', label: 'Deactivation', icon: Trash2 },
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general')
  const { user, updateUser, logout } = useAuthStore()

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="font-display font-bold text-2xl text-slate-800 dark:text-white flex items-center gap-2">
          <Settings size={24} className="text-brand-500" /> Settings
        </h1>
        <p className="text-sm text-slate-500 mt-1">Manage your account preferences and settings</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 md:gap-6">
        {/* Sidebar Tabs */}
        <div className="md:w-56 flex-shrink-0">
          <nav className="card p-2 flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap w-full text-left ${
                  activeTab === tab.id
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-300'
                }`}
              >
                <tab.icon size={16} />
                <span className="hidden md:inline">{tab.label}</span>
                <span className="md:hidden text-xs">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {activeTab === 'general' && <GeneralSettings />}
          {activeTab === 'profile' && <ProfileSettings />}
          {activeTab === 'security' && <SecuritySettings />}
          {activeTab === 'notifications' && <NotificationSettings />}
          {activeTab === 'privacy' && <PrivacySettings />}
          {activeTab === 'appearance' && <AppearanceSettings />}
          {activeTab === 'data' && <DataSettings />}
          {activeTab === 'deactivation' && <DeactivationSettings />}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// GENERAL SETTINGS
// ═══════════════════════════════════════════════════════════════════════════
function GeneralSettings() {
  const { user, updateUser } = useAuthStore()
  const { register, handleSubmit } = useForm({
    defaultValues: {
      full_name: user?.full_name ?? '',
      phone: user?.phone ?? '',
      company_name: user?.company_name ?? '',
      headline: user?.headline ?? '',
      location: user?.location ?? '',
    },
  })
  const updateMutation = useMutation({
    mutationFn: (d: any) => authService.updateMe(d),
    onSuccess: (res) => { updateUser(res.data); toast.success('Settings saved') },
    onError: () => toast.error('Update failed'),
  })

  const memberSince = user?.created_at
    ? formatDistanceToNow(new Date(user.created_at), { addSuffix: true })
    : ''

  return (
    <div className="space-y-4">
      <div className="card p-5 sm:p-6">
        <SectionTitle icon={User} title="Basic Information" description="Your core account details" />
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
            <input {...register('headline')} className="input" placeholder="e.g. Senior React Developer | Open to opportunities" />
            <p className="text-xs text-slate-400 mt-1">Shown below your name on your profile</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Phone</label>
              <div className="relative">
                <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input {...register('phone')} className="input pl-9" placeholder="+91 98765 43210" />
              </div>
            </div>
            <div>
              <label className="label">Location</label>
              <div className="relative">
                <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input {...register('location')} className="input pl-9" placeholder="Mumbai, India" />
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
          <button type="submit" disabled={updateMutation.isPending} className="btn-primary">
            <Save size={15} /> {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Account Info (read-only) */}
      <div className="card p-5 sm:p-6">
        <SectionTitle icon={Mail} title="Account Information" />
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-slate-800">
            <div>
              <p className="text-sm text-slate-500">Email</p>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{user?.email}</p>
            </div>
            <span className="badge badge-gray text-xs">Cannot change</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-slate-800">
            <div>
              <p className="text-sm text-slate-500">Role</p>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200 capitalize">{user?.role}</p>
            </div>
            <span className={`badge ${user?.role === 'employer' ? 'badge-green' : user?.role === 'superadmin' ? 'badge-red' : 'badge-blue'}`}>{user?.role}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-slate-800">
            <div>
              <p className="text-sm text-slate-500">Member Since</p>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{memberSince}</p>
            </div>
            <Calendar size={16} className="text-slate-400" />
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm text-slate-500">Account Status</p>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200 capitalize">{user?.status}</p>
            </div>
            <span className="badge badge-green">{user?.status}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// PROFILE SETTINGS (Photo, Banner, Links)
// ═══════════════════════════════════════════════════════════════════════════
function ProfileSettings() {
  const { user, updateUser } = useAuthStore()
  const avatarRef = useRef<HTMLInputElement>(null)
  const bannerRef = useRef<HTMLInputElement>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)

  const { register, handleSubmit } = useForm({
    defaultValues: {
      linkedin_url: user?.linkedin_url ?? '',
      github_url: user?.github_url ?? '',
      portfolio_url: user?.portfolio_url ?? '',
      bio: user?.bio ?? '',
    },
  })

  const avatarMutation = useMutation({
    mutationFn: (form: FormData) => photoService.uploadAvatar(form),
    onSuccess: (res) => {
      const url = res.data?.avatar_url ?? res.data?.url
      if (url) { updateUser({ avatar_url: url }); setAvatarPreview(url) }
      toast.success('Photo updated!')
    },
    onError: () => toast.error('Failed to upload photo'),
  })

  const bannerMutation = useMutation({
    mutationFn: (form: FormData) => photoService.uploadBanner(form),
    onSuccess: (res) => {
      const url = res.data?.banner_url ?? res.data?.url
      if (url) { updateUser({ banner_url: url }); setBannerPreview(url) }
      toast.success('Banner updated!')
    },
    onError: () => toast.error('Failed to upload banner'),
  })

  const updateMutation = useMutation({
    mutationFn: (d: any) => authService.updateMe(d),
    onSuccess: (res) => { updateUser(res.data); toast.success('Profile links saved') },
    onError: () => toast.error('Update failed'),
  })

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
    const file = e.target.files?.[0]
    if (!file) return
    const form = new FormData()
    form.append('file', file)
    if (type === 'avatar') avatarMutation.mutate(form)
    else bannerMutation.mutate(form)
    const reader = new FileReader()
    reader.onload = () => {
      if (type === 'avatar') setAvatarPreview(reader.result as string)
      else setBannerPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-4">
      {/* Photo & Banner */}
      <div className="card p-5 sm:p-6">
        <SectionTitle icon={Camera} title="Profile Photo & Banner" description="Personalize your profile appearance" />

        {/* Banner */}
        <div className="mb-6">
          <label className="label mb-2">Cover Banner</label>
          <div
            className="h-32 rounded-xl overflow-hidden relative group cursor-pointer border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-brand-300 transition-colors"
            onClick={() => bannerRef.current?.click()}
          >
            {(bannerPreview || user?.banner_url) ? (
              <img src={bannerPreview || user?.banner_url} alt="Banner" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-brand-100 to-brand-200 dark:from-brand-900/30 dark:to-brand-800/30 flex items-center justify-center">
                <Image size={32} className="text-brand-300" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
              <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-sm font-medium bg-black/50 px-4 py-2 rounded-xl flex items-center gap-2">
                <Image size={14} /> {bannerMutation.isPending ? 'Uploading...' : 'Change Banner'}
              </span>
            </div>
            <input ref={bannerRef} type="file" accept="image/*" className="hidden" onChange={e => handleFileUpload(e, 'banner')} />
          </div>
          <p className="text-xs text-slate-400 mt-1">Recommended: 1200x300px, max 3MB</p>
        </div>

        {/* Avatar */}
        <div>
          <label className="label mb-2">Profile Photo</label>
          <div className="flex items-center gap-4">
            <div
              className="w-20 h-20 rounded-2xl relative group cursor-pointer flex-shrink-0 overflow-hidden"
              onClick={() => avatarRef.current?.click()}
            >
              {(avatarPreview || user?.avatar_url) ? (
                <img src={avatarPreview || user?.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold text-2xl">
                  {user?.full_name?.[0]?.toUpperCase()}
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                <Camera size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={e => handleFileUpload(e, 'avatar')} />
            </div>
            <div>
              <p className="text-sm text-slate-700 dark:text-slate-200 font-medium">Profile Photo</p>
              <p className="text-xs text-slate-400">JPG, PNG or GIF. Max 2MB</p>
              <button
                type="button"
                onClick={() => avatarRef.current?.click()}
                className="btn-secondary text-xs mt-2 py-1.5 px-3"
              >
                {avatarMutation.isPending ? 'Uploading...' : 'Upload Photo'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bio & Links */}
      <div className="card p-5 sm:p-6">
        <SectionTitle icon={Globe} title="Bio & Online Presence" description="Share your story and online profiles" />
        <form onSubmit={handleSubmit(d => updateMutation.mutate(d))} className="space-y-4">
          <div>
            <label className="label">Bio</label>
            <textarea {...register('bio')} className="input h-24 resize-none" placeholder="Tell us about yourself..." />
          </div>
          <div>
            <label className="label">LinkedIn</label>
            <div className="relative">
              <Linkedin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input {...register('linkedin_url')} className="input pl-9" placeholder="https://linkedin.com/in/yourname" />
            </div>
          </div>
          <div>
            <label className="label">GitHub</label>
            <div className="relative">
              <Github size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input {...register('github_url')} className="input pl-9" placeholder="https://github.com/yourname" />
            </div>
          </div>
          <div>
            <label className="label">Portfolio</label>
            <div className="relative">
              <ExternalLink size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input {...register('portfolio_url')} className="input pl-9" placeholder="https://yourportfolio.com" />
            </div>
          </div>
          <button type="submit" disabled={updateMutation.isPending} className="btn-primary">
            <Save size={15} /> {updateMutation.isPending ? 'Saving...' : 'Save Links'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// SECURITY SETTINGS
// ═══════════════════════════════════════════════════════════════════════════
function SecuritySettings() {
  const { user, logout } = useAuthStore()
  const { register, handleSubmit, reset, watch } = useForm<{ current_password: string; new_password: string }>()
  const newPw = watch('new_password', '')

  const rules = [
    { label: '8+ characters', met: newPw.length >= 8 },
    { label: 'Uppercase', met: /[A-Z]/.test(newPw) },
    { label: 'Lowercase', met: /[a-z]/.test(newPw) },
    { label: 'Number', met: /[0-9]/.test(newPw) },
    { label: 'Special char', met: /[!@#$%^&*(),.?":{}|<>]/.test(newPw) },
  ]

  const pwMutation = useMutation({
    mutationFn: (d: any) => authService.changePassword(d),
    onSuccess: () => { toast.success('Password changed!'); reset() },
    onError: (err: any) => toast.error(err?.response?.data?.detail || 'Failed'),
  })

  return (
    <div className="space-y-4">
      {/* Change Password */}
      <div className="card p-5 sm:p-6">
        <SectionTitle icon={Lock} title="Change Password" description="Update your password regularly for security" />
        <form onSubmit={handleSubmit(d => pwMutation.mutate(d))} className="space-y-4">
          <div>
            <label className="label">Current Password</label>
            <input {...register('current_password', { required: true })} type="password" className="input" placeholder="Enter current password" />
          </div>
          <div>
            <label className="label">New Password</label>
            <input {...register('new_password', { required: true })} type="password" className="input" placeholder="Enter new password" />
            {newPw && (
              <div className="mt-2 grid grid-cols-3 sm:grid-cols-5 gap-1">
                {rules.map(r => (
                  <span key={r.label} className={`text-xs flex items-center gap-1 ${r.met ? 'text-emerald-500' : 'text-slate-300'}`}>
                    {r.met ? <Check size={10} /> : <X size={10} />} {r.label}
                  </span>
                ))}
              </div>
            )}
          </div>
          <button type="submit" disabled={pwMutation.isPending} className="btn-primary">
            <Lock size={15} /> {pwMutation.isPending ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* Active Sessions */}
      <div className="card p-5 sm:p-6">
        <SectionTitle icon={Smartphone} title="Active Sessions" description="Manage your logged-in devices" />
        <div className="space-y-3">
          <div className="flex items-center justify-between py-3 border-b border-slate-50 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
                <Monitor size={18} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">This device</p>
                <p className="text-xs text-slate-400">Current session</p>
              </div>
            </div>
            <span className="badge badge-green text-xs">Active</span>
          </div>
        </div>
        <button
          onClick={() => { logout(); toast.success('Signed out from all devices') }}
          className="btn-secondary text-sm mt-4"
        >
          <LogOut size={14} /> Sign Out All Devices
        </button>
      </div>

      {/* Two-Factor Auth */}
      <div className="card p-5 sm:p-6">
        <SectionTitle icon={Shield} title="Two-Factor Authentication" description="Add an extra layer of security" />
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-700 dark:text-slate-200 font-medium">2FA Status</p>
            <p className="text-xs text-slate-400">Not enabled</p>
          </div>
          <button onClick={() => toast('Coming soon!', { icon: '\u{1F512}' })} className="btn-secondary text-sm">
            Enable 2FA
          </button>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// NOTIFICATION SETTINGS
// ═══════════════════════════════════════════════════════════════════════════
function NotificationSettings() {
  const [prefs, setPrefs] = useState({
    emailNotifications: true,
    applicationUpdates: true,
    newJobMatches: true,
    connectionRequests: true,
    profileViews: false,
    marketingEmails: false,
    weeklyDigest: true,
    smsAlerts: false,
  })

  const toggle = (key: string) => {
    setPrefs(p => ({ ...p, [key]: !p[key as keyof typeof p] }))
    toast.success('Preference saved')
  }

  return (
    <div className="space-y-4">
      <div className="card p-5 sm:p-6">
        <SectionTitle icon={Mail} title="Email Notifications" description="Control what emails you receive" />
        <div className="divide-y divide-slate-50 dark:divide-slate-800">
          <Toggle enabled={prefs.emailNotifications} onChange={() => toggle('emailNotifications')} label="Email Notifications" description="Master switch for all email notifications" />
          <Toggle enabled={prefs.applicationUpdates} onChange={() => toggle('applicationUpdates')} label="Application Updates" description="When your application status changes" />
          <Toggle enabled={prefs.newJobMatches} onChange={() => toggle('newJobMatches')} label="Job Recommendations" description="AI-matched jobs based on your profile" />
          <Toggle enabled={prefs.connectionRequests} onChange={() => toggle('connectionRequests')} label="Connection Requests" description="When someone wants to connect with you" />
          <Toggle enabled={prefs.profileViews} onChange={() => toggle('profileViews')} label="Profile Views" description="When someone views your profile" />
          <Toggle enabled={prefs.weeklyDigest} onChange={() => toggle('weeklyDigest')} label="Weekly Digest" description="A weekly summary of activity and opportunities" />
          <Toggle enabled={prefs.marketingEmails} onChange={() => toggle('marketingEmails')} label="Marketing & Tips" description="Product updates, career advice, and tips" />
        </div>
      </div>

      <div className="card p-5 sm:p-6">
        <SectionTitle icon={Smartphone} title="Push & SMS Notifications" />
        <div className="divide-y divide-slate-50 dark:divide-slate-800">
          <Toggle enabled={prefs.smsAlerts} onChange={() => toggle('smsAlerts')} label="SMS Alerts" description="Critical notifications via SMS (interview invites, offers)" />
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// PRIVACY SETTINGS
// ═══════════════════════════════════════════════════════════════════════════
function PrivacySettings() {
  const [privacy, setPrivacy] = useState({
    profileVisibility: 'public',
    showEmail: false,
    showPhone: false,
    showLocation: true,
    allowConnectionRequests: true,
    showActivityStatus: true,
    showProfileInSearch: true,
  })

  return (
    <div className="space-y-4">
      <div className="card p-5 sm:p-6">
        <SectionTitle icon={Eye} title="Profile Visibility" description="Control who can see your information" />

        <div className="mb-5">
          <label className="label mb-2">Who can see your profile?</label>
          <div className="grid grid-cols-3 gap-2">
            {['public', 'connections', 'private'].map(opt => (
              <button
                key={opt}
                onClick={() => { setPrivacy(p => ({ ...p, profileVisibility: opt })); toast.success(`Profile set to ${opt}`) }}
                className={`py-2.5 px-3 rounded-xl text-sm font-medium border transition-all capitalize ${
                  privacy.profileVisibility === opt
                    ? 'bg-brand-50 border-brand-300 text-brand-700 dark:bg-brand-900/30 dark:border-brand-600'
                    : 'border-slate-200 text-slate-500 hover:border-slate-300 dark:border-slate-700'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-slate-50 dark:divide-slate-800">
          <Toggle enabled={privacy.showEmail} onChange={v => { setPrivacy(p => ({ ...p, showEmail: v })); toast.success('Saved') }} label="Show Email on Profile" description="Let others see your email address" />
          <Toggle enabled={privacy.showPhone} onChange={v => { setPrivacy(p => ({ ...p, showPhone: v })); toast.success('Saved') }} label="Show Phone on Profile" description="Display your phone number publicly" />
          <Toggle enabled={privacy.showLocation} onChange={v => { setPrivacy(p => ({ ...p, showLocation: v })); toast.success('Saved') }} label="Show Location" description="Display your city/region" />
          <Toggle enabled={privacy.allowConnectionRequests} onChange={v => { setPrivacy(p => ({ ...p, allowConnectionRequests: v })); toast.success('Saved') }} label="Allow Connection Requests" description="Others can send you connection requests" />
          <Toggle enabled={privacy.showActivityStatus} onChange={v => { setPrivacy(p => ({ ...p, showActivityStatus: v })); toast.success('Saved') }} label="Show Activity Status" description="Show when you were last active" />
          <Toggle enabled={privacy.showProfileInSearch} onChange={v => { setPrivacy(p => ({ ...p, showProfileInSearch: v })); toast.success('Saved') }} label="Appear in Search Results" description="Your profile appears when others search" />
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// APPEARANCE SETTINGS
// ═══════════════════════════════════════════════════════════════════════════
function AppearanceSettings() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('light')
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium')
  const [reducedMotion, setReducedMotion] = useState(false)

  return (
    <div className="space-y-4">
      <div className="card p-5 sm:p-6">
        <SectionTitle icon={Moon} title="Theme" description="Choose your preferred color scheme" />
        <div className="grid grid-cols-3 gap-3">
          {([
            { id: 'light', icon: Sun, label: 'Light' },
            { id: 'dark', icon: Moon, label: 'Dark' },
            { id: 'system', icon: Monitor, label: 'System' },
          ] as const).map(opt => (
            <button
              key={opt.id}
              onClick={() => { setTheme(opt.id); toast.success(`Theme set to ${opt.label}`) }}
              className={`flex flex-col items-center gap-2 py-4 px-3 rounded-xl border transition-all ${
                theme === opt.id
                  ? 'bg-brand-50 border-brand-300 text-brand-700 dark:bg-brand-900/30 dark:border-brand-600'
                  : 'border-slate-200 text-slate-500 hover:border-slate-300 dark:border-slate-700'
              }`}
            >
              <opt.icon size={22} />
              <span className="text-sm font-medium">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="card p-5 sm:p-6">
        <SectionTitle icon={Settings} title="Display Preferences" />
        <div className="mb-5">
          <label className="label mb-2">Font Size</label>
          <div className="grid grid-cols-3 gap-2">
            {(['small', 'medium', 'large'] as const).map(opt => (
              <button
                key={opt}
                onClick={() => { setFontSize(opt); toast.success(`Font size: ${opt}`) }}
                className={`py-2.5 px-3 rounded-xl text-sm font-medium border transition-all capitalize ${
                  fontSize === opt
                    ? 'bg-brand-50 border-brand-300 text-brand-700 dark:bg-brand-900/30'
                    : 'border-slate-200 text-slate-500 hover:border-slate-300 dark:border-slate-700'
                }`}
              >
                {opt === 'small' ? 'A' : opt === 'medium' ? 'Aa' : 'AA'} {opt}
              </button>
            ))}
          </div>
        </div>
        <Toggle
          enabled={reducedMotion}
          onChange={v => { setReducedMotion(v); toast.success(v ? 'Animations reduced' : 'Animations enabled') }}
          label="Reduce Animations"
          description="Minimize motion for accessibility"
        />
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// DATA & EXPORT SETTINGS
// ═══════════════════════════════════════════════════════════════════════════
function DataSettings() {
  return (
    <div className="space-y-4">
      <div className="card p-5 sm:p-6">
        <SectionTitle icon={Download} title="Export Your Data" description="Download a copy of your data" />
        <p className="text-sm text-slate-500 mb-4">
          You can request a copy of all your data including profile information, applications, resumes, and connections.
        </p>
        <div className="space-y-3">
          <button onClick={() => toast.success('Data export started. You will receive an email when ready.')} className="btn-secondary w-full sm:w-auto justify-center">
            <Download size={15} /> Export Profile Data
          </button>
          <button onClick={() => toast.success('Application history export started.')} className="btn-secondary w-full sm:w-auto justify-center">
            <FileText size={15} /> Export Application History
          </button>
          <button onClick={() => toast.success('Connections export started.')} className="btn-secondary w-full sm:w-auto justify-center">
            <User size={15} /> Export Connections
          </button>
        </div>
      </div>

      <div className="card p-5 sm:p-6">
        <SectionTitle icon={FileText} title="Activity Log" description="Recent actions on your account" />
        <div className="space-y-2">
          {[
            { action: 'Login from Chrome on Windows', time: 'Just now' },
            { action: 'Profile photo updated', time: '2 hours ago' },
            { action: 'Password changed', time: '1 day ago' },
            { action: 'Account created', time: 'Recently' },
          ].map((log, i) => (
            <div key={i} className="flex items-center justify-between py-2.5 border-b border-slate-50 dark:border-slate-800 last:border-0">
              <p className="text-sm text-slate-700 dark:text-slate-200">{log.action}</p>
              <p className="text-xs text-slate-400 flex-shrink-0 ml-3">{log.time}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// DEACTIVATION SETTINGS
// ═══════════════════════════════════════════════════════════════════════════
function DeactivationSettings() {
  const { logout } = useAuthStore()
  const [deactivateReason, setDeactivateReason] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleteText, setDeleteText] = useState('')

  return (
    <div className="space-y-4">
      {/* Deactivate */}
      <div className="card p-5 sm:p-6 border-amber-200 dark:border-amber-900/50">
        <SectionTitle icon={ToggleLeft} title="Deactivate Account" description="Temporarily disable your account" />
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 mb-4 border border-amber-100 dark:border-amber-800">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            Deactivating your account will:
          </p>
          <ul className="text-sm text-amber-700 dark:text-amber-300 mt-2 space-y-1 ml-4 list-disc">
            <li>Hide your profile from search results</li>
            <li>Pause all notifications</li>
            <li>Keep your data safe for when you return</li>
            <li>You can reactivate anytime by logging in</li>
          </ul>
        </div>
        <div className="mb-4">
          <label className="label">Reason for leaving (optional)</label>
          <select
            value={deactivateReason}
            onChange={e => setDeactivateReason(e.target.value)}
            className="input"
          >
            <option value="">Select a reason...</option>
            <option value="found_job">I found a job</option>
            <option value="not_useful">Not finding it useful</option>
            <option value="too_many_emails">Too many emails</option>
            <option value="privacy">Privacy concerns</option>
            <option value="temporary_break">Taking a temporary break</option>
            <option value="other">Other</option>
          </select>
        </div>
        <button
          onClick={() => {
            toast.success('Account deactivated. You can reactivate by logging in.')
            logout()
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-50 text-amber-700 font-medium text-sm border border-amber-200 hover:bg-amber-100 transition-all dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400"
        >
          <ToggleLeft size={15} /> Deactivate Account
        </button>
      </div>

      {/* Delete */}
      <div className="card p-5 sm:p-6 border-red-200 dark:border-red-900/50">
        <SectionTitle icon={Trash2} title="Delete Account Permanently" description="This action cannot be undone" />
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 mb-4 border border-red-100 dark:border-red-800">
          <p className="text-sm text-red-800 dark:text-red-200 font-medium flex items-center gap-2">
            <AlertTriangle size={16} /> Warning: This is permanent
          </p>
          <ul className="text-sm text-red-700 dark:text-red-300 mt-2 space-y-1 ml-4 list-disc">
            <li>All your data will be permanently deleted</li>
            <li>Your profile, applications, and resumes will be removed</li>
            <li>All connections will be severed</li>
            <li>This action <strong>cannot be undone</strong></li>
          </ul>
        </div>

        <div className="mb-4">
          <label className="label">Type <strong className="text-red-600">DELETE</strong> to confirm</label>
          <input
            value={deleteText}
            onChange={e => setDeleteText(e.target.value)}
            className="input border-red-200 focus:ring-red-500"
            placeholder="Type DELETE here"
          />
        </div>

        <label className="flex items-start gap-2 mb-4 cursor-pointer">
          <input
            type="checkbox"
            checked={confirmDelete}
            onChange={e => setConfirmDelete(e.target.checked)}
            className="mt-0.5 rounded border-red-300 text-red-600 focus:ring-red-500"
          />
          <span className="text-sm text-red-700 dark:text-red-400">
            I understand that deleting my account is permanent and all my data will be lost forever.
          </span>
        </label>

        <button
          disabled={deleteText !== 'DELETE' || !confirmDelete}
          onClick={() => toast.error('Contact admin to permanently delete your account', { icon: '\u{1F6AB}', duration: 5000 })}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 text-white font-medium text-sm hover:bg-red-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-red-600"
        >
          <Trash2 size={15} /> Delete Account Permanently
        </button>
      </div>
    </div>
  )
}

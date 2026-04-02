import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Lock, Eye, EyeOff, ShieldCheck, Check, X } from 'lucide-react'
import { authService } from '../services/api'
import { useAuthStore } from '../store/authStore'

interface SetPasswordForm {
  temp_password: string
  new_password: string
  confirm_password: string
}

export default function SetPasswordPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [showTemp, setShowTemp] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [loading, setLoading] = useState(false)

  const email = (location.state as any)?.email || ''

  const { register, handleSubmit, watch, formState: { errors } } = useForm<SetPasswordForm>()
  const newPw = watch('new_password', '')

  const rules = [
    { label: '8+ characters', met: newPw.length >= 8 },
    { label: 'Uppercase letter', met: /[A-Z]/.test(newPw) },
    { label: 'Lowercase letter', met: /[a-z]/.test(newPw) },
    { label: 'Number', met: /[0-9]/.test(newPw) },
    { label: 'Special character', met: /[!@#$%^&*(),.?":{}|<>]/.test(newPw) },
  ]
  const metCount = rules.filter(r => r.met).length
  const strengthPct = (metCount / rules.length) * 100

  const onSubmit = async (data: SetPasswordForm) => {
    if (data.new_password !== data.confirm_password) {
      toast.error('Passwords do not match')
      return
    }
    setLoading(true)
    try {
      const res = await authService.setFirstPassword({
        email,
        temp_password: data.temp_password,
        new_password: data.new_password,
      })
      setAuth(res.data.user, res.data.access_token, res.data.refresh_token)
      toast.success('Password set successfully! Welcome!')
      navigate('/dashboard')
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to set password')
    } finally {
      setLoading(false)
    }
  }

  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="card p-8 max-w-sm text-center">
          <ShieldCheck size={48} className="text-brand-600 mx-auto mb-4" />
          <h2 className="font-display font-bold text-xl mb-2">No Email Provided</h2>
          <p className="text-slate-500 text-sm mb-4">Please login first to set your password.</p>
          <button onClick={() => navigate('/login')} className="btn-primary w-full justify-center">Go to Login</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="card p-8 w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-brand-100 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck size={32} className="text-brand-600" />
          </div>
          <h1 className="font-display font-bold text-2xl text-slate-800 mb-1">Create Your Password</h1>
          <p className="text-slate-500 text-sm">
            Welcome! A temporary password was sent to <strong className="text-slate-700">{email}</strong>. Please set your own password.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Temp Password */}
          <div>
            <label className="label">Temporary Password (from email)</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                {...register('temp_password', { required: 'Temporary password is required' })}
                type={showTemp ? 'text' : 'password'}
                placeholder="Paste from your email"
                className="input pl-9 pr-10"
              />
              <button type="button" onClick={() => setShowTemp(!showTemp)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showTemp ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.temp_password && <p className="text-red-500 text-xs mt-1">{errors.temp_password.message}</p>}
          </div>

          {/* New Password */}
          <div>
            <label className="label">New Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                {...register('new_password', { required: 'New password is required' })}
                type={showNew ? 'text' : 'password'}
                placeholder="Create a strong password"
                className="input pl-9 pr-10"
              />
              <button type="button" onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Strength bar */}
            {newPw && (
              <div className="mt-2">
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${strengthPct <= 40 ? 'bg-red-500' : strengthPct <= 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${strengthPct}%` }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-1 mt-2">
                  {rules.map((r) => (
                    <div key={r.label} className="flex items-center gap-1.5 text-xs">
                      {r.met ? <Check size={12} className="text-emerald-500" /> : <X size={12} className="text-slate-300" />}
                      <span className={r.met ? 'text-emerald-600' : 'text-slate-400'}>{r.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="label">Confirm Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                {...register('confirm_password', { required: 'Please confirm your password' })}
                type="password"
                placeholder="Re-enter your password"
                className="input pl-9"
              />
            </div>
            {errors.confirm_password && <p className="text-red-500 text-xs mt-1">{errors.confirm_password.message}</p>}
          </div>

          <button type="submit" disabled={loading || metCount < 5} className="btn-primary w-full justify-center py-3">
            {loading ? 'Setting password...' : 'Set Password & Continue'}
          </button>
        </form>
      </div>
    </div>
  )
}

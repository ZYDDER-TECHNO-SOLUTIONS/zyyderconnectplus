import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Mail, Lock, ArrowLeft, ShieldCheck, Check, X, Eye, EyeOff, KeyRound } from 'lucide-react'
import { authService } from '../services/api'

type Step = 'email' | 'code' | 'done'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)

  const codeForm = useForm<{ code: string; new_password: string; confirm_password: string }>()
  const newPw = codeForm.watch('new_password', '')

  const rules = [
    { label: '8+ characters', met: newPw.length >= 8 },
    { label: 'Uppercase', met: /[A-Z]/.test(newPw) },
    { label: 'Lowercase', met: /[a-z]/.test(newPw) },
    { label: 'Number', met: /[0-9]/.test(newPw) },
    { label: 'Special char', met: /[!@#$%^&*(),.?":{}|<>]/.test(newPw) },
  ]
  const allMet = rules.every(r => r.met)

  // Step 1: Send reset code
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) { toast.error('Enter your email'); return }
    setLoading(true)
    try {
      await authService.forgotPassword({ email: email.trim().toLowerCase() })
      toast.success('Reset code sent! Check your email.')
      setStep('code')
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to send reset code')
    } finally {
      setLoading(false)
    }
  }

  // Step 2: Verify code and set new password
  const handleResetPassword = async (data: { code: string; new_password: string; confirm_password: string }) => {
    if (data.new_password !== data.confirm_password) {
      toast.error('Passwords do not match')
      return
    }
    setLoading(true)
    try {
      await authService.resetPassword({
        email: email.trim().toLowerCase(),
        code: data.code.trim(),
        new_password: data.new_password,
      })
      toast.success('Password reset successfully!')
      setStep('done')
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="w-full max-w-md animate-fade-in">

        {/* Step 1: Enter Email */}
        {step === 'email' && (
          <div className="card p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center mx-auto mb-4">
                <KeyRound size={32} className="text-brand-600" />
              </div>
              <h1 className="font-display font-bold text-2xl text-slate-800 dark:text-white">Forgot Password?</h1>
              <p className="text-slate-500 text-sm mt-2">No worries. Enter your email and we'll send you a reset code.</p>
            </div>

            <form onSubmit={handleSendCode} className="space-y-5">
              <div>
                <label className="label">Email Address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="input pl-9"
                    required
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
                {loading ? 'Sending...' : 'Send Reset Code'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link to="/login" className="text-sm text-slate-500 hover:text-brand-600 flex items-center justify-center gap-1">
                <ArrowLeft size={14} /> Back to Login
              </Link>
            </div>
          </div>
        )}

        {/* Step 2: Enter Code + New Password */}
        {step === 'code' && (
          <div className="card p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-4">
                <ShieldCheck size={32} className="text-emerald-600" />
              </div>
              <h1 className="font-display font-bold text-2xl text-slate-800 dark:text-white">Enter Reset Code</h1>
              <p className="text-slate-500 text-sm mt-2">
                We sent a 6-digit code to <strong className="text-slate-700 dark:text-slate-200">{email}</strong>
              </p>
            </div>

            <form onSubmit={codeForm.handleSubmit(handleResetPassword)} className="space-y-5">
              {/* Code Input */}
              <div>
                <label className="label">Reset Code</label>
                <input
                  {...codeForm.register('code', { required: 'Code is required' })}
                  type="text"
                  maxLength={6}
                  placeholder="000000"
                  className="input text-center text-2xl tracking-[8px] font-mono font-bold"
                  autoComplete="one-time-code"
                />
                {codeForm.formState.errors.code && (
                  <p className="text-red-500 text-xs mt-1">{codeForm.formState.errors.code.message}</p>
                )}
              </div>

              {/* New Password */}
              <div>
                <label className="label">New Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    {...codeForm.register('new_password', { required: 'Password is required' })}
                    type={showPw ? 'text' : 'password'}
                    placeholder="Create a strong password"
                    className="input pl-9 pr-10"
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {newPw && (
                  <div className="mt-2 grid grid-cols-3 sm:grid-cols-5 gap-1">
                    {rules.map(r => (
                      <span key={r.label} className={`text-[11px] flex items-center gap-0.5 ${r.met ? 'text-emerald-500' : 'text-slate-300'}`}>
                        {r.met ? <Check size={10} /> : <X size={10} />} {r.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="label">Confirm Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    {...codeForm.register('confirm_password', { required: 'Confirm your password' })}
                    type="password"
                    placeholder="Re-enter password"
                    className="input pl-9"
                  />
                </div>
              </div>

              <button type="submit" disabled={loading || !allMet} className="btn-primary w-full justify-center py-3">
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>

            <div className="mt-4 text-center">
              <button
                onClick={() => setStep('email')}
                className="text-sm text-slate-500 hover:text-brand-600 flex items-center justify-center gap-1 mx-auto"
              >
                <ArrowLeft size={14} /> Use different email
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Success */}
        {step === 'done' && (
          <div className="card p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-6">
              <Check size={40} className="text-emerald-500" />
            </div>
            <h1 className="font-display font-bold text-2xl text-slate-800 dark:text-white mb-2">Password Reset!</h1>
            <p className="text-slate-500 text-sm mb-6">Your password has been reset successfully. You can now log in with your new password.</p>
            <button onClick={() => navigate('/login')} className="btn-primary w-full justify-center py-3">
              Go to Login
            </button>
          </div>
        )}

      </div>
    </div>
  )
}

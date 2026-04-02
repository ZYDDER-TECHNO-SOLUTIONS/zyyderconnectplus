import { useState, useMemo, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Sparkles, Mail, Lock, User, Building2, Phone, Eye, EyeOff, Check, X, Briefcase, CheckCircle } from 'lucide-react'
import { GoogleLogin } from '@react-oauth/google'
import { authService } from '../services/api'
import { useAuthStore } from '../store/authStore'

const EMAIL_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i

type FormData = {
  full_name: string
  email: string
  role: 'employee' | 'employer'
  company_name?: string
  phone?: string
}

function PasswordStrengthIndicator({ password }: { password: string }) {
  const requirements = useMemo(() => [
    { label: '8+ characters', met: password.length >= 8 },
    { label: 'Uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'Lowercase letter', met: /[a-z]/.test(password) },
    { label: 'Number', met: /[0-9]/.test(password) },
    { label: 'Special character', met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) },
  ], [password])

  const metCount = requirements.filter(r => r.met).length
  const strength = metCount <= 2 ? 'weak' : metCount <= 4 ? 'medium' : 'strong'
  const strengthColor = strength === 'weak' ? 'bg-red-400' : strength === 'medium' ? 'bg-amber-400' : 'bg-emerald-400'
  const strengthLabel = strength === 'weak' ? 'Weak' : strength === 'medium' ? 'Medium' : 'Strong'
  const widthPct = (metCount / requirements.length) * 100

  if (!password) return null

  return (
    <div className="mt-2 space-y-2">
      {/* Strength bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${strengthColor}`}
            style={{ width: `${widthPct}%` }}
          />
        </div>
        <span className={`text-xs font-medium ${strength === 'weak' ? 'text-red-500' : strength === 'medium' ? 'text-amber-500' : 'text-emerald-500'}`}>
          {strengthLabel}
        </span>
      </div>

      {/* Requirements checklist */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-1">
        {requirements.map(req => (
          <div key={req.label} className="flex items-center gap-1.5">
            {req.met ? (
              <Check size={12} className="text-emerald-500 flex-shrink-0" />
            ) : (
              <X size={12} className="text-slate-300 flex-shrink-0" />
            )}
            <span className={`text-xs ${req.met ? 'text-emerald-600' : 'text-slate-400'}`}>{req.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function SuccessScreen() {
  const [show, setShow] = useState(false)
  useEffect(() => { setTimeout(() => setShow(true), 100) }, [])

  return (
    <div className={`text-center transition-all duration-500 ${show ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
      <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
        <CheckCircle size={40} className="text-emerald-500 animate-checkmark" />
      </div>
      <h2 className="font-display font-bold text-xl sm:text-2xl text-slate-800 mb-2">Account Created!</h2>
      <p className="text-slate-500 text-sm mb-6 max-w-xs mx-auto">
        Check your email for login credentials. You can now sign in and start exploring opportunities.
      </p>
      <Link to="/login" className="btn-primary justify-center py-3 w-full">
        Go to Login
      </Link>
    </div>
  )
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [registered, setRegistered] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const { register, handleSubmit, watch, setValue, formState: { errors, touchedFields } } = useForm<FormData>({
    defaultValues: { role: 'employee' },
    mode: 'onTouched',
  })
  const role = watch('role')

  const onSubmit = async (data: FormData) => {
    if (!agreeTerms) {
      toast.error('Please agree to the Terms & Conditions')
      return
    }
    setLoading(true)
    try {
      await authService.register(data)
      setRegistered(true)
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = (field: keyof FormData) => {
    const hasError = errors[field]
    const isTouched = touchedFields[field]
    if (hasError) return 'input pl-9 ring-2 ring-red-300 border-red-300 focus:ring-red-400'
    if (isTouched && !hasError) return 'input pl-9 ring-2 ring-emerald-200 border-emerald-300 focus:ring-emerald-400'
    return 'input pl-9'
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-slate-50">
      <div className={`w-full max-w-md transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
        <div className="flex items-center gap-2 mb-6 sm:mb-8 justify-center">
          <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center shadow-lg shadow-brand-200">
            <Sparkles size={18} className="text-white" />
          </div>
          <span className="font-display font-bold text-xl text-slate-800">Sparklex<span className="text-brand-600">+</span></span>
        </div>

        <div className="card p-5 sm:p-8">
          {registered ? (
            <SuccessScreen />
          ) : (
            <>
              <h2 className="font-display font-bold text-xl sm:text-2xl text-slate-800 mb-1">Create account</h2>
              <p className="text-slate-500 text-xs sm:text-sm mb-6">Join thousands of professionals on Sparklex Connect+</p>

              {/* Role selection cards */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {([
                  { value: 'employee' as const, label: 'Job Seeker', desc: 'Find your dream job', Icon: User },
                  { value: 'employer' as const, label: 'Employer', desc: 'Hire top talent', Icon: Briefcase },
                ]).map(({ value, label, desc, Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setValue('role', value)}
                    className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer text-center ${
                      role === value
                        ? 'border-brand-500 bg-brand-50 shadow-md shadow-brand-100'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                      role === value ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      <Icon size={20} />
                    </div>
                    <div>
                      <p className={`font-semibold text-sm transition-colors duration-300 ${role === value ? 'text-brand-700' : 'text-slate-700'}`}>{label}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
                    </div>
                    {role === value && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-brand-600 flex items-center justify-center animate-scale-in">
                        <Check size={12} className="text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
              {/* Hidden radio for react-hook-form */}
              <input {...register('role')} type="hidden" />

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="label">Full Name</label>
                  <div className="relative">
                    <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input {...register('full_name', { required: 'Name is required' })} placeholder="Jane Smith" className={inputClass('full_name')} />
                  </div>
                  {errors.full_name && <p className="text-red-500 text-xs mt-1">{errors.full_name.message}</p>}
                </div>

                <div>
                  <label className="label">Email</label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      {...register('email', {
                        required: 'Email is required',
                        pattern: {
                          value: EMAIL_REGEX,
                          message: 'Please enter a valid email address (e.g. name@company.com)',
                        },
                      })}
                      type="email"
                      placeholder="jane@company.com"
                      className={inputClass('email')}
                    />
                  </div>
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                </div>

                {/* Info about password */}
                <div className="p-3 bg-brand-50 rounded-xl border border-brand-100">
                  <p className="text-sm text-brand-700 flex items-center gap-2">
                    <Lock size={14} />
                    A secure password will be generated and sent to your email
                  </p>
                </div>

                {/* Company name with smooth transition */}
                <div
                  className="overflow-hidden transition-all duration-400 ease-in-out"
                  style={{
                    maxHeight: role === 'employer' ? '120px' : '0px',
                    opacity: role === 'employer' ? 1 : 0,
                    marginTop: role === 'employer' ? undefined : '0px',
                  }}
                >
                  <div>
                    <label className="label">Company Name</label>
                    <div className="relative">
                      <Building2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input {...register('company_name')} placeholder="Acme Corp" className="input pl-9" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="label">Phone <span className="text-slate-400 font-normal">(optional)</span></label>
                  <div className="relative">
                    <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input {...register('phone')} placeholder="+1 555 000 0000" className="input pl-9" />
                  </div>
                </div>

                {/* Terms & Conditions */}
                <div className="flex items-start gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setAgreeTerms(!agreeTerms)}
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all duration-200 ${
                      agreeTerms ? 'bg-brand-600 border-brand-600' : 'border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    {agreeTerms && <Check size={12} className="text-white" />}
                  </button>
                  <p className="text-xs text-slate-500">
                    I agree to the{' '}
                    <a href="#" onClick={(e) => { e.preventDefault(); toast('Coming soon!', { icon: '\u{1F4C4}' }) }} className="text-brand-600 hover:underline font-medium">
                      Terms & Conditions
                    </a>{' '}
                    and{' '}
                    <a href="#" onClick={(e) => { e.preventDefault(); toast('Coming soon!', { icon: '\u{1F4C4}' }) }} className="text-brand-600 hover:underline font-medium">
                      Privacy Policy
                    </a>
                  </p>
                </div>

                <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 mt-2">
                  {loading ? 'Creating account...' : 'Create account'}
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-slate-200" />
                  <span className="text-xs text-slate-400 uppercase tracking-wider">or</span>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>

                {/* Google Sign-Up */}
                <div className="flex justify-center">
                  <GoogleLogin
                    onSuccess={async (credentialResponse) => {
                      if (!credentialResponse.credential) {
                        toast.error('Google sign-up failed')
                        return
                      }
                      try {
                        const res = await authService.googleAuth({
                          credential: credentialResponse.credential,
                          role: role,
                        })
                        const { setAuth } = useAuthStore.getState()
                        setAuth(res.data.user, res.data.access_token, res.data.refresh_token)
                        toast.success(`Welcome, ${res.data.user.full_name}!`)
                        navigate('/dashboard')
                      } catch (err: any) {
                        toast.error(err?.response?.data?.detail || 'Google sign-up failed')
                      }
                    }}
                    onError={() => toast.error('Google sign-up failed')}
                    theme="outline"
                    size="large"
                    width="340"
                    text="signup_with"
                    shape="pill"
                  />
                </div>
              </form>
            </>
          )}
        </div>

        {!registered && (
          <p className="text-center text-sm text-slate-500 mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-600 font-medium hover:underline">Sign in</Link>
          </p>
        )}
      </div>
    </div>
  )
}

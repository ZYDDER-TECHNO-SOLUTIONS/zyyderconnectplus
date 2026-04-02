import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Sparkles, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { GoogleLogin } from '@react-oauth/google'
import { authService } from '../services/api'
import { useAuthStore } from '../store/authStore'

const EMAIL_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i

function CountUpStat({ target, suffix = '' }: { target: string; suffix?: string }) {
  const [display, setDisplay] = useState('0')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const numeric = parseInt(target.replace(/[^0-9]/g, ''), 10)
    if (isNaN(numeric)) { setDisplay(target); return }

    let start = 0
    const duration = 1800
    const increment = numeric / (duration / 16)
    const timer = setInterval(() => {
      start += increment
      if (start >= numeric) {
        clearInterval(timer)
        setDisplay(target)
      } else {
        setDisplay(Math.floor(start).toLocaleString() + suffix)
      }
    }, 16)
    return () => clearInterval(timer)
  }, [target, suffix])

  return <span ref={ref}>{display}</span>
}

export default function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const { register, handleSubmit, formState: { errors, touchedFields } } = useForm<{ email: string; password: string }>({
    mode: 'onTouched',
  })

  const onSubmit = async (data: { email: string; password: string }) => {
    setLoading(true)
    try {
      const res = await authService.login(data)
      if (res.data.must_change_password) {
        toast('Please set your own password', { icon: '\u{1F512}' })
        navigate('/set-password', { state: { email: data.email } })
        return
      }
      setAuth(res.data.user, res.data.access_token, res.data.refresh_token)
      toast.success(`Welcome back, ${res.data.user.full_name}!`)
      navigate('/dashboard')
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = (field: 'email' | 'password') => {
    const hasError = errors[field]
    const isTouched = touchedFields[field]
    if (hasError) return 'input pl-9 pr-10 ring-2 ring-red-300 border-red-300 focus:ring-red-400'
    if (isTouched && !hasError) return 'input pl-9 pr-10 ring-2 ring-emerald-200 border-emerald-300 focus:ring-emerald-400'
    return 'input pl-9 pr-10'
  }

  const stats = [
    { value: '12k+', label: 'Active Jobs', suffix: '+' },
    { value: '4k+', label: 'Companies', suffix: '+' },
    { value: '98%', label: 'Match Rate', suffix: '%' },
  ]

  return (
    <div className="min-h-screen flex">
      {/* Left branding panel */}
      <div
        className="hidden lg:flex flex-col justify-between w-[42%] p-12 text-white relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #4f46e5, #6366f1, #818cf8, #4f46e5)',
          backgroundSize: '300% 300%',
          animation: 'gradientShift 6s ease infinite',
        }}
      >
        {/* Decorative blurred shapes */}
        <div className="absolute top-[-10%] right-[-10%] w-80 h-80 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 rounded-full bg-white/5 blur-2xl" />

        <div className={`flex items-center gap-3 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
          <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Sparkles size={18} />
          </div>
          <span className="font-display font-bold text-xl">Sparklex Connect+</span>
        </div>
        <div className={`transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <h1 className="font-display font-bold text-4xl leading-tight mb-4">
            Your next great<br />opportunity awaits.
          </h1>
          <p className="text-brand-200 text-lg">
            AI-powered job matching that connects talent with the right companies — faster, smarter, fairer.
          </p>
        </div>
        <div className={`grid grid-cols-3 gap-4 text-center transition-all duration-700 delay-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {stats.map(({ value, label, suffix }) => (
            <div key={label} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 hover:bg-white/15 transition-all duration-300">
              <p className="font-display font-bold text-2xl">
                <CountUpStat target={value} suffix={suffix} />
              </p>
              <p className="text-brand-200 text-sm">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 bg-slate-50">
        <div className={`w-full max-w-sm transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center">
              <Sparkles size={16} className="text-white" />
            </div>
            <span className="font-display font-bold text-lg">Sparklex<span className="text-brand-600">+</span></span>
          </div>

          <h2 className="font-display font-bold text-2xl text-slate-800 mb-1">Sign in</h2>
          <p className="text-slate-500 text-sm mb-8">Welcome back — let's find your next opportunity.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: EMAIL_REGEX,
                      message: 'Please enter a valid email address (e.g. name@company.com)',
                    },
                  })}
                  type="email"
                  placeholder="you@company.com"
                  className={inputClass('email')}
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  {...register('password', { required: 'Password is required' })}
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  className={inputClass('password')}
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
              <div className="text-right mt-1.5">
                <Link
                  to="/forgot-password"
                  className="text-xs text-brand-600 hover:text-brand-700 hover:underline font-medium transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400 uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Google Sign-In */}
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={async (credentialResponse) => {
                if (!credentialResponse.credential) {
                  toast.error('Google sign-in failed')
                  return
                }
                setLoading(true)
                try {
                  const res = await authService.googleAuth({ credential: credentialResponse.credential })
                  setAuth(res.data.user, res.data.access_token, res.data.refresh_token)
                  toast.success(`Welcome, ${res.data.user.full_name}!`)
                  navigate('/dashboard')
                } catch (err: any) {
                  toast.error(err?.response?.data?.detail || 'Google sign-in failed')
                } finally {
                  setLoading(false)
                }
              }}
              onError={() => toast.error('Google sign-in failed')}
              theme="outline"
              size="large"
              width="340"
              text="signin_with"
              shape="pill"
            />
          </div>

          <p className="text-center text-sm text-slate-500 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand-600 font-medium hover:underline">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

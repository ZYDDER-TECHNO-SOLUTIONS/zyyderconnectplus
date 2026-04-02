import { Link } from 'react-router-dom'
import { Sparkles } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-brand-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-brand-200">
          <Sparkles size={28} className="text-white" />
        </div>
        <h1 className="font-display font-bold text-6xl text-slate-800 mb-2">404</h1>
        <p className="text-slate-500 text-lg mb-8">Page not found</p>
        <Link to="/dashboard" className="btn-primary px-8 py-3">Go Home</Link>
      </div>
    </div>
  )
}

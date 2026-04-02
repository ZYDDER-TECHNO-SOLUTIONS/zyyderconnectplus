import { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'

interface Props { children: ReactNode }
interface State { hasError: boolean; error?: Error }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error) { return { hasError: true, error } }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('ErrorBoundary:', error, info) }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="card p-8 text-center max-w-md">
            <AlertTriangle size={48} className="text-amber-500 mx-auto mb-4" />
            <h2 className="font-display font-bold text-xl text-slate-800 mb-2">Something went wrong</h2>
            <p className="text-slate-500 text-sm mb-4">{this.state.error?.message || 'An unexpected error occurred'}</p>
            <button onClick={() => { this.setState({ hasError: false }); window.location.href = '/dashboard' }} className="btn-primary">
              Go to Dashboard
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

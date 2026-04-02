import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'

// Layout (not lazy - needed immediately for shell)
import AppLayout from './components/common/AppLayout'

// Lazy-loaded pages
const LoginPage = lazy(() => import('./pages/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const JobsPage = lazy(() => import('./pages/JobsPage'))
const JobDetailPage = lazy(() => import('./pages/JobDetailPage'))
const PostJobPage = lazy(() => import('./pages/PostJobPage'))
const ResumesPage = lazy(() => import('./pages/ResumesPage'))
const ApplicationsPage = lazy(() => import('./pages/ApplicationsPage'))
const AdminPage = lazy(() => import('./pages/AdminPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const ResumeBuilderPage = lazy(() => import('./pages/ResumeBuilderPage'))
const SavedJobsPage = lazy(() => import('./pages/SavedJobsPage'))
const ApplicantReviewPage = lazy(() => import('./pages/ApplicantReviewPage'))
const ConnectionsPage = lazy(() => import('./pages/ConnectionsPage'))
const UserProfilePage = lazy(() => import('./pages/UserProfilePage'))
const PeoplePage = lazy(() => import('./pages/PeoplePage'))
const CompanyPage = lazy(() => import('./pages/CompanyPage'))
const CompanySettingsPage = lazy(() => import('./pages/CompanySettingsPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))
const SetPasswordPage = lazy(() => import('./pages/SetPasswordPage'))
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full" />
    </div>
  )
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated())
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

function RequireRole({ roles, children }: { roles: string[]; children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user)
  if (!user || !roles.includes(user.role)) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

function GuestOnly({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated())
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        {/* Public */}
        <Route path="/login"    element={<GuestOnly><LoginPage /></GuestOnly>} />
        <Route path="/register" element={<GuestOnly><RegisterPage /></GuestOnly>} />
        <Route path="/set-password" element={<SetPasswordPage />} />
        <Route path="/forgot-password" element={<GuestOnly><ForgotPasswordPage /></GuestOnly>} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Protected */}
        <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
          <Route path="/dashboard"    element={<DashboardPage />} />
          <Route path="/jobs"         element={<JobsPage />} />
          <Route path="/jobs/:id"     element={<JobDetailPage />} />
          <Route path="/jobs/:id/applicants" element={
            <RequireRole roles={['employer','superadmin']}><ApplicantReviewPage /></RequireRole>
          } />
          <Route path="/jobs/post"    element={
            <RequireRole roles={['employer','superadmin']}><PostJobPage /></RequireRole>
          } />
          <Route path="/resumes"      element={<ResumesPage />} />
          <Route path="/resume-builder" element={<ResumeBuilderPage />} />
          <Route path="/saved-jobs"   element={<SavedJobsPage />} />
          <Route path="/applications" element={<ApplicationsPage />} />
          <Route path="/connections"  element={<ConnectionsPage />} />
          <Route path="/people"       element={<PeoplePage />} />
          <Route path="/company/settings" element={
            <RequireRole roles={['employer','superadmin']}><CompanySettingsPage /></RequireRole>
          } />
          <Route path="/company/:slug" element={<CompanyPage />} />
          <Route path="/profile/:userId" element={<UserProfilePage />} />
          <Route path="/settings"     element={<SettingsPage />} />
          <Route path="/profile"      element={<ProfilePage />} />
          <Route path="/admin"        element={
            <RequireRole roles={['superadmin']}><AdminPage /></RequireRole>
          } />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  )
}

import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const AUTH_BASE  = import.meta.env.VITE_AUTH_API_URL  || 'http://localhost:8081'
const JOB_BASE   = import.meta.env.VITE_JOB_API_URL   || 'http://localhost:8082'
const RESUME_BASE= import.meta.env.VITE_RESUME_API_URL || 'http://localhost:8083'
const NOTIF_BASE = import.meta.env.VITE_NOTIFICATION_API_URL || 'http://localhost:8084'

function makeClient(baseURL: string) {
  const client = axios.create({ baseURL })

  client.interceptors.request.use((config) => {
    const token = useAuthStore.getState().accessToken
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  })

  client.interceptors.response.use(
    (res) => res,
    async (err) => {
      const original = err.config
      if (err.response?.status === 401 && !original._retry) {
        original._retry = true
        const { refreshToken, setAuth, logout } = useAuthStore.getState()
        if (refreshToken) {
          try {
            const { data } = await axios.post(`${AUTH_BASE}/auth/refresh`, { refresh_token: refreshToken })
            setAuth(data.user, data.access_token, data.refresh_token)
            original.headers.Authorization = `Bearer ${data.access_token}`
            return client(original)
          } catch {
            logout()
          }
        } else {
          logout()
        }
      }
      return Promise.reject(err)
    }
  )

  return client
}

export const authApi   = makeClient(AUTH_BASE)
export const jobApi    = makeClient(JOB_BASE)
export const resumeApi = makeClient(RESUME_BASE)
export const notifApi  = makeClient(NOTIF_BASE)

// ─── Auth ──────────────────────────────────────────────────────────────────
export const authService = {
  register:       (d: any) => authApi.post('/auth/register', d),
  login:          (d: any) => authApi.post('/auth/login', d),
  setFirstPassword: (d: any) => authApi.post('/auth/set-first-password', d),
  forgotPassword:   (d: any) => authApi.post('/auth/forgot-password', d),
  resetPassword:    (d: any) => authApi.post('/auth/reset-password', d),
  googleAuth:       (d: any) => authApi.post('/auth/google', d),
  getMe:          ()       => authApi.get('/users/me'),
  updateMe:       (d: any) => authApi.put('/users/me', d),
  changePassword: (d: any) => authApi.post('/users/me/change-password', d),
  adminListUsers: (p?: any)=> authApi.get('/admin/users', { params: p }),
  adminUpdateUser:(id: string, d: any) => authApi.patch(`/admin/users/${id}`, d),
  adminStats:     ()       => authApi.get('/admin/stats'),
}

// ─── Jobs ──────────────────────────────────────────────────────────────────
export const jobService = {
  listJobs:       (p?: any)        => jobApi.get('/jobs', { params: p }),
  getJob:         (id: string)     => jobApi.get(`/jobs/${id}`),
  createJob:      (d: any)         => jobApi.post('/jobs', d),
  updateJob:      (id: string, d: any) => jobApi.put(`/jobs/${id}`, d),
  deleteJob:      (id: string)     => jobApi.delete(`/jobs/${id}`),
  myJobs:         ()               => jobApi.get('/jobs/my-jobs'),
  applyToJob:     (id: string, d: any) => jobApi.post(`/jobs/${id}/apply`, d),
  getApplications:(id: string)     => jobApi.get(`/jobs/${id}/applications`),
  myApplications: ()               => jobApi.get('/jobs/my-applications/list'),
  updateApp:      (id: string, d: any) => jobApi.patch(`/jobs/applications/${id}`, d),
  aiGenerateDesc: (p: any)         => jobApi.post('/jobs/ai/generate-description', null, { params: p }),
}

// ─── Resumes ───────────────────────────────────────────────────────────────
export const resumeService = {
  uploadResume:   (form: FormData)         => resumeApi.post('/resumes/upload', form),
  myResumes:      ()                       => resumeApi.get('/resumes/my-resumes'),
  getResume:      (id: string)             => resumeApi.get(`/resumes/${id}`),
  getDownloadUrl: (id: string)             => resumeApi.get(`/resumes/${id}/download-url`),
  scoreAgainstJob:(id: string, jobTitle: string, jobRequirements: string) => resumeApi.post(`/resumes/${id}/score-against-job`, null, { params: { job_title: jobTitle, job_requirements: jobRequirements } }),
  deleteResume:   (id: string)             => resumeApi.delete(`/resumes/${id}`),
}

// ─── Resume Builder ───────────────────────────────────────────────────────
export const resumeBuilderService = {
  create:      (d: any)                => resumeApi.post('/resume-builder', d),
  list:        ()                      => resumeApi.get('/resume-builder'),
  get:         (id: string)            => resumeApi.get(`/resume-builder/${id}`),
  update:      (id: string, d: any)    => resumeApi.put(`/resume-builder/${id}`, d),
  delete:      (id: string)            => resumeApi.delete(`/resume-builder/${id}`),
  aiEnhance:   (id: string, section: string) => resumeApi.post(`/resume-builder/${id}/ai-enhance`, null, { params: { section } }),
}

// ─── Notifications ─────────────────────────────────────────────────────────
export const notifService = {
  list:       (p?: any) => notifApi.get('/notifications', { params: p }),
  unreadCount:()        => notifApi.get('/notifications/unread-count'),
  markRead:   (id: string) => notifApi.patch(`/notifications/${id}/read`),
  markAllRead:()        => notifApi.patch('/notifications/read-all'),
}

// ─── Connections ──────────────────────────────────────────────────────────
export const connectionService = {
  sendRequest:    (userId: string)  => authApi.post(`/connections/request/${userId}`),
  accept:         (connId: string)  => authApi.patch(`/connections/${connId}/accept`),
  reject:         (connId: string)  => authApi.patch(`/connections/${connId}/reject`),
  remove:         (connId: string)  => authApi.delete(`/connections/${connId}`),
  list:           ()                => authApi.get('/connections'),
  pending:        ()                => authApi.get('/connections/pending'),
  sent:           ()                => authApi.get('/connections/sent'),
  status:         (userId: string)  => authApi.get(`/connections/status/${userId}`),
}

// ─── Follows ──────────────────────────────────────────────────────────────
export const followService = {
  follow:         (userId: string)  => authApi.post(`/follows/${userId}`),
  unfollow:       (userId: string)  => authApi.delete(`/follows/${userId}`),
  following:      ()                => authApi.get('/follows/following'),
  followers:      ()                => authApi.get('/follows/followers'),
  status:         (userId: string)  => authApi.get(`/follows/status/${userId}`),
  count:          (userId: string)  => authApi.get(`/follows/count/${userId}`),
}

// ─── People Discovery ─────────────────────────────────────────────────────
export const peopleService = {
  discover:    (p?: any) => authApi.get('/users/people', { params: p }),
}

// ─── Companies ────────────────────────────────────────────────────────────
export const companyService = {
  create:      (d: any)                => authApi.post('/companies', d),
  list:        (p?: any)               => authApi.get('/companies', { params: p }),
  get:         (slug: string)          => authApi.get(`/companies/${slug}`),
  update:      (slug: string, d: any)  => authApi.put(`/companies/${slug}`, d),
  uploadLogo:  (slug: string, form: FormData) => authApi.post(`/companies/${slug}/logo`, form),
  uploadBanner:(slug: string, form: FormData) => authApi.post(`/companies/${slug}/banner`, form),
}

// ─── Profile Photos ───────────────────────────────────────────────────────
export const photoService = {
  uploadAvatar:  (form: FormData) => authApi.post('/users/me/avatar', form),
  uploadBanner:  (form: FormData) => authApi.post('/users/me/banner', form),
}

// ─── Public Profile ───────────────────────────────────────────────────────
export const profileService = {
  getPublic:      (userId: string)  => authApi.get(`/users/profile/${userId}`),
}

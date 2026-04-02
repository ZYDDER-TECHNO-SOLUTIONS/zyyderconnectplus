import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  LayoutDashboard, Briefcase, FileText, FileEdit, Send, Bell, User, Users,
  Settings, LogOut, Menu, X, Sparkles, ChevronDown, Shield, Bookmark,
  Check, Search, Building2
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { notifService, connectionService } from '../../services/api'
import { formatDistanceToNow } from 'date-fns'
import clsx from 'clsx'

const NAV = {
  employee: [
    { to: '/dashboard',      icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/jobs',           icon: Briefcase,       label: 'Browse Jobs' },
    { to: '/saved-jobs',     icon: Bookmark,        label: 'Saved Jobs' },
    { to: '/applications',   icon: Send,            label: 'My Applications' },
    { to: '/people',         icon: Search,          label: 'People' },
    { to: '/connections',    icon: Users,           label: 'Connections' },
    { to: '/resumes',        icon: FileText,        label: 'My Resumes' },
    { to: '/resume-builder', icon: FileEdit,        label: 'Resume Builder' },
    { to: '/profile',        icon: User,            label: 'Profile' },
    { to: '/settings',       icon: Settings,        label: 'Settings' },
  ],
  employer: [
    { to: '/dashboard',         icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/jobs',              icon: Briefcase,       label: 'Job Listings' },
    { to: '/jobs/post',         icon: Sparkles,        label: 'Post a Job' },
    { to: '/company/settings',  icon: Building2,       label: 'Company Page' },
    { to: '/applications',      icon: Send,            label: 'Applications' },
    { to: '/profile',           icon: User,            label: 'Profile' },
    { to: '/settings',          icon: Settings,        label: 'Settings' },
  ],
  superadmin: [
    { to: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/jobs',         icon: Briefcase,       label: 'All Jobs' },
    { to: '/admin',        icon: Shield,          label: 'Admin Panel' },
    { to: '/profile',      icon: User,            label: 'Profile' },
    { to: '/settings',     icon: Settings,        label: 'Settings' },
  ],
}

function NotificationBell() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const qc = useQueryClient()

  const { data: unreadData } = useQuery({
    queryKey: ['notif-unread-count'],
    queryFn: () => notifService.unreadCount().then(r => r.data),
    refetchInterval: 30000,
  })

  const { data: notifications } = useQuery({
    queryKey: ['notif-list'],
    queryFn: () => notifService.list({ limit: 5 }).then(r => r.data),
    enabled: open,
  })

  const unreadCount = unreadData?.count ?? unreadData?.unread_count ?? 0

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const handleMarkAllRead = async () => {
    try {
      await notifService.markAllRead()
      qc.invalidateQueries({ queryKey: ['notif-unread-count'] })
      qc.invalidateQueries({ queryKey: ['notif-list'] })
    } catch { /* ignore */ }
  }

  const handleMarkRead = async (id: string) => {
    try {
      await notifService.markRead(id)
      qc.invalidateQueries({ queryKey: ['notif-unread-count'] })
      qc.invalidateQueries({ queryKey: ['notif-list'] })
    } catch { /* ignore */ }
  }

  const items = Array.isArray(notifications) ? notifications : notifications?.items ?? notifications?.data ?? []

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 relative transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 min-w-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl z-50 overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-display font-semibold text-sm text-slate-800 dark:text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-brand-600 font-medium hover:underline flex items-center gap-1"
              >
                <Check size={12} /> Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell size={28} className="mx-auto text-slate-200 dark:text-slate-700 mb-2" />
                <p className="text-sm text-slate-400">No notifications yet</p>
              </div>
            ) : (
              items.map((n: any) => (
                <button
                  key={n.id}
                  onClick={() => { if (!n.is_read) handleMarkRead(n.id) }}
                  className={clsx(
                    'w-full text-left px-4 py-3 border-b border-slate-50 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors',
                    !n.is_read && 'bg-brand-50/50 dark:bg-brand-900/10'
                  )}
                >
                  <div className="flex items-start gap-2">
                    {!n.is_read && (
                      <span className="w-2 h-2 rounded-full bg-brand-500 mt-1.5 flex-shrink-0" />
                    )}
                    <div className={clsx('min-w-0 flex-1', n.is_read && 'pl-4')}>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{n.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">{n.message}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                        {n.created_at ? formatDistanceToNow(new Date(n.created_at), { addSuffix: true }) : ''}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-800">
            <Link
              to="/applications"
              onClick={() => setOpen(false)}
              className="text-xs text-brand-600 font-medium hover:underline block text-center"
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AppLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navItems = NAV[user?.role ?? 'employee']

  // Fetch pending connection count for badge
  const { data: pendingConns } = useQuery({
    queryKey: ['connections-pending-count'],
    queryFn: () => connectionService.pending().then(r => {
      const data = r.data
      return Array.isArray(data) ? data.length : 0
    }),
    refetchInterval: 30000,
    enabled: user?.role === 'employee',
  })
  const pendingCount = typeof pendingConns === 'number' ? pendingConns : 0

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [sidebarOpen])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const closeSidebar = () => setSidebarOpen(false)

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-5 flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center shadow-lg shadow-brand-200 dark:shadow-none">
          <Sparkles size={16} className="text-white" />
        </div>
        <span className="font-display font-bold text-lg text-slate-800 dark:text-white">
          Sparklex<span className="text-brand-600">+</span>
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={closeSidebar}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                isActive
                  ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
              )
            }
          >
            <Icon size={18} />
            {label}
            {to === '/connections' && pendingCount > 0 && (
              <span className="ml-auto text-[10px] font-bold bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="p-3 mt-auto border-t border-slate-100 dark:border-slate-800">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay - full screen with slide animation */}
      <div
        className={clsx(
          'fixed inset-0 z-50 lg:hidden transition-opacity duration-300',
          sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
      >
        {/* Backdrop */}
        <div
          className={clsx(
            'absolute inset-0 bg-black/50 transition-opacity duration-300',
            sidebarOpen ? 'opacity-100' : 'opacity-0'
          )}
          onClick={closeSidebar}
        />
        {/* Sidebar panel */}
        <aside
          className={clsx(
            'relative w-72 sm:w-80 h-full bg-white dark:bg-slate-900 flex flex-col shadow-2xl transition-transform duration-300 ease-out',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <button
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            onClick={closeSidebar}
          >
            <X size={20} />
          </button>
          <SidebarContent />
        </aside>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-14 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center px-3 sm:px-4 gap-2 sm:gap-3 flex-shrink-0">
          <button className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-brand-600 flex items-center justify-center">
              <Sparkles size={12} className="text-white" />
            </div>
            <span className="font-display font-bold text-sm text-slate-800 dark:text-white">
              Sparklex<span className="text-brand-600">+</span>
            </span>
          </div>
          <div className="flex-1" />
          <NotificationBell />
          <NavLink to="/profile" className="flex items-center gap-2 pl-2 sm:pl-3 pr-1 sm:pr-2 py-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
            <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center text-white font-semibold text-xs">
              {user?.full_name?.[0]?.toUpperCase()}
            </div>
            <ChevronDown size={14} className="text-slate-400 hidden sm:block" />
          </NavLink>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

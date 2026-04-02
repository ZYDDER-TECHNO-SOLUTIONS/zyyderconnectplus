import { useState, useEffect, useCallback, useRef } from 'react'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import clsx from 'clsx'
import {
  Plus, Trash2, ChevronLeft, ChevronRight, Save, Eye, Sparkles,
  FileEdit, X, ArrowLeft, GripVertical, Check, Globe, Mail, Phone,
  MapPin, Linkedin, Briefcase, GraduationCap, Wrench, FolderOpen,
  Award, Languages, Heart, Users, Star,
} from 'lucide-react'
import { resumeBuilderService } from '../services/api'

// ─── Types ──────────────────────────────────────────────────────────────────

interface WorkExperience {
  job_title: string
  company: string
  location: string
  start_date: string
  end_date: string
  current: boolean
  description: string
  highlights: string[]
}

interface Education {
  degree: string
  field_of_study: string
  institution: string
  location: string
  start_year: string
  end_year: string
  gpa: string
  achievements: string[]
}

interface Project {
  title: string
  description: string
  technologies: string[]
  url: string
  start_date: string
  end_date: string
}

interface Certification {
  name: string
  organization: string
  issue_date: string
  expiry_date: string
  credential_url: string
}

interface LanguageEntry {
  language: string
  proficiency: string
}

interface AwardEntry {
  title: string
  issuer: string
  date: string
  description: string
}

interface VolunteerEntry {
  role: string
  organization: string
  start_date: string
  end_date: string
  description: string
}

interface ReferenceEntry {
  name: string
  title: string
  company: string
  email: string
  phone: string
}

interface ResumeFormData {
  title: string
  template: string
  personal: {
    full_name: string
    email: string
    phone: string
    location: string
    linkedin_url: string
    portfolio_url: string
  }
  summary: string
  work_experience: WorkExperience[]
  education: Education[]
  skills: {
    technical: string[]
    soft: string[]
    tools: string[]
    languages: string[]
  }
  projects: Project[]
  certifications: Certification[]
  languages: LanguageEntry[]
  awards: AwardEntry[]
  volunteer: VolunteerEntry[]
  references: ReferenceEntry[]
}

const DEFAULT_FORM: ResumeFormData = {
  title: 'My Resume',
  template: 'professional',
  personal: { full_name: '', email: '', phone: '', location: '', linkedin_url: '', portfolio_url: '' },
  summary: '',
  work_experience: [],
  education: [],
  skills: { technical: [], soft: [], tools: [], languages: [] },
  projects: [],
  certifications: [],
  languages: [],
  awards: [],
  volunteer: [],
  references: [],
}

const STEPS = [
  { label: 'Personal', icon: Users },
  { label: 'Summary', icon: FileEdit },
  { label: 'Experience', icon: Briefcase },
  { label: 'Education', icon: GraduationCap },
  { label: 'Skills', icon: Wrench },
  { label: 'Projects', icon: FolderOpen },
  { label: 'Certifications', icon: Award },
  { label: 'Languages', icon: Languages },
  { label: 'Additional', icon: Heart },
  { label: 'Preview', icon: Eye },
]

const PROFICIENCY_LEVELS = ['Native', 'Fluent', 'Advanced', 'Intermediate', 'Basic']

// Transform frontend form data → backend API format (flatten personal fields)
function toApiPayload(data: ResumeFormData) {
  const { personal, title, volunteer, ...rest } = data
  return {
    ...rest,
    full_name: personal.full_name || 'Untitled',
    email: personal.email || 'user@example.com',
    phone: personal.phone || null,
    location: personal.location || null,
    linkedin_url: personal.linkedin_url || null,
    portfolio_url: personal.portfolio_url || null,
    volunteer_experience: volunteer,
  }
}

// Transform backend API data → frontend form format (nest personal fields)
function fromApiPayload(api: any): Partial<ResumeFormData> {
  return {
    template: api.template || 'professional',
    personal: {
      full_name: api.full_name || '',
      email: api.email || '',
      phone: api.phone || '',
      location: api.location || '',
      linkedin_url: api.linkedin_url || '',
      portfolio_url: api.portfolio_url || '',
    },
    summary: api.summary || '',
    work_experience: api.work_experience || [],
    education: api.education || [],
    skills: api.skills || { technical: [], soft: [], tools: [], languages: [] },
    projects: api.projects || [],
    certifications: api.certifications || [],
    languages: api.languages || [],
    awards: api.awards || [],
    volunteer: api.volunteer_experience || [],
    references: api.references || [],
  }
}

// ─── Tag Input Component ────────────────────────────────────────────────────

function TagInput({ value, onChange, placeholder }: { value: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const [input, setInput] = useState('')

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const trimmed = input.trim()
      if (trimmed && !value.includes(trimmed)) {
        onChange([...value, trimmed])
      }
      setInput('')
    } else if (e.key === 'Backspace' && !input && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  const removeTag = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
  }

  return (
    <div className="input !py-2 !px-3 flex flex-wrap gap-1.5 min-h-[42px] cursor-text" onClick={(e) => (e.currentTarget.querySelector('input') as HTMLInputElement)?.focus()}>
      {value.map((tag, i) => (
        <span key={i} className="badge badge-blue flex items-center gap-1 !py-1">
          {tag}
          <button type="button" onClick={() => removeTag(i)} className="hover:text-brand-900 transition-colors">
            <X size={12} />
          </button>
        </span>
      ))}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={value.length === 0 ? placeholder : ''}
        className="flex-1 min-w-[120px] bg-transparent outline-none text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
      />
    </div>
  )
}

// ─── Bullet Points Input ────────────────────────────────────────────────────

function BulletListInput({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const addBullet = () => onChange([...value, ''])
  const removeBullet = (index: number) => onChange(value.filter((_, i) => i !== index))
  const updateBullet = (index: number, text: string) => {
    const updated = [...value]
    updated[index] = text
    onChange(updated)
  }

  return (
    <div className="space-y-2">
      {value.map((bullet, i) => (
        <div key={i} className="flex gap-2 items-start">
          <span className="mt-2.5 w-1.5 h-1.5 rounded-full bg-brand-400 flex-shrink-0" />
          <input
            value={bullet}
            onChange={(e) => updateBullet(i, e.target.value)}
            className="input flex-1"
            placeholder="Describe an achievement or responsibility..."
          />
          <button type="button" onClick={() => removeBullet(i)} className="mt-1.5 p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors">
            <Trash2 size={14} />
          </button>
        </div>
      ))}
      <button type="button" onClick={addBullet} className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
        <Plus size={14} /> Add bullet point
      </button>
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function ResumeBuilderPage() {
  const qc = useQueryClient()
  const [view, setView] = useState<'list' | 'editor'>('list')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [step, setStep] = useState(0)
  const [pdfResume, setPdfResume] = useState<any>(null)
  const lastSavedRef = useRef<string>('')
  const autoSaveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const form = useForm<ResumeFormData>({ defaultValues: DEFAULT_FORM })
  const { control, register, watch, setValue, getValues, handleSubmit, reset, formState: { errors } } = form

  // Field arrays
  const workFields = useFieldArray({ control, name: 'work_experience' })
  const eduFields = useFieldArray({ control, name: 'education' })
  const projectFields = useFieldArray({ control, name: 'projects' })
  const certFields = useFieldArray({ control, name: 'certifications' })
  const langFields = useFieldArray({ control, name: 'languages' })
  const awardFields = useFieldArray({ control, name: 'awards' })
  const volunteerFields = useFieldArray({ control, name: 'volunteer' })
  const referenceFields = useFieldArray({ control, name: 'references' })

  // ─── Queries & Mutations ────────────────────────────────────────────

  const { data: resumes, isLoading } = useQuery({
    queryKey: ['resume-builders'],
    queryFn: () => resumeBuilderService.list().then(r => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (d: ResumeFormData) => resumeBuilderService.create(toApiPayload(d)),
    onSuccess: (res) => {
      toast.success('Resume created!')
      setEditingId(res.data.id)
      qc.invalidateQueries({ queryKey: ['resume-builders'] })
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail || 'Failed to create resume'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => resumeBuilderService.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['resume-builders'] })
    },
    onError: (e: any) => toast.error(e?.response?.data?.detail || 'Failed to save'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => resumeBuilderService.delete(id),
    onSuccess: () => {
      toast.success('Resume deleted')
      qc.invalidateQueries({ queryKey: ['resume-builders'] })
    },
  })

  const aiEnhanceMutation = useMutation({
    mutationFn: ({ id, section }: { id: string; section: string }) => resumeBuilderService.aiEnhance(id, section),
    onSuccess: (res) => {
      toast.success('AI enhanced your content!')
      if (res.data?.summary) setValue('summary', res.data.summary)
    },
    onError: () => toast.error('AI enhancement failed'),
  })

  // ─── Auto-save ──────────────────────────────────────────────────────

  const saveToBackend = useCallback((silent = true) => {
    if (!editingId) return
    const data = getValues()
    const serialized = JSON.stringify(data)
    if (serialized === lastSavedRef.current) return
    lastSavedRef.current = serialized
    const apiData = toApiPayload(data)
    if (silent) {
      updateMutation.mutate({ id: editingId, data: apiData })
    } else {
      updateMutation.mutate({ id: editingId, data: apiData }, {
        onSuccess: () => toast.success('Resume saved!'),
      })
    }
  }, [editingId, getValues, updateMutation])

  useEffect(() => {
    if (view === 'editor' && editingId) {
      autoSaveTimerRef.current = setInterval(() => saveToBackend(true), 30000)
    }
    return () => {
      if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current)
    }
  }, [view, editingId, saveToBackend])

  // ─── Handlers ───────────────────────────────────────────────────────

  const handleCreateNew = () => {
    reset(DEFAULT_FORM)
    setStep(0)
    createMutation.mutate(DEFAULT_FORM, {
      onSuccess: (res) => {
        setEditingId(res.data.id)
        setView('editor')
      },
    })
  }

  const handleOpenResume = async (id: string) => {
    try {
      const res = await resumeBuilderService.get(id)
      const data = { ...DEFAULT_FORM, ...fromApiPayload(res.data) }
      reset(data)
      lastSavedRef.current = JSON.stringify(data)
      setEditingId(id)
      setStep(0)
      setView('editor')
    } catch {
      toast.error('Failed to load resume')
    }
  }

  const handleBackToList = () => {
    saveToBackend(true)
    setView('list')
    setEditingId(null)
  }

  const handleSave = () => saveToBackend(false)

  const handleViewPDF = async (r: any) => {
    // If raw API data, transform it; if already has full_name at top, use directly
    const data = r.full_name ? r : (await resumeBuilderService.get(r.id)).data
    setPdfResume(data)
  }

  const handlePrintPDF = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow || !pdfResume) return
    const r = pdfResume
    const skills = r.skills?.technical || (Array.isArray(r.skills) ? r.skills : [])
    const softSkills = r.skills?.soft || []
    const tools = r.skills?.tools || []
    const workExp = r.work_experience || []
    const edu = r.education || []
    const projects = r.projects || []
    const certs = r.certifications || []
    const langs = r.languages || []

    printWindow.document.write(`<!DOCTYPE html><html><head><title>${r.full_name || 'Resume'}</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Segoe UI', Tahoma, sans-serif; color: #1e293b; line-height: 1.5; padding: 40px; max-width: 800px; margin: 0 auto; }
      h1 { font-size: 28px; font-weight: 700; color: #1e293b; }
      h2 { font-size: 14px; font-weight: 600; color: #6366f1; text-transform: uppercase; letter-spacing: 1.5px; margin: 24px 0 10px; padding-bottom: 6px; border-bottom: 2px solid #e2e8f0; }
      h3 { font-size: 15px; font-weight: 600; color: #334155; }
      p { font-size: 13px; color: #475569; }
      .contact { font-size: 13px; color: #64748b; margin-top: 4px; }
      .contact span { margin-right: 16px; }
      .summary { font-size: 14px; color: #475569; margin-top: 8px; line-height: 1.6; }
      .exp-item { margin-bottom: 14px; }
      .exp-header { display: flex; justify-content: space-between; align-items: baseline; }
      .exp-date { font-size: 12px; color: #94a3b8; }
      .exp-company { font-size: 13px; color: #64748b; }
      .highlights { margin-top: 4px; padding-left: 16px; }
      .highlights li { font-size: 13px; color: #475569; margin-bottom: 2px; }
      .skills { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
      .skill { background: #f1f5f9; padding: 3px 10px; border-radius: 12px; font-size: 12px; color: #475569; }
      .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
      @media print { body { padding: 20px; } }
    </style></head><body>
    <h1>${r.full_name || ''}</h1>
    <div class="contact">
      ${r.email ? `<span>${r.email}</span>` : ''}
      ${r.phone ? `<span>${r.phone}</span>` : ''}
      ${r.location ? `<span>${r.location}</span>` : ''}
      ${r.linkedin_url ? `<span>${r.linkedin_url}</span>` : ''}
    </div>
    ${r.summary ? `<h2>Summary</h2><p class="summary">${r.summary}</p>` : ''}
    ${workExp.length ? `<h2>Experience</h2>${workExp.map((w: any) => `
      <div class="exp-item">
        <div class="exp-header"><h3>${w.job_title || w.title || ''}</h3><span class="exp-date">${w.start_date || ''} - ${w.current ? 'Present' : w.end_date || ''}</span></div>
        <p class="exp-company">${w.company || ''}${w.location ? ' · ' + w.location : ''}</p>
        ${w.description ? `<p style="margin-top:4px;font-size:13px;color:#475569">${w.description}</p>` : ''}
        ${w.highlights?.length ? `<ul class="highlights">${w.highlights.map((h: string) => `<li>${h}</li>`).join('')}</ul>` : ''}
      </div>
    `).join('')}` : ''}
    ${edu.length ? `<h2>Education</h2>${edu.map((e: any) => `
      <div class="exp-item">
        <div class="exp-header"><h3>${e.degree || ''} ${e.field_of_study ? 'in ' + e.field_of_study : ''}</h3><span class="exp-date">${e.start_year || ''} - ${e.end_year || ''}</span></div>
        <p class="exp-company">${e.institution || ''}</p>
        ${e.gpa ? `<p style="font-size:12px;color:#94a3b8">GPA: ${e.gpa}</p>` : ''}
      </div>
    `).join('')}` : ''}
    ${skills.length || softSkills.length || tools.length ? `<h2>Skills</h2><div class="skills">
      ${[...skills, ...softSkills, ...tools].map((s: string) => `<span class="skill">${s}</span>`).join('')}
    </div>` : ''}
    ${projects.length ? `<h2>Projects</h2>${projects.map((p: any) => `
      <div class="exp-item">
        <h3>${p.title || ''}</h3>
        ${p.description ? `<p>${p.description}</p>` : ''}
        ${p.technologies?.length ? `<div class="skills" style="margin-top:4px">${p.technologies.map((t: string) => `<span class="skill">${t}</span>`).join('')}</div>` : ''}
      </div>
    `).join('')}` : ''}
    ${certs.length ? `<h2>Certifications</h2>${certs.map((c: any) => `
      <div class="exp-item"><h3>${c.name || ''}</h3><p class="exp-company">${c.issuing_organization || ''} ${c.issue_date ? '· ' + c.issue_date : ''}</p></div>
    `).join('')}` : ''}
    ${langs.length ? `<h2>Languages</h2><div class="two-col">${langs.map((l: any) => `
      <p><strong>${l.language || ''}</strong> — ${l.proficiency || ''}</p>
    `).join('')}</div>` : ''}
    </body></html>`)
    printWindow.document.close()
    setTimeout(() => printWindow.print(), 500)
  }

  const nextStep = () => setStep((s) => Math.min(s + 1, STEPS.length - 1))
  const prevStep = () => setStep((s) => Math.max(s - 1, 0))

  // ─── List View ──────────────────────────────────────────────────────

  if (view === 'list') {
    return (
      <div className="max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display font-bold text-2xl text-slate-800 dark:text-white">Resume Builder</h1>
            <p className="text-slate-500 text-sm mt-1">Build professional resumes with structured data and AI assistance.</p>
          </div>
          <button onClick={handleCreateNew} disabled={createMutation.isPending} className="btn-primary">
            <Plus size={16} /> {createMutation.isPending ? 'Creating...' : 'Create New Resume'}
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="card p-5 h-24 animate-pulse bg-slate-100 dark:bg-slate-800" />
            ))}
          </div>
        ) : !resumes?.length ? (
          <div className="card p-16 text-center">
            <FileEdit size={48} className="mx-auto text-slate-200 dark:text-slate-700 mb-4" />
            <p className="text-slate-500 mb-4">No resumes yet. Create your first one to get started.</p>
            <button onClick={handleCreateNew} className="btn-primary mx-auto">
              <Plus size={16} /> Create Resume
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {resumes.map((r: any) => {
              const name = r.full_name || r.personal?.full_name || 'Untitled'
              const email = r.email || r.personal?.email || ''
              const skills = r.skills?.technical || (Array.isArray(r.skills) ? r.skills : [])
              return (
                <div key={r.id} className="card p-5 hover:shadow-md transition-shadow group">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center flex-shrink-0">
                      <FileEdit size={22} className="text-brand-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-800 dark:text-slate-100 truncate">{name}</h3>
                      {email && <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1"><Mail size={11} />{email}</p>}
                      {r.summary && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{r.summary}</p>}
                    </div>
                  </div>

                  {skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {skills.slice(0, 4).map((s: string) => (
                        <span key={s} className="badge badge-blue">{s}</span>
                      ))}
                      {skills.length > 4 && <span className="badge badge-gray">+{skills.length - 4}</span>}
                    </div>
                  )}

                  {/* Action Buttons - always visible */}
                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => handleOpenResume(r.id)}
                      className="btn-secondary text-xs py-1.5 px-3 flex-1 justify-center"
                    >
                      <FileEdit size={14} /> Edit
                    </button>
                    <button
                      onClick={() => handleViewPDF(r)}
                      className="btn-secondary text-xs py-1.5 px-3 flex-1 justify-center"
                    >
                      <Eye size={14} /> View PDF
                    </button>
                    <button
                      onClick={() => { if (confirm('Delete this resume?')) deleteMutation.mutate(r.id) }}
                      className="p-2 rounded-xl text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* PDF Preview Modal */}
        {pdfResume && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setPdfResume(null)}>
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-6 py-4 flex items-center justify-between z-10">
                <h2 className="font-display font-bold text-lg text-slate-800 dark:text-white">Resume Preview</h2>
                <div className="flex items-center gap-2">
                  <button onClick={handlePrintPDF} className="btn-primary text-sm py-2 px-4">
                    <Eye size={15} /> Print / Save PDF
                  </button>
                  <button onClick={() => setPdfResume(null)} className="btn-ghost p-2 rounded-xl">
                    <X size={18} />
                  </button>
                </div>
              </div>
              <div className="p-6 sm:p-8">
                {/* Resume Content */}
                <h1 className="text-2xl font-bold text-slate-800">{pdfResume.full_name}</h1>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500 mt-1">
                  {pdfResume.email && <span>{pdfResume.email}</span>}
                  {pdfResume.phone && <span>{pdfResume.phone}</span>}
                  {pdfResume.location && <span>{pdfResume.location}</span>}
                  {pdfResume.linkedin_url && <span>{pdfResume.linkedin_url}</span>}
                </div>

                {pdfResume.summary && (
                  <>
                    <h2 className="text-xs font-semibold text-brand-600 uppercase tracking-widest mt-6 mb-2 pb-1 border-b-2 border-slate-100">Summary</h2>
                    <p className="text-sm text-slate-600 leading-relaxed">{pdfResume.summary}</p>
                  </>
                )}

                {pdfResume.work_experience?.length > 0 && (
                  <>
                    <h2 className="text-xs font-semibold text-brand-600 uppercase tracking-widest mt-6 mb-2 pb-1 border-b-2 border-slate-100">Experience</h2>
                    {pdfResume.work_experience.map((w: any, i: number) => (
                      <div key={i} className="mb-4">
                        <div className="flex justify-between items-baseline">
                          <h3 className="font-semibold text-sm text-slate-800">{w.job_title || w.title}</h3>
                          <span className="text-xs text-slate-400">{w.start_date} — {w.current ? 'Present' : w.end_date}</span>
                        </div>
                        <p className="text-xs text-slate-500">{w.company}{w.location ? ' · ' + w.location : ''}</p>
                        {w.description && <p className="text-sm text-slate-600 mt-1">{w.description}</p>}
                        {w.highlights?.length > 0 && (
                          <ul className="mt-1 ml-4 list-disc">
                            {w.highlights.map((h: string, j: number) => <li key={j} className="text-sm text-slate-600">{h}</li>)}
                          </ul>
                        )}
                      </div>
                    ))}
                  </>
                )}

                {pdfResume.education?.length > 0 && (
                  <>
                    <h2 className="text-xs font-semibold text-brand-600 uppercase tracking-widest mt-6 mb-2 pb-1 border-b-2 border-slate-100">Education</h2>
                    {pdfResume.education.map((e: any, i: number) => (
                      <div key={i} className="mb-3">
                        <div className="flex justify-between items-baseline">
                          <h3 className="font-semibold text-sm text-slate-800">{e.degree} {e.field_of_study ? 'in ' + e.field_of_study : ''}</h3>
                          <span className="text-xs text-slate-400">{e.start_year} — {e.end_year}</span>
                        </div>
                        <p className="text-xs text-slate-500">{e.institution}</p>
                      </div>
                    ))}
                  </>
                )}

                {(() => {
                  const allSkills = [
                    ...(pdfResume.skills?.technical || []),
                    ...(pdfResume.skills?.soft || []),
                    ...(pdfResume.skills?.tools || []),
                    ...(Array.isArray(pdfResume.skills) ? pdfResume.skills : []),
                  ]
                  return allSkills.length > 0 ? (
                    <>
                      <h2 className="text-xs font-semibold text-brand-600 uppercase tracking-widest mt-6 mb-2 pb-1 border-b-2 border-slate-100">Skills</h2>
                      <div className="flex flex-wrap gap-1.5">
                        {allSkills.map((s: string) => (
                          <span key={s} className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600">{s}</span>
                        ))}
                      </div>
                    </>
                  ) : null
                })()}

                {pdfResume.certifications?.length > 0 && (
                  <>
                    <h2 className="text-xs font-semibold text-brand-600 uppercase tracking-widest mt-6 mb-2 pb-1 border-b-2 border-slate-100">Certifications</h2>
                    {pdfResume.certifications.map((c: any, i: number) => (
                      <div key={i} className="mb-2">
                        <h3 className="font-semibold text-sm text-slate-800">{c.name}</h3>
                        <p className="text-xs text-slate-500">{c.issuing_organization} {c.issue_date ? '· ' + c.issue_date : ''}</p>
                      </div>
                    ))}
                  </>
                )}

                {pdfResume.languages?.length > 0 && (
                  <>
                    <h2 className="text-xs font-semibold text-brand-600 uppercase tracking-widest mt-6 mb-2 pb-1 border-b-2 border-slate-100">Languages</h2>
                    <div className="grid grid-cols-2 gap-2">
                      {pdfResume.languages.map((l: any, i: number) => (
                        <p key={i} className="text-sm text-slate-600"><strong>{l.language}</strong> — {l.proficiency}</p>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ─── Editor View ────────────────────────────────────────────────────

  const watchedData = watch()

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={handleBackToList} className="btn-ghost !px-2">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <input
            {...register('title')}
            className="font-display font-bold text-2xl text-slate-800 dark:text-white bg-transparent outline-none w-full placeholder:text-slate-300"
            placeholder="Resume Title"
          />
        </div>
        <button onClick={handleSave} disabled={updateMutation.isPending} className="btn-primary">
          <Save size={16} /> {updateMutation.isPending ? 'Saving...' : 'Save'}
        </button>
      </div>

      {/* Step Progress */}
      <div className="card p-4 mb-6 overflow-x-auto">
        <div className="flex items-center gap-1 min-w-max">
          {STEPS.map((s, i) => {
            const Icon = s.icon
            const isActive = i === step
            const isCompleted = i < step
            return (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={clsx(
                  'flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap',
                  isActive && 'bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300',
                  isCompleted && !isActive && 'text-brand-600 dark:text-brand-400',
                  !isActive && !isCompleted && 'text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800'
                )}
              >
                <div className={clsx(
                  'w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0',
                  isActive && 'bg-brand-600 text-white',
                  isCompleted && !isActive && 'bg-brand-100 text-brand-600 dark:bg-brand-900 dark:text-brand-400',
                  !isActive && !isCompleted && 'bg-slate-100 text-slate-400 dark:bg-slate-800'
                )}>
                  {isCompleted && !isActive ? <Check size={12} /> : <Icon size={12} />}
                </div>
                <span className="hidden sm:inline">{s.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="card p-6 mb-6">
        {/* Step 0: Personal Info */}
        {step === 0 && (
          <div>
            <h2 className="font-display font-semibold text-lg text-slate-800 dark:text-white mb-1">Personal Information</h2>
            <p className="text-sm text-slate-500 mb-6">Basic contact details that appear at the top of your resume.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Full Name <span className="text-red-500">*</span></label>
                <input {...register('personal.full_name', { required: true })} className={clsx('input', errors.personal?.full_name && 'ring-2 ring-red-400')} placeholder="John Doe" />
                {errors.personal?.full_name && <p className="text-xs text-red-500 mt-1">Full name is required</p>}
              </div>
              <div>
                <label className="label">Email <span className="text-red-500">*</span></label>
                <input {...register('personal.email', { required: true, pattern: /^\S+@\S+\.\S+$/ })} type="email" className={clsx('input', errors.personal?.email && 'ring-2 ring-red-400')} placeholder="john@example.com" />
                {errors.personal?.email && <p className="text-xs text-red-500 mt-1">Valid email is required</p>}
              </div>
              <div>
                <label className="label">Phone</label>
                <input {...register('personal.phone')} className="input" placeholder="+1 (555) 123-4567" />
              </div>
              <div>
                <label className="label">Location</label>
                <input {...register('personal.location')} className="input" placeholder="San Francisco, CA" />
              </div>
              <div>
                <label className="label">LinkedIn URL</label>
                <input {...register('personal.linkedin_url')} className="input" placeholder="https://linkedin.com/in/johndoe" />
              </div>
              <div>
                <label className="label">Portfolio / Website</label>
                <input {...register('personal.portfolio_url')} className="input" placeholder="https://johndoe.dev" />
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Professional Summary */}
        {step === 1 && (
          <div>
            <h2 className="font-display font-semibold text-lg text-slate-800 dark:text-white mb-1">Professional Summary</h2>
            <p className="text-sm text-slate-500 mb-6">A brief overview of your professional background and career goals.</p>
            <div>
              <label className="label">Summary</label>
              <textarea {...register('summary')} rows={6} className="input !py-3" placeholder="Results-driven software engineer with 5+ years of experience..." />
            </div>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  saveToBackend(true)
                  aiEnhanceMutation.mutate({ id: editingId, section: 'summary' })
                }}
                disabled={aiEnhanceMutation.isPending}
                className="btn-secondary mt-4"
              >
                <Sparkles size={16} className="text-brand-500" />
                {aiEnhanceMutation.isPending ? 'Enhancing...' : 'Enhance with AI'}
              </button>
            )}
          </div>
        )}

        {/* Step 2: Work Experience */}
        {step === 2 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-display font-semibold text-lg text-slate-800 dark:text-white mb-1">Work Experience</h2>
                <p className="text-sm text-slate-500">Add your professional work history, starting with the most recent.</p>
              </div>
              <button
                type="button"
                onClick={() => workFields.append({ job_title: '', company: '', location: '', start_date: '', end_date: '', current: false, description: '', highlights: [] })}
                className="btn-secondary"
              >
                <Plus size={16} /> Add Position
              </button>
            </div>

            {workFields.fields.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                <Briefcase size={40} className="mx-auto mb-3 text-slate-200 dark:text-slate-700" />
                <p>No work experience added yet.</p>
              </div>
            )}

            <div className="space-y-6">
              {workFields.fields.map((field, index) => (
                <div key={field.id} className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-slate-700 dark:text-slate-200 text-sm">Position {index + 1}</h3>
                    <button type="button" onClick={() => workFields.remove(index)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 transition-colors">
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Job Title <span className="text-red-500">*</span></label>
                      <input {...register(`work_experience.${index}.job_title`, { required: true })} className="input" placeholder="Senior Software Engineer" />
                    </div>
                    <div>
                      <label className="label">Company <span className="text-red-500">*</span></label>
                      <input {...register(`work_experience.${index}.company`, { required: true })} className="input" placeholder="Google" />
                    </div>
                    <div>
                      <label className="label">Location</label>
                      <input {...register(`work_experience.${index}.location`)} className="input" placeholder="Mountain View, CA" />
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="label">Start Date</label>
                        <input {...register(`work_experience.${index}.start_date`)} type="month" className="input" />
                      </div>
                      <div className="flex-1">
                        <label className="label">End Date</label>
                        <input
                          {...register(`work_experience.${index}.end_date`)}
                          type="month"
                          className="input"
                          disabled={watch(`work_experience.${index}.current`)}
                        />
                      </div>
                    </div>
                    <div className="md:col-span-2 flex items-center gap-2">
                      <input
                        type="checkbox"
                        {...register(`work_experience.${index}.current`)}
                        id={`current-${index}`}
                        className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                      />
                      <label htmlFor={`current-${index}`} className="text-sm text-slate-600 dark:text-slate-400">Currently working here</label>
                    </div>
                    <div className="md:col-span-2">
                      <label className="label">Description</label>
                      <textarea {...register(`work_experience.${index}.description`)} rows={3} className="input !py-3" placeholder="Brief description of your role and responsibilities..." />
                    </div>
                    <div className="md:col-span-2">
                      <label className="label">Highlights / Achievements</label>
                      <Controller
                        control={control}
                        name={`work_experience.${index}.highlights`}
                        render={({ field: { value, onChange } }) => (
                          <BulletListInput value={value || []} onChange={onChange} />
                        )}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Education */}
        {step === 3 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-display font-semibold text-lg text-slate-800 dark:text-white mb-1">Education</h2>
                <p className="text-sm text-slate-500">Add your educational background.</p>
              </div>
              <button
                type="button"
                onClick={() => eduFields.append({ degree: '', field_of_study: '', institution: '', location: '', start_year: '', end_year: '', gpa: '', achievements: [] })}
                className="btn-secondary"
              >
                <Plus size={16} /> Add Education
              </button>
            </div>

            {eduFields.fields.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                <GraduationCap size={40} className="mx-auto mb-3 text-slate-200 dark:text-slate-700" />
                <p>No education entries added yet.</p>
              </div>
            )}

            <div className="space-y-6">
              {eduFields.fields.map((field, index) => (
                <div key={field.id} className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-slate-700 dark:text-slate-200 text-sm">Education {index + 1}</h3>
                    <button type="button" onClick={() => eduFields.remove(index)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 transition-colors">
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Degree <span className="text-red-500">*</span></label>
                      <input {...register(`education.${index}.degree`, { required: true })} className="input" placeholder="Bachelor of Science" />
                    </div>
                    <div>
                      <label className="label">Field of Study</label>
                      <input {...register(`education.${index}.field_of_study`)} className="input" placeholder="Computer Science" />
                    </div>
                    <div>
                      <label className="label">Institution <span className="text-red-500">*</span></label>
                      <input {...register(`education.${index}.institution`, { required: true })} className="input" placeholder="Stanford University" />
                    </div>
                    <div>
                      <label className="label">Location</label>
                      <input {...register(`education.${index}.location`)} className="input" placeholder="Stanford, CA" />
                    </div>
                    <div>
                      <label className="label">Start Year</label>
                      <input {...register(`education.${index}.start_year`)} className="input" placeholder="2018" />
                    </div>
                    <div>
                      <label className="label">End Year</label>
                      <input {...register(`education.${index}.end_year`)} className="input" placeholder="2022" />
                    </div>
                    <div>
                      <label className="label">GPA</label>
                      <input {...register(`education.${index}.gpa`)} className="input" placeholder="3.8 / 4.0" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="label">Achievements</label>
                      <Controller
                        control={control}
                        name={`education.${index}.achievements`}
                        render={({ field: { value, onChange } }) => (
                          <BulletListInput value={value || []} onChange={onChange} />
                        )}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Skills */}
        {step === 4 && (
          <div>
            <h2 className="font-display font-semibold text-lg text-slate-800 dark:text-white mb-1">Skills</h2>
            <p className="text-sm text-slate-500 mb-6">Type a skill and press Enter to add it.</p>
            <div className="space-y-5">
              <div>
                <label className="label">Technical Skills</label>
                <Controller control={control} name="skills.technical" render={({ field: { value, onChange } }) => (
                  <TagInput value={value || []} onChange={onChange} placeholder="e.g. React, Node.js, AWS..." />
                )} />
              </div>
              <div>
                <label className="label">Soft Skills</label>
                <Controller control={control} name="skills.soft" render={({ field: { value, onChange } }) => (
                  <TagInput value={value || []} onChange={onChange} placeholder="e.g. Leadership, Communication..." />
                )} />
              </div>
              <div>
                <label className="label">Tools & Technologies</label>
                <Controller control={control} name="skills.tools" render={({ field: { value, onChange } }) => (
                  <TagInput value={value || []} onChange={onChange} placeholder="e.g. Docker, Git, Figma..." />
                )} />
              </div>
              <div>
                <label className="label">Programming Languages</label>
                <Controller control={control} name="skills.languages" render={({ field: { value, onChange } }) => (
                  <TagInput value={value || []} onChange={onChange} placeholder="e.g. JavaScript, Python, Go..." />
                )} />
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Projects */}
        {step === 5 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-display font-semibold text-lg text-slate-800 dark:text-white mb-1">Projects</h2>
                <p className="text-sm text-slate-500">Showcase notable projects you have worked on.</p>
              </div>
              <button
                type="button"
                onClick={() => projectFields.append({ title: '', description: '', technologies: [], url: '', start_date: '', end_date: '' })}
                className="btn-secondary"
              >
                <Plus size={16} /> Add Project
              </button>
            </div>

            {projectFields.fields.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                <FolderOpen size={40} className="mx-auto mb-3 text-slate-200 dark:text-slate-700" />
                <p>No projects added yet.</p>
              </div>
            )}

            <div className="space-y-6">
              {projectFields.fields.map((field, index) => (
                <div key={field.id} className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-slate-700 dark:text-slate-200 text-sm">Project {index + 1}</h3>
                    <button type="button" onClick={() => projectFields.remove(index)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 transition-colors">
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Project Title</label>
                      <input {...register(`projects.${index}.title`)} className="input" placeholder="E-commerce Platform" />
                    </div>
                    <div>
                      <label className="label">URL</label>
                      <input {...register(`projects.${index}.url`)} className="input" placeholder="https://github.com/..." />
                    </div>
                    <div>
                      <label className="label">Start Date</label>
                      <input {...register(`projects.${index}.start_date`)} type="month" className="input" />
                    </div>
                    <div>
                      <label className="label">End Date</label>
                      <input {...register(`projects.${index}.end_date`)} type="month" className="input" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="label">Description</label>
                      <textarea {...register(`projects.${index}.description`)} rows={3} className="input !py-3" placeholder="Brief description of the project..." />
                    </div>
                    <div className="md:col-span-2">
                      <label className="label">Technologies Used</label>
                      <Controller control={control} name={`projects.${index}.technologies`} render={({ field: { value, onChange } }) => (
                        <TagInput value={value || []} onChange={onChange} placeholder="e.g. React, Node.js, PostgreSQL..." />
                      )} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 6: Certifications */}
        {step === 6 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-display font-semibold text-lg text-slate-800 dark:text-white mb-1">Certifications</h2>
                <p className="text-sm text-slate-500">Add any professional certifications you have earned.</p>
              </div>
              <button
                type="button"
                onClick={() => certFields.append({ name: '', organization: '', issue_date: '', expiry_date: '', credential_url: '' })}
                className="btn-secondary"
              >
                <Plus size={16} /> Add Certification
              </button>
            </div>

            {certFields.fields.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                <Award size={40} className="mx-auto mb-3 text-slate-200 dark:text-slate-700" />
                <p>No certifications added yet.</p>
              </div>
            )}

            <div className="space-y-6">
              {certFields.fields.map((field, index) => (
                <div key={field.id} className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-slate-700 dark:text-slate-200 text-sm">Certification {index + 1}</h3>
                    <button type="button" onClick={() => certFields.remove(index)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 transition-colors">
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Certification Name</label>
                      <input {...register(`certifications.${index}.name`)} className="input" placeholder="AWS Solutions Architect" />
                    </div>
                    <div>
                      <label className="label">Issuing Organization</label>
                      <input {...register(`certifications.${index}.organization`)} className="input" placeholder="Amazon Web Services" />
                    </div>
                    <div>
                      <label className="label">Issue Date</label>
                      <input {...register(`certifications.${index}.issue_date`)} type="month" className="input" />
                    </div>
                    <div>
                      <label className="label">Expiry Date</label>
                      <input {...register(`certifications.${index}.expiry_date`)} type="month" className="input" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="label">Credential URL</label>
                      <input {...register(`certifications.${index}.credential_url`)} className="input" placeholder="https://www.credential.net/..." />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 7: Languages */}
        {step === 7 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-display font-semibold text-lg text-slate-800 dark:text-white mb-1">Languages</h2>
                <p className="text-sm text-slate-500">Add languages you speak and your proficiency level.</p>
              </div>
              <button
                type="button"
                onClick={() => langFields.append({ language: '', proficiency: 'Intermediate' })}
                className="btn-secondary"
              >
                <Plus size={16} /> Add Language
              </button>
            </div>

            {langFields.fields.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                <Languages size={40} className="mx-auto mb-3 text-slate-200 dark:text-slate-700" />
                <p>No languages added yet.</p>
              </div>
            )}

            <div className="space-y-4">
              {langFields.fields.map((field, index) => (
                <div key={field.id} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                  <div className="flex-1">
                    <label className="label">Language</label>
                    <input {...register(`languages.${index}.language`)} className="input" placeholder="English" />
                  </div>
                  <div className="flex-1">
                    <label className="label">Proficiency</label>
                    <select {...register(`languages.${index}.proficiency`)} className="input">
                      {PROFICIENCY_LEVELS.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                  <button type="button" onClick={() => langFields.remove(index)} className="mt-6 p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 transition-colors">
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 8: Additional */}
        {step === 8 && (
          <div>
            <h2 className="font-display font-semibold text-lg text-slate-800 dark:text-white mb-1">Additional Sections</h2>
            <p className="text-sm text-slate-500 mb-6">Optional sections to further strengthen your resume.</p>

            {/* Awards */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-slate-700 dark:text-slate-200 flex items-center gap-2">
                  <Star size={16} className="text-amber-500" /> Awards & Honors
                </h3>
                <button type="button" onClick={() => awardFields.append({ title: '', issuer: '', date: '', description: '' })} className="btn-ghost text-xs">
                  <Plus size={14} /> Add Award
                </button>
              </div>
              <div className="space-y-4">
                {awardFields.fields.map((field, index) => (
                  <div key={field.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-slate-400">Award {index + 1}</span>
                      <button type="button" onClick={() => awardFields.remove(index)} className="p-1 rounded text-red-400 hover:text-red-600">
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="label text-xs">Title</label>
                        <input {...register(`awards.${index}.title`)} className="input" placeholder="Employee of the Year" />
                      </div>
                      <div>
                        <label className="label text-xs">Issuer</label>
                        <input {...register(`awards.${index}.issuer`)} className="input" placeholder="Company Name" />
                      </div>
                      <div>
                        <label className="label text-xs">Date</label>
                        <input {...register(`awards.${index}.date`)} type="month" className="input" />
                      </div>
                      <div className="md:col-span-3">
                        <label className="label text-xs">Description</label>
                        <input {...register(`awards.${index}.description`)} className="input" placeholder="Brief description..." />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Volunteer Experience */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-slate-700 dark:text-slate-200 flex items-center gap-2">
                  <Heart size={16} className="text-pink-500" /> Volunteer Experience
                </h3>
                <button type="button" onClick={() => volunteerFields.append({ role: '', organization: '', start_date: '', end_date: '', description: '' })} className="btn-ghost text-xs">
                  <Plus size={14} /> Add Volunteer
                </button>
              </div>
              <div className="space-y-4">
                {volunteerFields.fields.map((field, index) => (
                  <div key={field.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-slate-400">Volunteer {index + 1}</span>
                      <button type="button" onClick={() => volunteerFields.remove(index)} className="p-1 rounded text-red-400 hover:text-red-600">
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="label text-xs">Role</label>
                        <input {...register(`volunteer.${index}.role`)} className="input" placeholder="Volunteer Coordinator" />
                      </div>
                      <div>
                        <label className="label text-xs">Organization</label>
                        <input {...register(`volunteer.${index}.organization`)} className="input" placeholder="Red Cross" />
                      </div>
                      <div>
                        <label className="label text-xs">Start Date</label>
                        <input {...register(`volunteer.${index}.start_date`)} type="month" className="input" />
                      </div>
                      <div>
                        <label className="label text-xs">End Date</label>
                        <input {...register(`volunteer.${index}.end_date`)} type="month" className="input" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="label text-xs">Description</label>
                        <textarea {...register(`volunteer.${index}.description`)} rows={2} className="input !py-2" placeholder="Describe your contributions..." />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* References */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-slate-700 dark:text-slate-200 flex items-center gap-2">
                  <Users size={16} className="text-blue-500" /> References
                </h3>
                <button type="button" onClick={() => referenceFields.append({ name: '', title: '', company: '', email: '', phone: '' })} className="btn-ghost text-xs">
                  <Plus size={14} /> Add Reference
                </button>
              </div>
              <div className="space-y-4">
                {referenceFields.fields.map((field, index) => (
                  <div key={field.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-slate-400">Reference {index + 1}</span>
                      <button type="button" onClick={() => referenceFields.remove(index)} className="p-1 rounded text-red-400 hover:text-red-600">
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="label text-xs">Name</label>
                        <input {...register(`references.${index}.name`)} className="input" placeholder="Jane Smith" />
                      </div>
                      <div>
                        <label className="label text-xs">Title</label>
                        <input {...register(`references.${index}.title`)} className="input" placeholder="Engineering Manager" />
                      </div>
                      <div>
                        <label className="label text-xs">Company</label>
                        <input {...register(`references.${index}.company`)} className="input" placeholder="Google" />
                      </div>
                      <div>
                        <label className="label text-xs">Email</label>
                        <input {...register(`references.${index}.email`)} type="email" className="input" placeholder="jane@example.com" />
                      </div>
                      <div>
                        <label className="label text-xs">Phone</label>
                        <input {...register(`references.${index}.phone`)} className="input" placeholder="+1 (555) 987-6543" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 9: Preview */}
        {step === 9 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-display font-semibold text-lg text-slate-800 dark:text-white mb-1">Preview & Save</h2>
                <p className="text-sm text-slate-500">Review your resume before saving.</p>
              </div>
              <div className="flex items-center gap-3">
                <div>
                  <label className="label text-xs">Template</label>
                  <select {...register('template')} className="input !py-1.5 text-xs">
                    <option value="professional">Professional</option>
                    <option value="modern" disabled>Modern (Coming Soon)</option>
                    <option value="minimal" disabled>Minimal (Coming Soon)</option>
                  </select>
                </div>
                <button onClick={handleSave} disabled={updateMutation.isPending} className="btn-primary mt-5">
                  <Save size={16} /> {updateMutation.isPending ? 'Saving...' : 'Save Resume'}
                </button>
              </div>
            </div>

            {/* Resume Preview */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-8 md:p-12 max-w-3xl mx-auto">
              {/* Header */}
              <div className="text-center border-b border-slate-200 dark:border-slate-700 pb-6 mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-2">
                  {watchedData.personal?.full_name || 'Your Name'}
                </h1>
                <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                  {watchedData.personal?.email && (
                    <span className="flex items-center gap-1"><Mail size={13} /> {watchedData.personal.email}</span>
                  )}
                  {watchedData.personal?.phone && (
                    <span className="flex items-center gap-1"><Phone size={13} /> {watchedData.personal.phone}</span>
                  )}
                  {watchedData.personal?.location && (
                    <span className="flex items-center gap-1"><MapPin size={13} /> {watchedData.personal.location}</span>
                  )}
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-brand-600 mt-2">
                  {watchedData.personal?.linkedin_url && (
                    <a href={watchedData.personal.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:underline">
                      <Linkedin size={13} /> LinkedIn
                    </a>
                  )}
                  {watchedData.personal?.portfolio_url && (
                    <a href={watchedData.personal.portfolio_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:underline">
                      <Globe size={13} /> Portfolio
                    </a>
                  )}
                </div>
              </div>

              {/* Summary */}
              {watchedData.summary && (
                <div className="mb-6">
                  <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">Professional Summary</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{watchedData.summary}</p>
                </div>
              )}

              {/* Work Experience */}
              {watchedData.work_experience?.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-3">Work Experience</h2>
                  <div className="space-y-4">
                    {watchedData.work_experience.map((w, i) => (
                      <div key={i}>
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{w.job_title || 'Job Title'}</h3>
                            <p className="text-sm text-brand-600">{w.company}{w.location ? ` - ${w.location}` : ''}</p>
                          </div>
                          <p className="text-xs text-slate-400 flex-shrink-0">
                            {w.start_date || 'Start'} - {w.current ? 'Present' : (w.end_date || 'End')}
                          </p>
                        </div>
                        {w.description && <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{w.description}</p>}
                        {w.highlights?.length > 0 && (
                          <ul className="mt-1.5 space-y-0.5">
                            {w.highlights.filter(h => h).map((h, j) => (
                              <li key={j} className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2">
                                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-400 flex-shrink-0" />
                                {h}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Education */}
              {watchedData.education?.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-3">Education</h2>
                  <div className="space-y-3">
                    {watchedData.education.map((e, i) => (
                      <div key={i}>
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
                              {e.degree}{e.field_of_study ? ` in ${e.field_of_study}` : ''}
                            </h3>
                            <p className="text-sm text-brand-600">{e.institution}{e.location ? ` - ${e.location}` : ''}</p>
                          </div>
                          <p className="text-xs text-slate-400 flex-shrink-0">
                            {e.start_year || ''}{e.start_year && e.end_year ? ' - ' : ''}{e.end_year || ''}
                          </p>
                        </div>
                        {e.gpa && <p className="text-xs text-slate-500 mt-0.5">GPA: {e.gpa}</p>}
                        {e.achievements?.length > 0 && (
                          <ul className="mt-1 space-y-0.5">
                            {e.achievements.filter(a => a).map((a, j) => (
                              <li key={j} className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2">
                                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-400 flex-shrink-0" />
                                {a}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Skills */}
              {(watchedData.skills?.technical?.length > 0 || watchedData.skills?.soft?.length > 0 || watchedData.skills?.tools?.length > 0 || watchedData.skills?.languages?.length > 0) && (
                <div className="mb-6">
                  <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-3">Skills</h2>
                  <div className="space-y-2">
                    {watchedData.skills.technical?.length > 0 && (
                      <div>
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Technical: </span>
                        <span className="text-sm text-slate-600 dark:text-slate-400">{watchedData.skills.technical.join(', ')}</span>
                      </div>
                    )}
                    {watchedData.skills.soft?.length > 0 && (
                      <div>
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Soft Skills: </span>
                        <span className="text-sm text-slate-600 dark:text-slate-400">{watchedData.skills.soft.join(', ')}</span>
                      </div>
                    )}
                    {watchedData.skills.tools?.length > 0 && (
                      <div>
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Tools: </span>
                        <span className="text-sm text-slate-600 dark:text-slate-400">{watchedData.skills.tools.join(', ')}</span>
                      </div>
                    )}
                    {watchedData.skills.languages?.length > 0 && (
                      <div>
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Programming: </span>
                        <span className="text-sm text-slate-600 dark:text-slate-400">{watchedData.skills.languages.join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Projects */}
              {watchedData.projects?.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-3">Projects</h2>
                  <div className="space-y-3">
                    {watchedData.projects.map((p, i) => (
                      <div key={i}>
                        <div className="flex justify-between items-start">
                          <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
                            {p.title || 'Project Title'}
                            {p.url && (
                              <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-brand-600 font-normal ml-2 text-xs hover:underline">
                                Link
                              </a>
                            )}
                          </h3>
                          <p className="text-xs text-slate-400 flex-shrink-0">
                            {p.start_date || ''}{p.start_date && p.end_date ? ' - ' : ''}{p.end_date || ''}
                          </p>
                        </div>
                        {p.description && <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">{p.description}</p>}
                        {p.technologies?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {p.technologies.map((t, j) => (
                              <span key={j} className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">{t}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Certifications */}
              {watchedData.certifications?.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-3">Certifications</h2>
                  <div className="space-y-2">
                    {watchedData.certifications.map((c, i) => (
                      <div key={i} className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
                            {c.name || 'Certification'}
                            {c.credential_url && (
                              <a href={c.credential_url} target="_blank" rel="noopener noreferrer" className="text-brand-600 font-normal ml-2 text-xs hover:underline">
                                Verify
                              </a>
                            )}
                          </h3>
                          <p className="text-sm text-slate-500">{c.organization}</p>
                        </div>
                        <p className="text-xs text-slate-400 flex-shrink-0">
                          {c.issue_date || ''}{c.expiry_date ? ` - ${c.expiry_date}` : ''}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Languages */}
              {watchedData.languages?.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-3">Languages</h2>
                  <div className="flex flex-wrap gap-3">
                    {watchedData.languages.map((l, i) => (
                      <span key={i} className="text-sm text-slate-600 dark:text-slate-400">
                        <span className="font-medium text-slate-800 dark:text-slate-200">{l.language || 'Language'}</span>
                        {l.proficiency ? ` (${l.proficiency})` : ''}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Awards */}
              {watchedData.awards?.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-3">Awards & Honors</h2>
                  <div className="space-y-2">
                    {watchedData.awards.map((a, i) => (
                      <div key={i}>
                        <div className="flex justify-between items-start">
                          <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{a.title || 'Award'}</h3>
                          <p className="text-xs text-slate-400">{a.date}</p>
                        </div>
                        {a.issuer && <p className="text-sm text-slate-500">{a.issuer}</p>}
                        {a.description && <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">{a.description}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Volunteer */}
              {watchedData.volunteer?.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-3">Volunteer Experience</h2>
                  <div className="space-y-3">
                    {watchedData.volunteer.map((v, i) => (
                      <div key={i}>
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{v.role || 'Role'}</h3>
                            <p className="text-sm text-brand-600">{v.organization}</p>
                          </div>
                          <p className="text-xs text-slate-400 flex-shrink-0">
                            {v.start_date || ''}{v.start_date && v.end_date ? ' - ' : ''}{v.end_date || ''}
                          </p>
                        </div>
                        {v.description && <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">{v.description}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* References */}
              {watchedData.references?.length > 0 && (
                <div>
                  <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-3">References</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {watchedData.references.map((r, i) => (
                      <div key={i} className="text-sm">
                        <p className="font-semibold text-slate-800 dark:text-slate-100">{r.name || 'Name'}</p>
                        <p className="text-slate-500">{r.title}{r.company ? ` at ${r.company}` : ''}</p>
                        {r.email && <p className="text-slate-400 text-xs">{r.email}</p>}
                        {r.phone && <p className="text-slate-400 text-xs">{r.phone}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty state */}
              {!watchedData.personal?.full_name && !watchedData.summary && watchedData.work_experience?.length === 0 && watchedData.education?.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                  <Eye size={40} className="mx-auto mb-3 text-slate-200 dark:text-slate-700" />
                  <p>Fill in your details in the previous steps to see a preview here.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Step Navigation */}
      <div className="flex items-center justify-between">
        <button onClick={prevStep} disabled={step === 0} className="btn-secondary">
          <ChevronLeft size={16} /> Previous
        </button>
        <span className="text-sm text-slate-400">
          Step {step + 1} of {STEPS.length}
        </span>
        <button onClick={nextStep} disabled={step === STEPS.length - 1} className="btn-primary">
          Next <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}

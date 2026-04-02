import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Sparkles, Plus, X, Eye, EyeOff, Save, MapPin, Briefcase, DollarSign, Calendar, Star, CheckCircle, Clock, Users, AlertTriangle, ShieldAlert } from 'lucide-react'
import { jobService } from '../services/api'
import { useAuthStore } from '../store/authStore'

const JOB_TYPES = ['full_time','part_time','contract','internship','remote','hybrid']
const EXP_LEVELS = ['entry','junior','mid','senior','lead','executive']

export default function PostJobPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const [loading, setLoading] = useState(false)
  const [draftLoading, setDraftLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [skills, setSkills] = useState<string[]>([])
  const [benefits, setBenefits] = useState<string[]>([])
  const [skillInput, setSkillInput] = useState('')
  const [benefitInput, setBenefitInput] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [isFeatured, setIsFeatured] = useState(false)
  const [contentPolicyAgreed, setContentPolicyAgreed] = useState(false)

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      title: '', description: '', requirements: '', responsibilities: '',
      location: '', job_type: 'full_time', experience_level: 'mid',
      salary_min: '', salary_max: '', salary_currency: 'USD',
      company_name: user?.company_name || '',
      application_deadline: '',
    }
  })

  const title = watch('title')
  const description = watch('description')
  const requirements = watch('requirements')
  const responsibilities = watch('responsibilities')
  const jobType = watch('job_type')
  const location = watch('location')
  const experienceLevel = watch('experience_level')
  const salaryMin = watch('salary_min')
  const salaryMax = watch('salary_max')
  const salaryCurrency = watch('salary_currency')
  const companyName = watch('company_name')
  const applicationDeadline = watch('application_deadline')

  const addSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills(s => [...s, skillInput.trim()])
      setSkillInput('')
    }
  }

  const addBenefit = () => {
    if (benefitInput.trim() && !benefits.includes(benefitInput.trim())) {
      setBenefits(b => [...b, benefitInput.trim()])
      setBenefitInput('')
    }
  }

  const handleAiGenerate = async () => {
    if (!title) return toast.error('Enter a job title first')
    setAiLoading(true)
    try {
      const r = await jobService.aiGenerateDesc({ title, company: companyName || 'My Company', skills: skills.join(','), job_type: jobType })
      const d = r.data
      setValue('description', d.description)
      setValue('requirements', d.requirements)
      setValue('responsibilities', d.responsibilities)
      toast.success('AI-generated description ready!')
    } catch {
      toast.error('AI generation failed')
    } finally {
      setAiLoading(false)
    }
  }

  const submitJob = async (data: any, status: 'active' | 'draft') => {
    const setLoad = status === 'draft' ? setDraftLoading : setLoading
    setLoad(true)
    try {
      const payload = {
        ...data,
        status,
        salary_min: data.salary_min ? parseInt(data.salary_min) : undefined,
        salary_max: data.salary_max ? parseInt(data.salary_max) : undefined,
        skills_required: skills,
        benefits,
        is_featured: isFeatured,
        application_deadline: data.application_deadline || undefined,
        company_name: data.company_name || undefined,
      }
      const res = await jobService.createJob(payload)
      toast.success(status === 'draft' ? 'Job saved as draft!' : 'Job posted successfully!')
      navigate(`/jobs/${res.data.id}`)
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to post job')
    } finally {
      setLoad(false)
    }
  }

  const onSubmit = async (data: any) => {
    await submitJob(data, 'active')
  }

  const onSaveDraft = async () => {
    const data = {
      title, description, requirements, responsibilities,
      location, job_type: jobType, experience_level: experienceLevel,
      salary_min: salaryMin, salary_max: salaryMax, salary_currency: salaryCurrency,
      company_name: companyName, application_deadline: applicationDeadline,
    }
    await submitJob(data, 'draft')
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-4 sm:mb-6">
        <h1 className="font-display font-bold text-xl sm:text-2xl text-slate-800 dark:text-white">Post a Job</h1>
        <p className="text-slate-500 text-xs sm:text-sm mt-1">Reach thousands of qualified candidates</p>
      </div>

      {/* Content Policy Warning Banner */}
      <div className="flex items-start gap-3 p-3 sm:p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
        <ShieldAlert size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-red-700 dark:text-red-300 font-medium">
          Content Policy: Job postings containing offensive, discriminatory, or inappropriate content will be removed and may result in account suspension.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
        {/* Basic Info */}
        <div className="card p-4 sm:p-6 space-y-4">
          <h2 className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs flex items-center justify-center font-bold">1</span>
            Basic Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Job Title *</label>
              <input {...register('title', { required: 'Title is required' })} className="input" placeholder="e.g. Senior React Developer" />
              {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message as string}</p>}
            </div>
            <div>
              <label className="label">Company Name</label>
              <input {...register('company_name')} className="input" placeholder="e.g. Acme Corp" />
            </div>
            <div>
              <label className="label">Location *</label>
              <input {...register('location', { required: true })} className="input" placeholder="e.g. San Francisco, CA or Remote" />
            </div>
            <div>
              <label className="label">Application Deadline</label>
              <input {...register('application_deadline')} type="date" className="input" />
            </div>
            <div>
              <label className="label">Job Type</label>
              <select {...register('job_type')} className="input">
                {JOB_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Experience Level</label>
              <select {...register('experience_level')} className="input">
                {EXP_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Min Salary (USD)</label>
              <input {...register('salary_min')} type="number" className="input" placeholder="60000" />
            </div>
            <div>
              <label className="label">Max Salary (USD)</label>
              <input {...register('salary_max')} type="number" className="input" placeholder="90000" />
            </div>
          </div>

          {/* Is Featured Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-2">
              <Star size={16} className="text-amber-500" />
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Feature this job</p>
                <p className="text-xs text-slate-500">Featured jobs appear at the top of search results</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsFeatured(!isFeatured)}
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${isFeatured ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-600'}`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${isFeatured ? 'translate-x-5' : 'translate-x-0'}`}
              />
            </button>
          </div>
        </div>

        {/* Skills */}
        <div className="card p-4 sm:p-6 space-y-4">
          <h2 className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs flex items-center justify-center font-bold">2</span>
            Required Skills
          </h2>
          <div className="flex gap-2">
            <input value={skillInput} onChange={e => setSkillInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())}
              className="input flex-1" placeholder="e.g. React, Python, AWS..." />
            <button type="button" onClick={addSkill} className="btn-secondary px-3 flex-shrink-0"><Plus size={16} /></button>
          </div>
          <div className="flex flex-wrap gap-2">
            {skills.map(s => (
              <span key={s} className="badge badge-blue items-center gap-1">
                {s}
                <button type="button" onClick={() => setSkills(sk => sk.filter(x => x !== s))} className="ml-1 hover:text-red-500"><X size={11} /></button>
              </span>
            ))}
          </div>
        </div>

        {/* AI Content */}
        <div className="card p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h2 className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs flex items-center justify-center font-bold">3</span>
              Job Description
            </h2>
            <button type="button" onClick={handleAiGenerate} disabled={aiLoading} className="btn-secondary text-sm py-2 w-full sm:w-auto justify-center">
              <Sparkles size={15} className="text-brand-500" />
              {aiLoading ? 'Generating...' : 'Generate with AI'}
            </button>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="label">Description *</label>
              <span className={`text-xs ${(description?.length ?? 0) > 2000 ? 'text-red-500' : 'text-slate-400'}`}>
                {description?.length ?? 0} / 3000
              </span>
            </div>
            <textarea {...register('description', { required: true })} className="input h-32 resize-none" placeholder="Overview of the company and role..." />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label className="label">Requirements *</label>
              <span className={`text-xs ${(requirements?.length ?? 0) > 2000 ? 'text-red-500' : 'text-slate-400'}`}>
                {requirements?.length ?? 0} / 3000
              </span>
            </div>
            <textarea {...register('requirements', { required: true })} className="input h-28 resize-none" placeholder="Must-have qualifications and experience..." />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label className="label">Responsibilities</label>
              <span className={`text-xs ${(responsibilities?.length ?? 0) > 2000 ? 'text-red-500' : 'text-slate-400'}`}>
                {responsibilities?.length ?? 0} / 3000
              </span>
            </div>
            <textarea {...register('responsibilities')} className="input h-24 resize-none" placeholder="Day-to-day tasks and duties..." />
          </div>
        </div>

        {/* Benefits */}
        <div className="card p-4 sm:p-6 space-y-4">
          <h2 className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs flex items-center justify-center font-bold">4</span>
            Benefits
          </h2>
          <div className="flex gap-2">
            <input value={benefitInput} onChange={e => setBenefitInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addBenefit())}
              className="input flex-1" placeholder="e.g. Health Insurance, 401k..." />
            <button type="button" onClick={addBenefit} className="btn-secondary px-3 flex-shrink-0"><Plus size={16} /></button>
          </div>
          <div className="flex flex-wrap gap-2">
            {benefits.map(b => (
              <span key={b} className="badge badge-green items-center gap-1">
                {b}
                <button type="button" onClick={() => setBenefits(bs => bs.filter(x => x !== b))} className="ml-1 hover:text-red-500"><X size={11} /></button>
              </span>
            ))}
          </div>
        </div>

        {/* Preview Toggle */}
        <div className="card p-4">
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="btn-secondary w-full justify-center"
          >
            {showPreview ? <EyeOff size={16} /> : <Eye size={16} />}
            {showPreview ? 'Hide Preview' : 'Preview Job Posting'}
          </button>
        </div>

        {/* Preview Section - styled like JobDetailPage */}
        {showPreview && (
          <div className="card border-2 border-brand-200 dark:border-brand-800 overflow-hidden">
            {/* Preview banner */}
            <div className="bg-brand-50 dark:bg-brand-900/30 px-4 sm:px-6 py-2.5 border-b border-brand-200 dark:border-brand-800 flex items-center gap-2 text-brand-600">
              <Eye size={16} />
              <span className="text-sm font-semibold">Live Preview</span>
            </div>

            {/* Header - matches JobDetailPage layout */}
            <div className="p-4 sm:p-7">
              <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-5">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold text-xl sm:text-2xl shadow-lg flex-shrink-0">
                  {(companyName || 'C')[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0 w-full">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <h1 className="font-display font-bold text-xl sm:text-2xl text-slate-800 dark:text-white">{title || 'Job Title'}</h1>
                      <p className="text-slate-500 mt-0.5">{companyName || 'Company Name'}</p>
                    </div>
                    {isFeatured && <span className="badge badge-amber flex-shrink-0"><Star size={11} className="mr-1" />Featured</span>}
                  </div>
                  <div className="flex flex-wrap gap-2 sm:gap-4 mt-3 text-xs sm:text-sm text-slate-500">
                    {location && <span className="flex items-center gap-1 sm:gap-1.5"><MapPin size={14} />{location}</span>}
                    <span className="flex items-center gap-1 sm:gap-1.5"><Briefcase size={14} />{jobType.replace('_', ' ')}</span>
                    <span className="flex items-center gap-1 sm:gap-1.5"><Clock size={14} />Just posted</span>
                    <span className="flex items-center gap-1 sm:gap-1.5"><Eye size={14} />0 views</span>
                    <span className="flex items-center gap-1 sm:gap-1.5"><Users size={14} />0 applicants</span>
                  </div>
                </div>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2 mt-4 sm:mt-5 pt-4 sm:pt-5 border-t border-slate-100 dark:border-slate-700">
                <span className="badge badge-blue capitalize">{experienceLevel}</span>
                <span className="badge badge-gray capitalize">{jobType.replace('_', ' ')}</span>
                {salaryMin && (
                  <span className="badge badge-green flex items-center gap-1">
                    <DollarSign size={11} />{Number(salaryMin).toLocaleString()}{salaryMax ? `\u2013${Number(salaryMax).toLocaleString()}` : ''} {salaryCurrency}/yr
                  </span>
                )}
              </div>
            </div>

            {/* Body - 2 column layout like JobDetailPage */}
            <div className="px-4 sm:px-7 pb-4 sm:pb-7">
              <div className="flex flex-col md:grid md:grid-cols-3 gap-4">
                {/* Main content */}
                <div className="md:col-span-2 space-y-4">
                  {description && (
                    <div className="card p-4 sm:p-6 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                      <h2 className="font-display font-semibold text-base sm:text-lg text-slate-800 dark:text-white mb-3">About This Role</h2>
                      <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed whitespace-pre-wrap">{description}</p>
                    </div>
                  )}
                  {requirements && (
                    <div className="card p-4 sm:p-6 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                      <h2 className="font-display font-semibold text-base sm:text-lg text-slate-800 dark:text-white mb-3">Requirements</h2>
                      <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed whitespace-pre-wrap">{requirements}</p>
                    </div>
                  )}
                  {responsibilities && (
                    <div className="card p-4 sm:p-6 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                      <h2 className="font-display font-semibold text-base sm:text-lg text-slate-800 dark:text-white mb-3">Responsibilities</h2>
                      <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed whitespace-pre-wrap">{responsibilities}</p>
                    </div>
                  )}
                </div>

                {/* Sidebar */}
                <div className="space-y-4">
                  {skills.length > 0 && (
                    <div className="card p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                      <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-3 text-sm">Required Skills</h3>
                      <div className="flex flex-wrap gap-1.5">
                        {skills.map(s => <span key={s} className="badge badge-blue">{s}</span>)}
                      </div>
                    </div>
                  )}
                  {benefits.length > 0 && (
                    <div className="card p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                      <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-3 text-sm">Benefits</h3>
                      <ul className="space-y-1.5">
                        {benefits.map(b => (
                          <li key={b} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                            <CheckCircle size={14} className="text-emerald-500 flex-shrink-0" />{b}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {applicationDeadline && (
                    <div className="card p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                      <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-1 text-sm">Application Deadline</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                        <Calendar size={14} className="text-red-400" />
                        {new Date(applicationDeadline).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {!title && !description && !requirements && (
                <p className="text-slate-400 text-sm text-center py-8">Fill in the form above to see a preview of your job posting.</p>
              )}
            </div>
          </div>
        )}

        {/* Content Moderation Consent */}
        <div className="card p-4 sm:p-6 border-amber-200 dark:border-amber-800">
          <div className="flex items-start gap-3 mb-4">
            <AlertTriangle size={20} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-slate-700 dark:text-slate-200 text-sm">Content Policy Agreement</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                By publishing this job posting, you confirm that:
              </p>
              <ul className="text-sm text-slate-600 dark:text-slate-400 mt-2 space-y-1.5 list-disc list-inside">
                <li>The content does not contain any offensive, discriminatory, or sexually explicit material</li>
                <li>The job listing complies with employment laws and regulations</li>
                <li>All information provided is accurate and truthful</li>
                <li>You understand that violations may result in account suspension or legal action</li>
              </ul>
            </div>
          </div>
          <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <input
              type="checkbox"
              checked={contentPolicyAgreed}
              onChange={(e) => setContentPolicyAgreed(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
              I agree to the content policy and confirm this posting is appropriate
            </span>
          </label>
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-3">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary justify-center">Cancel</button>
          <button type="button" onClick={onSaveDraft} disabled={draftLoading} className="btn-secondary justify-center flex items-center gap-2">
            <Save size={15} />
            {draftLoading ? 'Saving...' : 'Save as Draft'}
          </button>
          <button type="submit" disabled={loading || !contentPolicyAgreed} className="btn-primary flex-1 justify-center py-3 disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? 'Publishing...' : 'Publish Job'}
          </button>
        </div>
      </form>
    </div>
  )
}

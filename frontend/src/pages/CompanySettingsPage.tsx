import { useState, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  Building2, Save, Camera, Image, Plus, X, Globe, MapPin, Calendar,
  Tag, Users, Briefcase
} from 'lucide-react'
import { companyService } from '../services/api'
import { useAuthStore } from '../store/authStore'

const INDUSTRIES = [
  'Technology', 'Healthcare', 'Finance', 'Education', 'Manufacturing', 'Retail', 'Other'
]

const COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-500', '500+']

export default function CompanySettingsPage() {
  const user = useAuthStore((s) => s.user)
  const qc = useQueryClient()
  const logoRef = useRef<HTMLInputElement>(null)
  const bannerRef = useRef<HTMLInputElement>(null)

  const [specialties, setSpecialties] = useState<string[]>([])
  const [specialtyInput, setSpecialtyInput] = useState('')
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)

  // Try to load existing company
  const { data: companyData, isLoading } = useQuery({
    queryKey: ['my-company'],
    queryFn: async () => {
      try {
        // Try to get by user's company name slug or list and find own
        const res = await companyService.list({ owner: 'me' })
        const companies = Array.isArray(res.data) ? res.data : res.data?.items ?? res.data?.companies ?? []
        return companies[0] ?? null
      } catch {
        return null
      }
    },
  })

  const company = companyData

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      description: '',
      industry: 'Technology',
      company_size: '1-10',
      website: '',
      location: '',
      founded_year: '',
    },
  })

  // Populate form when company loads
  useEffect(() => {
    if (company) {
      reset({
        name: company.name ?? '',
        description: company.description ?? '',
        industry: company.industry ?? 'Technology',
        company_size: company.company_size ?? '1-10',
        website: company.website ?? '',
        location: company.location ?? '',
        founded_year: company.founded_year?.toString() ?? '',
      })
      setSpecialties(Array.isArray(company.specialties) ? company.specialties : [])
      if (company.logo_url) setLogoPreview(company.logo_url)
      if (company.banner_url) setBannerPreview(company.banner_url)
    }
  }, [company, reset])

  const createMut = useMutation({
    mutationFn: (d: any) => companyService.create(d),
    onSuccess: () => {
      toast.success('Company page created!')
      qc.invalidateQueries({ queryKey: ['my-company'] })
    },
    onError: (err: any) => toast.error(err?.response?.data?.detail || 'Failed to create company'),
  })

  const updateMut = useMutation({
    mutationFn: (d: any) => companyService.update(company!.slug, d),
    onSuccess: () => {
      toast.success('Company page updated!')
      qc.invalidateQueries({ queryKey: ['my-company'] })
    },
    onError: (err: any) => toast.error(err?.response?.data?.detail || 'Failed to update company'),
  })

  const logoUploadMut = useMutation({
    mutationFn: (form: FormData) => companyService.uploadLogo(company!.slug, form),
    onSuccess: (res) => {
      toast.success('Logo uploaded!')
      if (res.data?.logo_url) setLogoPreview(res.data.logo_url)
      qc.invalidateQueries({ queryKey: ['my-company'] })
    },
    onError: () => toast.error('Failed to upload logo'),
  })

  const bannerUploadMut = useMutation({
    mutationFn: (form: FormData) => companyService.uploadBanner(company!.slug, form),
    onSuccess: (res) => {
      toast.success('Banner uploaded!')
      if (res.data?.banner_url) setBannerPreview(res.data.banner_url)
      qc.invalidateQueries({ queryKey: ['my-company'] })
    },
    onError: () => toast.error('Failed to upload banner'),
  })

  const addSpecialty = () => {
    if (specialtyInput.trim() && !specialties.includes(specialtyInput.trim())) {
      setSpecialties(s => [...s, specialtyInput.trim()])
      setSpecialtyInput('')
    }
  }

  const onSubmit = (data: any) => {
    const payload = {
      ...data,
      founded_year: data.founded_year ? parseInt(data.founded_year) : undefined,
      specialties,
    }
    if (company) {
      updateMut.mutate(payload)
    } else {
      createMut.mutate(payload)
    }
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!company) {
      // Preview only before company is created
      const reader = new FileReader()
      reader.onload = () => setLogoPreview(reader.result as string)
      reader.readAsDataURL(file)
      return
    }
    const form = new FormData()
    form.append('file', file)
    logoUploadMut.mutate(form)
    // Show local preview immediately
    const reader = new FileReader()
    reader.onload = () => setLogoPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!company) {
      const reader = new FileReader()
      reader.onload = () => setBannerPreview(reader.result as string)
      reader.readAsDataURL(file)
      return
    }
    const form = new FormData()
    form.append('file', file)
    bannerUploadMut.mutate(form)
    const reader = new FileReader()
    reader.onload = () => setBannerPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  const isSubmitting = createMut.isPending || updateMut.isPending

  return (
    <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display font-bold text-xl sm:text-2xl text-slate-800 dark:text-white flex items-center gap-2">
          <Building2 size={22} className="text-brand-600" />
          {company ? 'Edit Company Page' : 'Create Your Company Page'}
        </h1>
        <p className="text-slate-500 text-xs sm:text-sm mt-1">
          {company ? 'Update your company information' : 'Set up your company profile to attract top talent'}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
        {/* Banner Upload */}
        <div className="card overflow-hidden">
          <div
            className="h-32 sm:h-44 relative group cursor-pointer"
            onClick={() => bannerRef.current?.click()}
          >
            {bannerPreview ? (
              <img src={bannerPreview} alt="Banner" className="w-full h-full object-cover" />
            ) : (
              <div
                className="w-full h-full"
                style={{
                  background: 'linear-gradient(135deg, #4f46e5, #7c3aed, #6366f1)',
                }}
              />
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
              <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-sm font-medium flex items-center gap-2 bg-black/50 px-4 py-2 rounded-xl">
                <Image size={16} /> Change Cover
              </span>
            </div>
            <input
              ref={bannerRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleBannerChange}
            />
          </div>

          {/* Logo Upload */}
          <div className="px-4 sm:px-6 pb-4 -mt-10 sm:-mt-12">
            <div
              className="relative w-20 h-20 sm:w-24 sm:h-24 group cursor-pointer"
              onClick={() => logoRef.current?.click()}
            >
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt="Logo"
                  className="w-full h-full rounded-2xl object-cover border-4 border-white dark:border-slate-900 shadow-xl bg-white"
                />
              ) : (
                <div className="w-full h-full rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold text-3xl border-4 border-white dark:border-slate-900 shadow-xl">
                  <Building2 size={32} />
                </div>
              )}
              <div className="absolute inset-0 rounded-2xl bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center border-4 border-transparent">
                <Camera size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <input
                ref={logoRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoChange}
              />
            </div>
            <p className="text-xs text-slate-400 mt-2">Click logo or banner to upload</p>
          </div>
        </div>

        {/* Basic Info */}
        <div className="card p-4 sm:p-6 space-y-4">
          <h2 className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs flex items-center justify-center font-bold">1</span>
            Company Information
          </h2>

          <div>
            <label className="label">Company Name *</label>
            <div className="relative">
              <Building2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                {...register('name', { required: 'Company name is required' })}
                className="input pl-9"
                placeholder="e.g. Acme Corp"
              />
            </div>
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message as string}</p>}
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              {...register('description')}
              className="input h-28 resize-none"
              placeholder="Tell people about your company, mission, and culture..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Industry</label>
              <select {...register('industry')} className="input">
                {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Company Size</label>
              <select {...register('company_size')} className="input">
                {COMPANY_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Website</label>
              <div className="relative">
                <Globe size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  {...register('website')}
                  className="input pl-9"
                  placeholder="https://example.com"
                />
              </div>
            </div>
            <div>
              <label className="label">Location</label>
              <div className="relative">
                <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  {...register('location')}
                  className="input pl-9"
                  placeholder="San Francisco, CA"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="label">Founded Year</label>
            <div className="relative">
              <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                {...register('founded_year')}
                type="number"
                className="input pl-9"
                placeholder="e.g. 2020"
                min={1800}
                max={new Date().getFullYear()}
              />
            </div>
          </div>
        </div>

        {/* Specialties */}
        <div className="card p-4 sm:p-6 space-y-4">
          <h2 className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs flex items-center justify-center font-bold">2</span>
            Specialties
          </h2>
          <div className="flex gap-2">
            <input
              value={specialtyInput}
              onChange={e => setSpecialtyInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSpecialty())}
              className="input flex-1"
              placeholder="e.g. Cloud Computing, AI, Data Analytics..."
            />
            <button type="button" onClick={addSpecialty} className="btn-secondary px-3 flex-shrink-0">
              <Plus size={16} />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {specialties.map(s => (
              <span key={s} className="badge badge-blue items-center gap-1">
                {s}
                <button
                  type="button"
                  onClick={() => setSpecialties(sp => sp.filter(x => x !== s))}
                  className="ml-1 hover:text-red-500"
                >
                  <X size={11} />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex flex-col-reverse sm:flex-row gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary flex-1 justify-center py-3"
          >
            <Save size={15} />
            {isSubmitting ? 'Saving...' : company ? 'Save Changes' : 'Create Company Page'}
          </button>
        </div>
      </form>
    </div>
  )
}

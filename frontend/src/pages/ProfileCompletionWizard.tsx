import { useState, KeyboardEvent } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  User, Briefcase, GraduationCap, Sparkles, Heart, ChevronRight,
  ChevronLeft, X, Plus, Trash2, Check, PartyPopper
} from 'lucide-react'
import toast from 'react-hot-toast'
import { authService } from '../services/api'
import { useAuthStore } from '../store/authStore'
import { useNavigate } from 'react-router-dom'

interface WizardForm {
  headline: string
  bio: string
  location: string
  phone: string
  current_title: string
  current_company: string
  current_location: string
  current_start_date: string
  currently_working: boolean
  past_experience: { title: string; company: string; start_date: string; end_date: string }[]
  education: { degree: string; institution: string; field: string; start_year: string; end_year: string }[]
  skills: string[]
  hobbies: string[]
}

const STEPS = [
  { label: 'Basic Info', icon: User },
  { label: 'Current Role', icon: Briefcase },
  { label: 'Past Experience', icon: Briefcase },
  { label: 'Education', icon: GraduationCap },
  { label: 'Skills', icon: Sparkles },
  { label: 'Hobbies', icon: Heart },
  { label: 'Complete!', icon: Check },
]

export default function ProfileCompletionWizard({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0)
  const [skillInput, setSkillInput] = useState('')
  const [hobbyInput, setHobbyInput] = useState('')
  const navigate = useNavigate()
  const updateUser = useAuthStore((s) => s.updateUser)
  const qc = useQueryClient()

  const { register, handleSubmit, watch, setValue, control, getValues } = useForm<WizardForm>({
    defaultValues: {
      headline: '',
      bio: '',
      location: '',
      phone: '',
      current_title: '',
      current_company: '',
      current_location: '',
      current_start_date: '',
      currently_working: true,
      past_experience: [],
      education: [],
      skills: [],
      hobbies: [],
    },
  })

  const { fields: pastFields, append: addPast, remove: removePast } = useFieldArray({
    control,
    name: 'past_experience',
  })

  const { fields: eduFields, append: addEdu, remove: removeEdu } = useFieldArray({
    control,
    name: 'education',
  })

  const skills = watch('skills')
  const hobbies = watch('hobbies')

  const saveMut = useMutation({
    mutationFn: (data: any) => authService.updateMe(data),
    onSuccess: (res) => {
      const updated = res.data?.user ?? res.data
      if (updated) updateUser(updated)
      qc.invalidateQueries({ queryKey: ['me'] })
      toast.success('Profile completed!')
    },
    onError: () => toast.error('Failed to save profile'),
  })

  const handleNext = () => {
    if (step < STEPS.length - 1) setStep(step + 1)
  }

  const handleBack = () => {
    if (step > 0) setStep(step - 1)
  }

  const handleSkip = () => {
    if (step < STEPS.length - 2) setStep(step + 1)
    else handleFinish()
  }

  const handleFinish = () => {
    const vals = getValues()
    const payload: any = {
      headline: vals.headline || undefined,
      bio: vals.bio || undefined,
      location: vals.location || undefined,
      phone: vals.phone || undefined,
      skills: vals.skills.length > 0 ? vals.skills : undefined,
      hobbies: vals.hobbies.length > 0 ? vals.hobbies : undefined,
      profile_completed: true,
    }

    if (vals.current_title || vals.current_company) {
      payload.current_experience = {
        title: vals.current_title,
        company: vals.current_company,
        location: vals.current_location,
        start_date: vals.current_start_date,
        is_current: vals.currently_working,
      }
    }

    if (vals.past_experience.length > 0) {
      payload.past_experience = vals.past_experience.filter(e => e.title || e.company)
    }

    if (vals.education.length > 0) {
      payload.education = vals.education.filter(e => e.degree || e.institution)
    }

    // Remove undefined values
    Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k])

    saveMut.mutate(payload)
    setStep(STEPS.length - 1)
  }

  const addSkill = (value: string) => {
    const trimmed = value.trim()
    if (trimmed && !skills.includes(trimmed)) {
      setValue('skills', [...skills, trimmed])
    }
    setSkillInput('')
  }

  const removeSkill = (index: number) => {
    setValue('skills', skills.filter((_: any, i: number) => i !== index))
  }

  const addHobby = (value: string) => {
    const trimmed = value.trim()
    if (trimmed && !hobbies.includes(trimmed)) {
      setValue('hobbies', [...hobbies, trimmed])
    }
    setHobbyInput('')
  }

  const removeHobby = (index: number) => {
    setValue('hobbies', hobbies.filter((_: any, i: number) => i !== index))
  }

  const handleSkillKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addSkill(skillInput)
    }
  }

  const handleHobbyKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addHobby(hobbyInput)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold text-lg text-slate-800 dark:text-white">Complete Your Profile</h2>
            <button onClick={onComplete} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Progress */}
          <div className="flex items-center gap-1">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                  i <= step ? 'bg-brand-600' : 'bg-slate-200 dark:bg-slate-700'
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Step {step + 1} of {STEPS.length} - {STEPS[step].label}
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6">
          {/* Step 0: Basic Info */}
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Headline</label>
                <input
                  {...register('headline')}
                  placeholder="e.g. Full Stack Developer | React Enthusiast"
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Bio</label>
                <textarea
                  {...register('bio')}
                  rows={3}
                  placeholder="Tell us about yourself..."
                  className="input resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Location</label>
                <input
                  {...register('location')}
                  placeholder="e.g. New York, NY"
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone</label>
                <input
                  {...register('phone')}
                  placeholder="e.g. +1 (555) 123-4567"
                  className="input"
                />
              </div>
            </div>
          )}

          {/* Step 1: Current Experience */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Job Title</label>
                <input
                  {...register('current_title')}
                  placeholder="e.g. Software Engineer"
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Company</label>
                <input
                  {...register('current_company')}
                  placeholder="e.g. Acme Corp"
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Location</label>
                <input
                  {...register('current_location')}
                  placeholder="e.g. San Francisco, CA"
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Start Date</label>
                <input
                  {...register('current_start_date')}
                  type="date"
                  className="input"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  {...register('currently_working')}
                  type="checkbox"
                  className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-sm text-slate-600 dark:text-slate-300">I'm currently working here</span>
              </label>
            </div>
          )}

          {/* Step 2: Past Experience */}
          {step === 2 && (
            <div className="space-y-4">
              {pastFields.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-4">No past experience added yet.</p>
              )}
              {pastFields.map((field, index) => (
                <div key={field.id} className="p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3 relative">
                  <button
                    type="button"
                    onClick={() => removePast(index)}
                    className="absolute top-2 right-2 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                  <input
                    {...register(`past_experience.${index}.title`)}
                    placeholder="Job Title"
                    className="input text-sm"
                  />
                  <input
                    {...register(`past_experience.${index}.company`)}
                    placeholder="Company"
                    className="input text-sm"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      {...register(`past_experience.${index}.start_date`)}
                      type="date"
                      placeholder="Start"
                      className="input text-sm"
                    />
                    <input
                      {...register(`past_experience.${index}.end_date`)}
                      type="date"
                      placeholder="End"
                      className="input text-sm"
                    />
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addPast({ title: '', company: '', start_date: '', end_date: '' })}
                className="btn-secondary w-full text-sm flex items-center justify-center gap-2"
              >
                <Plus size={16} /> Add Past Experience
              </button>
            </div>
          )}

          {/* Step 3: Education */}
          {step === 3 && (
            <div className="space-y-4">
              {eduFields.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-4">No education added yet.</p>
              )}
              {eduFields.map((field, index) => (
                <div key={field.id} className="p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3 relative">
                  <button
                    type="button"
                    onClick={() => removeEdu(index)}
                    className="absolute top-2 right-2 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                  <input
                    {...register(`education.${index}.degree`)}
                    placeholder="Degree (e.g. B.S. Computer Science)"
                    className="input text-sm"
                  />
                  <input
                    {...register(`education.${index}.institution`)}
                    placeholder="Institution"
                    className="input text-sm"
                  />
                  <input
                    {...register(`education.${index}.field`)}
                    placeholder="Field of Study"
                    className="input text-sm"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      {...register(`education.${index}.start_year`)}
                      placeholder="Start Year"
                      className="input text-sm"
                    />
                    <input
                      {...register(`education.${index}.end_year`)}
                      placeholder="End Year"
                      className="input text-sm"
                    />
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addEdu({ degree: '', institution: '', field: '', start_year: '', end_year: '' })}
                className="btn-secondary w-full text-sm flex items-center justify-center gap-2"
              >
                <Plus size={16} /> Add Education
              </button>
            </div>
          )}

          {/* Step 4: Skills */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Add your skills (press Enter or comma to add)
                </label>
                <input
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={handleSkillKeyDown}
                  placeholder="e.g. React, TypeScript, Python..."
                  className="input"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill: string, i: number) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 text-sm px-3 py-1 rounded-full bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300 font-medium"
                  >
                    {skill}
                    <button type="button" onClick={() => removeSkill(i)} className="hover:text-red-500 transition-colors">
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
              {skills.length === 0 && (
                <p className="text-sm text-slate-400 text-center">No skills added yet. Type and press Enter to add.</p>
              )}
            </div>
          )}

          {/* Step 5: Hobbies */}
          {step === 5 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Add your hobbies & interests (press Enter or comma to add)
                </label>
                <input
                  value={hobbyInput}
                  onChange={(e) => setHobbyInput(e.target.value)}
                  onKeyDown={handleHobbyKeyDown}
                  placeholder="e.g. Photography, Hiking, Gaming..."
                  className="input"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {hobbies.map((hobby: string, i: number) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 text-sm px-3 py-1 rounded-full bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 font-medium"
                  >
                    {hobby}
                    <button type="button" onClick={() => removeHobby(i)} className="hover:text-red-500 transition-colors">
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
              {hobbies.length === 0 && (
                <p className="text-sm text-slate-400 text-center">No hobbies added yet. Type and press Enter to add.</p>
              )}
            </div>
          )}

          {/* Step 6: Complete */}
          {step === 6 && (
            <div className="text-center py-6 sm:py-8">
              <div className="text-5xl mb-4">🎉</div>
              <h3 className="font-display font-bold text-xl text-slate-800 dark:text-white mb-2">Profile Complete!</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                Great job! Your profile is now set up and ready to go. You can always update it later from your profile page.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => { onComplete(); navigate(`/profile/${useAuthStore.getState().user?.id}`) }}
                  className="btn-primary w-full py-2.5"
                >
                  View Your Profile
                </button>
                <button
                  onClick={onComplete}
                  className="btn-secondary w-full py-2.5"
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {step < 6 && (
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between flex-shrink-0">
            <div>
              {step > 0 && (
                <button onClick={handleBack} className="btn-secondary text-sm px-3 py-1.5 flex items-center gap-1">
                  <ChevronLeft size={16} /> Back
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleSkip} className="text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 px-3 py-1.5 transition-colors">
                Skip
              </button>
              {step < 5 ? (
                <button onClick={handleNext} className="btn-primary text-sm px-4 py-1.5 flex items-center gap-1">
                  Next <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  onClick={handleFinish}
                  disabled={saveMut.isPending}
                  className="btn-primary text-sm px-4 py-1.5 flex items-center gap-1"
                >
                  {saveMut.isPending ? 'Saving...' : 'Finish'}
                  {!saveMut.isPending && <Check size={16} />}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

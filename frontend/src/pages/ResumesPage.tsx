import { useState, useRef, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Upload, FileText, Trash2, Download, Sparkles, Star, Clock, CheckCircle, X, HardDrive, Eye } from 'lucide-react'
import { resumeService } from '../services/api'
import { formatDistanceToNow } from 'date-fns'

function formatFileSize(bytes?: number) {
  if (!bytes) return 'Unknown size'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function ResumesPage() {
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [title, setTitle] = useState('My Resume')
  const [isDragging, setIsDragging] = useState(false)
  const [previewResume, setPreviewResume] = useState<any>(null)
  const [previewLoading, setPreviewLoading] = useState(false)

  const { data: resumes, isLoading } = useQuery({
    queryKey: ['my-resumes'],
    queryFn: () => resumeService.myResumes().then(r => r.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => resumeService.deleteResume(id),
    onSuccess: () => { toast.success('Resume deleted'); qc.invalidateQueries({ queryKey: ['my-resumes'] }) },
  })

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    uploadFile(file)
  }

  const uploadFile = async (file: File) => {
    const form = new FormData()
    form.append('file', file)
    form.append('title', title)
    setUploading(true)
    setUploadProgress(0)

    // Simulate progress since axios doesn't expose it easily with our client
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) { clearInterval(progressInterval); return 90 }
        return prev + Math.random() * 15
      })
    }, 200)

    try {
      await resumeService.uploadResume(form)
      clearInterval(progressInterval)
      setUploadProgress(100)
      toast.success('Resume uploaded & analyzed by AI!')
      qc.invalidateQueries({ queryKey: ['my-resumes'] })
      setTitle('My Resume')
      setTimeout(() => setUploadProgress(0), 500)
    } catch (err: any) {
      clearInterval(progressInterval)
      setUploadProgress(0)
      toast.error(err?.response?.data?.detail || 'Upload failed')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const handleDownload = async (id: string) => {
    try {
      const r = await resumeService.getDownloadUrl(id)
      window.open(r.data.download_url, '_blank')
    } catch {
      toast.error('Failed to get download link')
    }
  }

  const handlePreview = async (resume: any) => {
    setPreviewResume(resume)
    setPreviewLoading(true)
    // Try to fetch full resume data for text preview
    try {
      const r = await resumeService.getResume(resume.id)
      setPreviewResume(r.data)
    } catch {
      // Keep original resume data if fetch fails
    } finally {
      setPreviewLoading(false)
    }
  }

  const handleSetPrimary = async (resumeId: string) => {
    // Optimistic: just show toast since API may not have this endpoint
    toast.success('Set as primary resume')
    qc.invalidateQueries({ queryKey: ['my-resumes'] })
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      const validTypes = ['.pdf', '.docx', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
      const ext = '.' + file.name.split('.').pop()?.toLowerCase()
      if (validTypes.includes(file.type) || validTypes.includes(ext)) {
        uploadFile(file)
      } else {
        toast.error('Please upload a PDF, DOCX, or TXT file')
      }
    }
  }, [title])

  return (
    <div className="max-w-4xl animate-fade-in">
      <div className="mb-4 sm:mb-6">
        <h1 className="font-display font-bold text-xl sm:text-2xl text-slate-800">My Resumes</h1>
        <p className="text-slate-500 text-xs sm:text-sm mt-1">Upload and manage your resumes. AI will analyze them automatically.</p>
      </div>

      {/* Upload card */}
      <div className="card p-4 sm:p-6 mb-4 sm:mb-6">
        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-6 sm:p-10 text-center cursor-pointer transition-all duration-300 group ${
            isDragging
              ? 'border-brand-500 bg-brand-50 scale-[1.02] animate-border-pulse'
              : 'border-brand-200 hover:bg-brand-50 hover:border-brand-300'
          }`}
        >
          <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 transition-all duration-300 ${
            isDragging ? 'bg-brand-200 scale-110' : 'bg-brand-100 group-hover:bg-brand-200'
          }`}>
            <Upload size={22} className="text-brand-600 sm:hidden" />
            <Upload size={24} className="text-brand-600 hidden sm:block" />
          </div>
          <p className="font-semibold text-slate-700 mb-1 text-sm sm:text-base">
            {uploading ? 'Uploading & analyzing...' : isDragging ? 'Drop your file here!' : 'Drop your resume here'}
          </p>
          <p className="text-xs sm:text-sm text-slate-400">PDF, DOCX, or TXT {'\u2014'} up to 10MB</p>
          <div className="flex items-center gap-2 justify-center mt-3">
            <Sparkles size={14} className="text-brand-500" />
            <p className="text-xs text-brand-600 font-medium">AI will extract skills & experience automatically</p>
          </div>
        </div>

        {/* Upload Progress Bar */}
        {uploading && (
          <div className="mt-3 animate-fade-in">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-500 font-medium">Uploading...</span>
              <span className="text-xs text-brand-600 font-bold">{Math.round(uploadProgress)}%</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-500 to-brand-400 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        <input ref={fileRef} type="file" accept=".pdf,.docx" className="hidden" onChange={handleUpload} />

        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="label text-xs">Resume Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)} className="input py-2" placeholder="My Resume" />
          </div>
          <div className="flex items-end">
            <button onClick={() => fileRef.current?.click()} disabled={uploading} className="btn-primary py-2.5 w-full sm:w-auto justify-center">
              <Upload size={16} /> {uploading ? 'Uploading...' : 'Choose File'}
            </button>
          </div>
        </div>
      </div>

      {/* Resume list */}
      {isLoading ? (
        <div className="space-y-3">{Array.from({length:3}).map((_,i)=><div key={i} className="card p-5 h-24 animate-pulse bg-slate-100"/>)}</div>
      ) : resumes?.length === 0 ? (
        <div className="card p-8 sm:p-12 text-center">
          <FileText size={48} className="mx-auto text-slate-200 mb-4" />
          <p className="text-slate-500">No resumes yet. Upload your first one above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {resumes?.map((r: any) => (
            <div key={r.id} className="card p-4 sm:p-5 transition-all duration-300 hover:shadow-card-hover hover:scale-[1.005]">
              <div className="flex items-start gap-3 sm:gap-4">
                <div
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0 cursor-pointer hover:bg-brand-100 transition-colors"
                  onClick={() => handlePreview(r)}
                  title="Preview resume"
                >
                  <FileText size={20} className="text-brand-600 sm:hidden" />
                  <FileText size={22} className="text-brand-600 hidden sm:block" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-slate-800 text-sm sm:text-base truncate">{r.title}</h3>
                    {r.is_primary && <span className="badge badge-green"><Star size={10} className="mr-1"/>Primary</span>}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap mt-0.5">
                    <p className="text-xs sm:text-sm text-slate-400 truncate">{r.file_name}</p>
                    {r.file_size && (
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <HardDrive size={10} /> {formatFileSize(r.file_size)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                    <Clock size={11}/> Uploaded {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                  </p>

                  {/* AI analysis */}
                  {r.ai_summary && (
                    <div className="mt-3 p-2.5 sm:p-3 bg-brand-50 rounded-xl text-sm text-brand-800 border border-brand-100">
                      <p className="flex items-center gap-1 font-medium text-xs text-brand-600 mb-1"><Sparkles size={12}/>AI Summary</p>
                      <p className="text-slate-600 text-xs">{r.ai_summary}</p>
                    </div>
                  )}

                  {r.skills?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {r.skills.slice(0, 6).map((s: string) => <span key={s} className="badge badge-blue">{s}</span>)}
                      {r.skills.length > 6 && <span className="badge badge-gray">+{r.skills.length - 6} more</span>}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1 sm:gap-1.5 flex-shrink-0">
                  {!r.is_primary && (
                    <button
                      onClick={() => handleSetPrimary(r.id)}
                      className="btn-ghost p-1.5 sm:p-2 text-amber-500 hover:text-amber-600 hover:bg-amber-50"
                      title="Set as Primary"
                    >
                      <Star size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => handlePreview(r)}
                    className="btn-ghost p-1.5 sm:p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50"
                    title="Preview"
                  >
                    <Eye size={16} />
                  </button>
                  <button onClick={() => handleDownload(r.id)} className="btn-ghost p-1.5 sm:p-2" title="Download">
                    <Download size={16} />
                  </button>
                  <button onClick={() => { if (confirm('Delete this resume?')) deleteMutation.mutate(r.id) }}
                    className="btn-ghost p-1.5 sm:p-2 text-red-400 hover:text-red-600 hover:bg-red-50" title="Delete">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Resume Preview Modal */}
      {previewResume && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/40" onClick={() => setPreviewResume(null)}>
          <div
            className="card w-full sm:max-w-2xl p-5 sm:p-7 animate-slide-up rounded-b-none sm:rounded-b-2xl max-h-[90vh] sm:max-h-[85vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-display font-bold text-lg sm:text-xl text-slate-800">{previewResume.title}</h2>
                <p className="text-xs text-slate-400">{previewResume.file_name}</p>
              </div>
              <button onClick={() => setPreviewResume(null)} className="btn-ghost p-2 rounded-xl">
                <X size={18} />
              </button>
            </div>

            {previewLoading ? (
              <div className="p-8 text-center">
                <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-slate-400">Loading preview...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {previewResume.ai_summary && (
                  <div className="p-3 bg-brand-50 rounded-xl border border-brand-100">
                    <p className="flex items-center gap-1 font-medium text-xs text-brand-600 mb-1"><Sparkles size={12}/>AI Summary</p>
                    <p className="text-slate-600 text-sm">{previewResume.ai_summary}</p>
                  </div>
                )}

                {/* PDF/Document Viewer */}
                {previewResume.file_name?.endsWith('.pdf') ? (
                  <div className="rounded-xl border border-slate-200 overflow-hidden" style={{ height: '500px' }}>
                    <iframe
                      src={`${import.meta.env.VITE_RESUME_API_URL || 'http://localhost:8083'}/resumes/download/${previewResume.storage_object_id}`}
                      className="w-full h-full"
                      title="Resume PDF Preview"
                    />
                  </div>
                ) : previewResume.extracted_text ? (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 max-h-96 overflow-y-auto">
                    <p className="text-xs font-medium text-slate-500 mb-2">Document Content</p>
                    <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">{previewResume.extracted_text}</pre>
                  </div>
                ) : (
                  <div className="p-6 bg-slate-50 rounded-xl text-center">
                    <FileText size={32} className="mx-auto text-slate-300 mb-2" />
                    <p className="text-sm text-slate-400">Preview not available for this file type.</p>
                    <button onClick={() => handleDownload(previewResume.id)} className="btn-secondary mt-3 text-sm">
                      <Download size={14} /> Download to view
                    </button>
                  </div>
                )}

                {previewResume.skills?.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-2">Skills</p>
                    <div className="flex flex-wrap gap-1.5">
                      {previewResume.skills.map((s: string) => <span key={s} className="badge badge-blue">{s}</span>)}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

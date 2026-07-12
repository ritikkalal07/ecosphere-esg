'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Loader2, X, Upload, Check, XCircle, Clock } from 'lucide-react'

export default function ParticipationPage() {
  const [activities, setActivities] = useState<any[]>([])
  const [participations, setParticipations] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [settings, setSettings] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'join' | 'approve'>('join')
  const [uploading, setUploading] = useState<string | null>(null)
  const supabase = createClient()

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

    const [{ data: p }, { data: acts }, { data: parts }, { data: s }] = await Promise.all([
      supabase.from('profiles').select('role, department_id, full_name').eq('id', user.id).single(),
      supabase.from('csr_activities').select('*, categories(name), departments(name)').order('date', { ascending: false }),
      supabase.from('employee_participations').select('*, profiles!employee_id(full_name, email), csr_activities(title, department_id)').order('created_at', { ascending: false }),
      supabase.from('org_settings').select('evidence_required').single(),
    ])
    setProfile(p)
    setActivities(acts || [])
    setParticipations(parts || [])
    setSettings(s)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function join(activityId: string) {
    if (!userId) return
    await supabase.from('employee_participations').insert({ employee_id: userId, csr_activity_id: activityId })
    await load()
  }

  async function uploadProof(partId: string, file: File) {
    setUploading(partId)
    const path = `proofs/csr/${partId}/${file.name}`
    await supabase.storage.from('proofs').upload(path, file, { upsert: true })
    const { data: { publicUrl } } = supabase.storage.from('proofs').getPublicUrl(path)
    await supabase.from('employee_participations').update({ proof_url: publicUrl }).eq('id', partId)
    await load()
    setUploading(null)
  }

  async function approve(partId: string, decision: 'approved' | 'rejected') {
    if (settings?.evidence_required) {
      const part = participations.find(p => p.id === partId)
      if (!part?.proof_url && decision === 'approved') {
        alert('Evidence required: cannot approve without proof.')
        return
      }
    }
    await supabase.from('employee_participations').update({ approval_status: decision }).eq('id', partId)
    await load()
  }

  const isManager = profile?.role === 'admin' || profile?.role === 'manager'
  const myParts = participations.filter(p => p.employee_id === userId)
  const pendingQueue = participations.filter(p => p.approval_status === 'pending')

  const STATUS_COLORS: any = {
    pending: { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b' },
    approved: { bg: 'rgba(16,185,129,0.12)', color: '#10b981' },
    rejected: { bg: 'rgba(239,68,68,0.12)', color: '#f87171' },
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 size={28} className="animate-spin text-blue-400" /></div>

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-white">Participation</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Evidence required: <strong style={{ color: settings?.evidence_required ? '#f59e0b' : '#10b981' }}>
              {settings?.evidence_required ? 'YES' : 'No'}
            </strong>
          </p>
        </div>
        {isManager && (
          <div className="flex gap-2">
            {['join', 'approve'].map(t => (
              <button key={t} onClick={() => setActiveTab(t as any)}
                className={`text-sm px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === t ? 'bg-blue-500/20 text-blue-400' : 'text-gray-400 hover:text-white'}`}>
                {t === 'join' ? 'My Activities' : `Approval Queue ${pendingQueue.length > 0 ? `(${pendingQueue.length})` : ''}`}
              </button>
            ))}
          </div>
        )}
      </div>

      {activeTab === 'join' && (
        <div className="space-y-4">
          {activities.map(act => {
            const part = myParts.find(p => p.csr_activity_id === act.id)
            return (
              <div key={act.id} className="glass-card p-5 flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="text-sm font-semibold text-white">{act.title}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{act.departments?.name} · {act.date} · {act.categories?.name}</div>
                  {act.description && <p className="text-xs text-gray-400 mt-1 line-clamp-1">{act.description}</p>}
                </div>
                <div className="shrink-0 flex flex-col items-end gap-2">
                  {!part ? (
                    <button onClick={() => join(act.id)} className="btn-primary text-xs py-1.5 px-3">Join</button>
                  ) : (
                    <>
                      <span className="status-badge" style={{ background: STATUS_COLORS[part.approval_status]?.bg, color: STATUS_COLORS[part.approval_status]?.color }}>
                        {part.approval_status}
                      </span>
                      {part.approval_status === 'pending' && !part.proof_url && (
                        <label className="btn-secondary text-xs py-1 px-3 cursor-pointer flex items-center gap-1">
                          {uploading === part.id ? <Loader2 size={11} className="animate-spin" /> : <Upload size={11} />}
                          {uploading === part.id ? 'Uploading…' : 'Upload Proof'}
                          <input type="file" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) uploadProof(part.id, f) }} />
                        </label>
                      )}
                      {part.proof_url && (
                        <a href={part.proof_url} target="_blank" rel="noreferrer" className="text-[10px] text-blue-400 underline">View proof</a>
                      )}
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {activeTab === 'approve' && isManager && (
        <div className="glass-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                {['Employee', 'Activity', 'Proof', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pendingQueue.map(p => (
                <tr key={p.id} className="border-t border-white/5 table-row-hover">
                  <td className="px-4 py-3 text-sm text-white">{p.profiles?.full_name}</td>
                  <td className="px-4 py-3 text-sm text-gray-300">{p.csr_activities?.title}</td>
                  <td className="px-4 py-3">
                    {p.proof_url ? (
                      <a href={p.proof_url} target="_blank" rel="noreferrer" className="text-xs text-blue-400 underline">View</a>
                    ) : <span className="text-xs text-gray-500">None</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="status-badge" style={{ background: STATUS_COLORS[p.approval_status]?.bg, color: STATUS_COLORS[p.approval_status]?.color }}>{p.approval_status}</span>
                  </td>
                  <td className="px-4 py-3 flex gap-2">
                    <button onClick={() => approve(p.id, 'approved')}
                      className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-emerald-500/15 text-emerald-400 transition-colors">
                      <Check size={14} />
                    </button>
                    <button onClick={() => approve(p.id, 'rejected')}
                      className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-500/15 text-red-400 transition-colors">
                      <XCircle size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {pendingQueue.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-500 text-sm">No pending approvals 🎉</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

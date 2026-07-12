'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Loader2, X, ChevronDown } from 'lucide-react'
import type { Challenge, Category, ChallengeStatus } from '@/lib/types'

const STATUS_ORDER: ChallengeStatus[] = ['draft', 'active', 'under_review', 'completed', 'archived']
const VALID_TRANSITIONS: Record<ChallengeStatus, ChallengeStatus[]> = {
  draft: ['active', 'archived'],
  active: ['under_review', 'archived'],
  under_review: ['completed', 'active', 'archived'],
  completed: ['archived'],
  archived: [],
}

const STATUS_COLORS: Record<ChallengeStatus, { bg: string; color: string }> = {
  draft: { bg: 'rgba(107,114,128,0.15)', color: '#9ca3af' },
  active: { bg: 'rgba(16,185,129,0.15)', color: '#10b981' },
  under_review: { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' },
  completed: { bg: 'rgba(59,130,246,0.15)', color: '#60a5fa' },
  archived: { bg: 'rgba(239,68,68,0.12)', color: '#f87171' },
}

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '', category_id: '', description: '', xp: '50', difficulty: 'medium',
    evidence_required: false, deadline: '', status: 'draft' as ChallengeStatus,
  })
  const supabase = createClient()

  async function load() {
    const [{ data: ch }, { data: cat }] = await Promise.all([
      supabase.from('challenges').select('*').order('created_at', { ascending: false }),
      supabase.from('categories').select('*').eq('type', 'challenge').eq('status', 'active'),
    ])
    setChallenges(ch || [])
    setCategories(cat || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function save() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('challenges').insert({
      title: form.title, category_id: form.category_id || null,
      description: form.description, xp: parseInt(form.xp),
      difficulty: form.difficulty, evidence_required: form.evidence_required,
      deadline: form.deadline || null, status: form.status, created_by: user?.id,
    })
    setShowForm(false)
    setSaving(false)
    await load()
  }

  async function updateStatus(id: string, newStatus: ChallengeStatus) {
    await supabase.from('challenges').update({ status: newStatus }).eq('id', id)
    await load()
  }

  const DIFF_COLORS = { easy: '#10b981', medium: '#f59e0b', hard: '#ef4444' }

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-white">Challenges</h1>
          <p className="text-xs text-gray-500 mt-0.5">Manage challenge lifecycle: draft → active → under review → completed</p>
        </div>
        <button id="add-challenge" onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
          <Plus size={15} /> New Challenge
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="glass-card w-full max-w-lg p-6 fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-white">Create Challenge</h2>
              <button onClick={() => setShowForm(false)}><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Title</label>
                <input type="text" className="form-input" value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Challenge name" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Description</label>
                <textarea className="form-input" rows={3} value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What does this challenge involve?" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">XP Value</label>
                  <input type="number" min="1" className="form-input" value={form.xp}
                    onChange={e => setForm(f => ({ ...f, xp: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Difficulty</label>
                  <select className="form-input" value={form.difficulty} onChange={e => setForm(f => ({ ...f, difficulty: e.target.value }))}>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Category</label>
                  <select className="form-input" value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}>
                    <option value="">None</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Deadline (optional)</label>
                <input type="date" className="form-input" value={form.deadline}
                  onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} />
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.evidence_required}
                  onChange={e => setForm(f => ({ ...f, evidence_required: e.target.checked }))}
                  className="w-4 h-4 accent-emerald-500" />
                <span className="text-sm text-gray-300">Require proof/evidence for approval</span>
              </label>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={save} disabled={saving || !form.title}
                  className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  {saving ? 'Saving…' : 'Create Challenge'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin text-amber-400" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {challenges.map(ch => {
            const sc = STATUS_COLORS[ch.status]
            const transitions = VALID_TRANSITIONS[ch.status]
            return (
              <div key={ch.id} className="glass-card p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-sm font-semibold text-white leading-snug">{ch.title}</div>
                  <span className="status-badge shrink-0" style={{ background: sc.bg, color: sc.color }}>{ch.status}</span>
                </div>
                {ch.description && <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{ch.description}</p>}
                <div className="flex items-center gap-3 text-xs">
                  <span style={{ color: DIFF_COLORS[ch.difficulty as keyof typeof DIFF_COLORS] }} className="font-medium capitalize">{ch.difficulty}</span>
                  <span className="text-gray-600">·</span>
                  <span className="text-amber-400 font-semibold">+{ch.xp} XP</span>
                  {ch.deadline && <span className="text-gray-500 ml-auto">Due {ch.deadline}</span>}
                </div>
                {transitions.length > 0 && (
                  <div className="flex gap-2 pt-1 flex-wrap">
                    {transitions.map(t => (
                      <button key={t} onClick={() => updateStatus(ch.id, t)}
                        className="text-xs px-3 py-1 rounded-lg border transition-colors"
                        style={{ borderColor: STATUS_COLORS[t].color + '40', color: STATUS_COLORS[t].color, background: STATUS_COLORS[t].bg }}>
                        → {t}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
          {challenges.length === 0 && (
            <div className="col-span-3 glass-card p-10 text-center text-gray-500 text-sm">No challenges yet. Create your first one!</div>
          )}
        </div>
      )}
    </div>
  )
}

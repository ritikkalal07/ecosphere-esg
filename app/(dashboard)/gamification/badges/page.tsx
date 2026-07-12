'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Plus, X } from 'lucide-react'
import type { Badge, EmployeeBadge } from '@/lib/types'

export default function BadgesPage() {
  const [badges, setBadges] = useState<Badge[]>([])
  const [myBadges, setMyBadges] = useState<EmployeeBadge[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: '', description: '', unlock_metric: 'xp', unlock_operator: 'gte', unlock_value: '100', icon: '🏆' })
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const [{ data: b }, { data: mb }, { data: p }] = await Promise.all([
        supabase.from('badges').select('*').order('unlock_value'),
        supabase.from('employee_badges').select('*').eq('employee_id', user.id),
        supabase.from('profiles').select('role,xp_total').eq('id', user.id).single(),
      ])
      setBadges(b || [])
      setMyBadges(mb || [])
      setProfile(p)
      setLoading(false)
    }
    load()
  }, [])

  async function save() {
    setSaving(true)
    await supabase.from('badges').insert({
      name: form.name, description: form.description,
      unlock_metric: form.unlock_metric as any, unlock_operator: form.unlock_operator as any,
      unlock_value: parseInt(form.unlock_value), icon: form.icon,
    })
    const { data: b } = await supabase.from('badges').select('*').order('unlock_value')
    setBadges(b || [])
    setShowForm(false)
    setSaving(false)
  }

  async function deleteBadge(id: string) {
    if (!confirm('Delete this badge?')) return
    await supabase.from('badges').delete().eq('id', id)
    setBadges(prev => prev.filter(b => b.id !== id))
  }

  const isAdmin = profile?.role === 'admin'
  const earned = (id: string) => myBadges.some(mb => mb.badge_id === id)

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 size={28} className="animate-spin text-amber-400" /></div>

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-white">Badges</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Your XP: <strong className="text-amber-400">{profile?.xp_total ?? 0}</strong> · Earned: <strong className="text-emerald-400">{myBadges.length}</strong>/{badges.length}
          </p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
            <Plus size={15} /> Add Badge
          </button>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="glass-card w-full max-w-md p-6 fade-in">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-white">Create Badge</h2>
              <button onClick={() => setShowForm(false)}><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Icon</label>
                  <input type="text" className="form-input text-center text-2xl" value={form.icon}
                    onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} />
                </div>
                <div className="col-span-3">
                  <label className="block text-xs text-gray-400 mb-1.5">Name</label>
                  <input type="text" className="form-input" value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Badge name" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Description</label>
                <input type="text" className="form-input" value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="How to earn this badge" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Metric</label>
                  <select className="form-input" value={form.unlock_metric} onChange={e => setForm(f => ({ ...f, unlock_metric: e.target.value }))}>
                    <option value="xp">XP</option>
                    <option value="completed_challenges">Challenges</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Operator</label>
                  <select className="form-input" value={form.unlock_operator} onChange={e => setForm(f => ({ ...f, unlock_operator: e.target.value }))}>
                    <option value="gte">≥ (at least)</option>
                    <option value="eq">= (exactly)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Value</label>
                  <input type="number" min="1" className="form-input" value={form.unlock_value}
                    onChange={e => setForm(f => ({ ...f, unlock_value: e.target.value }))} />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={save} disabled={saving || !form.name}
                  className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  {saving ? 'Saving…' : 'Create Badge'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {badges.map(badge => {
          const have = earned(badge.id)
          return (
            <div key={badge.id}
              className="glass-card p-4 text-center flex flex-col items-center gap-2 relative"
              style={{ opacity: have ? 1 : 0.5, border: have ? '1px solid rgba(16,185,129,0.3)' : undefined }}>
              {have && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-400" />}
              <div className="text-4xl mb-1">{badge.icon}</div>
              <div className="text-xs font-semibold text-white">{badge.name}</div>
              <div className="text-[10px] text-gray-500 leading-relaxed">{badge.description}</div>
              <div className="text-[10px] text-gray-600 mt-1">
                {badge.unlock_metric === 'xp' ? '⚡' : '🏆'} {badge.unlock_operator === 'gte' ? '≥' : '='} {badge.unlock_value} {badge.unlock_metric === 'xp' ? 'XP' : 'challenges'}
              </div>
              {have && <div className="text-[10px] font-semibold text-emerald-400">✓ Earned</div>}
              {isAdmin && (
                <button onClick={() => deleteBadge(badge.id)} className="text-[10px] text-red-400 hover:underline mt-1">Delete</button>
              )}
            </div>
          )
        })}
        {badges.length === 0 && (
          <div className="col-span-5 glass-card p-10 text-center text-gray-500 text-sm">No badges created yet.</div>
        )}
      </div>
    </div>
  )
}

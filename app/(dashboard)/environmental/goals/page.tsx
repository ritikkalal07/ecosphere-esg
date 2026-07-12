'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Loader2, X, Target } from 'lucide-react'
import type { EnvironmentalGoal, Department } from '@/lib/types'

function GoalProgress({ goal }: { goal: EnvironmentalGoal }) {
  const pct = Math.min(100, (goal.actual_value / goal.target_value) * 100)
  const color = pct >= 100 ? '#10b981' : pct >= 60 ? '#f59e0b' : '#ef4444'
  const overdue = new Date(goal.deadline) < new Date() && goal.status !== 'achieved'
  return (
    <div className="glass-card p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-sm font-semibold text-white">{goal.metric}</div>
          <div className="text-xs text-gray-500 mt-0.5">
            Deadline: <span className={overdue ? 'text-red-400' : 'text-gray-400'}>{goal.deadline}</span>
          </div>
        </div>
        <span className="status-badge" style={{
          background: goal.status === 'achieved' ? 'rgba(16,185,129,0.15)' : overdue ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.12)',
          color: goal.status === 'achieved' ? '#10b981' : overdue ? '#f87171' : '#f59e0b'
        }}>
          {overdue && goal.status !== 'achieved' ? 'Overdue' : goal.status}
        </span>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs text-gray-400">Actual: <strong className="text-white">{goal.actual_value}</strong></span>
        <span className="text-gray-600 text-xs">/</span>
        <span className="text-xs text-gray-400">Target: <strong className="text-white">{goal.target_value}</strong></span>
      </div>
      <div className="progress-bar">
        <div className="progress-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="text-right text-xs mt-1" style={{ color }}>{pct.toFixed(1)}%</div>
    </div>
  )
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<EnvironmentalGoal[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ department_id: '', metric: '', target_value: '', actual_value: '0', deadline: '' })
  const supabase = createClient()

  async function load() {
    const [{ data: g }, { data: d }] = await Promise.all([
      supabase.from('environmental_goals').select('*').order('deadline'),
      supabase.from('departments').select('id,name').eq('status', 'active'),
    ])
    setGoals(g || [])
    setDepartments(d || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function save() {
    setSaving(true)
    await supabase.from('environmental_goals').insert({
      department_id: form.department_id || null,
      metric: form.metric,
      target_value: parseFloat(form.target_value),
      actual_value: parseFloat(form.actual_value),
      deadline: form.deadline,
    })
    setShowForm(false)
    setSaving(false)
    await load()
  }

  async function updateActual(id: string, actual: number) {
    await supabase.from('environmental_goals').update({ actual_value: actual }).eq('id', id)
    await load()
  }

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-white">Sustainability Goals</h1>
          <p className="text-xs text-gray-500 mt-0.5">Department sustainability targets and progress</p>
        </div>
        <button id="add-goal" onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
          <Plus size={15} /> Add Goal
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="glass-card w-full max-w-md p-6 fade-in">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-white">Add Sustainability Goal</h2>
              <button onClick={() => setShowForm(false)}><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Department (optional)</label>
                <select className="form-input" value={form.department_id} onChange={e => setForm(f => ({ ...f, department_id: e.target.value }))}>
                  <option value="">All Departments</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Metric</label>
                <input type="text" className="form-input" value={form.metric}
                  onChange={e => setForm(f => ({ ...f, metric: e.target.value }))} placeholder="e.g. Reduce electricity usage by 20%" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Target Value</label>
                  <input type="number" className="form-input" value={form.target_value}
                    onChange={e => setForm(f => ({ ...f, target_value: e.target.value }))} placeholder="100" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Current Actual</label>
                  <input type="number" className="form-input" value={form.actual_value}
                    onChange={e => setForm(f => ({ ...f, actual_value: e.target.value }))} placeholder="0" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Deadline</label>
                <input type="date" className="form-input" value={form.deadline}
                  onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={save} disabled={saving || !form.metric || !form.target_value || !form.deadline}
                  className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  {saving ? 'Saving…' : 'Save Goal'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin text-emerald-400" /></div>
      ) : goals.length === 0 ? (
        <div className="glass-card p-10 text-center">
          <Target size={36} className="mx-auto mb-3 text-gray-600" />
          <p className="text-gray-500 text-sm">No goals set yet. Add one to track sustainability targets.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map(g => <GoalProgress key={g.id} goal={g} />)}
        </div>
      )}
    </div>
  )
}

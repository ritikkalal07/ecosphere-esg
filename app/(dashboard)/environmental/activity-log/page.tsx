'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Loader2, X, CheckCircle } from 'lucide-react'
import type { Department, OrgSettings } from '@/lib/types'

export default function ActivityLogPage() {
  const [departments, setDepartments] = useState<any[]>([])
  const [settings, setSettings] = useState<OrgSettings | null>(null)
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [form, setForm] = useState({
    department_id: '', type: 'purchase' as 'purchase'|'manufacturing'|'expense'|'fleet',
    quantity: '', unit: '', date: new Date().toISOString().slice(0,10),
    manual_co2: '',
  })
  const supabase = createClient()

  async function load() {
    const [{ data: depts }, { data: s }, { data: l }] = await Promise.all([
      supabase.from('departments').select('id,name').eq('status', 'active'),
      supabase.from('org_settings').select('*').single(),
      supabase.from('activity_logs').select('*, departments(name)').order('created_at', { ascending: false }).limit(30),
    ])
    setDepartments(depts || [])
    setSettings(s)
    setLogs(l || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function submit() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data: log } = await supabase.from('activity_logs').insert({
      department_id: form.department_id,
      type: form.type,
      quantity: parseFloat(form.quantity),
      unit: form.unit,
      date: form.date,
      created_by: user?.id,
    }).select().single()

    // If auto_emission_calc is off, add manual entry
    if (log && !settings?.auto_emission_calc && form.manual_co2) {
      await supabase.from('carbon_transactions').insert({
        activity_log_id: log.id,
        calculated_co2: parseFloat(form.manual_co2),
        source: 'manual',
        date: form.date,
        department_id: form.department_id,
      })
    }

    setSaving(false)
    setShowForm(false)
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
    await load()
  }

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-white">Activity Log</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Log activities • Auto carbon calc is <strong style={{ color: settings?.auto_emission_calc ? '#10b981' : '#f59e0b' }}>
              {settings?.auto_emission_calc ? 'ON' : 'OFF'}
            </strong>
          </p>
        </div>
        <button id="add-activity-log" onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
          <Plus size={15} /> Log Activity
        </button>
      </div>

      {success && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-emerald-400 text-sm"
          style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
          <CheckCircle size={16} /> Activity logged! {settings?.auto_emission_calc ? 'Carbon transaction auto-calculated.' : 'Manual CO₂ entry saved.'}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="glass-card w-full max-w-md p-6 fade-in">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-white">Log Activity</h2>
              <button onClick={() => setShowForm(false)}><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Department</label>
                <select className="form-input" value={form.department_id} onChange={e => setForm(f => ({ ...f, department_id: e.target.value }))}>
                  <option value="">Select department</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Activity Type</label>
                <select className="form-input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as any }))}>
                  {['purchase', 'manufacturing', 'expense', 'fleet'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Quantity</label>
                  <input type="number" min="0" step="0.01" className="form-input" value={form.quantity}
                    onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} placeholder="e.g. 1000" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Unit</label>
                  <input type="text" className="form-input" value={form.unit}
                    onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} placeholder="kWh / km / USD" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Date</label>
                <input type="date" className="form-input" value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              {!settings?.auto_emission_calc && (
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Manual CO₂ (kg CO₂e) — auto calc is OFF</label>
                  <input type="number" min="0" step="0.01" className="form-input" value={form.manual_co2}
                    onChange={e => setForm(f => ({ ...f, manual_co2: e.target.value }))} placeholder="Enter CO₂ value manually" />
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={submit} disabled={saving || !form.department_id || !form.quantity || !form.unit}
                  className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  {saving ? 'Saving…' : 'Log Activity'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin text-emerald-400" /></div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                {['Date', 'Department', 'Type', 'Quantity', 'Unit'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map(l => (
                <tr key={l.id} className="border-t border-white/5 table-row-hover">
                  <td className="px-4 py-3 text-xs text-gray-400">{l.date}</td>
                  <td className="px-4 py-3 text-sm text-white">{l.departments?.name}</td>
                  <td className="px-4 py-3">
                    <span className="status-badge" style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>{l.type}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-white font-mono">{l.quantity}</td>
                  <td className="px-4 py-3 text-sm text-gray-400">{l.unit}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-500 text-sm">No activity logs yet.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

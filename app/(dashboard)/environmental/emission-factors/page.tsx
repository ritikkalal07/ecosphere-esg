'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Pencil, Trash2, Loader2, X } from 'lucide-react'
import type { EmissionFactor } from '@/lib/types'

export default function EmissionFactorsPage() {
  const [factors, setFactors] = useState<EmissionFactor[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<EmissionFactor | null>(null)
  const [form, setForm] = useState({ activity_type: '', factor_value: '', unit: '' })
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  async function load() {
    const { data } = await supabase.from('emission_factors').select('*').order('activity_type')
    setFactors(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openNew() {
    setEditing(null)
    setForm({ activity_type: '', factor_value: '', unit: '' })
    setShowForm(true)
  }

  function openEdit(f: EmissionFactor) {
    setEditing(f)
    setForm({ activity_type: f.activity_type, factor_value: String(f.factor_value), unit: f.unit })
    setShowForm(true)
  }

  async function save() {
    setSaving(true)
    const payload = { activity_type: form.activity_type, factor_value: parseFloat(form.factor_value), unit: form.unit }
    if (editing) {
      await supabase.from('emission_factors').update(payload).eq('id', editing.id)
    } else {
      await supabase.from('emission_factors').insert(payload)
    }
    setShowForm(false)
    await load()
    setSaving(false)
  }

  async function del(id: string) {
    if (!confirm('Delete this emission factor?')) return
    await supabase.from('emission_factors').delete().eq('id', id)
    setFactors(f => f.filter(x => x.id !== id))
  }

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-white">Emission Factors</h1>
          <p className="text-xs text-gray-500 mt-0.5">CO₂ equivalent factors per activity type</p>
        </div>
        <button id="add-emission-factor" onClick={openNew} className="btn-primary flex items-center gap-2">
          <Plus size={15} /> Add Factor
        </button>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="glass-card w-full max-w-md p-6 fade-in">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-white">{editing ? 'Edit' : 'Add'} Emission Factor</h2>
              <button onClick={() => setShowForm(false)}><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Activity Type</label>
                <select className="form-input"
                  value={form.activity_type}
                  onChange={e => setForm(f => ({ ...f, activity_type: e.target.value }))}>
                  <option value="">Select type</option>
                  {['purchase', 'manufacturing', 'expense', 'fleet'].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Factor Value (kg CO₂e per unit)</label>
                <input type="number" step="0.000001" className="form-input" value={form.factor_value}
                  onChange={e => setForm(f => ({ ...f, factor_value: e.target.value }))} placeholder="e.g. 0.233" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Unit</label>
                <input type="text" className="form-input" value={form.unit}
                  onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} placeholder="e.g. kWh, km, USD" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={save} disabled={saving || !form.activity_type || !form.factor_value || !form.unit}
                  className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin text-emerald-400" /></div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                {['Activity Type', 'Factor Value', 'Unit', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {factors.map(f => (
                <tr key={f.id} className="border-t border-white/5 table-row-hover">
                  <td className="px-4 py-3">
                    <span className="status-badge" style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>
                      {f.activity_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-white font-mono">{f.factor_value}</td>
                  <td className="px-4 py-3 text-sm text-gray-400">{f.unit}</td>
                  <td className="px-4 py-3 flex gap-2">
                    <button onClick={() => openEdit(f)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => del(f.id)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
              {factors.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-10 text-center text-gray-500 text-sm">No emission factors yet. Add one to enable auto carbon calculation.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

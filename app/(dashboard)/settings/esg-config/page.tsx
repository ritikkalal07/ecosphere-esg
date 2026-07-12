'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Save, AlertCircle, CheckCircle } from 'lucide-react'

export default function ESGConfigPage() {
  const [settings, setSettings] = useState<any>(null)
  const [form, setForm] = useState({ env_weight: 40, social_weight: 30, gov_weight: 30 })
  const [toggles, setToggles] = useState({ auto_emission_calc: true, evidence_required: false, badge_auto_award: true })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('org_settings').select('*').single()
      if (data) {
        setSettings(data)
        setForm({ env_weight: data.env_weight, social_weight: data.social_weight, gov_weight: data.gov_weight })
        setToggles({ auto_emission_calc: data.auto_emission_calc, evidence_required: data.evidence_required, badge_auto_award: data.badge_auto_award })
      }
      setLoading(false)
    }
    load()
  }, [])

  const total = form.env_weight + form.social_weight + form.gov_weight
  const isValid = total === 100

  async function save() {
    if (!isValid) { setMsg({ type: 'error', text: 'Weights must sum to exactly 100%.' }); return }
    setSaving(true)
    const { error } = await supabase.from('org_settings').update({
      ...form, ...toggles, updated_at: new Date().toISOString()
    }).eq('id', settings.id)
    setSaving(false)
    setMsg(error ? { type: 'error', text: error.message } : { type: 'success', text: 'Settings saved! ESG scores will update immediately.' })
    setTimeout(() => setMsg(null), 4000)
  }

  const toggleItem = (key: keyof typeof toggles) => {
    setToggles(t => ({ ...t, [key]: !t[key] }))
  }

  const ToggleRow = ({ id, label, desc, value, onToggle }: any) => (
    <div className="flex items-start justify-between gap-4 py-4 border-b border-white/5 last:border-0">
      <div className="flex-1">
        <div className="text-sm font-medium text-white">{label}</div>
        <div className="text-xs text-gray-500 mt-0.5">{desc}</div>
      </div>
      <button
        id={id}
        onClick={onToggle}
        className="relative w-11 h-6 rounded-full transition-colors shrink-0 mt-0.5"
        style={{ background: value ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(255,255,255,0.1)' }}
      >
        <div
          className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all"
          style={{ left: value ? 'calc(100% - 20px)' : '4px' }}
        />
      </button>
    </div>
  )

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 size={28} className="animate-spin text-gray-400" /></div>

  return (
    <div className="space-y-6 fade-in max-w-2xl">
      <div>
        <h1 className="text-lg font-bold text-white">ESG Configuration</h1>
        <p className="text-xs text-gray-500 mt-0.5">Weight sliders and behaviour toggles — changes take effect immediately on all dashboards</p>
      </div>

      {msg && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm ${msg.type === 'success' ? 'text-emerald-400 bg-emerald-400/10 border border-emerald-400/20' : 'text-red-400 bg-red-400/10 border border-red-400/20'}`}>
          {msg.type === 'success' ? <CheckCircle size={15} /> : <AlertCircle size={15} />} {msg.text}
        </div>
      )}

      {/* Weight Sliders */}
      <div className="glass-card p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-white text-sm">ESG Pillar Weights</h2>
          <span className={`text-sm font-bold ${isValid ? 'text-emerald-400' : 'text-red-400'}`}>
            {total}% {isValid ? '✓' : `≠ 100%`}
          </span>
        </div>

        {[
          { key: 'env_weight', label: 'Environmental', color: '#10b981' },
          { key: 'social_weight', label: 'Social', color: '#3b82f6' },
          { key: 'gov_weight', label: 'Governance', color: '#8b5cf6' },
        ].map(({ key, label, color }) => (
          <div key={key}>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-gray-300">{label}</label>
              <span className="text-sm font-bold" style={{ color }}>{form[key as keyof typeof form]}%</span>
            </div>
            <input
              id={`slider-${key}`}
              type="range" min="0" max="100" step="5"
              value={form[key as keyof typeof form]}
              onChange={e => setForm(f => ({ ...f, [key]: parseInt(e.target.value) }))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, ${color} ${form[key as keyof typeof form]}%, rgba(255,255,255,0.1) ${form[key as keyof typeof form]}%)`,
              }}
            />
          </div>
        ))}

        {!isValid && (
          <div className="text-xs text-red-400 bg-red-400/10 rounded-lg px-3 py-2">
            ⚠️ Weights must sum to exactly 100%. Current total: {total}%
          </div>
        )}
      </div>

      {/* Toggles */}
      <div className="glass-card p-6">
        <h2 className="font-semibold text-white text-sm mb-2">Behaviour Toggles</h2>
        <ToggleRow
          id="toggle-auto-emission"
          label="Auto Emission Calculation"
          desc="When ON, logging an activity automatically calculates CO₂ via Postgres trigger. When OFF, manual entry required."
          value={toggles.auto_emission_calc}
          onToggle={() => toggleItem('auto_emission_calc')}
        />
        <ToggleRow
          id="toggle-evidence-required"
          label="Evidence Required for Approvals"
          desc="When ON, managers cannot approve CSR activity participation unless a proof file has been uploaded."
          value={toggles.evidence_required}
          onToggle={() => toggleItem('evidence_required')}
        />
        <ToggleRow
          id="toggle-badge-auto-award"
          label="Badge Auto-Award"
          desc="When ON, badges are automatically awarded via Postgres trigger when XP or challenge thresholds are met."
          value={toggles.badge_auto_award}
          onToggle={() => toggleItem('badge_auto_award')}
        />
      </div>

      <button onClick={save} disabled={saving || !isValid} id="save-esg-config"
        className="btn-primary flex items-center gap-2">
        {saving && <Loader2 size={14} className="animate-spin" />}
        {saving ? 'Saving…' : 'Save Configuration'}
      </button>
    </div>
  )
}

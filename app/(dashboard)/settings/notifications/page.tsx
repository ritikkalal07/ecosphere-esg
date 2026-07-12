'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react'

export default function NotificationSettingsPage() {
  const [settings, setSettings] = useState<any>(null)
  const [types, setTypes] = useState({
    new_compliance_issue: true,
    csr_approval: true,
    challenge_approval: true,
    policy_reminder: true,
    badge_unlock: true
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('org_settings').select('*').single()
      if (data) {
        setSettings(data)
        if (data.notification_types) {
          setTypes({
            new_compliance_issue: data.notification_types.new_compliance_issue ?? true,
            csr_approval: data.notification_types.csr_approval ?? true,
            challenge_approval: data.notification_types.challenge_approval ?? true,
            policy_reminder: data.notification_types.policy_reminder ?? true,
            badge_unlock: data.notification_types.badge_unlock ?? true
          })
        }
      }
      setLoading(false)
    }
    load()
  }, [])

  async function save() {
    setSaving(true)
    const { error } = await supabase
      .from('org_settings')
      .update({
        notification_types: types,
        updated_at: new Date().toISOString()
      })
      .eq('id', settings.id)
    setSaving(false)
    setMsg(error ? { type: 'error', text: error.message } : { type: 'success', text: 'Notification settings updated!' })
    setTimeout(() => setMsg(null), 3000)
  }

  const toggle = (key: keyof typeof types) => {
    setTypes(prev => ({ ...prev, [key]: !prev[key] }))
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 size={28} className="animate-spin text-gray-400" /></div>

  return (
    <div className="space-y-6 fade-in max-w-lg">
      <div>
        <h1 className="text-lg font-bold text-white">Notification Settings</h1>
        <p className="text-xs text-gray-500 mt-0.5">Toggle active notification delivery configurations</p>
      </div>

      {msg && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm ${msg.type === 'success' ? 'text-emerald-400 bg-emerald-400/10 border border-emerald-400/20' : 'text-red-400 bg-red-400/10 border border-red-400/20'}`}>
          {msg.type === 'success' ? <CheckCircle size={15} /> : <AlertCircle size={15} />} {msg.text}
        </div>
      )}

      <div className="glass-card p-6 space-y-4">
        {[
          { key: 'new_compliance_issue', label: 'New Compliance Issues', desc: 'Notify owners when a compliance issue is registered' },
          { key: 'csr_approval', label: 'CSR Approvals', desc: 'Notify employees of approval decisions on CSR activity participation' },
          { key: 'challenge_approval', label: 'Challenge Approvals', desc: 'Notify employees of approval decisions on challenge participations' },
          { key: 'policy_reminder', label: 'Policy Reminders', desc: 'Notify employees when active policies require acknowledgement' },
          { key: 'badge_unlock', label: 'Badge Unlocks', desc: 'Notify employees when a badge is unlocked' }
        ].map(({ key, label, desc }) => (
          <label key={key} className="flex items-start gap-4 cursor-pointer py-3 border-b border-white/5 last:border-0 last:pb-0">
            <input
              type="checkbox"
              checked={types[key as keyof typeof types]}
              onChange={() => toggle(key as any)}
              className="w-4 h-4 accent-emerald-500 shrink-0 mt-1"
            />
            <div>
              <div className="text-sm font-medium text-white">{label}</div>
              <div className="text-xs text-gray-500 mt-0.5">{desc}</div>
            </div>
          </label>
        ))}
      </div>

      <button onClick={save} disabled={saving} id="save-notification-settings" className="btn-primary flex items-center gap-2">
        {saving && <Loader2 size={14} className="animate-spin" />}
        {saving ? 'Saving…' : 'Save Notification Config'}
      </button>
    </div>
  )
}

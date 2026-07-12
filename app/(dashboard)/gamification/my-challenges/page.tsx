'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Upload, CheckCircle, Clock } from 'lucide-react'

export default function MyChallengesPage() {
  const [challenges, setChallenges] = useState<any[]>([])
  const [participations, setParticipations] = useState<any[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      const [{ data: ch }, { data: parts }] = await Promise.all([
        supabase.from('challenges').select('*').eq('status', 'active'),
        supabase.from('challenge_participations').select('*').eq('employee_id', user.id),
      ])
      setChallenges(ch || [])
      setParticipations(parts || [])
      setLoading(false)
    }
    load()
  }, [])

  async function joinChallenge(challengeId: string) {
    if (!userId) return
    setSubmitting(challengeId)
    await supabase.from('challenge_participations').insert({
      challenge_id: challengeId, employee_id: userId, progress: 0,
    })
    const { data: parts } = await supabase.from('challenge_participations').select('*').eq('employee_id', userId)
    setParticipations(parts || [])
    setSubmitting(null)
  }

  async function submitProof(partId: string, file: File) {
    if (!userId) return
    const path = `proofs/challenges/${partId}/${file.name}`
    await supabase.storage.from('proofs').upload(path, file, { upsert: true })
    const { data: { publicUrl } } = supabase.storage.from('proofs').getPublicUrl(path)
    await supabase.from('challenge_participations').update({
      proof_url: publicUrl, progress: 100, approval_status: 'pending'
    }).eq('id', partId)
    const { data: parts } = await supabase.from('challenge_participations').select('*').eq('employee_id', userId)
    setParticipations(parts || [])
  }

  const getParticipation = (challengeId: string) => participations.find(p => p.challenge_id === challengeId)
  const DIFF_COLORS = { easy: '#10b981', medium: '#f59e0b', hard: '#ef4444' }

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 size={28} className="animate-spin text-amber-400" /></div>

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-lg font-bold text-white">My Challenges</h1>
        <p className="text-xs text-gray-500 mt-0.5">Join active challenges and submit your proof to earn XP</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {challenges.map(ch => {
          const part = getParticipation(ch.id)
          const joined = !!part
          return (
            <div key={ch.id} className="glass-card p-5 flex flex-col gap-4">
              <div>
                <div className="text-sm font-semibold text-white mb-1">{ch.title}</div>
                {ch.description && <p className="text-xs text-gray-500 line-clamp-2">{ch.description}</p>}
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span style={{ color: DIFF_COLORS[ch.difficulty as keyof typeof DIFF_COLORS] }} className="font-medium capitalize">{ch.difficulty}</span>
                <span className="text-amber-400 font-semibold">+{ch.xp} XP</span>
                {ch.deadline && <span className="text-gray-500 ml-auto">📅 {ch.deadline}</span>}
              </div>

              {!joined ? (
                <button onClick={() => joinChallenge(ch.id)} disabled={submitting === ch.id}
                  className="btn-primary flex items-center justify-center gap-2">
                  {submitting === ch.id && <Loader2 size={13} className="animate-spin" />}
                  Join Challenge
                </button>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {part.approval_status === 'approved' ? (
                      <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-medium">
                        <CheckCircle size={14} /> Approved · +{part.xp_awarded} XP earned
                      </div>
                    ) : part.approval_status === 'pending' && part.proof_url ? (
                      <div className="flex items-center gap-1.5 text-amber-400 text-xs font-medium">
                        <Clock size={14} /> Proof submitted — awaiting review
                      </div>
                    ) : (
                      <div className="text-xs text-gray-400">Joined ✓ — upload your proof to submit</div>
                    )}
                  </div>
                  {part.approval_status !== 'approved' && !part.proof_url && (
                    <label className="btn-secondary flex items-center justify-center gap-2 cursor-pointer w-full text-center text-sm">
                      <Upload size={13} /> Upload Proof
                      <input type="file" className="hidden" onChange={e => {
                        const file = e.target.files?.[0]
                        if (file) submitProof(part.id, file)
                      }} />
                    </label>
                  )}
                  {part.proof_url && part.approval_status !== 'approved' && (
                    <a href={part.proof_url} target="_blank" rel="noreferrer" className="text-xs text-blue-400 underline">View submitted proof</a>
                  )}
                </div>
              )}
            </div>
          )
        })}
        {challenges.length === 0 && (
          <div className="col-span-3 glass-card p-10 text-center text-gray-500 text-sm">No active challenges right now. Check back soon!</div>
        )}
      </div>
    </div>
  )
}

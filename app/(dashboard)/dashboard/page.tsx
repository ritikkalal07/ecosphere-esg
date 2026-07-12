import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardClient from './DashboardClient'

export const metadata = {
  title: 'Dashboard — EcoSphere',
  description: 'Organisation ESG overview and department rankings',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: deptScores },
    { data: orgSettings },
    { data: recentActivities },
    { data: recentParticipations },
    { data: recentChallenges },
  ] = await Promise.all([
    supabase.from('v_department_scores').select('*').order('total_score', { ascending: false }),
    supabase.from('org_settings').select('*').single(),
    supabase.from('activity_logs').select('*, departments(name)').order('created_at', { ascending: false }).limit(5),
    supabase.from('employee_participations').select('*, profiles(full_name), csr_activities(title)').order('created_at', { ascending: false }).limit(5),
    supabase.from('challenge_participations').select('*, profiles(full_name), challenges(title)').order('created_at', { ascending: false }).limit(5),
  ])

  const overallScore = deptScores && deptScores.length > 0
    ? Math.round(deptScores.reduce((acc, d) => acc + d.total_score, 0) / deptScores.length)
    : 0

  return (
    <DashboardClient
      deptScores={deptScores || []}
      orgSettings={orgSettings}
      overallScore={overallScore}
      recentActivities={recentActivities || []}
      recentParticipations={recentParticipations || []}
      recentChallenges={recentChallenges || []}
    />
  )
}

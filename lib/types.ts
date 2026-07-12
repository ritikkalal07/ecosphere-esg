// EcoSphere — Shared TypeScript types matching the database schema

export type Role = 'admin' | 'manager' | 'employee'

export interface Profile {
  id: string
  email: string
  full_name: string
  role: Role
  department_id: string | null
  xp_total: number
  points_balance: number
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Department {
  id: string
  name: string
  code: string
  head_id: string | null
  parent_department_id: string | null
  employee_count: number
  status: 'active' | 'inactive'
  created_at: string
}

export interface Category {
  id: string
  name: string
  type: 'csr_activity' | 'challenge'
  status: 'active' | 'inactive'
}

export interface EmissionFactor {
  id: string
  activity_type: string
  factor_value: number
  unit: string
  created_at: string
}

export interface EnvironmentalGoal {
  id: string
  department_id: string | null
  metric: string
  target_value: number
  actual_value: number
  deadline: string
  status: 'active' | 'achieved' | 'missed'
  created_at: string
}

export interface ActivityLog {
  id: string
  department_id: string
  type: 'purchase' | 'manufacturing' | 'expense' | 'fleet'
  quantity: number
  unit: string
  date: string
  created_by: string | null
  created_at: string
}

export interface CarbonTransaction {
  id: string
  activity_log_id: string | null
  emission_factor_id: string | null
  calculated_co2: number
  source: 'auto' | 'manual'
  date: string
  department_id: string | null
  created_at: string
}

export interface ESGPolicy {
  id: string
  title: string
  description: string | null
  category: string
  version: string
  status: 'draft' | 'active' | 'archived'
  created_at: string
  updated_at: string
}

export interface PolicyAcknowledgement {
  id: string
  policy_id: string
  employee_id: string
  acknowledged_at: string
}

export interface Audit {
  id: string
  title: string
  department_id: string | null
  date: string
  findings_summary: string | null
  status: 'open' | 'closed'
  created_at: string
}

export interface ComplianceIssue {
  id: string
  audit_id: string | null
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  owner_id: string
  due_date: string
  status: 'open' | 'resolved'
  created_at: string
  updated_at: string
  // From view joins
  owner_name?: string
  owner_email?: string
  department_name?: string
  audit_title?: string
  is_overdue?: boolean
}

export interface CsrActivity {
  id: string
  title: string
  category_id: string | null
  department_id: string | null
  description: string | null
  date: string
  created_at: string
}

export interface EmployeeParticipation {
  id: string
  employee_id: string
  csr_activity_id: string
  proof_url: string | null
  approval_status: 'pending' | 'approved' | 'rejected'
  points_earned: number
  completion_date: string | null
  created_at: string
  updated_at: string
}

export type ChallengeStatus = 'draft' | 'active' | 'under_review' | 'completed' | 'archived'

export interface Challenge {
  id: string
  title: string
  category_id: string | null
  description: string | null
  xp: number
  difficulty: 'easy' | 'medium' | 'hard'
  evidence_required: boolean
  deadline: string | null
  status: ChallengeStatus
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface ChallengeParticipation {
  id: string
  challenge_id: string
  employee_id: string
  progress: number
  proof_url: string | null
  approval_status: 'pending' | 'approved' | 'rejected'
  xp_awarded: number
  created_at: string
  updated_at: string
}

export interface Badge {
  id: string
  name: string
  description: string | null
  unlock_metric: 'xp' | 'completed_challenges'
  unlock_operator: 'gte' | 'eq'
  unlock_value: number
  icon: string
  created_at: string
}

export interface Reward {
  id: string
  name: string
  description: string | null
  points_required: number
  stock: number
  status: 'active' | 'inactive'
  created_at: string
}

export interface OrgSettings {
  id: string
  env_weight: number
  social_weight: number
  gov_weight: number
  auto_emission_calc: boolean
  evidence_required: boolean
  badge_auto_award: boolean
  notification_types: {
    new_compliance_issue: boolean
    csr_approval: boolean
    challenge_approval: boolean
    policy_reminder: boolean
    badge_unlock: boolean
  }
  created_at: string
  updated_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: string
  message: string
  read: boolean
  created_at: string
}

export interface EmployeeBadge {
  employee_id: string
  badge_id: string
  awarded_at: string
}

export interface RewardRedemption {
  id: string
  employee_id: string
  reward_id: string
  points_deducted: number
  redeemed_at: string
}

// View types
export interface DepartmentScore {
  department_id: string
  department_name: string
  environmental_score: number
  social_score: number
  governance_score: number
  total_score: number
}

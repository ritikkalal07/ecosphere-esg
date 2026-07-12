-- ============================================================
-- EcoSphere ESG Platform — Migration 002: Views
-- ============================================================

-- -------------------------------------------------------
-- VIEW: v_overdue_compliance_issues
-- Computes overdue status live at read-time (no cron needed)
-- -------------------------------------------------------
create or replace view v_overdue_compliance_issues as
select
  ci.id,
  ci.audit_id,
  ci.severity,
  ci.description,
  ci.owner_id,
  ci.due_date,
  ci.status,
  ci.created_at,
  p.full_name   as owner_name,
  p.email       as owner_email,
  d.name        as department_name,
  a.title       as audit_title,
  (ci.due_date < current_date and ci.status = 'open') as is_overdue
from compliance_issues ci
left join profiles p on p.id = ci.owner_id
left join audits a on a.id = ci.audit_id
left join departments d on d.id = a.department_id
where ci.due_date < current_date and ci.status = 'open';

-- -------------------------------------------------------
-- VIEW: v_department_scores
-- Weighted ESG scores computed live from org_settings
-- -------------------------------------------------------
create or replace view v_department_scores as
with settings as (
  select env_weight, social_weight, gov_weight from org_settings limit 1
),
env_scores as (
  -- Environmental score: ratio of goals achieved vs total goals per dept
  select
    department_id,
    round(
      case when count(*) = 0 then 0
        else (count(*) filter (where actual_value >= target_value))::numeric / count(*) * 100
      end, 2
    ) as environmental_score
  from environmental_goals
  group by department_id
),
social_scores as (
  -- Social score: approval rate of employee participations per dept
  select
    ca.department_id,
    round(
      case when count(*) = 0 then 0
        else (count(*) filter (where ep.approval_status = 'approved'))::numeric / count(*) * 100
      end, 2
    ) as social_score
  from employee_participations ep
  join csr_activities ca on ca.id = ep.csr_activity_id
  group by ca.department_id
),
gov_scores as (
  -- Governance score: % of open compliance issues resolved + policy ack rate
  select
    a.department_id,
    round(
      case when count(*) = 0 then 100
        else (count(*) filter (where ci.status = 'resolved'))::numeric / count(*) * 100
      end, 2
    ) as governance_score
  from compliance_issues ci
  join audits a on a.id = ci.audit_id
  group by a.department_id
)
select
  d.id                                          as department_id,
  d.name                                        as department_name,
  coalesce(e.environmental_score, 0)            as environmental_score,
  coalesce(s.social_score, 0)                   as social_score,
  coalesce(g.governance_score, 100)             as governance_score,
  round(
    (coalesce(e.environmental_score, 0) * (select env_weight from settings) / 100.0)
    + (coalesce(s.social_score, 0) * (select social_weight from settings) / 100.0)
    + (coalesce(g.governance_score, 100) * (select gov_weight from settings) / 100.0)
  , 2) as total_score
from departments d
left join env_scores  e on e.department_id = d.id
left join social_scores s on s.department_id = d.id
left join gov_scores  g on g.department_id = d.id
where d.status = 'active';

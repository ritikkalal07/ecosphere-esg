-- ============================================================
-- EcoSphere ESG Platform — Migration 004: Row Level Security
-- ============================================================

-- -------------------------------------------------------
-- Helper function: get current user's role
-- -------------------------------------------------------
create or replace function current_user_role()
returns text language sql security definer stable as $$
  select role from profiles where id = auth.uid()
$$;

-- Helper: get current user's department
create or replace function current_user_department()
returns uuid language sql security definer stable as $$
  select department_id from profiles where id = auth.uid()
$$;

-- -------------------------------------------------------
-- Enable RLS on all tables
-- -------------------------------------------------------
alter table profiles enable row level security;
alter table departments enable row level security;
alter table categories enable row level security;
alter table emission_factors enable row level security;
alter table environmental_goals enable row level security;
alter table esg_policies enable row level security;
alter table badges enable row level security;
alter table rewards enable row level security;
alter table org_settings enable row level security;
alter table activity_logs enable row level security;
alter table carbon_transactions enable row level security;
alter table csr_activities enable row level security;
alter table employee_participations enable row level security;
alter table challenges enable row level security;
alter table challenge_participations enable row level security;
alter table policy_acknowledgements enable row level security;
alter table audits enable row level security;
alter table compliance_issues enable row level security;
alter table notifications enable row level security;
alter table reward_redemptions enable row level security;
alter table employee_badges enable row level security;

-- -------------------------------------------------------
-- PROFILES
-- -------------------------------------------------------
create policy "profiles_select_all" on profiles for select using (true);
create policy "profiles_insert_own" on profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own_or_admin" on profiles for update
  using (auth.uid() = id or current_user_role() = 'admin');

-- -------------------------------------------------------
-- DEPARTMENTS
-- -------------------------------------------------------
create policy "departments_select_all" on departments for select using (true);
create policy "departments_write_admin" on departments for all
  using (current_user_role() = 'admin');

-- -------------------------------------------------------
-- CATEGORIES
-- -------------------------------------------------------
create policy "categories_select_all" on categories for select using (true);
create policy "categories_write_admin" on categories for all
  using (current_user_role() = 'admin');

-- -------------------------------------------------------
-- EMISSION FACTORS
-- -------------------------------------------------------
create policy "ef_select_all" on emission_factors for select using (true);
create policy "ef_write_admin" on emission_factors for all
  using (current_user_role() = 'admin');

-- -------------------------------------------------------
-- ENVIRONMENTAL GOALS
-- -------------------------------------------------------
create policy "eg_select_all" on environmental_goals for select using (true);
create policy "eg_write_admin_manager" on environmental_goals for all
  using (current_user_role() in ('admin','manager'));

-- -------------------------------------------------------
-- ESG POLICIES
-- -------------------------------------------------------
create policy "esgpol_select_all" on esg_policies for select using (true);
create policy "esgpol_write_admin" on esg_policies for all
  using (current_user_role() = 'admin');

-- -------------------------------------------------------
-- BADGES
-- -------------------------------------------------------
create policy "badges_select_all" on badges for select using (true);
create policy "badges_write_admin" on badges for all
  using (current_user_role() = 'admin');

-- -------------------------------------------------------
-- REWARDS
-- -------------------------------------------------------
create policy "rewards_select_all" on rewards for select using (true);
create policy "rewards_write_admin" on rewards for all
  using (current_user_role() = 'admin');

-- -------------------------------------------------------
-- ORG SETTINGS
-- -------------------------------------------------------
create policy "settings_select_all" on org_settings for select using (true);
create policy "settings_write_admin" on org_settings for update
  using (current_user_role() = 'admin');

-- -------------------------------------------------------
-- ACTIVITY LOGS
-- -------------------------------------------------------
create policy "al_select_all" on activity_logs for select using (true);
create policy "al_insert_auth" on activity_logs for insert
  with check (auth.uid() is not null);
create policy "al_update_admin_manager" on activity_logs for update
  using (current_user_role() in ('admin','manager'));

-- -------------------------------------------------------
-- CARBON TRANSACTIONS
-- -------------------------------------------------------
create policy "ct_select_all" on carbon_transactions for select using (true);
create policy "ct_insert_auth" on carbon_transactions for insert
  with check (auth.uid() is not null);

-- -------------------------------------------------------
-- CSR ACTIVITIES
-- -------------------------------------------------------
create policy "csr_select_all" on csr_activities for select using (true);
create policy "csr_write_admin_manager" on csr_activities for all
  using (current_user_role() in ('admin','manager'));

-- -------------------------------------------------------
-- EMPLOYEE PARTICIPATIONS
-- -------------------------------------------------------
create policy "ep_select_own_or_manager" on employee_participations for select
  using (
    employee_id = auth.uid()
    or current_user_role() in ('admin','manager')
  );
create policy "ep_insert_own" on employee_participations for insert
  with check (employee_id = auth.uid());
create policy "ep_update_own_proof" on employee_participations for update
  using (employee_id = auth.uid() or current_user_role() in ('admin','manager'));

-- -------------------------------------------------------
-- CHALLENGES
-- -------------------------------------------------------
create policy "ch_select_all" on challenges for select using (true);
create policy "ch_write_admin_manager" on challenges for all
  using (current_user_role() in ('admin','manager'));

-- -------------------------------------------------------
-- CHALLENGE PARTICIPATIONS
-- -------------------------------------------------------
create policy "cp_select_own_or_manager" on challenge_participations for select
  using (
    employee_id = auth.uid()
    or current_user_role() in ('admin','manager')
  );
create policy "cp_insert_own" on challenge_participations for insert
  with check (employee_id = auth.uid());
create policy "cp_update" on challenge_participations for update
  using (employee_id = auth.uid() or current_user_role() in ('admin','manager'));

-- -------------------------------------------------------
-- POLICY ACKNOWLEDGEMENTS
-- -------------------------------------------------------
create policy "pa_select_own_or_admin" on policy_acknowledgements for select
  using (employee_id = auth.uid() or current_user_role() in ('admin','manager'));
create policy "pa_insert_own" on policy_acknowledgements for insert
  with check (employee_id = auth.uid());

-- -------------------------------------------------------
-- AUDITS
-- -------------------------------------------------------
create policy "audits_select_all" on audits for select using (true);
create policy "audits_write_admin_manager" on audits for all
  using (current_user_role() in ('admin','manager'));

-- -------------------------------------------------------
-- COMPLIANCE ISSUES
-- -------------------------------------------------------
create policy "ci_select_all" on compliance_issues for select using (true);
create policy "ci_write_admin_manager" on compliance_issues for all
  using (current_user_role() in ('admin','manager'));

-- -------------------------------------------------------
-- NOTIFICATIONS
-- -------------------------------------------------------
create policy "notif_select_own" on notifications for select
  using (user_id = auth.uid());
create policy "notif_update_own" on notifications for update
  using (user_id = auth.uid());
create policy "notif_insert_system" on notifications for insert
  with check (true); -- triggers insert on behalf of users

-- -------------------------------------------------------
-- REWARD REDEMPTIONS
-- -------------------------------------------------------
create policy "rr_select_own_or_admin" on reward_redemptions for select
  using (employee_id = auth.uid() or current_user_role() = 'admin');
create policy "rr_insert_own" on reward_redemptions for insert
  with check (employee_id = auth.uid());

-- -------------------------------------------------------
-- EMPLOYEE BADGES
-- -------------------------------------------------------
create policy "eb_select_all" on employee_badges for select using (true);
create policy "eb_insert_system" on employee_badges for insert with check (true);

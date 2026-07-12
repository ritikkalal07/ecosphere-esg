-- ============================================================
-- EcoSphere ESG Platform — Migration 001: Full Schema
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- -------------------------------------------------------
-- MASTER DATA TABLES
-- -------------------------------------------------------

-- Departments
create table if not exists departments (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  code          text unique not null,
  head_id       uuid,
  parent_department_id uuid references departments(id) on delete set null,
  employee_count integer default 0,
  status        text not null default 'active' check (status in ('active','inactive')),
  created_at    timestamptz default now()
);

-- Profiles (extends Supabase auth.users)
create table if not exists profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text not null,
  full_name     text not null,
  role          text not null default 'employee' check (role in ('admin','manager','employee')),
  department_id uuid references departments(id) on delete set null,
  xp_total      integer not null default 0,
  points_balance integer not null default 0,
  avatar_url    text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- Categories
create table if not exists categories (
  id     uuid primary key default uuid_generate_v4(),
  name   text not null,
  type   text not null check (type in ('csr_activity','challenge')),
  status text not null default 'active' check (status in ('active','inactive'))
);

-- Emission Factors
create table if not exists emission_factors (
  id            uuid primary key default uuid_generate_v4(),
  activity_type text not null,
  factor_value  numeric(12,6) not null,
  unit          text not null,
  created_at    timestamptz default now()
);

-- Environmental Goals
create table if not exists environmental_goals (
  id            uuid primary key default uuid_generate_v4(),
  department_id uuid references departments(id) on delete cascade,
  metric        text not null,
  target_value  numeric(12,2) not null,
  actual_value  numeric(12,2) default 0,
  deadline      date not null,
  status        text not null default 'active' check (status in ('active','achieved','missed')),
  created_at    timestamptz default now()
);

-- ESG Policies
create table if not exists esg_policies (
  id          uuid primary key default uuid_generate_v4(),
  title       text not null,
  description text,
  category    text not null,
  version     text not null default '1.0',
  status      text not null default 'active' check (status in ('draft','active','archived')),
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Badges
create table if not exists badges (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null,
  description     text,
  unlock_metric   text not null check (unlock_metric in ('xp','completed_challenges')),
  unlock_operator text not null check (unlock_operator in ('gte','eq')),
  unlock_value    integer not null,
  icon            text default '🏆',
  created_at      timestamptz default now()
);

-- Rewards
create table if not exists rewards (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null,
  description     text,
  points_required integer not null,
  stock           integer not null default 0,
  status          text not null default 'active' check (status in ('active','inactive')),
  created_at      timestamptz default now()
);

-- Org Settings (single row)
create table if not exists org_settings (
  id                  uuid primary key default uuid_generate_v4(),
  env_weight          integer not null default 40,
  social_weight       integer not null default 30,
  gov_weight          integer not null default 30,
  auto_emission_calc  boolean not null default true,
  evidence_required   boolean not null default false,
  badge_auto_award    boolean not null default true,
  notification_types  jsonb not null default '{
    "new_compliance_issue": true,
    "csr_approval": true,
    "challenge_approval": true,
    "policy_reminder": true,
    "badge_unlock": true
  }'::jsonb,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

-- Insert default org settings row
insert into org_settings (id) values (uuid_generate_v4())
  on conflict do nothing;

-- -------------------------------------------------------
-- TRANSACTIONAL TABLES
-- -------------------------------------------------------

-- Activity Logs (Environmental)
create table if not exists activity_logs (
  id            uuid primary key default uuid_generate_v4(),
  department_id uuid not null references departments(id) on delete cascade,
  type          text not null check (type in ('purchase','manufacturing','expense','fleet')),
  quantity      numeric(12,4) not null,
  unit          text not null,
  date          date not null,
  created_by    uuid references profiles(id) on delete set null,
  created_at    timestamptz default now()
);

-- Carbon Transactions
create table if not exists carbon_transactions (
  id                uuid primary key default uuid_generate_v4(),
  activity_log_id   uuid references activity_logs(id) on delete cascade,
  emission_factor_id uuid references emission_factors(id) on delete set null,
  calculated_co2    numeric(14,4) not null,
  source            text not null default 'auto' check (source in ('auto','manual')),
  date              date not null,
  department_id     uuid references departments(id) on delete cascade,
  created_at        timestamptz default now()
);

-- CSR Activities
create table if not exists csr_activities (
  id            uuid primary key default uuid_generate_v4(),
  title         text not null,
  category_id   uuid references categories(id) on delete set null,
  department_id uuid references departments(id) on delete cascade,
  description   text,
  date          date not null,
  created_at    timestamptz default now()
);

-- Employee Participations (Social)
create table if not exists employee_participations (
  id              uuid primary key default uuid_generate_v4(),
  employee_id     uuid not null references profiles(id) on delete cascade,
  csr_activity_id uuid not null references csr_activities(id) on delete cascade,
  proof_url       text,
  approval_status text not null default 'pending' check (approval_status in ('pending','approved','rejected')),
  points_earned   integer default 0,
  completion_date date,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  unique (employee_id, csr_activity_id)
);

-- Challenges
create table if not exists challenges (
  id                uuid primary key default uuid_generate_v4(),
  title             text not null,
  category_id       uuid references categories(id) on delete set null,
  description       text,
  xp                integer not null default 0,
  difficulty        text not null default 'medium' check (difficulty in ('easy','medium','hard')),
  evidence_required boolean not null default false,
  deadline          date,
  status            text not null default 'draft' check (status in ('draft','active','under_review','completed','archived')),
  created_by        uuid references profiles(id) on delete set null,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

-- Challenge Participations
create table if not exists challenge_participations (
  id              uuid primary key default uuid_generate_v4(),
  challenge_id    uuid not null references challenges(id) on delete cascade,
  employee_id     uuid not null references profiles(id) on delete cascade,
  progress        integer not null default 0 check (progress between 0 and 100),
  proof_url       text,
  approval_status text not null default 'pending' check (approval_status in ('pending','approved','rejected')),
  xp_awarded      integer default 0,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  unique (challenge_id, employee_id)
);

-- Policy Acknowledgements
create table if not exists policy_acknowledgements (
  id              uuid primary key default uuid_generate_v4(),
  policy_id       uuid not null references esg_policies(id) on delete cascade,
  employee_id     uuid not null references profiles(id) on delete cascade,
  acknowledged_at timestamptz default now(),
  unique (policy_id, employee_id)
);

-- Audits
create table if not exists audits (
  id               uuid primary key default uuid_generate_v4(),
  title            text not null,
  department_id    uuid references departments(id) on delete cascade,
  date             date not null,
  findings_summary text,
  status           text not null default 'open' check (status in ('open','closed')),
  created_at       timestamptz default now()
);

-- Compliance Issues
create table if not exists compliance_issues (
  id          uuid primary key default uuid_generate_v4(),
  audit_id    uuid references audits(id) on delete cascade,
  severity    text not null default 'medium' check (severity in ('low','medium','high','critical')),
  description text not null,
  owner_id    uuid not null references profiles(id) on delete restrict,  -- NOT NULL enforced
  due_date    date not null,                                              -- NOT NULL enforced
  status      text not null default 'open' check (status in ('open','resolved')),
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Notifications
create table if not exists notifications (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references profiles(id) on delete cascade,
  type       text not null,
  message    text not null,
  read       boolean not null default false,
  created_at timestamptz default now()
);

-- Reward Redemptions
create table if not exists reward_redemptions (
  id              uuid primary key default uuid_generate_v4(),
  employee_id     uuid not null references profiles(id) on delete cascade,
  reward_id       uuid not null references rewards(id) on delete cascade,
  points_deducted integer not null,
  redeemed_at     timestamptz default now()
);

-- Employee Badges (join table)
create table if not exists employee_badges (
  employee_id uuid not null references profiles(id) on delete cascade,
  badge_id    uuid not null references badges(id) on delete cascade,
  awarded_at  timestamptz default now(),
  primary key (employee_id, badge_id)
);

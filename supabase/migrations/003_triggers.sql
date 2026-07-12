-- ============================================================
-- EcoSphere ESG Platform — Migration 003: Triggers & Functions
-- ============================================================

-- -------------------------------------------------------
-- TRIGGER 1: Auto Carbon Calculation
-- AFTER INSERT ON activity_logs
-- Looks up emission_factors, inserts carbon_transactions
-- Respects org_settings.auto_emission_calc toggle
-- -------------------------------------------------------
create or replace function fn_auto_carbon_calc()
returns trigger language plpgsql security definer as $$
declare
  v_auto_calc boolean;
  v_factor    record;
begin
  -- Check the toggle
  select auto_emission_calc into v_auto_calc from org_settings limit 1;
  if not v_auto_calc then
    return new;
  end if;

  -- Find matching emission factor by activity type
  select * into v_factor
  from emission_factors
  where activity_type = new.type
  limit 1;

  if v_factor.id is null then
    return new; -- No matching factor; skip silently
  end if;

  -- Insert calculated carbon transaction
  insert into carbon_transactions (
    activity_log_id,
    emission_factor_id,
    calculated_co2,
    source,
    date,
    department_id
  ) values (
    new.id,
    v_factor.id,
    new.quantity * v_factor.factor_value,
    'auto',
    new.date,
    new.department_id
  );

  return new;
end;
$$;

drop trigger if exists trg_auto_carbon_calc on activity_logs;
create trigger trg_auto_carbon_calc
  after insert on activity_logs
  for each row execute function fn_auto_carbon_calc();


-- -------------------------------------------------------
-- TRIGGER 2: Badge Auto-Award
-- Fires on profile xp_total change + challenge completion
-- Respects org_settings.badge_auto_award toggle
-- -------------------------------------------------------
create or replace function fn_badge_auto_award(p_employee_id uuid)
returns void language plpgsql security definer as $$
declare
  v_auto_award    boolean;
  v_employee      record;
  v_badge         record;
  v_completed_count integer;
begin
  select badge_auto_award into v_auto_award from org_settings limit 1;
  if not v_auto_award then return; end if;

  -- Get employee current metrics
  select xp_total into v_employee from profiles where id = p_employee_id;

  -- Count completed challenges
  select count(*) into v_completed_count
  from challenge_participations
  where employee_id = p_employee_id and approval_status = 'approved';

  -- Loop through all badges, check unlock conditions
  for v_badge in select * from badges loop
    -- Skip if already awarded
    continue when exists (
      select 1 from employee_badges
      where employee_id = p_employee_id and badge_id = v_badge.id
    );

    -- Check unlock condition
    if v_badge.unlock_metric = 'xp' then
      if v_badge.unlock_operator = 'gte' and v_employee.xp_total >= v_badge.unlock_value then
        insert into employee_badges (employee_id, badge_id) values (p_employee_id, v_badge.id);
        -- Notify
        insert into notifications (user_id, type, message)
        values (p_employee_id, 'badge_unlock', 'You earned the badge: ' || v_badge.name || ' ' || v_badge.icon);
      elsif v_badge.unlock_operator = 'eq' and v_employee.xp_total = v_badge.unlock_value then
        insert into employee_badges (employee_id, badge_id) values (p_employee_id, v_badge.id);
        insert into notifications (user_id, type, message)
        values (p_employee_id, 'badge_unlock', 'You earned the badge: ' || v_badge.name || ' ' || v_badge.icon);
      end if;
    elsif v_badge.unlock_metric = 'completed_challenges' then
      if v_badge.unlock_operator = 'gte' and v_completed_count >= v_badge.unlock_value then
        insert into employee_badges (employee_id, badge_id) values (p_employee_id, v_badge.id);
        insert into notifications (user_id, type, message)
        values (p_employee_id, 'badge_unlock', 'You earned the badge: ' || v_badge.name || ' ' || v_badge.icon);
      elsif v_badge.unlock_operator = 'eq' and v_completed_count = v_badge.unlock_value then
        insert into employee_badges (employee_id, badge_id) values (p_employee_id, v_badge.id);
        insert into notifications (user_id, type, message)
        values (p_employee_id, 'badge_unlock', 'You earned the badge: ' || v_badge.name || ' ' || v_badge.icon);
      end if;
    end if;
  end loop;
end;
$$;

-- Trigger on xp_total change in profiles
create or replace function fn_profile_xp_changed()
returns trigger language plpgsql security definer as $$
begin
  if new.xp_total <> old.xp_total then
    perform fn_badge_auto_award(new.id);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_profile_xp_badge on profiles;
create trigger trg_profile_xp_badge
  after update of xp_total on profiles
  for each row execute function fn_profile_xp_changed();

-- Trigger on challenge completion (approval)
create or replace function fn_challenge_approved()
returns trigger language plpgsql security definer as $$
declare
  v_xp integer;
begin
  if new.approval_status = 'approved' and old.approval_status <> 'approved' then
    -- Get challenge XP value
    select xp into v_xp from challenges where id = new.challenge_id;

    -- Award XP on profiles
    update profiles
    set xp_total = xp_total + v_xp
    where id = new.employee_id;

    -- Update xp_awarded on the participation row
    new.xp_awarded := v_xp;

    -- Notify employee
    insert into notifications (user_id, type, message)
    values (new.employee_id, 'challenge_approval', 'Your challenge was approved! You earned ' || v_xp || ' XP.');

    -- Badge check handled by trg_profile_xp_badge above
  end if;
  return new;
end;
$$;

drop trigger if exists trg_challenge_approved on challenge_participations;
create trigger trg_challenge_approved
  before update of approval_status on challenge_participations
  for each row execute function fn_challenge_approved();


-- -------------------------------------------------------
-- TRIGGER 3: Participation Approval → Credits Points
-- BEFORE UPDATE on employee_participations
-- -------------------------------------------------------
create or replace function fn_participation_approved()
returns trigger language plpgsql security definer as $$
declare
  v_points integer default 10; -- default points per participation
begin
  if new.approval_status = 'approved' and old.approval_status <> 'approved' then
    new.points_earned := v_points;
    new.completion_date := current_date;

    update profiles
    set points_balance = points_balance + v_points
    where id = new.employee_id;

    insert into notifications (user_id, type, message)
    values (new.employee_id, 'csr_approval', 'Your CSR activity participation was approved! You earned ' || v_points || ' points.');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_participation_approved on employee_participations;
create trigger trg_participation_approved
  before update of approval_status on employee_participations
  for each row execute function fn_participation_approved();


-- -------------------------------------------------------
-- TRIGGER 4: New Compliance Issue → Notify Owner
-- -------------------------------------------------------
create or replace function fn_compliance_issue_notify()
returns trigger language plpgsql security definer as $$
begin
  insert into notifications (user_id, type, message)
  values (
    new.owner_id,
    'new_compliance_issue',
    'You have been assigned a compliance issue: ' || left(new.description, 80) || '. Due: ' || to_char(new.due_date, 'DD Mon YYYY')
  );
  return new;
end;
$$;

drop trigger if exists trg_compliance_issue_notify on compliance_issues;
create trigger trg_compliance_issue_notify
  after insert on compliance_issues
  for each row execute function fn_compliance_issue_notify();


-- -------------------------------------------------------
-- FUNCTION: redeem_reward (atomic check-and-decrement)
-- Called from API route, never two separate client calls
-- -------------------------------------------------------
create or replace function redeem_reward(p_employee_id uuid, p_reward_id uuid)
returns jsonb language plpgsql security definer as $$
declare
  v_reward    record;
  v_employee  record;
begin
  -- Lock the reward row
  select * into v_reward from rewards where id = p_reward_id for update;

  if v_reward.id is null then
    return jsonb_build_object('success', false, 'error', 'Reward not found');
  end if;
  if v_reward.status = 'inactive' then
    return jsonb_build_object('success', false, 'error', 'Reward is not available');
  end if;
  if v_reward.stock <= 0 then
    return jsonb_build_object('success', false, 'error', 'Out of stock');
  end if;

  -- Lock the employee row
  select * into v_employee from profiles where id = p_employee_id for update;

  if v_employee.points_balance < v_reward.points_required then
    return jsonb_build_object('success', false, 'error', 'Insufficient points balance');
  end if;

  -- Atomic deduct
  update rewards set stock = stock - 1 where id = p_reward_id;
  update profiles set points_balance = points_balance - v_reward.points_required where id = p_employee_id;

  -- Record redemption
  insert into reward_redemptions (employee_id, reward_id, points_deducted)
  values (p_employee_id, p_reward_id, v_reward.points_required);

  return jsonb_build_object('success', true, 'points_deducted', v_reward.points_required);
end;
$$;


-- -------------------------------------------------------
-- FUNCTION: Auto-create profile on new auth user signup
-- -------------------------------------------------------
create or replace function fn_handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)),
    coalesce(new.raw_user_meta_data->>'role', 'employee')
  );
  return new;
end;
$$;

drop trigger if exists trg_on_auth_user_created on auth.users;
create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function fn_handle_new_user();

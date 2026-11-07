-- 1. USERS (your $7 Pro, $49 Founder Lifetime, Team)
create table users (
  id text primary key,
  email text unique not null,
  plan text default 'free' check (plan in ('free','pro','founder','team')),
  is_founder boolean default false,
  founder_number int check (founder_number between 1 and 20),
  subscription_status text default 'active',
  lifetime boolean default false,
  created_at timestamp default now()
);

-- 2. API KEYS (nova_sk_xxx that users paste)
create table api_keys (
  id uuid default gen_random_uuid() primary key,
  key text unique not null,
  user_id text references users(id) on delete cascade,
  name text default 'default',
  last_used timestamp,
  created_at timestamp default now()
);

-- 3. MEMORIES (core)
create table memories (
  id uuid default gen_random_uuid() primary key,
  user_id text references users(id) on delete cascade not null,
  content text not null,
  source text,
  type text default 'memory' check (type in ('fact','preference','memory','summary')),
  tags text[],
  metadata jsonb,
  created_at timestamp default now()
);
create index idx_memories_user on memories(user_id);
create index idx_memories_content on memories using gin (to_tsvector('english', content));

-- 4. TEAMS ($29 for 3 seats)
create table teams (
  id uuid default gen_random_uuid() primary key,
  owner_id text references users(id) not null,
  name text not null,
  seat_limit int default 3,
  seat_used int default 1,
  plan text default 'team',
  created_at timestamp default now()
);

-- 5. TEAM MEMBERS ($9 per extra)
create table team_members (
  id uuid default gen_random_uuid() primary key,
  team_id uuid references teams(id) on delete cascade,
  user_id text references users(id) on delete cascade,
  role text default 'member',
  seat_cost int default 9,
  joined_at timestamp default now(),
  unique(team_id, user_id)
);

-- 6. USAGE LOGS (limit check)
create table usage_logs (
  id uuid default gen_random_uuid() primary key,
  user_id text references users(id),
  action text,
  count int default 1,
  created_at timestamp default now()
);

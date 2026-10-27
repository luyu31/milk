-- Apple Hut 多设备云同步：Supabase 表结构
-- 使用方法：Supabase 控制台 → SQL Editor → 新建查询 → 粘贴本文件 → Run

create table if not exists public.apple_hut_kv (
  user_id    uuid        not null references auth.users(id) on delete cascade,
  key        text        not null,
  value      jsonb,
  updated_at bigint      not null default 0,
  device_id  text,
  deleted    boolean     not null default false,
  synced_at  timestamptz not null default now(),
  primary key (user_id, key)
);

-- 按用户与更新时间建立索引，便于增量拉取
create index if not exists apple_hut_kv_user_updated_idx
  on public.apple_hut_kv (user_id, updated_at desc);

-- 开启行级安全：每个账号只能读写自己的数据
alter table public.apple_hut_kv enable row level security;
alter table public.apple_hut_kv force row level security;

drop policy if exists "apple_hut_own" on public.apple_hut_kv;
create policy "apple_hut_own" on public.apple_hut_kv
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 服务端写入时间（仅用于诊断，不参与冲突判断）
create or replace function public.apple_hut_touch()
returns trigger
language plpgsql
as $$
begin
  new.synced_at = now();
  return new;
end
$$;

drop trigger if exists apple_hut_touch on public.apple_hut_kv;
create trigger apple_hut_touch
before insert or update on public.apple_hut_kv
for each row execute function public.apple_hut_touch();

-- 仅允许已登录用户访问
grant select, insert, update, delete on public.apple_hut_kv to authenticated;
revoke all on public.apple_hut_kv from anon;

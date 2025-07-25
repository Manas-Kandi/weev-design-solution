create table projects (
  id text primary key default uuid_generate_v4(),
  name text not null,
  description text,
  last_modified timestamp with time zone default now(),
  node_count integer default 0,
  status text check (status in ('draft', 'testing', 'deployed'))
);

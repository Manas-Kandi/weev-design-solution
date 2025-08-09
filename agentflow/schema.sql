create table projects (
  id text primary key default uuid_generate_v4(),
  name text not null,
  description text,
  last_modified timestamp with time zone default now(),
  node_count integer default 0,
  start_node_id text,
  status text check (status in ('draft', 'testing', 'deployed'))
);

-- Table to store individual nodes that make up a project flow
create table nodes (
  id text primary key, -- Allow both UUIDs and string IDs
  project_id text references projects(id) on delete cascade,
  type text not null,
  subtype text,
  position jsonb,
  size jsonb,
  data jsonb,
  inputs jsonb,
  outputs jsonb,
  created_at timestamp with time zone default now()
);

-- Table linking nodes together within a project
create table connections (
  id text primary key default uuid_generate_v4(),
  project_id text references projects(id) on delete cascade,
  source_node text references nodes(id) on delete cascade,
  source_output text,
  target_node text references nodes(id) on delete cascade,
  target_input text,
  created_at timestamp with time zone default now()
);

-- Row Level Security (RLS)
-- No RLS policies are defined in this project. Add policies here if your
-- application requires user-based access control.

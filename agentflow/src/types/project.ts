export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'active' | 'archived' | 'testing' | 'deployed';
  nodeCount: number;
  lastModified: Date;
  created_at: string;
  user_id: string;
}

export interface ProjectFile {
  id: string;
  project_id: string;
  name: string;
  file_path: string;
  file_type: string;
  size_bytes: number;
  created_at: string;
  updated_at: string;
  user_id: string;
}

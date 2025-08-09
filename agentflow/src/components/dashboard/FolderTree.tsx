import React, { useState, useRef, useEffect } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen, File, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabaseClient';
import type { Project } from '@/types/project';

interface Folder {
  id: string;
  name: string;
  parent_id: string | null;
  children?: Folder[];
  projects?: Project[];
  isOpen?: boolean;
}

interface FolderTreeProps {
  onSelectProject: (projectId: string) => void;
  onSelectFolder?: (folderId: string, folderName: string) => void;
  selectedProjectId?: string;
  projects: Project[];
}

export default function FolderTree({ onSelectProject, onSelectFolder, selectedProjectId, projects }: FolderTreeProps) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const [draggedProject, setDraggedProject] = useState<string | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);

  useEffect(() => {
    fetchFolders();
    // Set recent projects (last 5 accessed)
    setRecentProjects(projects.slice(0, 5));
  }, [projects]);

  const fetchFolders = async () => {
    try {
      console.log('Fetching folders...');
      
      const { data, error } = await supabase
        .from('folders')
        .select(`
          *,
          project_folders (
            project_id
          )
        `)
        .order('created_at');

      if (error) {
        console.error('Error fetching folders:', error);
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        return;
      }

      console.log('Fetched folders:', data);

      // Transform the flat folder list into a tree structure
      const folderMap = new Map<string, Folder>();
      data.forEach(folder => {
        folderMap.set(folder.id, {
          ...folder,
          children: [],
          projects: [],
          isOpen: false
        });
      });

      const rootFolders: Folder[] = [];
      folderMap.forEach(folder => {
        if (folder.parent_id === null) {
          rootFolders.push(folder);
        } else {
          const parent = folderMap.get(folder.parent_id);
          if (parent) {
            parent.children = parent.children || [];
            parent.children.push(folder);
          }
        }
      });

      setFolders(rootFolders);
    } catch (err) {
      console.error('Error in fetchFolders:', err);
    }
  };

  const handleCreateFolder = async (parentId: string | null) => {
    try {
      console.log('Creating folder with parent:', parentId);
      
      const newFolder = {
        name: 'New Folder',
        parent_id: parentId,
        user_id: '00000000-0000-0000-0000-000000000000'
      };
      
      console.log('Folder data:', newFolder);

      const { data, error } = await supabase
        .from('folders')
        .insert([newFolder])
        .select()
        .single();

      if (error) {
        console.error('Error creating folder:', error);
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        return;
      }

      if (!data) {
        console.error('No data returned from folder creation');
        return;
      }

      console.log('Folder created successfully:', data);
      setEditingFolderId(data.id);
      await fetchFolders();
    } catch (err) {
      console.error('Unexpected error creating folder:', err);
    }
  };

  const handleFolderNameChange = async (folderId: string, newName: string) => {
    try {
      const { error } = await supabase
        .from('folders')
        .update({ name: newName })
        .eq('id', folderId);

      if (error) {
        console.error('Error updating folder name:', error);
        return;
      }

      setEditingFolderId(null);
      await fetchFolders();
    } catch (err) {
      console.error('Error updating folder name:', err);
    }
  };

  const handleDrop = async (e: React.DragEvent, folderId: string) => {
    try {
      e.preventDefault();
      // Check for both internal drag (draggedProject) and external drag (window.draggedProjectId)
      const projectId = draggedProject || (window as any).draggedProjectId;
      if (!projectId) return;

      const { error } = await supabase
        .from('project_folders')
        .insert([{
          project_id: projectId,
          folder_id: folderId
        }]);

      if (error) {
        console.error('Error moving project to folder:', error);
        return;
      }

      setDraggedProject(null);
      setDragOverFolderId(null);
      // Clear the global drag state
      (window as any).draggedProjectId = null;
      await fetchFolders();
    } catch (err) {
      console.error('Error moving project to folder:', err);
    }
  };

  const renderFolder = (folder: Folder, level: number = 0) => {
    const isEditing = editingFolderId === folder.id;

    return (
      <div key={folder.id} className="select-none">
        <div
          className={cn(
            "flex items-center gap-1 py-1 px-2 rounded-sm hover:bg-white/[0.02] group",
            dragOverFolderId === folder.id && "bg-white/[0.03]"
          )}
          style={{ paddingLeft: `${level * 16 + 16}px` }}
          onDragOver={(e) => {
            e.preventDefault();
            // Accept drops from both internal and external projects
            if (draggedProject || (window as any).draggedProjectId) {
              setDragOverFolderId(folder.id);
            }
          }}
          onDragLeave={() => setDragOverFolderId(null)}
          onDrop={(e) => handleDrop(e, folder.id)}
        >
          <button
            onClick={() => {
              folder.isOpen = !folder.isOpen;
              setFolders([...folders]);
            }}
            className="p-1 hover:bg-white/[0.02] rounded-sm opacity-50 group-hover:opacity-100 transition-opacity"
          >
            {folder.children?.length ? (
              folder.isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />
            ) : null}
          </button>
          
          {folder.isOpen ? (
            <FolderOpen className="w-3.5 h-3.5 text-muted-foreground mt-0.5" />
          ) : (
            <Folder className="w-3.5 h-3.5 text-muted-foreground mt-0.5" />
          )}

          {isEditing ? (
            <input
              ref={editInputRef}
              defaultValue={folder.name}
              className="bg-transparent border-none outline-none focus:ring-1 ring-white/20 rounded px-1"
              onBlur={(e) => handleFolderNameChange(folder.id, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleFolderNameChange(folder.id, e.currentTarget.value);
                }
              }}
              autoFocus
            />
          ) : (
            <span 
              className="flex-1 text-sm cursor-pointer hover:text-white/80 transition-colors" 
              onClick={() => onSelectFolder?.(folder.id, folder.name)}
            >
              {folder.name}
            </span>
          )}

          <button
            onClick={() => handleCreateFolder(folder.id)}
            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded-md"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>

        {folder.isOpen && folder.children?.map(child => renderFolder(child, level + 1))}
        
        {folder.isOpen && folder.projects?.map(project => (
          <div
            key={project.id}
            className={cn(
              "flex items-center gap-2 py-1 px-2 rounded-md hover:bg-white/5",
              selectedProjectId === project.id && "bg-white/10"
            )}
            style={{ paddingLeft: `${(level + 1) * 12 + 12}px` }}
            onClick={() => onSelectProject(project.id)}
            draggable
            onDragStart={() => setDraggedProject(project.id)}
            onDragEnd={() => setDraggedProject(null)}
          >
            <File className="w-4 h-4 text-muted-foreground" />
            <span className="truncate">{project.name}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <div className="flex items-center justify-between px-2 py-1">
          <span className="text-sm text-white/40 pl-2">Folders</span>
          <button
            onClick={() => handleCreateFolder(null)}
            className="opacity-50 hover:opacity-100 transition-opacity mt-0.5"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
        {folders.map(folder => renderFolder(folder))}
      </div>
    </div>
  );
}
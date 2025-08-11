import React, { useState, useRef, useEffect } from 'react';
import { ChevronRight, ChevronDown, File, Plus, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabaseClient';
import type { Project } from '@/types/project';

interface Folder {
  id: string;
  name: string;
  parent_id: string | null;
  emoji?: string;
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

// Default emoji options for folders
const FOLDER_EMOJIS = ['📁', '📂', '🗂️', '📋', '📊', '💼', '🎯', '⭐', '🚀', '💡', '🔥', '⚡', '🎨', '🔧', '📝', '💻', '🌟', '🎪', '🎭', '🎵'];

// Get random emoji for new folders
const getRandomEmoji = () => {
  return FOLDER_EMOJIS[Math.floor(Math.random() * FOLDER_EMOJIS.length)];
};

export default function FolderTree({ onSelectProject, onSelectFolder, selectedProjectId, projects }: FolderTreeProps) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingEmojiId, setEditingEmojiId] = useState<string | null>(null);
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
      
      // Try creating with emoji first, fallback without if column doesn't exist
      let newFolder = {
        name: 'New Folder',
        parent_id: parentId,
        emoji: getRandomEmoji(),
        user_id: '00000000-0000-0000-0000-000000000000'
      };
      
      console.log('Folder data:', newFolder);

      let { data, error } = await supabase
        .from('folders')
        .insert([newFolder])
        .select()
        .single();

      // If emoji column doesn't exist, try without it
      if (error && (error.code === '42703' || error.message?.includes('column') || !error.code)) {
        console.warn('Emoji column not found, creating folder without emoji');
        const { name, parent_id, user_id } = newFolder;
        const folderWithoutEmoji = { name, parent_id, user_id };
        
        const result = await supabase
          .from('folders')
          .insert([folderWithoutEmoji])
          .select()
          .single();
        
        data = result.data;
        error = result.error;
        
        // If successful, add emoji to local state
        if (data && !error) {
          data.emoji = newFolder.emoji;
        }
      }

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

  const handleEmojiChange = async (folderId: string, newEmoji: string) => {
    try {
      // First check if the emoji column exists by attempting the update
      const { error } = await supabase
        .from('folders')
        .update({ emoji: newEmoji })
        .eq('id', folderId);

      if (error) {
        // Handle various database errors gracefully
        if (error.code === '42703' || error.message?.includes('column') || !error.code) {
          console.warn('Emoji column not yet added to database. Emoji changes will be temporary until database migration.');
          // Update local state only for now
          setFolders(prevFolders => {
            const updateFolderEmoji = (folders: Folder[]): Folder[] => {
              return folders.map(folder => {
                if (folder.id === folderId) {
                  return { ...folder, emoji: newEmoji };
                }
                if (folder.children) {
                  return { ...folder, children: updateFolderEmoji(folder.children) };
                }
                return folder;
              });
            };
            return updateFolderEmoji(prevFolders);
          });
          setEditingEmojiId(null);
          return; // Exit early since we handled it locally
        } else {
          console.error('Unexpected error updating folder emoji:', error);
          setEditingEmojiId(null);
          return;
        }
      }

      // Database update succeeded
      setEditingEmojiId(null);
      await fetchFolders();
    } catch (err) {
      console.error('Exception updating folder emoji:', err);
      // Fallback to local state update
      setFolders(prevFolders => {
        const updateFolderEmoji = (folders: Folder[]): Folder[] => {
          return folders.map(folder => {
            if (folder.id === folderId) {
              return { ...folder, emoji: newEmoji };
            }
            if (folder.children) {
              return { ...folder, children: updateFolderEmoji(folder.children) };
            }
            return folder;
          });
        };
        return updateFolderEmoji(prevFolders);
      });
      setEditingEmojiId(null);
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
    const isEditingEmoji = editingEmojiId === folder.id;
    const folderEmoji = folder.emoji || '📁';

    return (
      <motion.div 
        key={folder.id} 
        className="select-none"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        <div
          className={cn(
            "flex items-center gap-2 py-1.5 px-3 rounded-lg hover:bg-white/[0.03] group transition-all duration-200",
            dragOverFolderId === folder.id && "bg-white/[0.05] ring-1 ring-white/10"
          )}
          style={{ paddingLeft: `${level * 20 + 8}px` }}
          onDragOver={(e) => {
            e.preventDefault();
            if (draggedProject || (window as any).draggedProjectId) {
              setDragOverFolderId(folder.id);
            }
          }}
          onDragLeave={() => setDragOverFolderId(null)}
          onDrop={(e) => handleDrop(e, folder.id)}
        >
          {/* Expand/Collapse Button */}
          <button
            onClick={() => {
              folder.isOpen = !folder.isOpen;
              setFolders([...folders]);
            }}
            className="p-0.5 hover:bg-white/[0.05] rounded-md opacity-60 group-hover:opacity-100 transition-all duration-200"
          >
            {folder.children?.length ? (
              <motion.div
                animate={{ rotate: folder.isOpen ? 90 : 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <ChevronRight className="w-3 h-3" />
              </motion.div>
            ) : (
              <div className="w-3 h-3" /> // Spacer for alignment
            )}
          </button>
          
          {/* Emoji Icon */}
          {isEditingEmoji ? (
            <div className="flex gap-1 flex-wrap max-w-48">
              {FOLDER_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleEmojiChange(folder.id, emoji)}
                  className="text-sm hover:bg-white/10 rounded p-1 transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          ) : (
            <button
              onClick={() => setEditingEmojiId(folder.id)}
              className="text-sm hover:scale-110 transition-transform duration-200"
              title="Click to change emoji"
            >
              {folderEmoji}
            </button>
          )}

          {/* Folder Name */}
          {isEditing ? (
            <input
              ref={editInputRef}
              defaultValue={folder.name}
              className="bg-transparent border-none outline-none focus:ring-1 ring-white/20 rounded-md px-2 py-1 text-sm text-neutral-300 flex-1"
              onBlur={(e) => handleFolderNameChange(folder.id, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleFolderNameChange(folder.id, e.currentTarget.value);
                }
                if (e.key === 'Escape') {
                  setEditingFolderId(null);
                }
              }}
              autoFocus
            />
          ) : (
            <span 
              className="flex-1 text-sm text-neutral-400 cursor-pointer hover:text-neutral-300 transition-colors duration-200 font-medium" 
              onClick={() => onSelectFolder?.(folder.id, folder.name)}
              onDoubleClick={() => setEditingFolderId(folder.id)}
            >
              {folder.name}
            </span>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={() => setEditingFolderId(folder.id)}
              className="p-1 hover:bg-white/10 rounded-md transition-colors"
              title="Rename folder"
            >
              <Edit2 className="w-3 h-3 text-neutral-500" />
            </button>
            <button
              onClick={() => handleCreateFolder(folder.id)}
              className="p-1 hover:bg-white/10 rounded-md transition-colors"
              title="Add subfolder"
            >
              <Plus className="w-3 h-3 text-neutral-500" />
            </button>
          </div>
        </div>

        {/* Children and Projects with Animation */}
        <AnimatePresence>
          {folder.isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {folder.children?.map(child => renderFolder(child, level + 1))}
              
              {folder.projects?.map(project => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className={cn(
                    "flex items-center gap-3 py-1.5 px-3 rounded-lg hover:bg-white/[0.03] cursor-pointer transition-all duration-200",
                    selectedProjectId === project.id && "bg-white/[0.06] ring-1 ring-white/10"
                  )}
                  style={{ paddingLeft: `${(level + 1) * 20 + 24}px` }}
                  onClick={() => onSelectProject(project.id)}
                  draggable
                  onDragStart={() => setDraggedProject(project.id)}
                  onDragEnd={() => setDraggedProject(null)}
                >
                  <File className="w-3.5 h-3.5 text-neutral-500" />
                  <span className="truncate text-sm text-neutral-400 font-medium">{project.name}</span>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Folders</span>
        <button
          onClick={() => handleCreateFolder(null)}
          className="opacity-60 hover:opacity-100 hover:bg-white/10 p-1 rounded-md transition-all duration-200"
          title="Create new folder"
        >
          <Plus className="w-3.5 h-3.5 text-neutral-500" />
        </button>
      </div>
      <div className="space-y-0.5">
        <AnimatePresence>
          {folders.map(folder => renderFolder(folder))}
        </AnimatePresence>
      </div>
    </div>
  );
}
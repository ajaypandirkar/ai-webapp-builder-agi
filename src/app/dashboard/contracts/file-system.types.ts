// models/file-system.types.ts
export interface FileNode {
    id: string;
    name: string;
    type: 'file' | 'folder';
    parentId: string | null;
    content?: string;
    fileType?: 'html' | 'css' | 'js' | 'other';  // Added fileType
    createdAt: Date;
    updatedAt: Date;
    path?: string;  // Full path to the file/folder
  }
  
  export interface FileSystemState {
    nodes: { [key: string]: FileNode };
    rootId: string;
    activeFileId: string | null;
  }
  
  export interface CreateNodeOptions {
    name: string;
    type: 'file' | 'folder';
    parentId: string | null;
    content?: string;
    fileType?: 'html' | 'css' | 'js' | 'other';
  }
  
  export interface ProjectData {
    id: string;
    name: string;
    files: FileNode[];
    createdAt: Date;
    updatedAt: Date;
    userId: string;
  }
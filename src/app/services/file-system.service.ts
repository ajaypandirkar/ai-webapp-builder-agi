// services/file-system.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { FirestoreService } from './firestore.service';
import { CreateNodeOptions, FileNode, FileSystemState } from '../dashboard/contracts/file-system.types';

@Injectable({
  providedIn: 'root'
})
export class FileSystemService {
  private state: FileSystemState = {
    nodes: {},
    rootId: 'root',
    activeFileId: null
  };

  private stateSubject = new BehaviorSubject<FileSystemState>(this.state);
  private projectId: string | null = null;

  constructor(private firestoreService: FirestoreService) {
    // Initialize with root folder
    this.state.nodes[this.state.rootId] = {
      id: this.state.rootId,
      name: 'Root',
      type: 'folder',
      parentId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      path: '/'
    };
    this.updateState();
  }

  setProjectId(projectId: string) {
    this.projectId = projectId;
  }

  getState(): Observable<FileSystemState> {
    return this.stateSubject.asObservable();
  }

  async createNode(options: CreateNodeOptions): Promise<string> {
    const id = uuidv4();
    const parentNode = options.parentId ? this.state.nodes[options.parentId] : null;
    const parentPath = parentNode ? parentNode.path : '/';
    
    const newNode: FileNode = {
      id,
      name: options.name,
      type: options.type,
      parentId: options.parentId || this.state.rootId,
      content: options.content || '',
      fileType: options.type === 'file' ? this.determineFileType(options.name) : undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
      path: `${parentPath}${options.name}`
    };

    this.state.nodes[id] = newNode;

    if (this.projectId) {
      await this.firestoreService.updateProject(this.projectId, {
        files: Object.values(this.state.nodes)
      });
    }

    this.updateState();
    return id;
  }

  private determineFileType(filename: string): 'html' | 'css' | 'js' | 'other' {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'html': return 'html';
      case 'css': return 'css';
      case 'js': return 'js';
      default: return 'other';
    }
  }

  async updateFileContent(fileId: string, content: string): Promise<void> {
    if (this.state.nodes[fileId]) {
      this.state.nodes[fileId] = {
        ...this.state.nodes[fileId],
        content,
        updatedAt: new Date()
      };

      if (this.projectId) {
        await this.firestoreService.updateFileContent(
          this.projectId,
          fileId,
          content
        );
      }

      this.updateState();
    }
  }

  setActiveFile(fileId: string | null): void {
    this.state.activeFileId = fileId;
    this.updateState();
  }

  getActiveFile(): FileNode | null {
    return this.state.activeFileId ? this.state.nodes[this.state.activeFileId] : null;
  }

  getFileContent(fileId: string): string | undefined {
    return this.state.nodes[fileId]?.content;
  }

  async deleteNode(id: string): Promise<void> {
    const node = this.state.nodes[id];
    if (!node) return;

    // Recursively delete children if it's a folder
    if (node.type === 'folder') {
      const childNodes = Object.values(this.state.nodes)
        .filter(n => n.parentId === id);
      
      for (const child of childNodes) {
        await this.deleteNode(child.id);
      }
    }

    delete this.state.nodes[id];

    if (this.projectId) {
      await this.firestoreService.updateProject(this.projectId, {
        files: Object.values(this.state.nodes)
      });
    }

    if (this.state.activeFileId === id) {
      this.state.activeFileId = null;
    }

    this.updateState();
  }

  getChildren(parentId: string): FileNode[] {
    return Object.values(this.state.nodes)
      .filter(node => node.parentId === parentId)
      .sort((a, b) => {
        // Folders first, then files
        if (a.type !== b.type) {
          return a.type === 'folder' ? -1 : 1;
        }
        // Alphabetical within same type
        return a.name.localeCompare(b.name);
      });
  }

  private updateState(): void {
    this.stateSubject.next({ ...this.state });
  }
}
// services/firestore.service.ts
import { Injectable } from '@angular/core';
import { 
  Firestore,
  collection,
  collectionData,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  DocumentReference,
  CollectionReference,
  Query
} from '@angular/fire/firestore';
import { Observable, from, map } from 'rxjs';
import { FileNode, ProjectData } from '../dashboard/contracts/file-system.types';

@Injectable({
  providedIn: 'root'
})
export class FirestoreService {
  private readonly PROJECTS_COLLECTION = 'projects';
  private readonly FILES_COLLECTION = 'files';
  private readonly FOLDERS_COLLECTION = 'folders';

  constructor(private firestore: Firestore) {}

  // Project Operations
  async createProject(projectData: Omit<ProjectData, 'id'>): Promise<string> {
    const projectsRef = collection(this.firestore, this.PROJECTS_COLLECTION);
    const docRef = await addDoc(projectsRef, {
      ...projectData,
      files: [],
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return docRef.id;
  }

  getProject(projectId: string): Observable<ProjectData> {
    const projectRef = doc(this.firestore, this.PROJECTS_COLLECTION, projectId);
    return from(getDoc(projectRef)).pipe(
      map(docSnap => {
        if (!docSnap.exists()) throw new Error('Project not found');
        const data = docSnap.data();
        return {
          id: docSnap.id,
          name: data['name'] as string,
          files: (data['files'] || []) as FileNode[],
          createdAt: data['createdAt'] as Date,
          updatedAt: data['updatedAt'] as Date,
          userId: data['userId'] as string
        } as ProjectData;
      })
    );
  }

  async updateProject(projectId: string, data: Partial<ProjectData>): Promise<void> {
    const projectRef = doc(this.firestore, this.PROJECTS_COLLECTION, projectId);
    const updateData = {
      ...data,
      updatedAt: new Date()
    };
    return updateDoc(projectRef, updateData);
  }

  // File Operations
  async createFile(projectId: string, fileData: Omit<FileNode, 'id'>): Promise<string> {
    const filesRef = collection(
      this.firestore,
      this.PROJECTS_COLLECTION,
      projectId,
      this.FILES_COLLECTION
    );
    
    const docRef = await addDoc(filesRef, {
      ...fileData,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return docRef.id;
  }

  async updateFileContent(projectId: string, fileId: string, content: string): Promise<void> {
    const fileRef = doc(
      this.firestore,
      this.PROJECTS_COLLECTION,
      projectId,
      this.FILES_COLLECTION,
      fileId
    );
    
    return updateDoc(fileRef, { 
      content,
      updatedAt: new Date()
    });
  }

  getProjectFiles(projectId: string): Observable<FileNode[]> {
    const filesRef = collection(
      this.firestore,
      this.PROJECTS_COLLECTION,
      projectId,
      this.FILES_COLLECTION
    );
    
    return collectionData(filesRef, { idField: 'id' }).pipe(
      map(files => files as FileNode[])
    );
  }

  async createFolder(projectId: string, folderData: Omit<FileNode, 'id'>): Promise<string> {
    const foldersRef = collection(
      this.firestore,
      this.PROJECTS_COLLECTION,
      projectId,
      this.FOLDERS_COLLECTION
    );
    
    const docRef = await addDoc(foldersRef, {
      ...folderData,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return docRef.id;
  }

  getProjectFolders(projectId: string): Observable<FileNode[]> {
    const foldersRef = collection(
      this.firestore,
      this.PROJECTS_COLLECTION,
      projectId,
      this.FOLDERS_COLLECTION
    );
    
    return collectionData(foldersRef, { idField: 'id' }).pipe(
      map(folders => folders as FileNode[])
    );
  }

  getProjectHtmlFiles(projectId: string): Observable<FileNode[]> {
    const filesRef = collection(
      this.firestore,
      this.PROJECTS_COLLECTION,
      projectId,
      this.FILES_COLLECTION
    );
    
    const htmlFilesQuery = query(filesRef, where('fileType', '==', 'html'));
    
    return collectionData(htmlFilesQuery, { idField: 'id' }).pipe(
      map(files => files as FileNode[])
    );
  }

  async deleteFile(projectId: string, fileId: string): Promise<void> {
    const fileRef = doc(
      this.firestore,
      this.PROJECTS_COLLECTION,
      projectId,
      this.FILES_COLLECTION,
      fileId
    );
    return deleteDoc(fileRef);
  }

  async deleteFolder(projectId: string, folderId: string): Promise<void> {
    const folderRef = doc(
      this.firestore,
      this.PROJECTS_COLLECTION,
      projectId,
      this.FOLDERS_COLLECTION,
      folderId
    );
    return deleteDoc(folderRef);
  }

  // async testAllOperations(): Promise<void> {
  //   try {
  //     console.log('Starting Firestore operations test...');

  //     // 1. Create a test project
  //     console.log('1. Testing project creation...');
  //     const testProject: Omit<ProjectData, 'id'> = {
  //       name: 'Test Project',
  //       files: [],
  //       createdAt: new Date(),
  //       updatedAt: new Date(),
  //       userId: 'test-user'
  //     };

  //     const projectId = await this.createProject(testProject);
  //     console.log('✅ Project created with ID:', projectId);

  //     // Wait briefly to ensure project is created
  //     await new Promise(resolve => setTimeout(resolve, 1000));

  //     // 2. Create a test folder
  //     console.log('2. Testing folder creation...');
  //     const folderData: Omit<FileNode, 'id'> = {
  //       name: 'Test Folder',
  //       type: 'folder',
  //       parentId: null,
  //       createdAt: new Date(),
  //       updatedAt: new Date(),
  //       path: '/test-folder'
  //     };

  //     const folderId = await this.createFolder(projectId, folderData);
  //     console.log('✅ Folder created with ID:', folderId);

  //     // 3. Create a test file
  //     console.log('3. Testing file creation...');
  //     const fileData: Omit<FileNode, 'id'> = {
  //       name: 'test.html',
  //       type: 'file',
  //       parentId: folderId,
  //       content: '<h1>Test Content</h1>',
  //       fileType: 'html',
  //       createdAt: new Date(),
  //       updatedAt: new Date(),
  //       path: '/test-folder/test.html'
  //     };

  //     const fileId = await this.createFile(projectId, fileData);
  //     console.log('✅ File created with ID:', fileId);

  //     // Wait for async operations to complete
  //     await new Promise(resolve => setTimeout(resolve, 1000));

  //     // Test cleanup
  //     console.log('4. Testing deletion...');
  //     await this.deleteFile(projectId, fileId);
  //     console.log('✅ File deleted');
  //     await this.deleteFolder(projectId, folderId);
  //     console.log('✅ Folder deleted');

  //     console.log('✅ All operations completed successfully!');

  //   } catch (error) {
  //     console.error('❌ Test failed:', error);
  //     throw error;
  //   }
  // }
}
// side-panel.component.ts
import { Component, Input, OnInit } from '@angular/core';
import { combineLatest, Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { FileNode } from '../contracts/file-system.types';
import { FileSystemService } from '../../services/file-system.service';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-side-panel',
  templateUrl: './side-panel.component.html',
  styleUrls: ['./side-panel.component.css']
})
export class SidePanelComponent implements OnInit {
  @Input() isSidebarActive: boolean = true;
  
  isPanelCollapsed = false;
  sidebarWidth = '16rem';
  isAuthenticated = false;
  currentUser: any = null;

  nodes$: Observable<FileNode[]>;
  expandedFolders = new Set(['root']);
  activeNodeId: string | null = null;
  isCreatingNew = false;
  newItemType: 'file' | 'folder' | null = null;
  newItemParentId: string | null = null;
  newItemName = '';

  private subscriptions: Subscription[] = [];

  constructor(
    private fileSystemService: FileSystemService,
    private authService: AuthService
  ) {
    // Initialize nodes$ with authentication check
    this.nodes$ = combineLatest([
      this.authService.currentUser$,
      this.fileSystemService.getState()
    ]).pipe(
      map(([user, state]) => {
        if (!user) return [];
        return this.fileSystemService.getChildren('root');
      })
    );
  }
  
  testInProgress = false;
  testError: string | null = null;
  testSuccess = false;

  ngOnInit() {
    // Subscribe to auth state
    this.subscriptions.push(
      this.authService.currentUser$.subscribe(user => {
        this.currentUser = user;
        this.isAuthenticated = !!user;
      })
    );

    //await this.testOperations();
    this.handleResize();
    window.addEventListener('resize', () => this.handleResize());
  }

  // async testOperations() {
  //   this.testInProgress = true;
  //   this.testError = null;
  //   this.testSuccess = false;

  //   try {
  //     await this.firestoreService.testAllOperations();
  //     this.testSuccess = true;
  //   } catch (error) {
  //     this.testError = 'Test failed. Check console for details.';
  //     console.error('Test error:', error);
  //   } finally {
  //     this.testInProgress = false;
  //   }
  // }

  togglePanel() {
    this.isPanelCollapsed = !this.isPanelCollapsed;
    this.sidebarWidth = this.isPanelCollapsed ? '4rem' : '16rem';
  }

  toggleFolder(folderId: string): void {
    if (this.expandedFolders.has(folderId)) {
      this.expandedFolders.delete(folderId);
    } else {
      this.expandedFolders.add(folderId);
    }
  }

  isFolderExpanded(folderId: string): boolean {
    return this.expandedFolders.has(folderId);
  }

  getChildNodes(parentId: string): FileNode[] {
    return this.fileSystemService.getChildren(parentId);
  }

  async startCreatingNode(type: 'file' | 'folder', parentId: string | null) {
    this.isCreatingNew = true;
    this.newItemType = type;
    this.newItemParentId = parentId;
    this.newItemName = '';
  }

  cancelCreatingNode() {
    this.isCreatingNew = false;
    this.newItemType = null;
    this.newItemParentId = null;
    this.newItemName = '';
  }

  async createNode() {
    if (!this.isAuthenticated) {
      //this.snackBar.open('Please login to create files', 'Close', { duration: 3000 });
      return;
    }

    if (!this.newItemName || !this.newItemType) return;

    try {
      const fileId = await this.fileSystemService.createNode({
        name: this.newItemName,
        type: this.newItemType,
        parentId: this.newItemParentId
      });

      if (this.newItemParentId) {
        this.expandedFolders.add(this.newItemParentId);
      }

      if (this.newItemType === 'file' && this.newItemName.endsWith('.html')) {
        this.fileSystemService.setActiveFile(fileId);
      }

      //this.snackBar.open('Item created successfully', 'Close', { duration: 3000 });
    } catch (error) {
      //this.snackBar.open('Error creating item', 'Close', { duration: 3000 });
      console.error('Error creating node:', error);
    }

    this.cancelCreatingNode();
  }

  async deleteNode(id: string) {
    if (!this.isAuthenticated) {
      //this.snackBar.open('Please login to delete files', 'Close', { duration: 3000 });
      return;
    }

    try {
      await this.fileSystemService.deleteNode(id);
      //this.snackBar.open('Item deleted successfully', 'Close', { duration: 3000 });
    } catch (error) {
      //this.snackBar.open('Error deleting item', 'Close', { duration: 3000 });
      console.error('Error deleting node:', error);
    }
  }

  selectNode(node: FileNode) {
    if (!this.isAuthenticated) {
      //this.snackBar.open('Please login to select files', 'Close', { duration: 3000 });
      return;
    }

    if (node.type === 'file') {
      this.activeNodeId = node.id;
      this.fileSystemService.setActiveFile(node.id);
    }
  }

  private handleResize() {
    if (window.innerWidth >= 768) {
      this.isSidebarActive = true;
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    window.removeEventListener('resize', () => this.handleResize());
  }
}
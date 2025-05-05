import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { BehaviorSubject, Subscription, firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';
import {
  CreateProjectDto,
  Page,
  Project,
} from '../../services/project.service';
import { ProjectService } from '../../services/project.service';
import { AuthService } from '../../auth/auth.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-project-explorer',
  templateUrl: './project-explorer.component.html',
  styleUrls: ['./project-explorer.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
})
export class ProjectExplorerComponent implements OnInit, OnDestroy {
  projects: Project[] = [];
  selectedProject: Project | null = null;
  isCreatingProject = false;
  isCreatingPage = false;
  projectForm: FormGroup;
  pageForm: FormGroup;
  private currentProjectSubject = new BehaviorSubject<Project | null>(null);
  currentProject$ = this.currentProjectSubject.asObservable();
  private subscriptions: Subscription[] = [];
  isLoading = false;

  constructor(
    private projectService: ProjectService,
    private fb: FormBuilder,
    private notification: NotificationService,
    private authService: AuthService,
    private router: Router
  ) {
    this.projectForm = this.fb.group({
      name: ['', [Validators.required]],
      description: [''],
    });

    this.pageForm = this.fb.group({
      name: ['', [Validators.required]],
      path: ['', [Validators.required]],
    });
  }

  ngOnInit() {
    this.subscriptions.push(
      this.authService.isAuthenticated$.subscribe((isAuth: boolean) => {
        if (isAuth) {
          this.loadProjects();
        } else {
          this.router.navigate(['/login']);
        }
      })
    );

    this.subscriptions.push(
      this.currentProject$.subscribe((project) => {
        this.selectedProject = project;
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  async loadProjects() {
    if (this.isLoading) return;

    this.isLoading = true;
    try {
      const projectsObservable = await this.projectService.getUserProjects();
      const projects = await firstValueFrom(projectsObservable);
      this.projects = projects;
    } catch (error: any) {
      if (error.status === 401) {
        this.router.navigate(['/login']);
      } else {
        this.notification.show('Error loading projects', 'error');
        console.error('Error loading projects:', error);
      }
    } finally {
      this.isLoading = false;
    }
  }

  async createProject() {
    if (this.projectForm.valid) {
      const projectDto: CreateProjectDto = this.projectForm.value;
      try {
        const createProjectObservable = await this.projectService.createProject(
          projectDto
        );
        await firstValueFrom(createProjectObservable);
        this.isCreatingProject = false;
        this.projectForm.reset();
        this.notification.show('Project created successfully');
        await this.loadProjects();
      } catch (error: any) {
        if (error.status === 401) {
          this.router.navigate(['/login']);
        } else {
          this.notification.show('Error creating project', 'error');
          console.error('Error creating project:', error);
        }
      }
    }
  }

  async selectProject(project: Project) {
    try {
      const projectObservable = await this.projectService.getProject(
        project.id
      );
      const fullProject = await firstValueFrom(projectObservable);
      this.currentProjectSubject.next(fullProject);
    } catch (error: any) {
      if (error.status === 401) {
        this.router.navigate(['/login']);
      } else {
        this.notification.show('Error loading project', 'error');
        console.error('Error loading project:', error);
      }
    }
  }

  async deleteProject(project: Project, event: Event) {
    event.stopPropagation();
    if (confirm(`Are you sure you want to delete project "${project.name}"?`)) {
      try {
        const deleteProjectObservable = await this.projectService.deleteProject(
          project.id
        );
        await firstValueFrom(deleteProjectObservable);
        this.notification.show('Project deleted successfully');
        await this.loadProjects();
        if (this.selectedProject?.id === project.id) {
          this.currentProjectSubject.next(null);
        }
      } catch (error: any) {
        if (error.status === 401) {
          this.router.navigate(['/login']);
        } else {
          this.notification.show('Error deleting project', 'error');
          console.error('Error deleting project:', error);
        }
      }
    }
  }

  async createPage() {
    if (this.pageForm.valid && this.selectedProject) {
      const pageData: Omit<Page, 'id'> = {
        ...this.pageForm.value,
        content: '', // Initialize with empty content
        projectId: this.selectedProject.id,
      };

      try {
        const createPageObservable = await this.projectService.createPage(
          this.selectedProject.id,
          pageData
        );
        await firstValueFrom(createPageObservable);
        this.isCreatingPage = false;
        this.pageForm.reset();
        this.notification.show('Page created successfully');
        // Refresh the current project to show the new page
        await this.selectProject(this.selectedProject);
      } catch (error: any) {
        if (error.status === 401) {
          this.router.navigate(['/login']);
        } else {
          this.notification.show('Error creating page', 'error');
          console.error('Error creating page:', error);
        }
      }
    }
  }

  selectPage(page: Page) {
    // Implement page selection logic (e.g., open in editor)
  }

  async deletePage(page: Page, event: Event) {
    event.stopPropagation();
    if (
      this.selectedProject &&
      page.id &&
      confirm(`Are you sure you want to delete page "${page.name}"?`)
    ) {
      try {
        const deletePageObservable = await this.projectService.deletePage(
          this.selectedProject.id,
          page.id
        );
        await firstValueFrom(deletePageObservable);
        this.notification.show('Page deleted successfully');
        // Refresh the current project to update the pages list
        await this.selectProject(this.selectedProject);
      } catch (error: any) {
        if (error.status === 401) {
          this.router.navigate(['/login']);
        } else {
          this.notification.show('Error deleting page', 'error');
          console.error('Error deleting page:', error);
        }
      }
    }
  }

  // UI Helpers
  startCreatingProject() {
    this.isCreatingProject = true;
    this.projectForm.reset();
  }

  cancelCreatingProject() {
    this.isCreatingProject = false;
    this.projectForm.reset();
  }

  startCreatingPage() {
    this.isCreatingPage = true;
    this.pageForm.reset();
  }

  cancelCreatingPage() {
    this.isCreatingPage = false;
    this.pageForm.reset();
  }
}

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from, switchMap } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { getAuth } from 'firebase/auth';

export interface CreateProjectDto {
  name: string;
  description: string;
}

export interface Page {
  id?: string;
  projectId: string;
  name: string;
  path: string;
  content: string;
  lastModifiedBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  userId: string;
  createdAt?: Date;
  updatedAt?: Date;
  pages?: Page[];
}

interface ProjectResponse {
  id: string;
}

@Injectable({
  providedIn: 'root',
})
export class ProjectService {
  private apiUrl = `${environment.apiUrl}/project`;

  constructor(private http: HttpClient) {}

  private getHeaders(): Observable<HttpHeaders> {
    const auth = getAuth();
    return from(
      auth.currentUser?.getIdToken() ?? Promise.reject('No user logged in')
    ).pipe(
      map((token) => new HttpHeaders().set('Authorization', `Bearer ${token}`))
    );
  }

  getUserProjects(): Observable<Project[]> {
    return this.getHeaders().pipe(
      switchMap((headers) =>
        this.http.get<Project[]>(`${this.apiUrl}/user`, { headers })
      )
    );
  }

  getProject(id: string): Observable<Project> {
    return this.getHeaders().pipe(
      switchMap((headers) =>
        this.http.get<Project>(`${this.apiUrl}/${id}`, { headers })
      )
    );
  }

  createProject(project: CreateProjectDto): Observable<string> {
    return this.getHeaders().pipe(
      switchMap((headers) =>
        this.http
          .post<ProjectResponse>(this.apiUrl, project, { headers })
          .pipe(map((response) => response.id))
      )
    );
  }

  updateProject(id: string, project: Partial<Project>): Observable<void> {
    return this.getHeaders().pipe(
      switchMap((headers) => {
        const projectToUpdate = {
          ...project,
          id,
          updatedAt: new Date(),
        };
        return this.http.put<void>(`${this.apiUrl}/${id}`, projectToUpdate, {
          headers,
        });
      })
    );
  }

  deleteProject(id: string): Observable<void> {
    return this.getHeaders().pipe(
      switchMap((headers) =>
        this.http.delete<void>(`${this.apiUrl}/${id}`, { headers })
      )
    );
  }

  createPage(projectId: string, page: Omit<Page, 'id'>): Observable<string> {
    const auth = getAuth();
    const userId = auth.currentUser?.uid;

    if (!userId) {
      throw new Error('User not authenticated');
    }

    return this.getHeaders().pipe(
      switchMap((headers) => {
        const pageToCreate = {
          ...page,
          projectId,
          lastModifiedBy: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        return this.http
          .post<ProjectResponse>(
            `${this.apiUrl}/${projectId}/pages`,
            pageToCreate,
            { headers }
          )
          .pipe(map((response) => response.id));
      })
    );
  }

  updatePage(
    projectId: string,
    pageId: string,
    page: Partial<Page>
  ): Observable<void> {
    const auth = getAuth();
    const userId = auth.currentUser?.uid;

    if (!userId) {
      throw new Error('User not authenticated');
    }

    return this.getHeaders().pipe(
      switchMap((headers) => {
        const pageToUpdate = {
          ...page,
          id: pageId,
          projectId,
          lastModifiedBy: userId,
          updatedAt: new Date(),
        };

        return this.http.put<void>(
          `${this.apiUrl}/${projectId}/pages/${pageId}`,
          pageToUpdate,
          { headers }
        );
      })
    );
  }

  deletePage(projectId: string, pageId: string): Observable<void> {
    return this.getHeaders().pipe(
      switchMap((headers) =>
        this.http.delete<void>(`${this.apiUrl}/${projectId}/pages/${pageId}`, {
          headers,
        })
      )
    );
  }

  getPage(projectId: string, pageId: string): Observable<Page> {
    return this.getHeaders().pipe(
      switchMap((headers) =>
        this.http.get<Page>(`${this.apiUrl}/${projectId}/pages/${pageId}`, {
          headers,
        })
      )
    );
  }
}

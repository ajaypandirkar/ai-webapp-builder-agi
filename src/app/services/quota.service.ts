import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, switchMap } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from '../auth/auth.service';

export interface QuotaInfo {
  used: number;
  limit: number;
  isSubscribed: boolean;
  subscriptionTier: string;
  resetDate: string;
  quotaResetPeriod: string;
}

export interface QuotaStatus {
  canGenerate: boolean;
  remainingPosts: number;
  quotaPercentage: number;
  nextResetDate: string;
  warningLevel: string;
}

@Injectable({
  providedIn: 'root',
})
export class QuotaService {
  private apiUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient, private authService: AuthService) {}

  /**
   * Get the current quota information for the authenticated user
   */
  getQuotaInfo(): Observable<{ quotaInfo: QuotaInfo }> {
    return from(this.authService.getIdToken()).pipe(
      switchMap((token) => {
        return this.http.get<{ quotaInfo: QuotaInfo }>(`${this.apiUrl}/quota`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      })
    );
  }

  /**
   * Get the quota status indicating if the user can generate content
   */
  getQuotaStatus(): Observable<QuotaStatus> {
    return from(this.authService.getIdToken()).pipe(
      switchMap((token) => {
        return this.http.get<QuotaStatus>(`${this.apiUrl}/quota/status`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      })
    );
  }

  /**
   * Increment the quota usage for a specific generation
   */
  incrementQuota(
    postId: string,
    generationType: string
  ): Observable<{ success: boolean; newQuotaInfo: any }> {
    return from(this.authService.getIdToken()).pipe(
      switchMap((token) => {
        return this.http.post<{ success: boolean; newQuotaInfo: any }>(
          `${this.apiUrl}/quota/increment`,
          {
            postId,
            generationType,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      })
    );
  }
}

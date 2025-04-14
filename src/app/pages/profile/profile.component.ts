import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../auth/auth.service';
import {
  QuotaService,
  QuotaInfo,
  QuotaStatus,
} from '../../services/quota.service';
import { Router } from '@angular/router';
import { firstValueFrom, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
})
export class ProfileComponent implements OnInit {
  user: any;
  quotaInfo: QuotaInfo | null = null;
  quotaStatus: QuotaStatus | null = null;
  isLoading = true;
  error: string | null = null;

  constructor(
    private authService: AuthService,
    private quotaService: QuotaService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUserProfile();
  }

  async loadUserProfile(): Promise<void> {
    try {
      this.isLoading = true;

      // Get current user from auth service using the observable
      this.user = await firstValueFrom(this.authService.currentUser$);

      if (!this.user) {
        this.router.navigate(['/login']);
        return;
      }

      // Load quota info
      await this.loadQuotaData();
    } catch (error) {
      console.error('Error loading user profile:', error);
      this.error = 'Failed to load profile information. Please try again.';
    } finally {
      this.isLoading = false;
    }
  }

  async loadQuotaData(): Promise<void> {
    try {
      // Get quota info first
      const quotaInfoResponse = await firstValueFrom(
        this.quotaService.getQuotaInfo().pipe(
          catchError((err) => {
            console.error('Error fetching quota info:', err);
            return of({ quotaInfo: this.getDefaultQuotaInfo() });
          })
        )
      );
      this.quotaInfo = quotaInfoResponse.quotaInfo;

      // Then get quota status
      this.quotaStatus = await firstValueFrom(
        this.quotaService.getQuotaStatus().pipe(
          catchError((err) => {
            console.error('Error fetching quota status:', err);
            return of(this.getDefaultQuotaStatus());
          })
        )
      );
    } catch (error) {
      console.error('Error loading quota data:', error);
      this.error = 'Failed to load quota information.';

      // Set defaults
      this.quotaInfo = this.getDefaultQuotaInfo();
      this.quotaStatus = this.getDefaultQuotaStatus();
    }
  }

  private getDefaultQuotaInfo(): QuotaInfo {
    return {
      used: 0,
      limit: 10,
      isSubscribed: false,
      subscriptionTier: 'free',
      resetDate: new Date(
        new Date().getTime() + 30 * 24 * 60 * 60 * 1000
      ).toISOString(),
      quotaResetPeriod: 'monthly',
    };
  }

  private getDefaultQuotaStatus(): QuotaStatus {
    return {
      canGenerate: true,
      remainingPosts: 10,
      quotaPercentage: 0,
      nextResetDate: new Date(
        new Date().getTime() + 30 * 24 * 60 * 60 * 1000
      ).toISOString(),
      warningLevel: 'none',
    };
  }

  getProgressBarColor(): string {
    if (!this.quotaStatus) return 'bg-gray-600';

    const percentage = this.quotaStatus.quotaPercentage;

    if (percentage < 50) {
      return 'bg-green-500';
    } else if (percentage < 80) {
      return 'bg-yellow-500';
    } else {
      return 'bg-red-500';
    }
  }

  navigateToPlans(): void {
    this.router.navigate(['/plans']);
  }
}

import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { QuotaService, QuotaStatus } from '../../services/quota.service';
import { Subscription, interval } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-quota-indicator',
  templateUrl: './quota-indicator.component.html',
  styleUrls: ['./quota-indicator.component.css'],
})
export class QuotaIndicatorComponent implements OnInit, OnDestroy {
  @Input() showDetails: boolean = true;

  quotaStatus: QuotaStatus | null = null;
  isLoading: boolean = true;
  error: string | null = null;

  private subscription: Subscription | null = null;

  constructor(private quotaService: QuotaService) {}

  ngOnInit(): void {
    // Initial fetch
    this.fetchQuotaStatus();

    // Refresh every 5 minutes - first get quota info then status
    this.subscription = interval(300000)
      .pipe(
        switchMap(() => this.quotaService.getQuotaInfo()),
        switchMap(() => this.quotaService.getQuotaStatus())
      )
      .subscribe({
        next: (status) => {
          this.quotaStatus = status;
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Failed to refresh quota status:', err);
          this.error = 'Failed to refresh quota status';
          this.isLoading = false;
        },
      });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  fetchQuotaStatus(): void {
    this.isLoading = true;
    this.error = null;

    // First call getQuotaInfo to ensure quota is initialized
    this.quotaService.getQuotaInfo().subscribe({
      next: () => {
        // Then get the quota status
        this.quotaService.getQuotaStatus().subscribe({
          next: (status) => {
            this.quotaStatus = status;
            this.isLoading = false;
          },
          error: (statusErr) => {
            console.error('Failed to load quota status:', statusErr);
            this.error = 'Failed to load quota status';
            this.isLoading = false;
          },
        });
      },
      error: (err) => {
        console.error('Failed to initialize quota:', err);
        this.error = 'Failed to load quota information';
        this.isLoading = false;
      },
    });
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
}

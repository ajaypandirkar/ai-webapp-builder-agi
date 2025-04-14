import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { QuotaService, QuotaInfo } from '../../services/quota.service';
import { firstValueFrom, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

interface Plan {
  id: string;
  name: string;
  price: number;
  frequency: string;
  quota: number;
  features: string[];
  isPopular: boolean;
}

@Component({
  selector: 'app-plans',
  templateUrl: './plans.component.html',
  styleUrls: ['./plans.component.css'],
})
export class PlansComponent implements OnInit {
  plans: Plan[] = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      frequency: 'forever',
      quota: 10,
      features: [
        '10 website generations per month',
        'Basic customization',
        'Standard customer support',
      ],
      isPopular: false,
    },
    {
      id: 'pro',
      name: 'Professional',
      price: 29,
      frequency: 'monthly',
      quota: 100,
      features: [
        '100 website generations per month',
        'Advanced customization options',
        'Priority customer support',
        'Custom domains',
        'Export to multiple formats',
      ],
      isPopular: true,
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 99,
      frequency: 'monthly',
      quota: 500,
      features: [
        'Unlimited website generations',
        'Team collaboration',
        'Dedicated account manager',
        'Custom API integration',
        'White-label solutions',
        'Advanced analytics',
      ],
      isPopular: false,
    },
  ];

  reasonMessages: { [key: string]: string } = {
    quota_exceeded: "You've reached your monthly generation limit.",
    upgrade_benefits:
      'Upgrade your plan to unlock more features and increased quota.',
  };

  reason: string | null = null;
  returnUrl: string | null = null;
  currentPlan: string = 'free';
  quotaInfo: QuotaInfo | null = null;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private quotaService: QuotaService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.reason = params['reason'] || null;
      this.returnUrl = params['returnUrl'] || '/editor';
    });

    this.loadCurrentPlan();
  }

  async loadCurrentPlan(): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.quotaService.getQuotaInfo().pipe(
          catchError((err) => {
            console.error('Error fetching quota info:', err);
            this.error =
              'Unable to fetch plan information. Using default plan.';
            return of({ quotaInfo: this.getDefaultQuotaInfo() });
          })
        )
      );
      this.quotaInfo = response.quotaInfo;
      this.currentPlan = this.quotaInfo.subscriptionTier || 'free';
    } catch (error) {
      console.error('Error loading plan info:', error);
      this.error = 'Failed to load plan information.';
      this.quotaInfo = this.getDefaultQuotaInfo();
      this.currentPlan = 'free';
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

  selectPlan(planId: string): void {
    // For now, just redirect to a mock checkout page
    // In a real app, this would connect to a payment processor
    this.router.navigate(['/checkout'], {
      queryParams: {
        plan: planId,
        returnUrl: this.returnUrl,
      },
    });
  }

  isCurrentPlan(planId: string): boolean {
    return this.currentPlan === planId;
  }

  goBack(): void {
    this.router.navigateByUrl(this.returnUrl || '/editor');
  }
}

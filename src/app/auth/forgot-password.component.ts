import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div
      class="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 flex items-center justify-center p-4"
    >
      <div
        class="max-w-md w-full space-y-8 bg-gray-800 rounded-2xl shadow-2xl p-6 md:p-8 border border-gray-700"
      >
        <!-- Header -->
        <div class="text-center">
          <h2 class="text-3xl font-bold text-white tracking-tight mb-2">
            Reset your password
          </h2>
          <p class="text-sm text-gray-300">
            Enter your email address and we'll send you instructions to reset
            your password.
          </p>
        </div>

        <form
          [formGroup]="resetForm"
          (ngSubmit)="onSubmit()"
          class="mt-8 space-y-6"
        >
          <!-- Success Message -->
          <div
            *ngIf="isSuccess"
            class="bg-green-900/30 border-l-4 border-green-500 p-4 rounded-md"
            role="alert"
          >
            <div class="flex">
              <div class="flex-shrink-0">
                <svg
                  class="h-5 w-5 text-green-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clip-rule="evenodd"
                  />
                </svg>
              </div>
              <div class="ml-3">
                <p class="text-sm text-green-300">
                  Password reset email sent! Check your inbox for further
                  instructions.
                </p>
              </div>
            </div>
          </div>

          <!-- Error Alert -->
          <div
            *ngIf="error"
            class="bg-red-900/30 border-l-4 border-red-500 p-4 rounded-md"
            role="alert"
          >
            <p class="text-sm text-red-300">{{ error }}</p>
          </div>

          <!-- Email Field -->
          <div>
            <label
              for="email"
              class="block text-sm font-medium text-gray-300 mb-1"
            >
              Email address
            </label>
            <input
              id="email"
              type="email"
              formControlName="email"
              class="appearance-none block w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl 
                     shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 
                     focus:ring-indigo-500 focus:border-indigo-500 transition-all text-white"
              [class.border-red-500]="isFieldInvalid('email')"
              [class.ring-red-500]="isFieldInvalid('email')"
              placeholder="name@company.com"
            />
            <p
              *ngIf="isFieldInvalid('email')"
              class="mt-2 text-sm text-red-400"
            >
              Please enter a valid email address
            </p>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            [disabled]="resetForm.invalid || isLoading"
            class="w-full flex justify-center items-center py-3 px-4 border border-transparent 
                   rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none 
                   focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 font-medium 
                   transition-all transform hover:scale-[1.02] active:scale-[0.98] 
                   disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <span *ngIf="isLoading" class="mr-2">
              <svg
                class="animate-spin h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </span>
            {{ isLoading ? 'Sending instructions...' : 'Reset password' }}
          </button>

          <!-- Back to Login -->
          <div class="text-center">
            <a
              routerLink="/login"
              class="text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              ← Back to login
            </a>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class ForgotPasswordComponent implements OnInit {
  resetForm: FormGroup;
  isLoading = false;
  isSuccess = false;
  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.resetForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  ngOnInit() {
    const email = this.route.snapshot.queryParams['email'];
    if (email) {
      this.resetForm.patchValue({
        email: decodeURIComponent(email),
      });
    }
  }

  isFieldInvalid(field: string): boolean {
    const formField = this.resetForm.get(field);
    return formField ? formField.invalid && formField.touched : false;
  }

  async onSubmit() {
    if (this.resetForm.valid) {
      this.isLoading = true;
      this.error = null;
      this.isSuccess = false;

      try {
        const { email } = this.resetForm.value;
        await firstValueFrom(this.authService.sendPasswordResetEmail(email));
        this.isSuccess = true;
        this.resetForm.reset();

        // Redirect to login after 3 seconds
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 3000);
      } catch (error: any) {
        this.error = this.getErrorMessage(error.code);
      } finally {
        this.isLoading = false;
      }
    } else {
      Object.keys(this.resetForm.controls).forEach((key) => {
        const control = this.resetForm.get(key);
        if (control?.invalid) {
          control.markAsTouched();
        }
      });
    }
  }

  private getErrorMessage(code: string): string {
    switch (code) {
      case 'auth/user-not-found':
        return 'No account found with this email address';
      case 'auth/invalid-email':
        return 'Please enter a valid email address';
      case 'auth/too-many-requests':
        return 'Too many attempts. Please try again later';
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection';
      default:
        return 'An error occurred. Please try again';
    }
  }
}

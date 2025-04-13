// signup.component.ts
import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-signup',
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
            Get started
          </h2>
          <p class="text-sm text-gray-300">
            Already have an account?
            <a
              routerLink="/login"
              class="font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Sign in
            </a>
          </p>
        </div>

        <form
          [formGroup]="signupForm"
          (ngSubmit)="onSubmit()"
          class="mt-8 space-y-6"
        >
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

          <!-- Password Field -->
          <div>
            <label
              for="password"
              class="block text-sm font-medium text-gray-300 mb-1"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              formControlName="password"
              class="appearance-none block w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl 
                     shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 
                     focus:ring-indigo-500 focus:border-indigo-500 transition-all text-white"
              [class.border-red-500]="isFieldInvalid('password')"
              [class.ring-red-500]="isFieldInvalid('password')"
              placeholder="••••••••"
            />
            <p
              *ngIf="isFieldInvalid('password')"
              class="mt-2 text-sm text-red-400"
            >
              Password must be at least 8 characters
            </p>
          </div>

          <!-- Confirm Password Field -->
          <div>
            <label
              for="confirmPassword"
              class="block text-sm font-medium text-gray-300 mb-1"
            >
              Confirm password
            </label>
            <input
              id="confirmPassword"
              type="password"
              formControlName="confirmPassword"
              class="appearance-none block w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl 
                     shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 
                     focus:ring-indigo-500 focus:border-indigo-500 transition-all text-white"
              [class.border-red-500]="isFieldInvalid('confirmPassword')"
              [class.ring-red-500]="isFieldInvalid('confirmPassword')"
              placeholder="••••••••"
            />
            <p
              *ngIf="isFieldInvalid('confirmPassword')"
              class="mt-2 text-sm text-red-400"
            >
              Passwords do not match
            </p>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            [disabled]="signupForm.invalid || isLoading"
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
            {{ isLoading ? 'Creating account...' : 'Create account' }}
          </button>

          <!-- Divider -->
          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-600"></div>
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-4 bg-gray-800 text-gray-400"
                >Or continue with</span
              >
            </div>
          </div>

          <!-- Google Sign Up -->
          <button
            type="button"
            (click)="signUpWithGoogle()"
            [disabled]="isLoading"
            class="w-full flex items-center justify-center px-4 py-3 border border-gray-600 
                   rounded-xl shadow-sm bg-gray-700 hover:bg-gray-600 focus:outline-none 
                   focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 font-medium text-white
                   transition-all transform hover:scale-[1.02] active:scale-[0.98] 
                   disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <svg
              class="h-5 w-5 mr-2"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z"
                fill="#4285f4"
              />
            </svg>
            Continue with Google
          </button>
        </form>
      </div>
    </div>
  `,
})
export class SignupComponent implements OnDestroy {
  signupForm!: FormGroup;
  isLoading = false;
  error: string | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.initializeForm();
  }

  private initializeForm() {
    this.signupForm = this.fb.group(
      {
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', Validators.required],
      },
      { validators: this.passwordMatchValidator }
    );
  }

  private passwordMatchValidator(
    control: AbstractControl
  ): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    return password &&
      confirmPassword &&
      password.value === confirmPassword.value
      ? null
      : { passwordMismatch: true };
  }

  isFieldInvalid(field: string): boolean {
    const control = this.signupForm.get(field);
    return control
      ? control.invalid && (control.dirty || control.touched)
      : false;
  }

  async onSubmit() {
    if (this.signupForm.valid) {
      this.isLoading = true;
      this.error = null;

      try {
        const { email, password } = this.signupForm.value;
        await firstValueFrom(this.authService.signUp(email, password));
        await this.router.navigate(['/editor']);
      } catch (error: any) {
        console.error('Signup error:', error);
        if (error.code) {
          this.error = this.getErrorMessage(error.code);
        } else if (error.message) {
          this.error = error.message;
        } else {
          this.error =
            'An unexpected error occurred during signup. Please try again.';
        }
      } finally {
        this.isLoading = false;
      }
    } else {
      Object.keys(this.signupForm.controls).forEach((key) => {
        const control = this.signupForm.get(key);
        if (control?.invalid) {
          control.markAsTouched();
        }
      });
    }
  }

  async signUpWithGoogle() {
    this.isLoading = true;
    this.error = null;

    try {
      await firstValueFrom(this.authService.signInWithGoogle());
      await this.router.navigate(['/editor']);
    } catch (error: any) {
      console.error('Google signup error:', error);
      if (error.code) {
        this.error = this.getErrorMessage(error.code);
      } else if (error.message) {
        this.error = error.message;
      } else {
        this.error =
          'An unexpected error occurred during Google signup. Please try again.';
      }
    } finally {
      this.isLoading = false;
    }
  }

  private getErrorMessage(code: string): string {
    switch (code) {
      case 'auth/email-already-in-use':
        return 'An account with this email already exists';
      case 'auth/invalid-email':
        return 'Invalid email address';
      case 'auth/operation-not-allowed':
        return 'Email/password accounts are not enabled. Please contact support.';
      case 'auth/weak-password':
        return 'Please choose a stronger password';
      case 'auth/too-many-requests':
        return 'Too many attempts. Please try again later';
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection';
      default:
        return 'An error occurred. Please try again';
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

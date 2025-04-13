import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div
      class="min-h-screen bg-gradient-to-br from-indigo-100 via-white to-cyan-100 flex items-center justify-center p-4"
    >
      <div
        class="max-w-md w-full space-y-8 bg-white rounded-2xl shadow-xl p-6 md:p-8"
      >
        <!-- Header -->
        <div class="text-center">
          <h2 class="text-3xl font-bold text-gray-900 tracking-tight mb-2">
            Welcome back
          </h2>
          <p class="text-sm text-gray-600">
            New here?
            <a
              routerLink="/signup"
              class="font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
            >
              Create an account
            </a>
          </p>
        </div>

        <form
          [formGroup]="loginForm"
          (ngSubmit)="onSubmit()"
          class="mt-8 space-y-6"
        >
          <!-- Error Alert -->
          <div
            *ngIf="error"
            class="bg-red-50 border-l-4 border-red-400 p-4 rounded-md"
            role="alert"
          >
            <p class="text-sm text-red-700">{{ error }}</p>
          </div>

          <!-- Email Field -->
          <div>
            <label
              for="email"
              class="block text-sm font-medium text-gray-700 mb-1"
            >
              Email address
            </label>
            <input
              id="email"
              type="email"
              formControlName="email"
              class="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-xl 
                     shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 
                     focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              [class.border-red-300]="isFieldInvalid('email')"
              [class.ring-red-500]="isFieldInvalid('email')"
              placeholder="name@company.com"
            />
            <p
              *ngIf="isFieldInvalid('email')"
              class="mt-2 text-sm text-red-600"
            >
              Please enter a valid email address
            </p>
          </div>

          <!-- Password Field -->
          <div>
            <label
              for="password"
              class="block text-sm font-medium text-gray-700 mb-1"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              formControlName="password"
              class="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-xl 
                     shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 
                     focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              [class.border-red-300]="isFieldInvalid('password')"
              [class.ring-red-500]="isFieldInvalid('password')"
              placeholder="••••••••"
            />
            <p
              *ngIf="isFieldInvalid('password')"
              class="mt-2 text-sm text-red-600"
            >
              Password is required
            </p>
          </div>

          <!-- Remember Me & Forgot Password -->
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                formControlName="rememberMe"
                class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <label
                for="remember-me"
                class="ml-2 block text-sm text-gray-700 cursor-pointer"
              >
                Remember me
              </label>
            </div>

            <button
              type="button"
              (click)="forgotPassword()"
              class="text-sm font-medium text-indigo-600 hover:text-indigo-500 
           focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 
           rounded-md transition-colors"
            >
              Forgot password?
            </button>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            [disabled]="loginForm.invalid || isLoading"
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
            {{ isLoading ? 'Signing in...' : 'Sign in' }}
          </button>

          <!-- Divider -->
          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-200"></div>
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-4 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          <!-- Google Sign In -->
          <button
            type="button"
            (click)="signInWithGoogle()"
            [disabled]="isLoading"
            class="w-full flex items-center justify-center px-4 py-3 border border-gray-300 
                   rounded-xl shadow-sm bg-white hover:bg-gray-50 focus:outline-none 
                   focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 font-medium 
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
export class LoginComponent {
  loginForm: FormGroup;
  isLoading = false;
  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false],
    });
  }

  isFieldInvalid(field: string): boolean {
    const formField = this.loginForm.get(field);
    return formField ? formField.invalid && formField.touched : false;
  }

  async onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.error = null;

      try {
        const { email, password } = this.loginForm.value;
        await this.authService.signIn(email, password).toPromise();

        const returnUrl =
          this.route.snapshot.queryParams['returnUrl'] || '/dashboard';

        await this.router.navigate([returnUrl]);
      } catch (error: any) {
        this.error = this.getErrorMessage(error.code);
      } finally {
        this.isLoading = false;
      }
    } else {
      Object.keys(this.loginForm.controls).forEach((key) => {
        const control = this.loginForm.get(key);
        if (control?.invalid) {
          control.markAsTouched();
        }
      });
    }
  }

  async signInWithGoogle() {
    this.isLoading = true;
    this.error = null;

    try {
      await this.authService.signInWithGoogle().toPromise();
      const returnUrl =
        this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
      await this.router.navigate([returnUrl]);
    } catch (error: any) {
      this.error = this.getErrorMessage(error.code);
    } finally {
      this.isLoading = false;
    }
  }

  async forgotPassword() {
    const email = this.loginForm.get('email')?.value;
    if (!email) {
      this.error =
        'Please enter your email address above before clicking forgot password';
      return;
    }

    // Navigate to forgot-password route with email pre-filled
    this.router.navigate(['/forgot-password'], {
      queryParams: { email: encodeURIComponent(email) },
    });
  }

  private getErrorMessage(code: string): string {
    switch (code) {
      case 'auth/user-not-found':
        return 'No account found with this email address';
      case 'auth/wrong-password':
        return 'Invalid email or password';
      case 'auth/too-many-requests':
        return 'Too many attempts. Please try again later';
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection';
      default:
        return 'An error occurred. Please try again';
    }
  }
}

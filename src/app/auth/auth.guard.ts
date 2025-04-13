import { Injectable, inject } from '@angular/core';
import {
  CanActivateFn,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router
} from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';
import { map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard {
  private router = inject(Router);
  private authService = inject(AuthService);

  async canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Promise<boolean> {
    try {
      // If no token exists, navigate to generator for new users
      if (!this.authService.hasStoredToken()) {
        if (!state.url.includes('/login')) {
          await this.router.navigate(['/login']);
          return false;
        }
        return true;
      }

      // Token exists but is expired, try to refresh
      if (this.authService.isTokenExpired()) {
        try {
          const newToken = await firstValueFrom(this.authService.refreshToken());
          if (newToken) {
            // Token refresh successful
            return true;
          }
          // Token refresh failed, redirect to login
          await this.router.navigate(['/login'], {
            queryParams: { returnUrl: state.url }
          });
          return false;
        } catch (error) {
          // Token refresh error, redirect to login
          await this.router.navigate(['/login']);
          return false;
        }
      }

      // Token exists and is valid
      return true;
    } catch (error) {
      console.error('Auth guard error:', error);
      // On error, redirect based on token existence
      if (this.authService.hasStoredToken()) {
        await this.router.navigate(['/login']);
      } else {
        await this.router.navigate(['/login']);
      }
      return false;
    }
  }
}

// Export the functional guard
export const authGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  return authService.isAuthenticated$.pipe(
    map(isAuthenticated => {
      if (!isAuthenticated) {
        router.navigate(['/login'], {
          queryParams: { returnUrl: state.url }
        });
        return false;
      }
      return true;
    })
  );
};
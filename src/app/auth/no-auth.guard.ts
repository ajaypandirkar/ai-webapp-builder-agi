import { Injectable, inject } from '@angular/core';
import {
  CanActivateFn,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router
} from '@angular/router';
import { AuthService } from './auth.service';
import { firstValueFrom } from 'rxjs';
import { map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NoAuthGuard {
  private router = inject(Router);
  private authService = inject(AuthService);

  async canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Promise<boolean> {
    // If user has a valid token, redirect to generator
    if (this.authService.hasStoredToken() && !this.authService.isTokenExpired()) {
      await this.router.navigate(['/create']);
      return false;
    }

    // If token exists but is expired, try to refresh
    if (this.authService.hasStoredToken() && this.authService.isTokenExpired()) {
      try {
        const newToken = await firstValueFrom(this.authService.refreshToken());
        if (newToken) {
          // Token refresh successful, redirect to generator
          await this.router.navigate(['/create']);
          return false;
        }
      } catch (error) {
        // Token refresh failed, allow access to login pages
        return true;
      }
    }

    // No token or token refresh failed, allow access to login pages
    return true;
  }
}

// Export a function that uses the guard
export const noAuthGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  return authService.isAuthenticated$.pipe(
    map(isAuthenticated => {
      if (isAuthenticated) {
        router.navigate(['/editor']);
        return false;
      }
      return true;
    })
  );
};
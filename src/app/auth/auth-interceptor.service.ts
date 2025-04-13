import { 
  HttpInterceptorFn, 
  HttpHandlerFn, 
  HttpRequest, 
  HttpEvent, 
  HttpErrorResponse 
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, throwError, BehaviorSubject, filter, take, switchMap } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';

let refreshTokenInProgress = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const AuthInterceptor: HttpInterceptorFn = (
  request: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Only add auth header for API requests
  if (!request.url.includes('/api/')) {
    return next(request);
  }

  // Skip auth header for public endpoints
  if (isPublicEndpoint(request.url)) {
    request = request.clone({
      setHeaders: {
        'Accept-Language': 'en',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    return next(request);
  }

  return authService.getIdToken().pipe(
    switchMap(token => {
      if (token) {
        request = request.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`,
            'Accept-Language': 'en',
            'Content-Type': 'application/json'
          }
        });
      }

      return next(request).pipe(
        catchError((error: HttpErrorResponse) => {
          // Handle different API error scenarios
          if (error.status === 401 && !refreshTokenInProgress) {
            return handle401Error(request, next, authService, router);
          }
          
          // Handle 404 errors for specific endpoints
          if (error.status === 404) {
            if (request.url.includes('/api/Coupons/validate/')) {
              return throwError(() => new Error('Invalid coupon code'));
            }
            if (request.url.includes('/api/Products/')) {
              return throwError(() => new Error('Product not found'));
            }
          }

          // Handle 400 errors for specific endpoints
          if (error.status === 400) {
            if (request.url.includes('/api/Coupons/generate')) {
              return throwError(() => new Error('Invalid coupon generation request'));
            }
            if (request.url.includes('/api/Products')) {
              return throwError(() => new Error('Invalid product data'));
            }
          }

          return throwError(() => error);
        })
      );
    })
  );
};

function handle401Error(
  request: HttpRequest<unknown>,
  next: HttpHandlerFn,
  authService: AuthService,
  router: Router,
): Observable<HttpEvent<unknown>> {
  if (!refreshTokenInProgress) {
    refreshTokenInProgress = true;
    refreshTokenSubject.next(null);

    return authService.refreshToken().pipe(
      switchMap(newToken => {
        refreshTokenInProgress = false;
        refreshTokenSubject.next(newToken);
        
        if (newToken) {
          return next(cloneRequestWithToken(request, newToken));
        }
        handleAuthError(authService, router);
        return throwError(() => new Error('Authentication required'));
      }),
      catchError(error => {
        refreshTokenInProgress = false;
        refreshTokenSubject.next(null);
        handleAuthError(authService, router);
        return throwError(() => error);
      })
    );
  }

  return refreshTokenSubject.pipe(
    filter(token => token !== null),
    take(1),
    switchMap(token => next(cloneRequestWithToken(request, token!)))
  );
}

function cloneRequestWithToken(request: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return request.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
      'Accept-Language': 'en',
      'Content-Type': 'application/json'
    }
  });
}

function handleAuthError(authService: AuthService, router: Router): void {
  authService.signOut().then(() => {
    router.navigate(['/login'], {
      queryParams: {
        returnUrl: router.url
      }
    });
  });
}

function isPublicEndpoint(url: string): boolean {
  const publicEndpoints = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/forgot-password',
    '/api/auth/reset-password',
    '/api/auth/verify-email',
    '/api/Products/recommended',
    '/health'
  ];
  
  return publicEndpoints.some(endpoint => url.includes(endpoint));
}
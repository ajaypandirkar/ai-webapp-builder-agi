import { Injectable } from '@angular/core';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  GoogleAuthProvider,
  signInWithPopup,
  setPersistence,
  browserLocalPersistence,
  Auth,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { BehaviorSubject, Observable, from, of, throwError } from 'rxjs';
import { tap, map, catchError, switchMap } from 'rxjs/operators';
import { AuthState, UserData } from './user.model';
import { UserService } from './user.service';
import { FirebaseInitService } from '../firebase-init.service';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private auth: Auth;
  private authStateSubject: BehaviorSubject<AuthState>;
  private readonly AUTH_TOKEN_KEY = 'auth_token';
  private readonly TOKEN_EXPIRY_KEY = 'token_expiry';
  private readonly USER_DATA_KEY = 'user_data';
  private initialized = false;

  constructor(
    private firebaseInit: FirebaseInitService,
    private userService: UserService
  ) {
    this.auth = getAuth(this.firebaseInit.getApp());
    this.authStateSubject = new BehaviorSubject<AuthState>(
      this.getInitialState()
    );
    this.initializeAuth();
  }

  private async initializeAuth() {
    try {
      // First restore from localStorage
      this.restoreAuthState();

      await setPersistence(this.auth, browserLocalPersistence);

      // Watch for auth state changes
      onAuthStateChanged(this.auth, async (user: User | null) => {
        if (user) {
          await this.updateAuthState(user);

          // If we have a user but no stored data, fetch from Firestore
          if (!localStorage.getItem(this.USER_DATA_KEY)) {
            const userData = await firstValueFrom(
              this.userService.getUserData(user.uid)
            );
            if (userData) {
              const currentState = this.authStateSubject.value;
              const newState = {
                ...currentState,
                user: {
                  ...currentState.user,
                  ...userData,
                },
              };
              this.saveToStorage(newState);
              this.authStateSubject.next(newState);
            }
          }
        } else {
          // Only clear if we're not in the initialization phase
          if (this.initialized) {
            this.clearAuthState();
          }
        }
      });

      this.initialized = true;
    } catch (error) {
      console.error('Error initializing auth:', error);
      this.initialized = true;
    }
  }

  private getInitialState(): AuthState {
    return {
      user: null,
      token: null,
      tokenExpiration: null,
    };
  }

  private mapUserToUserData(user: User): UserData {
    return {
      uid: user.uid,
      email: user.email,
      phoneNumber: user.phoneNumber,
      displayName: user.displayName,
      photoURL: user.photoURL,
      emailVerified: user.emailVerified,
    };
  }

  private async updateAuthState(user: User) {
    try {
      const token = await user.getIdToken(false);
      const decodedToken: any = this.parseJwt(token);
      const expirationTime = decodedToken.exp * 1000;

      // Get additional user data from Firestore
      const additionalData = await firstValueFrom(
        this.userService.getUserData(user.uid)
      );

      const userData = {
        ...this.mapUserToUserData(user),
        ...additionalData,
      };

      const newState: AuthState = {
        user: userData,
        token,
        tokenExpiration: expirationTime,
      };

      this.saveToStorage(newState);
      this.authStateSubject.next(newState);
    } catch (error) {
      console.error('Error updating auth state:', error);
      if (this.initialized) {
        this.clearAuthState();
      }
    }
  }

  private parseJwt(token: string) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');

      const buffer =
        typeof globalThis !== 'undefined' &&
        typeof (globalThis as any).Buffer !== 'undefined'
          ? (globalThis as any).Buffer
          : null;

      const decoded = buffer
        ? buffer.from(base64, 'base64').toString('utf-8')
        : atob(base64);

      return JSON.parse(decoded);
    } catch (error) {
      console.error('Error parsing JWT:', error);
      return {};
    }
  }

  private saveToStorage(state: AuthState) {
    if (typeof window === 'undefined') return;
    try {
      if (state.token) {
        localStorage.setItem(this.AUTH_TOKEN_KEY, state.token);
      }
      if (state.tokenExpiration) {
        localStorage.setItem(
          this.TOKEN_EXPIRY_KEY,
          state.tokenExpiration.toString()
        );
      }
      if (state.user) {
        localStorage.setItem(this.USER_DATA_KEY, JSON.stringify(state.user));
      }
    } catch (error) {
      console.error('Error saving to storage:', error);
    }
  }

  private restoreAuthState() {
    if (typeof window === 'undefined') return;

    try {
      const token = localStorage.getItem(this.AUTH_TOKEN_KEY);
      const expiry = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
      const userData = localStorage.getItem(this.USER_DATA_KEY);

      if (token && expiry && userData) {
        const parsedUserData = JSON.parse(userData);
        const state: AuthState = {
          user: parsedUserData,
          token: token,
          tokenExpiration: parseInt(expiry),
        };

        // Only restore if token isn't expired
        if (Date.now() < parseInt(expiry)) {
          this.authStateSubject.next(state);
        } else {
          // If token is expired, clear everything
          this.clearAuthState();
        }
      }
    } catch (error) {
      console.error('Error restoring auth state:', error);
      this.clearAuthState();
    }
  }

  private clearAuthState() {
    if (typeof window === 'undefined') return;

    localStorage.removeItem(this.AUTH_TOKEN_KEY);
    localStorage.removeItem(this.TOKEN_EXPIRY_KEY);
    localStorage.removeItem(this.USER_DATA_KEY);
    this.authStateSubject.next(this.getInitialState());
  }

  hasStoredToken(): boolean {
    return (
      typeof window !== 'undefined' &&
      !!localStorage.getItem(this.AUTH_TOKEN_KEY)
    );
  }

  isTokenExpired(): boolean {
    if (typeof window === 'undefined') return true;

    const expiry = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
    if (!expiry) return true;
    return Date.now() >= parseInt(expiry);
  }

  get currentUser$(): Observable<UserData | null> {
    return this.authStateSubject.pipe(map((state) => state.user));
  }

  get currentUser(): UserData | null {
    return this.authStateSubject.value.user;
  }

  get isAuthenticated$(): Observable<boolean> {
    return this.authStateSubject.pipe(map((state) => !!state.user));
  }

  get isAuthenticated(): boolean {
    return !!this.authStateSubject.value.user;
  }

  getIdToken(): Observable<string | null> {
    if (!this.hasStoredToken()) {
      return of(null);
    }

    // Check if token is expired or about to expire (within 5 minutes)
    const expiryTime = parseInt(
      localStorage.getItem(this.TOKEN_EXPIRY_KEY) || '0'
    );
    const fiveMinutes = 5 * 60 * 1000;
    if (Date.now() + fiveMinutes >= expiryTime) {
      return this.refreshToken();
    }

    return of(localStorage.getItem(this.AUTH_TOKEN_KEY));
  }

  refreshToken(): Observable<string | null> {
    const currentUser = this.auth.currentUser;
    if (!currentUser) {
      this.clearAuthState();
      return of(null);
    }

    return from(currentUser.getIdToken(true)).pipe(
      tap(async (token) => {
        if (token) {
          await this.updateAuthState(currentUser);
        }
      }),
      map((token) => token), // Ensure we return the token
      catchError((error) => {
        console.error('Error refreshing token:', error);
        this.clearAuthState();
        return throwError(() => new Error('Failed to refresh token'));
      })
    );
  }

  signIn(email: string, password: string): Observable<UserData> {
    console.log('Starting sign-in process for:', email);
    return from(signInWithEmailAndPassword(this.auth, email, password)).pipe(
      switchMap(async (userCredential) => {
        console.log('Sign-in successful for:', userCredential.user.uid);
        try {
          await this.updateAuthState(userCredential.user);
          console.log('Auth state updated for signed-in user');

          await this.userService.saveUserData(
            this.mapUserToUserData(userCredential.user)
          );
          console.log('User data updated in database');

          return this.mapUserToUserData(userCredential.user);
        } catch (error) {
          console.error('Error in post-sign-in process:', error);
          throw error;
        }
      }),
      catchError((error) => {
        console.error('Sign-in error in auth service:', error);
        return throwError(() => error);
      })
    );
  }

  signUp(email: string, password: string): Observable<UserData> {
    console.log('Starting signup process for:', email);
    return from(
      createUserWithEmailAndPassword(this.auth, email, password)
    ).pipe(
      switchMap(async (userCredential) => {
        console.log('User created successfully:', userCredential.user.uid);
        try {
          await this.updateAuthState(userCredential.user);
          console.log('Auth state updated for new user');

          // Initialize user document with onboarding status
          await this.userService.saveUserData({
            ...this.mapUserToUserData(userCredential.user),
            hasCompletedOnboarding: false,
          });
          console.log('User data saved to database');

          return this.mapUserToUserData(userCredential.user);
        } catch (error) {
          console.error('Error in post-signup process:', error);
          throw error;
        }
      }),
      catchError((error) => {
        console.error('Signup error in auth service:', error);
        return throwError(() => error);
      })
    );
  }

  signInWithGoogle(): Observable<UserData> {
    console.log('Starting Google sign-in process');
    const provider = new GoogleAuthProvider();
    return from(signInWithPopup(this.auth, provider)).pipe(
      switchMap(async (userCredential) => {
        console.log('Google sign-in successful:', userCredential.user.uid);
        try {
          await this.updateAuthState(userCredential.user);
          console.log('Auth state updated for Google user');

          await this.userService.saveUserData({
            ...this.mapUserToUserData(userCredential.user),
            hasCompletedOnboarding: false,
          });
          console.log('Google user data saved to database');

          return this.mapUserToUserData(userCredential.user);
        } catch (error) {
          console.error('Error in post-Google sign-in process:', error);
          throw error;
        }
      }),
      catchError((error) => {
        console.error('Google sign-in error in auth service:', error);
        return throwError(() => error);
      })
    );
  }

  async signOut(): Promise<void> {
    try {
      await signOut(this.auth);
      localStorage.removeItem('user');
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }

  sendPasswordResetEmail(email: string): Observable<void> {
    return from(
      sendPasswordResetEmail(this.auth, email, {
        url: window.location.origin + '/login',
        handleCodeInApp: true,
      })
    ).pipe(
      catchError((error) => {
        console.error('Error sending password reset email:', error);
        return throwError(() => this.getPasswordResetErrorMessage(error.code));
      })
    );
  }

  private getPasswordResetErrorMessage(errorCode: string): Error {
    let message = 'An error occurred while sending the password reset email';

    switch (errorCode) {
      case 'auth/invalid-email':
        message = 'Invalid email address';
        break;
      case 'auth/user-not-found':
        message = 'No account found with this email address';
        break;
      case 'auth/too-many-requests':
        message = 'Too many attempts. Please try again later';
        break;
      case 'auth/network-request-failed':
        message = 'Network error. Please check your connection';
        break;
    }

    return new Error(message);
  }

  hasWhatsAppNumber(): Observable<boolean> {
    return this.userService.hasWhatsAppNumber(this.currentUser?.uid || '');
  }

  saveWhatsAppNumber(number: string): Observable<void> {
    if (!this.currentUser?.uid) {
      return throwError(() => new Error('No authenticated user'));
    }
    return this.userService.saveWhatsAppNumber(this.currentUser.uid, number);
  }

  // Add method to handle auth errors
  handleAuthError(): Promise<void> {
    return this.signOut().then(() => {
      // Clear any cached data
      this.clearAuthState();
    });
  }
}

import { Injectable } from '@angular/core';
import {
  doc,
  setDoc,
  Firestore,
  getDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  Auth,
} from 'firebase/auth';
import { Observable, from, map, throwError, catchError } from 'rxjs';
import { UserData } from './user.model';
import { FirebaseInitService } from '../firebase-init.service';

export interface UserProfile extends UserData {
  bio?: string;
  social?: {
    instagram?: string;
    youtube?: string;
    twitter?: string;
  };
  hasCompletedOnboarding?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private auth: Auth;
  private db: Firestore;

  constructor(private firebaseInit: FirebaseInitService) {
    this.auth = this.firebaseInit.getAuth();
    this.db = this.firebaseInit.getFirestore();
    this.auth.languageCode = 'en';
    
    // Subscribe to connection status
    this.firebaseInit.getConnectionStatus().subscribe(isOnline => {
    });
  }

  async saveUserData(userData: any): Promise<void> {
    if (!userData?.uid) {
      throw new Error('User ID is required');
    }
    if (!userData?.email) {
      throw new Error('Email is required');
    }

    try {
      const userRef = doc(this.db, 'users', userData.uid);

      // Check if Firestore is initialized
      if (!this.firebaseInit.isInitialized()) {
        console.warn('Firestore persistence not fully initialized, proceeding without offline support');
      }

      // Attempt to get the document with retry logic
      const userDoc = await this.retryOperation(() => getDoc(userRef));

      const sanitizedData = {
        uid: userData.uid,
        email: userData.email,
        displayName: userData.displayName || null,
        photoURL: userData.photoURL || null,
        phoneNumber: userData.phoneNumber || null,
        emailVerified: userData.emailVerified || false
      };

      if (!userDoc.exists()) {
        await setDoc(userRef, {
          ...sanitizedData,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      } else {
        // For existing users, only update changed fields
        const existingData = userDoc.data();
        const updatedData = {
          ...sanitizedData,
          // Preserve existing values if new values are null
          displayName: userData.displayName || existingData['displayName'] || null,
          phoneNumber: userData.phoneNumber || existingData['phoneNumber'] || null,
          photoURL: userData.photoURL || existingData['photoURL'] || null,
          // Always update these fields
          email: userData.email,
          emailVerified: userData.emailVerified || false,
          updatedAt: new Date(),
        };

        await updateDoc(userRef, updatedData);
      }
    } catch (error: any) {
      console.error('Error saving user data:', error);
      throw this.handleFirebaseError(error);
    }
  }

  private async retryOperation<T>(operation: () => Promise<T>, maxAttempts = 3): Promise<T> {
    let lastError: any;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
        if (attempt === maxAttempts) break;
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
    throw lastError;
  }

  private handleFirebaseError(error: any) {
    console.error('Firebase error:', error);
    let errorMessage = 'An unexpected error occurred';

    switch (error.code) {
      case 'unavailable':
        errorMessage = 'Service temporarily unavailable. Please try again.';
        break;
      case 'permission-denied':
        errorMessage = 'You do not have permission to perform this action';
        break;
      case 'not-found':
        errorMessage = 'User document not found';
        break;
      case 'already-exists':
        errorMessage = 'User document already exists';
        break;
      case 'failed-precondition':
        errorMessage = 'Operation failed due to server state';
        break;
      case 'auth/invalid-phone-number':
        errorMessage = 'Invalid phone number format';
        break;
      case 'auth/code-expired':
        errorMessage = 'Verification code has expired';
        break;
      case 'auth/invalid-verification-code':
        errorMessage = 'Invalid verification code';
        break;
      case 'auth/too-many-requests':
        errorMessage = 'Too many attempts. Please try again later';
        break;
    }

    return {
      code: error.code || 'unknown',
      message: errorMessage
    };
  }

  hasWhatsAppNumber(uid: string): Observable<boolean> {
    const userRef = doc(this.db, `users/${uid}`);
    return from(getDoc(userRef)).pipe(
      map(doc => !!doc.data()?.['whatsappNumber']),
      catchError(error => throwError(() => this.handleFirebaseError(error)))
    );
  }

  saveWhatsAppNumber(uid: string, number: string): Observable<void> {
    const userRef = doc(this.db, `users/${uid}`);
    return from(updateDoc(userRef, { whatsappNumber: number })).pipe(
      catchError(error => throwError(() => this.handleFirebaseError(error)))
    );
  }

  getUserData(uid: string): Observable<UserProfile | null> {
    const userRef = doc(this.db, `users/${uid}`);
    return from(getDoc(userRef)).pipe(
      map(doc => doc.exists() ? doc.data() as UserProfile : null),
      catchError(error => {
        console.error('Error getting user data:', error);
        return throwError(() => error);
      })
    );
  }

  updateUserProfile(profile: Partial<UserProfile>): Observable<void> {
    if (!profile.uid) {
      return throwError(() => new Error('User ID is required'));
    }
  
    const userRef = doc(this.db, `users/${profile.uid}`);
    return from(updateDoc(userRef, {
      ...profile,
      updatedAt: new Date()
    })).pipe(
      catchError(error => {
        console.error('Error updating user profile:', error);
        return throwError(() => error);
      })
    );
  }
}
import { Inject, Injectable } from '@angular/core';
import { initializeApp, FirebaseApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
import { Environment } from '../environments/environment.interface';
import { ENVIRONMENT } from './config/environment.token';
import { Firestore, getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FirebaseInitService {
  private firebaseApp: FirebaseApp;
  private auth: Auth;
  private db: Firestore;
  private initialized = false;
  private connectionStatus = new BehaviorSubject<boolean>(true);

  constructor(
    @Inject(ENVIRONMENT) private readonly environment: Environment
  ) {
    // Initialize Firebase app
    if (!environment.firebase) {
      throw new Error('Firebase configuration is missing in environment');
    }

    this.firebaseApp = initializeApp({
      apiKey: environment.firebase.apiKey,
      authDomain: environment.firebase.authDomain,
      projectId: environment.firebase.projectId,
      storageBucket: environment.firebase.storageBucket,
      messagingSenderId: environment.firebase.messagingSenderId,
      appId: environment.firebase.appId
    });

    // Initialize Auth
    this.auth = getAuth(this.firebaseApp);
    
    // Initialize Firestore
    this.db = getFirestore(this.firebaseApp);
    
    this.monitorConnection();
  }

  private monitorConnection() {
    // Monitor online/offline status
    window.addEventListener('online', () => {
      this.connectionStatus.next(true);
    });

    window.addEventListener('offline', () => {
      this.connectionStatus.next(false);
    });
  }

  getApp(): FirebaseApp {
    return this.firebaseApp;
  }

  getAuth(): Auth {
    return this.auth;
  }

  getFirestore(): Firestore {
    return this.db;
  }

  getConnectionStatus() {
    return this.connectionStatus.asObservable();
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}
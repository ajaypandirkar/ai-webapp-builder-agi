export interface Environment {
    production: boolean;
    apiUrl: string;
    auth0?: {
      domain: string;
      clientId: string;
      audience: string;
    };
    firebase?: {
      apiKey: string;
      authDomain: string;
      projectId: string;
      storageBucket: string;
      messagingSenderId: string;
      appId: string;
      measurementId: string;
    };
    stripe?: {
      publishableKey: string;
    };
    features: {
      enableAnalytics: boolean;
      enableNotifications: boolean;
      maintenanceMode: boolean;
    };
    cache: {
      defaultTTL: number;
      maxSize: number;
    };
    api: {
      timeout: number;
      retryAttempts: number;
      retryDelay: number;
    };
  }
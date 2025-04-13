export interface UserData {
  uid: string;
  email: string | null;
  phoneNumber: string | null;
  whatsappNumber?: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
}

export interface AuthState {
  user: UserData | null;
  token: string | null;
  tokenExpiration: number | null;
}
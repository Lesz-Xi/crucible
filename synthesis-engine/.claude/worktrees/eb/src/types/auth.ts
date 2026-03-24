export interface AppAuthUser {
  id: string;
  email: string | null;
  fullName: string | null;
  avatarUrl: string | null;
}

export interface AuthState {
  isLoading: boolean;
  user: AppAuthUser | null;
}

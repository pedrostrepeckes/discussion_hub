import { create } from 'zustand';
import type { User } from '../types';

interface AuthState {
    user: User | null;
    setAuth: (user: User) => void;
    logout: () => void;
    isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    setAuth: (user) => set({ user }),
    logout: () => set({ user: null }),
    isAuthenticated: () => !!get().user,
}));

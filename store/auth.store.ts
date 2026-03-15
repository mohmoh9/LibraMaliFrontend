// src/store/auth.store.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthResponse, Role } from "@/types";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  userId: number | null;
  nom: string | null;
  email: string | null;
  role: Role | null;
  isAuthenticated: boolean;

  login: (auth: AuthResponse) => void;
  logout: () => void;
  updateNom: (nom: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      userId: null,
      nom: null,
      email: null,
      role: null,
      isAuthenticated: false,

      login: (auth) => {
        localStorage.setItem("accessToken", auth.accessToken);
        localStorage.setItem("refreshToken", auth.refreshToken);
        set({
          accessToken: auth.accessToken,
          refreshToken: auth.refreshToken,
          userId: auth.userId,
          nom: auth.nom,
          email: auth.email,
          role: auth.role,
          isAuthenticated: true,
        });
      },

      logout: () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        set({
          accessToken: null,
          refreshToken: null,
          userId: null,
          nom: null,
          email: null,
          role: null,
          isAuthenticated: false,
        });
      },

      updateNom: (nom) => set({ nom }),
    }),
    {
      name: "libramali-auth",
      partialize: (s) => ({
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
        userId: s.userId,
        nom: s.nom,
        email: s.email,
        role: s.role,
        isAuthenticated: s.isAuthenticated,
      }),
    }
  )
);
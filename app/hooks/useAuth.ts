"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  isProtected: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    isProtected: false,
  });
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // Check if the app requires authentication
      const response = await fetch("/api/auth/verify");
      const { protected: isProtected } = await response.json();

      if (!isProtected) {
        // No password required
        setAuthState({
          isAuthenticated: true,
          isLoading: false,
          isProtected: false,
        });
        return;
      }

      // Check if we have a stored password
      const storedPassword = sessionStorage.getItem("demo_password");

      if (!storedPassword) {
        setAuthState({
          isAuthenticated: false,
          isLoading: false,
          isProtected: true,
        });
        return;
      }

      // Verify the stored password is still valid
      const verifyResponse = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: storedPassword }),
      });

      const verifyData = await verifyResponse.json();

      setAuthState({
        isAuthenticated: verifyData.success,
        isLoading: false,
        isProtected: true,
      });

      // Clear invalid password
      if (!verifyData.success) {
        sessionStorage.removeItem("demo_password");
      }
    } catch (error) {
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        isProtected: true,
      });
    }
  };

  const getPassword = (): string | null => {
    if (typeof window === "undefined") return null;
    return sessionStorage.getItem("demo_password");
  };

  const logout = () => {
    sessionStorage.removeItem("demo_password");
    setAuthState({
      isAuthenticated: false,
      isLoading: false,
      isProtected: true,
    });
    router.push("/login");
  };

  const requireAuth = () => {
    if (!authState.isLoading && !authState.isAuthenticated && authState.isProtected) {
      router.push("/login");
    }
  };

  return {
    ...authState,
    getPassword,
    logout,
    requireAuth,
    checkAuth,
  };
}

import { createContext, ReactNode, useContext, useState, useEffect } from "react";
import { useMutation, UseQueryResult } from "@tanstack/react-query";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type User = {
  id: number;
  username: string;
  name: string;
  email: string;
  avatar: string | null;
  bio: string | null;
  isPremium: boolean;
  createdAt: string;
};

type LoginData = {
  username: string;
  password: string;
};

type RegisterData = {
  username: string;
  password: string;
  email: string;
  name: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: any;
  logoutMutation: any;
  registerMutation: any;
};

export const DevAuthContext = createContext<AuthContextType | null>(null);

export function DevAuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Auto-login for development purposes
    const checkAuthentication = async () => {
      try {
        const res = await fetch('/api/user');
        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
        }
      } catch (err) {
        console.error("Failed to check authentication:", err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthentication();
  }, []);

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      try {
        const res = await apiRequest("POST", "/api/login", credentials);
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Login failed");
        }
        return await res.json();
      } catch (err) {
        throw err;
      }
    },
    onSuccess: (userData: User) => {
      setUser(userData);
      queryClient.setQueryData(["/api/user"], userData);
      toast({
        title: "Login successful",
        description: `Welcome back, ${userData.name}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterData) => {
      try {
        const res = await apiRequest("POST", "/api/register", userData);
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Registration failed");
        }
        return await res.json();
      } catch (err) {
        throw err;
      }
    },
    onSuccess: (userData: User) => {
      setUser(userData);
      queryClient.setQueryData(["/api/user"], userData);
      toast({
        title: "Registration successful",
        description: `Welcome to HumanZ, ${userData.name}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message || "Could not create account",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      try {
        const res = await apiRequest("POST", "/api/logout");
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Logout failed");
        }
      } catch (err) {
        throw err;
      }
    },
    onSuccess: () => {
      setUser(null);
      queryClient.setQueryData(["/api/user"], null);
      // Invalidate and refetch any queries that depend on auth status
      queryClient.invalidateQueries();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <DevAuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </DevAuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(DevAuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
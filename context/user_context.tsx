"use client";

import { LOGOUT} from "@/graphql/mutation/auth";
import { useMutation } from "@apollo/client";
import { useRouter } from "next/navigation";
import React, { useState, useEffect, createContext, useContext } from "react";

type UserContextProviderProps = {
  children: React.ReactNode;
};

type UserType = {
  _id: string;
  email: string;
  name: string;
  role: string;
} | null;

type UserContextType = {
  user: UserType;
  setUser: (user: UserType) => void;
  clearUser: () => void;
  logout: () => Promise<void>;
};

// Create the context
const UserContext = createContext<UserContextType | null>(null);

export default function UserContextProvider({ children }: UserContextProviderProps) {
  const [user, setUserState] = useState<UserType>(null);
  const router = useRouter()

  const [logoutMutation] = useMutation(LOGOUT);

  // Load user from localStorage when the component mounts
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUserState(parsedUser);
          console.log("User loaded from storage:", { hasUser: !!parsedUser, role: parsedUser?.role });
        }
      } catch (error) {
        // Handle localStorage errors that might occur in private browsing
        console.warn("Unable to access localStorage:", error);
        // Clear potentially corrupted data
        try {
          localStorage.removeItem("user");
        } catch {}
      }
    }
  }, []);

  // Function to update user details and store them in localStorage
  const setUser = (user: UserType) => {
    try {
      console.log("Setting user in context:", { hasUser: !!user, role: user?.role });
      setUserState(user);
      if (user && typeof window !== 'undefined') {
        try {
          localStorage.setItem("user", JSON.stringify(user)); // Persist user in localStorage
          console.log("User persisted to localStorage");
        } catch (error) {
          // Handle localStorage errors (Safari private mode can throw)
          console.warn("Unable to save user to localStorage:", error);
        }
      }
    } catch (error) {
      console.error("Error in setUser:", error);
      // Don't throw the error, just log it to prevent app crashes
    }
  };

  // Function to clear user details from context and localStorage
  const clearUser = () => {
    setUserState(null);
    if (typeof window !== 'undefined') {
      try {
        // Clear all authentication-related storage
        const keysToRemove = ["user", "token", "auth", "auth_remember"];
        keysToRemove.forEach(key => {
          try {
            localStorage.removeItem(key);
            sessionStorage.removeItem(key);
          } catch (error) {
            // Silently handle storage errors
          }
        });
      } catch (error) {
        console.warn("Unable to clear storage:", error);
      }
    }
  };

  const logout = async () => {
    try {
      // Clear all cookies first
      document.cookie.split(";").forEach(function(c) {
        document.cookie = c.replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      
      // Try calling the GraphQL logout mutation
      try {
        await logoutMutation();
      } catch (mutationError) {
        console.warn("GraphQL logout mutation failed:", mutationError);
        // Continue with local logout even if server logout fails
      }

      // Clear the user context and all storage
      clearUser();
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      
      // Try clearing other potential storage
      try {
        sessionStorage.clear();
        localStorage.clear();
      } catch (storageError) {
        console.warn("Storage clearing had issues:", storageError);
      }

      // Force reload to ensure clean state
      window.location.href = '/login';
    } catch (error) {
      console.error("Error logging out:", error);
      // Last resort - force page reload
      window.location.href = '/login';
    }
  };

  return (
    <UserContext.Provider value={{ user, setUser, clearUser, logout }}>
      {children}
    </UserContext.Provider>
  );
}

// Custom hook to use the User context
export function useUser() {
  const context = useContext(UserContext);
  
  if (context === null) {
    throw new Error("useUser must be used within a UserContextProvider");
  }

  return context;
}

import React, { createContext, useContext, useEffect, useState } from "react";
import { useQuery } from "@apollo/client";
import { gql } from "@apollo/client";

// Use getCurrentUser instead of currentUser to avoid @Authorized decorator issues
const GET_CURRENT_USER = gql`
  query GetCurrentUser {
    getCurrentUser {
      _id
      name
      email
      role
    }
  }
`;

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: any;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasAuthToken, setHasAuthToken] = useState(false);

  // Check for auth token on client side only
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasToken = document.cookie.includes("accessToken") || 
                       localStorage.getItem("token") || 
                       sessionStorage.getItem("token");
      setHasAuthToken(!!hasToken);
    }
  }, []);

  const { data, loading, error } = useQuery(GET_CURRENT_USER, {
    skip: !hasAuthToken,
    errorPolicy: "all",
    onCompleted: (data) => {
      console.log("Auth context - getCurrentUser completed:", {
        hasData: !!data,
        user: data?.getCurrentUser
      });
    },
    onError: (error) => {
      console.error("Auth context - getCurrentUser error:", error);
    }
  });

  const value = {
    user: data?.getCurrentUser || null,
    loading: loading || !hasAuthToken,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}; 
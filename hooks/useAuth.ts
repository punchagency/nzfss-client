"use client"

import { useQuery } from "@apollo/client";  
import { usePathname, useRouter } from "next/navigation";  
import { useEffect } from "react";  
import { gql } from "@apollo/client";

// Use getCurrentUser instead of currentUser to avoid @Authorized decorator issues
const GET_CURRENT_USER_AUTH = gql`
  query GetCurrentUserAuth {
    getCurrentUser {
      _id
      email
      role
      name
    }
  }
`;

export const useIsAuth = () => {
  const { data, loading, error } = useQuery(GET_CURRENT_USER_AUTH, {
    fetchPolicy: "network-only", // Always fetch from network to get fresh auth state
    errorPolicy: "all"
  });  
  const router = useRouter();  
  const pathname = usePathname();

  useEffect(() => {
    // Only redirect if we're not loading and there's no user data
    if (!loading && (!data?.getCurrentUser || error)) {
      // Add a small delay to prevent race conditions with login
      const timeoutId = setTimeout(() => {
        // Double-check we're still not authenticated and not already on login page
        if (!data?.getCurrentUser && !pathname.includes('/login')) {
          router.replace("/login");  
          
          // Fallback redirect if router.replace doesn't work
          setTimeout(() => {
            if (!window.location.pathname.includes('/login')) {
              window.location.href = "/login";
            }
          }, 500);
        }
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [loading, data, error, router, pathname]);  
};

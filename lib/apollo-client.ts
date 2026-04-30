import { ApolloClient, InMemoryCache, from } from "@apollo/client";
import { onError } from "@apollo/client/link/error";
import { createHttpLink } from "@apollo/client/link/http";
import { setContext } from "@apollo/client/link/context";

// List of queries that don't require authentication
const publicQueries = ['GetAllContacts', 'GetAllClubs', 'Login', 'GetEventResults', 'GetEventsWithPoints'];

// Function to get user data from storage
function getUserFromStorage() {
  if (typeof window === 'undefined') return null;
  
  try {
    // First try localStorage
    let storedUser = localStorage.getItem("user");
    let storedToken = localStorage.getItem("token");
    
    if (storedUser && storedToken) {
      const user = JSON.parse(storedUser);
      return { ...user, token: storedToken };
    }
    
    // Fallback to sessionStorage
    storedUser = sessionStorage.getItem("user");
    storedToken = sessionStorage.getItem("token");
    
    if (storedUser && storedToken) {
      const user = JSON.parse(storedUser);
      return { ...user, token: storedToken };
    }
    
    // Final fallback: try to extract token from cookies (for incognito/Safari)
    if (document.cookie) {
      const cookies = document.cookie.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
      }, {} as Record<string, string>);
      
      // If we have an authToken cookie but no stored user data,
      // we'll let the server validate the token via the Authorization header
      if (cookies.authToken) {
        // Try to get user role from cookie for basic user info
        const userRole = cookies.userRole || 'USER';
        return {
          token: cookies.authToken,
          role: userRole,
          // We'll let the server provide the full user data
          _id: '',
          email: '',
          name: ''
        };
      }
    }
    
    return null;
  } catch (error) {
    console.warn("Storage access error:", error);
    
    // Even if storage fails, try to get token from cookies
    try {
      if (document.cookie) {
        const cookies = document.cookie.split(';').reduce((acc, cookie) => {
          const [key, value] = cookie.trim().split('=');
          acc[key] = value;
          return acc;
        }, {} as Record<string, string>);
        
        if (cookies.authToken) {
          const userRole = cookies.userRole || 'USER';
          return {
            token: cookies.authToken,
            role: userRole,
            _id: '',
            email: '',
            name: ''
          };
        }
      }
    } catch (cookieError) {
      console.warn("Cookie access also failed:", cookieError);
    }
    
    return null;
  }
}

const errorLink = onError(({ graphQLErrors, networkError, operation }) => {
  if (graphQLErrors) {
    // Skip auth errors for public queries
    if (publicQueries.includes(operation.operationName || '')) {
      return;
    }

    console.log("GraphQL Errors:", JSON.stringify(graphQLErrors, null, 2));
    graphQLErrors.forEach(({ message, locations, path, extensions }) => {
      console.error(
        `[GraphQL error]: 
        Message: ${message}
        Location: ${JSON.stringify(locations)}
        Path: ${path}
        Extensions: ${JSON.stringify(extensions)}
        Operation: ${operation.operationName}
        Variables: ${JSON.stringify(operation.variables, null, 2)}
        `
      );
      
      // Handle authentication errors
      if (
        message.includes("not authenticated") || 
        message.includes("unauthorized") || 
        message.includes("Not authenticated") ||
        extensions?.code === "UNAUTHENTICATED"
      ) {
        if (typeof window !== 'undefined') {
          try {
            console.warn("Authentication error detected, clearing auth data");
            // Clear stored user data
            ["auth", "user", "token", "auth_remember"].forEach(key => {
              try {
                localStorage.removeItem(key);
                sessionStorage.removeItem(key);
              } catch {}
            });
            
            // Only redirect if not already on login page
            if (!window.location.pathname.includes('/login')) {
              console.log("Redirecting to login page");
              window.location.href = "/login";
            }
          } catch (error) {
            console.warn("Error handling auth failure:", error);
          }
        }
      }
    });
  }
  if (networkError) {
    console.error("[Network error]:", networkError);
    console.log("Failed operation details:", {
      operationName: operation.operationName,
      variables: operation.variables,
      query: operation.query.loc?.source.body
    });
    
    // Enhanced error handling for Safari and incognito mode
    const isAuthRelatedError = 
      networkError.message.includes('cookie') ||
      networkError.message.includes('credentials') ||
      networkError.message.includes('CORS') ||
      networkError.message.includes('401') ||
      networkError.message.includes('403') ||
      (networkError as any)?.statusCode === 401 ||
      (networkError as any)?.statusCode === 403;
    
    if (isAuthRelatedError) {
      console.warn("Auth-related network error detected:", networkError.message);
      
      // Clear stored user data and redirect on auth-related network errors
      if (typeof window !== 'undefined' && !publicQueries.includes(operation.operationName || '')) {
        try {
          // Clear stored user data
          ["auth", "user", "token", "auth_remember"].forEach(key => {
            try {
              localStorage.removeItem(key);
              sessionStorage.removeItem(key);
            } catch {}
          });
          
          // Redirect to login if not already on login page
          if (!window.location.pathname.includes('/login')) {
            console.log("Redirecting to login due to network auth error");
            window.location.href = "/login";
          }
        } catch (error) {
          console.warn("Error handling auth network failure:", error);
        }
      }
    }
  }
});

// Auth context link that will add the token to the authorization header when cookies aren't available
const authLink = setContext((_, { headers }) => {
  // Get user from storage for the token
  const user = getUserFromStorage();

  // Debug logging in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Apollo authLink - User from storage:', {
      hasUser: !!user,
      hasToken: !!user?.token,
      userRole: user?.role,
      tokenLength: user?.token?.length || 0
    });
  }

  // Return the headers to the context so httpLink can read them
  return {
    headers: {
      ...headers,
      ...(user?.token ? { authorization: `Bearer ${user.token}` } : {}),
    }
  };
});

const httpLink = createHttpLink({
  uri: `${process.env.NEXT_PUBLIC_APP_SERVER}/graphql`,
  credentials: "include", // Always include credentials for cookies
  headers: {
    'Content-Type': 'application/json',
  }
});

export const client = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache({
    // Add better cache configuration to prevent binding issues
    addTypename: true,
    resultCaching: true,
    canonizeResults: true,
  }),
  defaultOptions: {
    mutate: {
      errorPolicy: "all",
      fetchPolicy: "no-cache" // Prevent cache conflicts during mutations
    },
    query: {
      errorPolicy: "all",
      fetchPolicy: "cache-first" // Better balance for queries
    },
    watchQuery: {
      errorPolicy: "all",
      fetchPolicy: "cache-first", // More stable than network-only
      notifyOnNetworkStatusChange: true
    }
  }
});

// Function to refresh authentication state in Apollo client
export const refreshAuthState = () => {
  try {
    // Clear the cache to force re-authentication on next query
    client.cache.reset();
    
    // Refetch any active queries to pick up new auth state
    client.refetchQueries({
      include: "active"
    });
  } catch (error) {
    console.warn("Error refreshing auth state:", error);
    // Force a complete cache reset if refetch fails
    try {
      client.clearStore();
    } catch (clearError) {
      console.warn("Error clearing store:", clearError);
    }
  }
}; 
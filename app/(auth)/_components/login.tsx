"use client";

import { logo } from "@/assets";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { useState, useEffect, useCallback } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { formSchema } from "@/schema/login.schema";
import { z } from "zod";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ApolloError, useMutation } from "@apollo/client";
import { LOGIN } from "@/graphql/mutation/auth";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/context/user_context";

/* =============================================================================
   Type Definitions
   ============================================================================= */

interface LoginFormValues {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface User {
  _id: string;
  email: string;
  name: string;
  role: string;
  token: string;
}

interface LoginMutationResponse {
  login: User;
}

interface LoginMutationVariables {
  input: {
    email: string;
    password: string;
    rememberMe?: boolean;
  };
}

/* =============================================================================
   Utility Functions
   ============================================================================= */

/**
 * Detects if cookies are being blocked by the browser
 */
function detectCookieBlocking(): boolean {
  try {
    // Try to set a test cookie
    document.cookie = "test=1; path=/; SameSite=Strict";
    const cookieSet = document.cookie.includes("test=1");
    
    // Clean up test cookie
    if (cookieSet) {
      document.cookie = "test=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
    }
    
    return !cookieSet;
  } catch {
    return true; // Assume blocked if we can't test
  }
}

/**
 * Detects if the browser is in private/incognito mode
 */
function detectPrivateMode(): boolean {
  try {
    localStorage.setItem("test", "test");
    localStorage.removeItem("test");
    return false;
  } catch {
    return true;
  }
}

/**
 * Safely stores authentication data with fallback mechanisms
 */
function storeAuthData(authData: { token: string; user: User }, rememberMe: boolean): void {
  const isPrivateMode = detectPrivateMode();
  
  try {
    // Always try to store in sessionStorage first (most reliable)
    try {
      sessionStorage.setItem("auth", JSON.stringify(authData));
      sessionStorage.setItem("user", JSON.stringify(authData.user));
      sessionStorage.setItem("token", authData.token);
      console.log("Successfully stored auth data in sessionStorage");
    } catch (sessionError) {
      console.warn("sessionStorage failed:", sessionError);
    }
    
    // Store in localStorage only if rememberMe is true and not in private mode
    if (rememberMe && !isPrivateMode) {
      try {
        localStorage.setItem("auth", JSON.stringify(authData));
        localStorage.setItem("user", JSON.stringify(authData.user));
        localStorage.setItem("token", authData.token);
        console.log("Successfully stored auth data in localStorage");
      } catch (localStorageError) {
        console.warn("localStorage not available, using sessionStorage only:", localStorageError);
        try {
          sessionStorage.setItem("auth_remember", "true");
        } catch {}
      }
    }
    
    // Always try to set cookies as they work better in incognito/Safari
    const isProd = process.env.NODE_ENV === "production";
    const maxAge = rememberMe ? 86400 * 30 : 86400; // 30 days or 1 day
    
    // Multiple cookie setting strategies for better compatibility
    const cookieStrategies = [
      // Strategy 1: Standard approach
      () => {
        const cookieOptions = `path=/; ${isProd ? "Secure; " : ""}SameSite=Strict; max-age=${maxAge}`;
        document.cookie = `authToken=${authData.token}; ${cookieOptions}`;
        document.cookie = `userRole=${authData.user.role}; ${cookieOptions}`;
      },
      // Strategy 2: Lax SameSite for better compatibility
      () => {
        const cookieOptions = `path=/; ${isProd ? "Secure; " : ""}SameSite=Lax; max-age=${maxAge}`;
        document.cookie = `authToken=${authData.token}; ${cookieOptions}`;
        document.cookie = `userRole=${authData.user.role}; ${cookieOptions}`;
      },
      // Strategy 3: No SameSite for maximum compatibility
      () => {
        const cookieOptions = `path=/; ${isProd ? "Secure; " : ""}max-age=${maxAge}`;
        document.cookie = `authToken=${authData.token}; ${cookieOptions}`;
        document.cookie = `userRole=${authData.user.role}; ${cookieOptions}`;
      }
    ];
    
    // Try each cookie strategy until one works
    let cookieSet = false;
    for (const strategy of cookieStrategies) {
      try {
        strategy();
        // Test if cookie was actually set
        if (document.cookie.includes(`authToken=${authData.token}`)) {
          cookieSet = true;
          console.log("Successfully set authentication cookies");
          break;
        }
      } catch (cookieError) {
        console.warn("Cookie strategy failed:", cookieError);
      }
    }
    
    if (!cookieSet) {
      console.warn("All cookie strategies failed, relying on storage only");
    }
    
  } catch (error) {
    console.error("Failed to store authentication data:", error);
    throw new Error("Unable to store authentication data. Please check your browser settings.");
  }
}

/**
 * Clears all authentication data
 */
function clearAllAuthData(): void {
  try {
    // Clear localStorage
    ["auth", "user", "token", "auth_remember"].forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch {}
    });
    
    // Clear sessionStorage
    ["auth", "user", "token", "auth_remember"].forEach(key => {
      try {
        sessionStorage.removeItem(key);
      } catch {}
    });
    
    // Clear cookies - both httpOnly and client-accessible ones
    try {
      const cookiesToClear = [
        "accessToken", 
        "authToken", 
        "userRole"
      ];
      
      cookiesToClear.forEach(cookieName => {
        // Clear with different path and domain combinations for thorough cleanup
        const clearStrategies = [
          `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`,
          `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}`,
          `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.${window.location.hostname}`,
        ];
        
        clearStrategies.forEach(strategy => {
          try {
            document.cookie = strategy;
          } catch {}
        });
      });
    } catch {}
  } catch (error) {
    console.error("Error clearing auth data:", error);
  }
}

/**
 * Gets the appropriate redirect URL based on user role
 */
function getRedirectUrl(role: string): string {
  switch (role) {
    case "ADMIN":
      return "/dashboard";
    case "CLUB":
      return "/events?tab=0";
    default:
      return "/events";
  }
}

/**
 * Validates authentication by checking if the current user can be retrieved
 */
async function validateAuthentication(token: string): Promise<boolean> {
  try {
    // Prepare headers with both Authorization and ensure credentials are included
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Always include the Authorization header as fallback
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_SERVER}/graphql`, {
      method: 'POST',
      credentials: 'include', // This ensures cookies are sent
      headers,
      body: JSON.stringify({
        query: `
          query ValidateAuth {
            getCurrentUser {
              _id
              email
              role
              name
            }
          }
        `
      }),
    });
    
    const result = await response.json();
    
    // Log for debugging in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Auth validation response:', {
        ok: response.ok,
        status: response.status,
        hasErrors: !!result.errors,
        hasUser: !!result.data?.getCurrentUser,
        errors: result.errors
      });
    }
    
    // Check if the query was successful and returned user data
    const isValid = response.ok && !result.errors && result.data?.getCurrentUser;
    
    if (!isValid && result.errors) {
      console.warn("Auth validation failed with errors:", result.errors);
    }
    
    return isValid;
  } catch (error) {
    console.warn("Auth validation failed:", error);
    return false;
  }
}

/* =============================================================================
   Login Component
   ============================================================================= */

const Login: React.FC = () => {
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [redirecting, setRedirecting] = useState<boolean>(false);
  const [cookiesBlocked, setCookiesBlocked] = useState<boolean>(false);
  
  const router = useRouter();
  const { toast } = useToast();
  const { setUser } = useUser();

  // Check for cookie blocking and handle pending redirects on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCookiesBlocked(detectCookieBlocking());
      
      // Check for pending redirects that might have been interrupted
      try {
        const pendingRedirect = sessionStorage.getItem('pending_redirect');
        if (pendingRedirect) {
          const redirectInfo = JSON.parse(pendingRedirect);
          const timeSinceRedirect = Date.now() - redirectInfo.timestamp;
          
          // If the redirect is recent (within 30 seconds) and we're still on login page
          if (timeSinceRedirect < 30000 && window.location.pathname.includes('/login')) {
            console.log("Found pending redirect, attempting recovery:", redirectInfo);
            
            // Wait a moment for any existing auth context to settle, then retry redirect
            setTimeout(() => {
              console.log("Executing recovery redirect to:", redirectInfo.url);
              window.location.replace(redirectInfo.url);
            }, 1000);
          } else {
            // Clean up old redirect info
            sessionStorage.removeItem('pending_redirect');
          }
        }
      } catch (e) {
        console.warn("Error checking pending redirects:", e);
      }
    }
  }, [toast]);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(formSchema.extend({
      rememberMe: z.boolean().default(false)
    })),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false
    },
  });

  const [login, { loading }] = useMutation<LoginMutationResponse, LoginMutationVariables>(LOGIN, {
    onError: (error: ApolloError) => {
      console.error("Login mutation error:", error);
      
      // Handle different types of authentication errors
      let errorMessage = "Login failed. Please try again.";
      
      if (error.message) {
        // Check for common authentication error patterns
        const message = error.message.toLowerCase();
        
        if (message.includes('invalid credentials') || 
            message.includes('incorrect password') || 
            message.includes('wrong password') ||
            message.includes('authentication failed')) {
          errorMessage = "Invalid email or password. Please check your credentials and try again.";
        } else if (message.includes('user not found') || 
                   message.includes('email not found') ||
                   message.includes('no user found')) {
          errorMessage = "No account found with this email address.";
        } else if (message.includes('account locked') || 
                   message.includes('account disabled')) {
          errorMessage = "Your account is currently locked or disabled. Please contact support.";
        } else if (message.includes('too many attempts') || 
                   message.includes('rate limit')) {
          errorMessage = "Too many login attempts. Please wait a few minutes before trying again.";
        } else {
          // Use the actual error message from the server
          errorMessage = error.message;
        }
      }
      
      toast({
        variant: "destructive",
        description: errorMessage,
      });
    }
  });

  /**
   * Handles the redirect after successful login with proper loading state and auto-refresh
   */
  const handleRedirect = useCallback((user: User) => {
    setRedirecting(true);
    const redirectUrl = getRedirectUrl(user.role);
    
    console.log("Starting redirect process to:", redirectUrl);
    
    // Store redirect information for potential recovery
    try {
      sessionStorage.setItem('pending_redirect', JSON.stringify({
        url: redirectUrl,
        timestamp: Date.now(),
        userRole: user.role
      }));
    } catch (e) {
      console.warn("Could not store redirect info:", e);
    }
    
    // Primary redirect attempt
    router.replace(redirectUrl);
    
    // Enhanced fallback redirect with auto-refresh mechanism
    let attempts = 0;
    const maxAttempts = 4;
    let redirectTimer: NodeJS.Timeout;
    
    const checkAndRedirect = () => {
      attempts++;
      console.log(`Redirect attempt ${attempts}/${maxAttempts}`);
      
      // Check if we're still on login page or if redirect failed
      const isStillOnLogin = window.location.pathname.includes('/login');
      const hasReachedTarget = window.location.pathname === redirectUrl.split('?')[0];
      
      if (isStillOnLogin && attempts < maxAttempts) {
        if (attempts === 1) {
          // Second attempt: Use router.push
          console.log("Trying router.push");
          router.push(redirectUrl);
        } else if (attempts === 2) {
          // Third attempt: Force navigation with window.location
          console.log("Trying window.location.href");
          window.location.href = redirectUrl;
        } else {
          // Final attempt: Force reload to the target URL
          console.log("Final attempt: forcing page reload");
          window.location.replace(redirectUrl);
        }
        
        // Schedule next check
        redirectTimer = setTimeout(checkAndRedirect, 1500);
      } else if (hasReachedTarget) {
        // We've reached the target page, but let's ensure it loads properly
        console.log("Reached target page, setting up auto-refresh safety net");
        
        // Set up a safety net auto-refresh if the page seems stuck
        const autoRefreshTimer = setTimeout(() => {
          console.log("Auto-refresh triggered due to potential loading issue");
          
          // Check if the page is still in a loading state by looking for common loading indicators
          const hasLoadingIndicators = document.querySelector('[data-loading="true"]') || 
                                     document.querySelector('.loading') ||
                                     document.querySelector('.spinner') ||
                                     document.querySelector('[aria-busy="true"]');
          
          // Also check if the main content is missing
          const hasMainContent = document.querySelector('main') || 
                                document.querySelector('[role="main"]') ||
                                document.querySelector('.main-content') ||
                                document.body.children.length > 3; // More than just basic layout
          
          if (hasLoadingIndicators || !hasMainContent) {
            console.log("Page appears to be stuck, forcing refresh");
            // Force a hard refresh to ensure all auth context is properly loaded
            window.location.reload();
          } else {
            console.log("Page appears to have loaded successfully");
            // Clean up redirect info since we're successful
            try {
              sessionStorage.removeItem('pending_redirect');
            } catch (e) {}
          }
        }, 3000); // 3 second safety net
        
        // Clear the redirect timer
        if (redirectTimer) {
          clearTimeout(redirectTimer);
        }
        
        // Also clear the auto-refresh timer if the page seems to load quickly
        setTimeout(() => {
          const pageLoaded = !document.querySelector('[data-loading="true"]') && 
                           !document.querySelector('.loading') &&
                           document.readyState === 'complete';
          
          if (pageLoaded) {
            console.log("Page loaded successfully, canceling auto-refresh");
            clearTimeout(autoRefreshTimer);
            try {
              sessionStorage.removeItem('pending_redirect');
            } catch (e) {}
          }
        }, 1000);
      }
    };
    
    // Start checking after initial redirect attempt
    redirectTimer = setTimeout(checkAndRedirect, 1000);
    
    // Ultimate safety net - if nothing works after 10 seconds, force reload
    setTimeout(() => {
      if (window.location.pathname.includes('/login')) {
        console.log("Ultimate fallback: forcing reload after 10 seconds");
        window.location.replace(redirectUrl);
      }
    }, 10000);
    
  }, [router]);

  /**
   * Handles form submission for user login
   */
  async function onSubmit(values: LoginFormValues): Promise<void> {
    if (isSubmitting) return; // Prevent double submissions
    
    setIsSubmitting(true);
    
    try {
      // Clear any existing auth data to prevent conflicts
      clearAllAuthData();
      
      console.log("Starting login process...");
      
      const { data } = await login({
        variables: {
          input: {
            email: values.email,
            password: values.password,
            rememberMe: values.rememberMe
          },
        },
      });

      if (data?.login) {
        const loggedInUser = data.login;
        console.log("Login successful, user data received:", {
          hasId: !!loggedInUser._id,
          hasToken: !!loggedInUser.token,
          role: loggedInUser.role,
          tokenLength: loggedInUser.token?.length || 0
        });
        
        // Store auth data with proper fallback mechanisms
        const authData = {
          token: loggedInUser.token,
          user: loggedInUser
        };
        
        console.log("Storing authentication data...");
        storeAuthData(authData, values.rememberMe);
        
        // Update user context with error handling
        try {
          console.log("Setting user context...");
          setUser({
            _id: loggedInUser._id,
            email: loggedInUser.email,
            name: loggedInUser.name || loggedInUser.email.split("@")[0],
            role: loggedInUser.role,
          });
          console.log("User context set successfully");
        } catch (contextError) {
          console.error("Error setting user context:", contextError);
          // Continue with login process even if context setting fails
        }

        console.log("Validating authentication...");
        // Validate authentication before redirecting
        const isAuthValid = await validateAuthentication(loggedInUser.token);
        
        console.log("Auth validation result:", isAuthValid);
        
        if (!isAuthValid) {
          // If validation fails, show error and don't redirect
          const errorMessage = cookiesBlocked 
            ? "Authentication setup failed. Please ensure your browser allows cookies for this site, or try refreshing the page."
            : "Authentication validation failed. Please try again.";
            
          console.error("Auth validation failed:", errorMessage);
          toast({
            variant: "destructive",
            description: errorMessage,
          });
          return;
        }

        // Show success message
        toast({
          description: "Login successful! Redirecting...",
        });

        // Small delay to ensure all storage operations complete
        await new Promise(resolve => setTimeout(resolve, 100));

        console.log("Redirecting user...");
        // Handle redirect based on role
        handleRedirect(loggedInUser);
        
      }
    } catch (error) {
      console.error("Login error:", error);
      
      // Enhanced error handling for better user experience
      let errorMessage = "An unexpected error occurred. Please try again.";
      
      // Check if this is an NS binding error
      if (error instanceof Error && error.message.includes('NS_BINDING')) {
        console.error("NS Binding error detected:", error);
        errorMessage = "Authentication binding error. Please refresh the page and try again.";
      } else if (error instanceof ApolloError) {
        // This should be handled by the onError callback above, but just in case
        if (error.message) {
          const message = error.message.toLowerCase();
          if (message.includes('invalid credentials') || 
              message.includes('incorrect password') || 
              message.includes('wrong password') ||
              message.includes('authentication failed')) {
            errorMessage = "Invalid email or password. Please check your credentials and try again.";
          } else if (message.includes('user not found') || 
                     message.includes('email not found')) {
            errorMessage = "No account found with this email address.";
          } else {
            errorMessage = error.message;
          }
        }
      } else if (error instanceof Error) {
        // Handle other specific error types
        if (error.message.includes('Network error') || 
            error.message.includes('fetch')) {
          errorMessage = "Network error. Please check your internet connection and try again.";
        } else if (error.message.includes('Unauthorized') || 
                   error.message.includes('401')) {
          errorMessage = "Invalid email or password. Please check your credentials and try again.";
        } else if (error.message.includes('Forbidden') || 
                   error.message.includes('403')) {
          errorMessage = "Access denied. Your account may be disabled or you don't have permission to login.";
        } else if (error.message.includes('Server error') || 
                   error.message.includes('500')) {
          errorMessage = "Server error. Please try again in a few moments.";
        } else if (error.message) {
          errorMessage = error.message;
        }
      }
      
      toast({
        variant: "destructive",
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  // Show loading state during redirect
  if (redirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-black rounded-full animate-spin mx-auto"></div>
          <p className="text-lg font-medium">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col p-2 sm:p-4 md:p-6 relative">
      {/* Debug Information - Only in Development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-4 right-4 bg-gray-100 p-4 rounded-lg text-xs max-w-sm z-50">
          <h3 className="font-bold mb-2">Debug Info</h3>
          <div className="space-y-1">
            <div>Cookies Blocked: {cookiesBlocked ? 'Yes' : 'No'}</div>
            <div>Private Mode: {detectPrivateMode() ? 'Yes' : 'No'}</div>
            <div>Has Cookies: {typeof window !== 'undefined' && document.cookie ? 'Yes' : 'No'}</div>
            <div>LocalStorage: {(() => {
              try {
                localStorage.setItem('test', 'test');
                localStorage.removeItem('test');
                return 'Available';
              } catch {
                return 'Blocked';
              }
            })()}</div>
            <div>SessionStorage: {(() => {
              try {
                sessionStorage.setItem('test', 'test');
                sessionStorage.removeItem('test');
                return 'Available';
              } catch {
                return 'Blocked';
              }
            })()}</div>
          </div>
        </div>
      )}

      {/* Logo Section */}
      <div className="flex-shrink-0 mb-2 sm:mb-4">
        <Link href="/home">
          <Image 
            src={logo} 
            alt="Logo" 
            className="w-8 sm:w-10 md:w-12 lg:w-14 cursor-pointer" 
            priority
          />
        </Link>
      </div>

      {/* Main Content - Centered and Scrollable */}
      <div className="flex-1 flex flex-col justify-center items-center py-2 sm:py-4 overflow-y-auto">
        <div className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl space-y-2 sm:space-y-3 md:space-y-4 lg:space-y-6">
          {/* Title Section */}
          <div className="text-center sm:text-left space-y-1 sm:space-y-2 md:space-y-3">
            <h1 className="text-[2.083vw] font-extrabold w-[32.448vw] h-[3.958vw] mb-8  font-bold leading-tight">
              Welcome to New Zealand Federation of Sled Dog Sports
            </h1>
            <p className="w-[32.448vw] h-[1.667vw] text-[1vw] font-semibold  text-[#4F4F4F]">
              Please enter your login details
            </p>
          </div>

          {/* Form Section */}
          <div className="w-full">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2 sm:space-y-3 md:space-y-4 lg:space-y-5" noValidate>
                {/* Email Input Field */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm md:text-base lg:text-lg font-semibold">
                        Email Address
                      </FormLabel>
                      <FormControl>
                        <Input
                          className="h-[2.6vw] w-[30vw]  px-3 md:px-4 lg:px-5 rounded-xl text-sm md:text-base lg:text-lg border-gray-300 focus:border-black focus:ring-black"
                          placeholder="Enter your email"
                          autoComplete="email"
                          type="email"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-xs sm:text-sm" />
                    </FormItem>
                  )}
                />

                {/* Password Input Field */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm md:text-base lg:text-lg font-semibold">
                        Password
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            className="h-[2.6vw] w-[30vw]  px-3 md:px-4 lg:px-5 rounded-xl text-sm md:text-base lg:text-lg pr-10 md:pr-12 lg:pr-13 border-gray-300 focus:border-black focus:ring-black"
                            placeholder="Enter your password"
                            autoComplete="current-password"
                            {...field}
                          />
                          <button
                            type="button"
                            className="absolute right-3 md:right-4 lg:right-5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label="Toggle password visibility"
                          >
                            {showPassword ? (
                              <EyeOff className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6" />
                            ) : (
                              <Eye className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs sm:text-sm" />
                    </FormItem>
                  )}
                />

                {/* Remember Me Checkbox */}
                <FormField
                  control={form.control}
                  name="rememberMe"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 lg:space-x-3">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="h-6 w-6 mt-1  rounded data-[state=checked]:bg-black data-[state=checked]:border-black"
                        />
                      </FormControl>
                      <FormLabel className="text-[0.833vw] font-medium cursor-pointer">
                        Remember me
                      </FormLabel>
                    </FormItem>
                  )}
                />

                {/* Submit Button */}
                <Button
                  className="w-[30vw] h-[2.6vw] bg-black hover:bg-gray-800 text-white rounded-xl font-bold text-sm md:text-base lg:text-lg transition-colors mt-3 sm:mt-4 md:mt-6 lg:mt-7"
                  type="submit"
                  disabled={loading || isSubmitting}
                >
                  {(loading || isSubmitting) ? (
                    <div className="flex items-center justify-center space-x-2 lg:space-x-3">
                      <div className="w-4 h-4 lg:w-5 lg:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Logging in...</span>
                    </div>
                  ) : (
                    "Login"
                  )}
                </Button>
              </form>
            </Form>
          </div>
        </div>
      </div>

      {/* Footer Section - Not absolutely positioned */}
      <footer className="flex-shrink-0 mt-2 sm:mt-4">
        <p className="text-xs sm:text-sm font-semibold text-gray-600 text-center sm:text-left">
          © New Zealand Federation of Sled Dog Sports
        </p>
      </footer>
    </div>
  );
};

export default Login;

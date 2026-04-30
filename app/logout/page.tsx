"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/user_context";

export default function LogoutPage() {
  const [isLoggingOut, setIsLoggingOut] = useState(true);
  const router = useRouter();
  const { logout } = useUser();

  useEffect(() => {
    const performLogout = async () => {
      try {
        // 1. Clear all cookies
        document.cookie.split(";").forEach((c) => {
          document.cookie = c
            .replace(/^ +/, "")
            .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });

        // 2. Clear localStorage and sessionStorage
        localStorage.clear();
        sessionStorage.clear();

        // 3. Try context logout
        if (logout) {
          try {
            await logout();
          } catch (e) {
            console.error("Context logout failed:", e);
          }
        }

        // 4. Wait a moment and redirect with hard reload
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
      } catch (error) {
        console.error("Logout failed:", error);
        setIsLoggingOut(false);
        
        // Emergency fallback
        setTimeout(() => {
          window.location.href = "/login";
        }, 1000);
      }
    };

    performLogout();
  }, [logout]);

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        <h1 className="text-2xl font-bold mb-4">Logging Out</h1>
        
        {isLoggingOut ? (
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-black mb-4" />
            <p>Please wait while we log you out...</p>
          </div>
        ) : (
          <div>
            <p className="mb-4 text-red-600">
              There was an issue logging you out automatically.
            </p>
            <button
              onClick={() => window.location.href = "/login"}
              className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
            >
              Return to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 
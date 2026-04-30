"use client";

import { Button } from "@/components/ui/button";
import { useUser } from "@/context/user_context";
import { LogOut } from "lucide-react";
import { useState } from "react";

interface LogoutButtonProps {
  variant?: "icon" | "text" | "full";
  className?: string;
}

export default function LogoutButton({ 
  variant = "full", 
  className = "" 
}: LogoutButtonProps) {
  const { user } = useUser();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Don't render if no user is logged in
  if (!user) return null;

  const handleLogout = () => {
    setIsLoggingOut(true);
    
    // Redirect to the dedicated logout page
    window.location.href = "/logout";
  };

  if (variant === "icon") {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={handleLogout}
        disabled={isLoggingOut}
        className={className}
        title="Logout"
      >
        <LogOut className="h-5 w-5" />
      </Button>
    );
  }

  if (variant === "text") {
    return (
      <Button
        variant="ghost"
        onClick={handleLogout}
        disabled={isLoggingOut}
        className={className}
      >
        {isLoggingOut ? "Logging out..." : "Logout"}
      </Button>
    );
  }

  return (
    <Button
      variant="destructive"
      onClick={handleLogout}
      disabled={isLoggingOut}
      className={`flex items-center gap-2 ${className}`}
    >
      <LogOut className="h-4 w-4" />
      {isLoggingOut ? "Logging out..." : "Logout"}
    </Button>
  );
} 
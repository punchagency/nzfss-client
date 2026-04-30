"use client";

import React from "react";
import { Providers } from "@/providers/providers"; // Your existing Apollo provider
import { ReduxProvider } from "@/redux/provider"; // Redux provider
import UserContextProvider from "@/context/user_context"; // User context
import { Toaster } from "@/components/ui/toaster"; // UI toaster
import { SearchProvider } from "@/app/context/SearchContext"; // Search context

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <ReduxProvider>
        <UserContextProvider>
          <SearchProvider>
            {children}
            <Toaster />
          </SearchProvider>
        </UserContextProvider>
      </ReduxProvider>
    </Providers>
  );
}
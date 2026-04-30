import React, { ReactNode } from "react";
import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/providers/providers";
import { Toaster } from "@/components/ui/toaster";
import UserContextProvider from "@/context/user_context";
import { Provider } from "react-redux";
import { store } from "@/redux/store";
import { ReduxProvider } from "@/redux/provider";

export const metadata: Metadata = {
  title: "NZFSS",
  description: "New Zealand Federation of Sled Dog Sports",
};

/**
 * Root layout component that wraps your entire application.
 *
 * @param {Object} props - Component props.
 * @param {ReactNode} props.children - The content of your application.
 * @returns {JSX.Element} The layout component wrapped with various providers.
 */
export default function RootLayout({ children }: { children: ReactNode }): JSX.Element {
  return (
    <html lang="en">
      <head />
      <body>
        {/* Wrap the app with all necessary providers */}
        <ReduxProvider>
          <Providers>
            <UserContextProvider>{children}</UserContextProvider>
          </Providers>
          <Toaster />
        </ReduxProvider>
      </body>
    </html>
  );
}
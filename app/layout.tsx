import React, { ReactNode } from "react";
import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/providers/providers";
import { Toaster } from "@/components/ui/toaster";
import UserContextProvider from "@/context/user_context";
import { Provider } from "react-redux";
import { store } from "@/redux/store";
import { ReduxProvider } from "@/redux/provider";
import { ApolloClient, ApolloProvider } from "@apollo/client";
import { client } from "@/lib/apollo-client";
import ClientProviders from "@/components/client-providers";
import { Analytics } from "@vercel/analytics/next";

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
export default function RootLayout({
  children,
}: {
  children: ReactNode;
}): JSX.Element {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        <ClientProviders>{children}</ClientProviders>
        <Analytics />
      </body>
    </html>
  );
}

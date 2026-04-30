"use client";

import React from "react";
import { ApolloProvider } from "@apollo/client";
import { client } from "@/lib/apollo-client"; // Use the correct Apollo client

// ApolloProvider component that wraps the app and provides Apollo Client to the children components
export const Providers = ({ children }: { children: React.ReactNode }) => {
  return <ApolloProvider client={client}>{children}</ApolloProvider>;
};

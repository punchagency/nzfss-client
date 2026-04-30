"use client";

import { useIsAuth } from "@/hooks/useAuth";
import { usePathname } from "next/navigation";

export default function RouteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  
  // List of public pages that don't require authentication
  const publicPages = [
    "/musher-ranking",
    "/result",
    "/dog-weightpull-points",
    "/dog-race-point",
    "/contacts"
  ];
  
  // Skip authentication check for public pages
  const isPublicPage = publicPages.some(page => pathname.includes(page));
  if (!isPublicPage) {
    useIsAuth();
  }
  
  return <>{children}</>;
}

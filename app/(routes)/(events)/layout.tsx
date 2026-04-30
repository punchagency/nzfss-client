"use client";

import TabContextProvider from "@/context/tab_context";
import { useUser } from "@/context/user_context";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import TopHeaderWithSuspense from "../_components/top_header_with_suspense";
import Navbar from "../_components/navbar";
import { Sidebar } from "../_components/sidebar";
import Tab from "../_components/tab";
import ClubsTab from "@/utils/club_tab.json"
import resultTab from "@/utils/result_tab.json"
import { SortContext } from "../_components/tab";


export default function RouteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Create a layout content component to contain all the search params logic
  const LayoutContent = () => {
    const router = useRouter();
    const { user } = useUser();
    const searchParams = useSearchParams();
    const isAddingResult = searchParams.get("adding_result") === "true";
    const tabParam = searchParams.get("tab");
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    const pathname = usePathname();
    const isEvent = pathname === "/events" || pathname.startsWith('/events/');

    let tab;

    if(pathname.startsWith('/events/') || isAddingResult){
        tab = resultTab
    } else {
      tab = ClubsTab
    }
  
    const [initialTab, setInitialTab] = useState(tabParam ? parseInt(tabParam, 10) : 0);

    // Check URL for sort direction on component mount and on URL changes
    useEffect(() => {
      try {
        const sortParam = searchParams.get('sort');
        if (sortParam === 'asc' || sortParam === 'desc') {
          setSortDirection(sortParam);
        }
      } catch (error) {
        console.error("Error getting sort direction from URL:", error);
      }
    }, [searchParams]);

    // Toggle sort direction function
    const toggleSortDirection = () => {
      try {
        // First update the state with the flipped value
        const newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
        setSortDirection(newDirection);
        
        // Add sort parameter to URL
        const newSearchParams = new URLSearchParams(searchParams.toString());
        newSearchParams.set('sort', newDirection);
        
        // Preserve existing tab parameter if it exists
        const currentTab = searchParams.get('tab');
        if (currentTab) {
          newSearchParams.set('tab', currentTab);
        }
        
        router.push(`${pathname}?${newSearchParams.toString()}`);
      } catch (error) {
        console.error("Error toggling sort direction:", error);
      }
    };

    useEffect(() => {
        // Update initialTab when tab parameter changes
        if (tabParam) {
            setInitialTab(parseInt(tabParam, 10));
        } else if (isEvent) {
            // If on events page with no tab parameter, default to Draft Events (tab 0)
            setInitialTab(0);
            router.push(`${pathname}?tab=0`);
        }
    }, [tabParam, isEvent, pathname, router]);

    // Admin users should be able to access events page
    // No redirection needed

    return (
      <TabContextProvider initialTab={initialTab}>
        <SortContext.Provider value={{ sortDirection, toggleSortDirection }}>
          <div className="h-full">
            <div className=" md:pl-[284px] w-full z-50">
              <TopHeaderWithSuspense 
                placeholder="Search..."
              />
              <Navbar />
              {isEvent && <Tab tabs={tab} />}
            </div>
            <div className="hidden md:flex h-full w-[284px] flex-col fixed inset-y-0 z-50">
              <Sidebar />
            </div>

            <main className="flex-1 md:pl-[284px]  " data-testid="main-content">{children}</main>
          </div>
        </SortContext.Provider>
      </TabContextProvider>
    );
  };

  // Wrap the layout content in a Suspense boundary
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LayoutContent />
    </Suspense>
  );
}

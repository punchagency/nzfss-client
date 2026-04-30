"use client";
import React, { useEffect, useState, createContext, useContext } from "react";
import { useTab } from "@/context/tab_context";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEvent } from "@/service/eventService";
import { CreateEventCalendarInput } from "@/service/eventService";
import { useUser } from "@/context/user_context";
import { useQuery } from "@apollo/client";
import { GET_ALL_RESULTS } from "@/graphql/query/addResult";
import { GET_ALL_POINTS } from "@/graphql/query/points";
import { useSearch } from "@/app/context/SearchContext";

// Create SortContext for sharing sort direction state
type SortContextType = {
  sortDirection: 'asc' | 'desc';
  toggleSortDirection: () => void;
};

export const SortContext = createContext<SortContextType>({
  sortDirection: 'desc',
  toggleSortDirection: () => {},
});

// Custom hook to use the Sort context
export function useSortDirection() {
  return useContext(SortContext);
}

interface TabProps {
  tabs: {
    id: number;
    tab: string;
  }[];
}

const Tab = ({ tabs }: TabProps) => {
  const { activeTab, setActiveTab, setActiveTabEvents, activeTabEvents } = useTab();
  const { events, refetch: refetchEvents } = useEvent();
  const { user } = useUser();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [totalResults, setTotalResults] = useState(0);

  // Query to get all results for the count
  const { data: resultsData, refetch: refetchResults } = useQuery(GET_ALL_RESULTS, {
    fetchPolicy: "cache-and-network",
    notifyOnNetworkStatusChange: true,
  });

  // Query to get all points to determine submission status
  const { data: pointsData, refetch: refetchPoints } = useQuery(GET_ALL_POINTS, {
    fetchPolicy: "cache-and-network",
    notifyOnNetworkStatusChange: true,
  });

  // Update total results count whenever the data changes
  useEffect(() => {
    if (resultsData?.getAllEntrants && pointsData?.getAllPoints) {
      console.log("Raw results from GraphQL:", resultsData.getAllEntrants.length);
      console.log("Points data from GraphQL:", pointsData.getAllPoints.length);
      
      // Create a Set of entrant IDs that have been submitted (have points)
      const submittedEntrantIds = new Set(
        pointsData.getAllPoints.map((point: any) => point.entrantId)
      );
      
      console.log("Submitted entrant IDs:", Array.from(submittedEntrantIds));

      // Filter results: only count entrants that don't have points (not submitted)
      // The server already filters results by user (admin sees all, club users see only their events)
      const nonSubmittedResults = resultsData.getAllEntrants.filter(
        (entrant: any) => !submittedEntrantIds.has(entrant._id)
      );
      
      console.log("Non-submitted results count:", nonSubmittedResults.length);
      console.log("Previous totalResults:", totalResults);
      
      setTotalResults(nonSubmittedResults.length);
    } else {
      console.log("No results or points data available");
      console.log("Results data:", !!resultsData?.getAllEntrants);
      console.log("Points data:", !!pointsData?.getAllPoints);
    }
  }, [resultsData, pointsData]);

  // Listen for custom events that indicate points have been submitted
  useEffect(() => {
    const handlePointsSubmitted = () => {
      console.log("Points submitted event detected, refetching data...");
      refetchResults();
      refetchPoints();
      refetchEvents(); // Also refetch events for submitted tab
    };

    // Listen for custom events from other components
    window.addEventListener('pointsSubmitted', handlePointsSubmitted);

    return () => {
      window.removeEventListener('pointsSubmitted', handlePointsSubmitted);
    };
  }, [refetchResults, refetchPoints, refetchEvents]);

  // Helper function to manually refresh results (for debugging)
  const refreshResultsCount = () => {
    console.log("Manually refreshing results count...");
    refetchResults();
    refetchPoints();
    refetchEvents(); // Also refresh events for submitted tab
  };

  // Make the refresh function available globally for debugging
  useEffect(() => {
    (window as any).refreshResultsCount = refreshResultsCount;
    return () => {
      delete (window as any).refreshResultsCount;
    };
  }, []);

  // Determine which state to use based on the current route
  const isEventsRoute = pathname === "/events" || pathname.startsWith('/events/');
  const activeTabState = isEventsRoute ? activeTabEvents : activeTab;
  const setActiveTabState = isEventsRoute ? setActiveTabEvents : setActiveTab;
  const { searchQuery } = useSearch();
  
  // Filter draft calendar events
  const draftCalendarEvents = (pathname === "/calendar" || pathname === "/dashboard/calendar")
    ? events.filter(
        (event: CreateEventCalendarInput) => {
          // Handle both string and boolean values for isSubmitted
          const isSubmitted = typeof event.isSubmitted === 'string' 
            ? (event.isSubmitted as string).toLowerCase() === 'true'
            : Boolean(event.isSubmitted);
            
          // Match the exact logic from DraftedCalendar component:
          // Show events that are submitted AND either:
          // 1. Status is "Pending", OR
          // 2. Has a date approved but NZFSS sanctioning is NOT true
          return isSubmitted &&
                 (event.status === "Pending" || 
                  (event.date && event.NZFSSSanctioning !== true));
        }
      ) 
    : [];

  const filteredDraftCalendarEvents = draftCalendarEvents.filter((event: CreateEventCalendarInput) => {
    if (!searchQuery) return true;
    
    const searchLower = searchQuery.toLowerCase();
    return (
      (event.eventName?.toLowerCase().includes(searchLower)) ||
      (event.eventDate?.toLowerCase().includes(searchLower))
    );
  });

  // Filter event information events
  const eventInfoEvents = pathname === "/calendar" 
    ? events.filter((event: CreateEventCalendarInput) => {
        // First check if event is submitted
        const isSubmittedStr = String(event.isSubmitted).toLowerCase();
        const isEventSubmitted = isSubmittedStr === "true";
        
        // Only show submitted events that are approved or have NZFSS sanctioning
        return isEventSubmitted && 
               (event.status === "Approve" || event.NZFSSSanctioning === true);
      }) 
    : [];

  const filteredEventInfoEvents = eventInfoEvents.filter((event: CreateEventCalendarInput) => {
    if (!searchQuery) return true;
    
    const searchLower = searchQuery.toLowerCase();
    return (
      (event.eventName?.toLowerCase().includes(searchLower)) ||
      (event.eventDate?.toLowerCase().includes(searchLower))
    );
  });
  
  // Debug logging for event counts
  useEffect(() => {
    if (pathname === "/calendar" || pathname === "/dashboard/calendar") {
      console.log("Total events:", events.length);
      
      // Log events matching each draft calendar condition
      const nzfssFalseCount = events.filter((e: CreateEventCalendarInput) => e.NZFSSSanctioning === false).length;
      const pendingAndSubmittedCount = events.filter((e: CreateEventCalendarInput) => 
        e.status === "Pending" && e.isSubmitted === true
      ).length;
      const dateAndPendingCount = events.filter((e: CreateEventCalendarInput) => 
        e.date === true && e.status === "Pending"
      ).length;
      
      console.log("NZFSS False Count:", nzfssFalseCount);
      console.log("Pending & Submitted Count:", pendingAndSubmittedCount);
      console.log("Date & Pending Count:", dateAndPendingCount);
      
      // Log events matching each event info condition
      const nzfssTrueCount = events.filter((e: CreateEventCalendarInput) => e.NZFSSSanctioning === true).length;
      const approvedCount = events.filter((e: CreateEventCalendarInput) => e.status === "Approve").length;
      
      console.log("NZFSS True Count:", nzfssTrueCount);
      console.log("Approved Count:", approvedCount);
      
      // Log tab definitions and their counts
      console.log("Tab definitions:", tabs);
      console.log("Tab 1 (Event Information) count:", filteredEventInfoEvents.length);
      console.log("Tab 2 (Draft Calendar) count:", filteredDraftCalendarEvents.length);
      console.log("Tab 3 (Saved Results) count:", totalResults);
      
      // Verify what's used by getCountForTab (checking if tab IDs are correct)
      console.log("getCountForTab(1):", getCountForTab(1));
      console.log("getCountForTab(2):", getCountForTab(2));
      console.log("getCountForTab(3):", getCountForTab(3));
    }
  }, [pathname, events, filteredEventInfoEvents.length, filteredDraftCalendarEvents.length, totalResults, tabs]);
  
  // Debug logging for sample events
  useEffect(() => {
    if (pathname === "/calendar" || pathname === "/dashboard/calendar") {
      // Log a sample of events to understand their structure
      const sampleEvents = events.slice(0, 5);
      console.log("Sample events:", sampleEvents);
      
      // Log a sample of draft calendar events to verify filter
      const draftCalendarSample = draftCalendarEvents.slice(0, 5);
      console.log("Draft calendar sample:", draftCalendarSample);
      
      // Log a sample of event info events to verify filter
      const eventInfoSample = eventInfoEvents.slice(0, 5);
      console.log("Event info sample:", eventInfoSample);
    }
  }, [pathname, events, draftCalendarEvents, eventInfoEvents]);

  // Filter draft events for the events route
  const draftEvents = isEventsRoute
    ? events.filter((event: CreateEventCalendarInput) => {
        const isSubmittedStr = String(event.isSubmitted).toLowerCase();
        const isEventSubmitted = isSubmittedStr === "true";
        
        // If the event is already submitted, it's not a draft
        if (isEventSubmitted) return false;
        
        // For ADMIN role, show all non-submitted events 
        if (user?.role === "ADMIN") {
          return true;
        }
        
        // For CLUB role, show only their draft events
        return event.clubId === user?._id;
      })
    : [];

    const filteredDraftEvents = draftEvents.filter((event: CreateEventCalendarInput) => {
      if (!searchQuery) return true;
      
      const searchLower = searchQuery.toLowerCase();
      return (
        (event.eventName?.toLowerCase().includes(searchLower)) ||
        (event.preferredDate?.toLowerCase().includes(searchLower)) ||
        (event.alternativeDate?.toLowerCase().includes(searchLower))
      );
    });
  // Filter submitted events for the events route
  const submittedEvents = isEventsRoute
    ? events.filter((event: CreateEventCalendarInput) => {
        const isSubmittedStr = String(event.isSubmitted).toLowerCase();
        const isEventSubmitted = isSubmittedStr === "true";
        
        // If the event is not submitted, exclude it
        if (!isEventSubmitted) return false;
        
        // For ADMIN users, show all submitted events
        if (user?.role === "ADMIN") {
          return true;
        }
        
        // For CLUB users, only show their own events
        return event.clubId === user?._id;
      })
    : [];

    const filteredSubmittedEvents = submittedEvents.filter((event: CreateEventCalendarInput) => {
      if (!searchQuery) return true;
      
      const searchLower = searchQuery.toLowerCase();
      return (
        (event.eventName?.toLowerCase().includes(searchLower)) ||
        (event.eventDate?.toLowerCase().includes(searchLower))
      );
    });
  // Function to handle tab click
  const handleTabClick = (tabId: number) => {
    setActiveTabState(tabId);
    
    // Update the URL with the tab parameter
    if (isEventsRoute) {
      // Update the URL with the selected tab
      router.push(`/events?tab=${tabId}`);
    } else if (pathname === "/calendar") {
      router.push(`/calendar?tab=${tabId}`);
    } else if (pathname === "/dashboard/calendar") {
      router.push(`/dashboard/calendar?tab=${tabId}`);
    }
  };

  // Helper function to determine if we should show the count for a tab
  const shouldShowCount = (tabId: number): boolean => {
    if (pathname === "/calendar" || pathname === "/dashboard/calendar") {
      // Show count for all tabs in calendar route (both club and admin)
      return true;
    } else if (pathname === "/events" || pathname.startsWith("/events/")) {
      // Show count for all tabs in events route
      return true;
    }
    return false;
  };

  // Helper function to get the count value for a specific tab
  const getCountForTab = (tabId: number): number => {
    if (pathname === "/calendar" || pathname === "/dashboard/calendar") {
      if (tabId === 1) {
        // Event Information tab - should show approved events or events with NZFSS sanctioning, but only if submitted
        const approvedEvents = events.filter((event: CreateEventCalendarInput) => {
          // First check if event is submitted
          const isSubmittedStr = String(event.isSubmitted).toLowerCase();
          const isEventSubmitted = isSubmittedStr === "true";
          
          // Only show submitted events that are approved or have NZFSS sanctioning
          return isEventSubmitted && 
                 (event.status === "Approve" || event.NZFSSSanctioning === true);
        });
        return approvedEvents.length;
      } else if (tabId === 2) {
        // Draft Calendar tab - match the exact logic from DraftedCalendar component
        const pendingEvents = events.filter(
          (event: CreateEventCalendarInput) => {
            // Handle both string and boolean values for isSubmitted
            const isSubmitted = typeof event.isSubmitted === 'string' 
              ? (event.isSubmitted as string).toLowerCase() === 'true'
              : Boolean(event.isSubmitted);
              
            // Show events that are submitted AND either:
            // 1. Status is "Pending", OR
            // 2. Has a date approved but NZFSS sanctioning is NOT true
            return isSubmitted &&
                   (event.status === "Pending" || 
                    (event.date && event.NZFSSSanctioning !== true));
          }
        );
        return pendingEvents.length;
      } else if (tabId === 3) {
        return totalResults; // Total number of results
      }
    } else if (pathname === "/events" || pathname.startsWith("/events/")) {
      if (tabId === 0) {
        return filteredDraftEvents.length; // Use filtered Draft Events count
      } else if (tabId === 1) {
        return filteredSubmittedEvents.length; // Use filtered Submitted count
      } else if (tabId === 2) {
        return totalResults; // Total number of results
      }
    }
    return 0;
  };

  // Helper function to get the background color for a pill
  const getPillBackgroundColor = (tabId: number): string => {
    // Make Draft Calendar pill red in calendar route
    if ((pathname === "/calendar" || pathname === "/dashboard/calendar") && tabId === 2) {
      return "bg-red-600"; // Red background for Draft Calendar
    }
    // Default dark gray background for other pills
    return "bg-[#323232]";
  };

  // Debug logging for data type checking
  useEffect(() => {
    if (pathname === "/calendar") {
      // Check for data type issues with the isSubmitted field
      console.log("Checking isSubmitted field types:");
      events.forEach((event: CreateEventCalendarInput, index: number) => {
        if (index < 20) { // Only log first 20 events to avoid console spam
          console.log(`Event ${index}: ${event.eventName}`);
          console.log(`  isSubmitted: ${event.isSubmitted} (${typeof event.isSubmitted})`);
          console.log(`  status: ${event.status} (${typeof event.status})`);
          
          // Test if the filter condition would match this event
          const wouldMatch = event.isSubmitted === true && event.status === "Pending";
          console.log(`  Would match draft calendar filter: ${wouldMatch}`);
          
          // Test with loose equality for booleans
          const wouldMatchLoose = Boolean(event.isSubmitted) === true && event.status === "Pending";
          console.log(`  Would match with loose equality: ${wouldMatchLoose}`);
          
          // Check if isSubmitted is a string that needs conversion
          if (typeof event.isSubmitted === 'string') {
            const parsedValue = (event.isSubmitted as string).toLowerCase() === 'true';
            console.log(`  String value parsed to boolean: ${parsedValue}`);
            const wouldMatchWithParsed = parsedValue && event.status === "Pending";
            console.log(`  Would match with parsed value: ${wouldMatchWithParsed}`);
          }
        }
      });
      
      // Count with different approaches
      const strictMatch = events.filter((e: CreateEventCalendarInput) => 
        e.isSubmitted === true && e.status === "Pending"
      ).length;
      
      const looseMatch = events.filter((e: CreateEventCalendarInput) => 
        Boolean(e.isSubmitted) === true && e.status === "Pending"
      ).length;
      
      const stringMatch = events.filter((e: CreateEventCalendarInput) => 
        (typeof e.isSubmitted === 'string' ? (e.isSubmitted as string).toLowerCase() === 'true' : e.isSubmitted === true) && 
        e.status === "Pending"
      ).length;
      
      console.log("Count with strict equality (===):", strictMatch);
      console.log("Count with loose equality (Boolean conversion):", looseMatch);
      console.log("Count with string handling:", stringMatch);
    }
  }, [pathname, events]);

  return (
    <div className="mx-3 md:mx-6 h-12 md:h-[48px] bg-[#F6F6F6]">
      <div className="border h-full w-full flex px-2 md:pl-4 overflow-x-auto gap-4 md:gap-[80px] relative items-center">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            className={`instant-anim font-bold whitespace-nowrap py-2 ${
              activeTabState === tab.id
                ? "text-black text-sm md:text-lg" // Active tab styles
                : "text-[#0000004D] text-xs md:text-base" // Inactive tab styles
            }`}
          >
            {tab.tab}
            {shouldShowCount(tab.id) && (
              <span className={`ml-1 md:ml-2 ${getPillBackgroundColor(tab.id)} h-5 w-5 md:h-6 md:w-6 text-white inline-flex justify-center items-center rounded-full text-[10px] md:text-xs`}>
                {getCountForTab(tab.id)}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Tab;

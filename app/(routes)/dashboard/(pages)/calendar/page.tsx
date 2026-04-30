"use client";

import { useTab } from "@/context/tab_context";
import DraftedCalendar from "@/app/(routes)/_components/calendar/drafted_calendar"; 
import EventInformation from "@/app/(routes)/_components/calendar/event_information"; 
import { useSearchParams, useRouter } from "next/navigation";
import { withSuspense } from "@/components/helpers/with-suspense";
import { useUser } from "@/context/user_context";
import AddNewResult from "@/app/(routes)/_components/events/_components/add_new_result";
import Results from "@/app/(routes)/_components/events/_components/saved_results";
import { useEffect } from "react";
import { useSortDirection } from "@/app/(routes)/_components/tab";

// Base component that uses useSearchParams
const CalendarContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { activeTab, setActiveTab } = useTab();
  const { user } = useUser();
  
  // Get event ID and adding_result params
  const eventId = searchParams.get("eventId");
  const isAddingResult = searchParams.get("adding_result") === "true";
  const showResultsTab = searchParams.get("resultsTab") === "true";

  // Set active tab to results (tab 3) when resultsTab parameter is true
  useEffect(() => {
    if (showResultsTab) {
      // Use a custom value (3) to represent the results tab
      setActiveTab(3);
    }
  }, [showResultsTab, setActiveTab]);

  // If admin is adding result, show the AddNewResult component
  if (user?.role === "ADMIN" && isAddingResult && eventId) {
    return <AddNewResult eventId={eventId} />;
  }

  // Show results tab when activeTab is 3 (or when resultsTab is true)
  if (activeTab === 3 || showResultsTab) {
    return <Results />;
  }

  return (
    <div className="container mx-0 max-w-none ">
      {activeTab === 1 ? (
        <EventInformation />
      ) : (
        <DraftedCalendar />
      )}
    </div>
  );
};

// Wrap the component with suspense to handle async loading
const CalendarPage = withSuspense(
  CalendarContent, 
  <div className="w-full h-32 flex items-center justify-center">Loading calendar...</div>
);

export default CalendarPage;

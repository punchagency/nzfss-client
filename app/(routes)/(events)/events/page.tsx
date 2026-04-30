"use client"

import { useTab } from '@/context/tab_context';
import React, { Suspense, useEffect } from 'react';
import DraftEvent from '../../_components/events/draft_event';
import Submitted from '../../_components/events/submitted';
import SavedResults from '../../_components/events/_components/saved_results';
import { useSearchParams } from 'next/navigation';

// Create a loading component for Suspense fallback
const LoadingComponent = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    <span className="ml-3 text-gray-600">Loading events...</span>
  </div>
);

// Content component that uses useTab
const EventsContent = () => {
  const { activeTabEvents, setActiveTabEvents } = useTab();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  
  // Sync activeTab with URL parameter
  useEffect(() => {
    if (tabParam !== null) {
      const tabValue = parseInt(tabParam, 10);
      setActiveTabEvents(tabValue);
    }
  }, [tabParam, setActiveTabEvents]);

  return (
    <>
      {activeTabEvents === 0 ? (
        <DraftEvent />
      ) : activeTabEvents === 1 ? (
        <Submitted />
      ) : activeTabEvents === 2 ? (
        <SavedResults />
      ) : (
        <DraftEvent />
      )}
    </>
  );
};

// Main EventsPage component with proper Suspense boundary - using React.Suspense directly
const EventsPage = () => {
  return (
    <Suspense fallback={<LoadingComponent />}>
      <EventsContent />
    </Suspense>
  );
};

export default EventsPage;
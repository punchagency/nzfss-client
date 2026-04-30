'use client'

import AddNewResult from '@/app/(routes)/_components/events/_components/add_new_result';
import SavedResults from '@/app/(routes)/_components/events/_components/saved_results';
import { useTab } from '@/context/tab_context';
import { useParams, useSearchParams } from 'next/navigation';
import React, { Suspense, useEffect } from 'react';

// Create a loading component
const LoadingComponent = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    <span className="ml-3 text-gray-600">Loading event...</span>
  </div>
);

// Content component that uses useSearchParams
const EventIdContent = () => {
  const params = useParams();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  
  const eventId = Array.isArray(params?.eventId) ? params.eventId[0] : params?.eventId ?? '';
  const { activeTab, setActiveTab } = useTab();
  
  // Update activeTab based on the tab parameter
  useEffect(() => {
    if (tabParam) {
      setActiveTab(parseInt(tabParam, 10));
    }
  }, [tabParam, setActiveTab]);
 
  return (
    <>
      {activeTab === 1 ? (
        <AddNewResult eventId={eventId} />
      ) : activeTab === 2 ? (
        <SavedResults />
      ) : (
        // Default content or placeholder
        <div className="px-6 py-10 text-center">
          <p className="text-gray-500">Select a tab to view content</p>
        </div>
      )}
    </>
  );
};

// Main component with Suspense boundary
const EventId = () => {
  return (
    <Suspense fallback={<LoadingComponent />}>
      <EventIdContent />
    </Suspense>
  );
};

export default EventId;
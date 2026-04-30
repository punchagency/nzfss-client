"use client";

import React, { useState, Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";

import Table from "../../_components/data_table";
import { Pencil, Trash2, ArrowUpDown } from "lucide-react";
import ActionIcons from "../../_components/actions_ buttons";
import EntryForm from "../../_components/entry_form";
import AddResult from "../../_components/add_result";
import { usePathname } from "next/navigation";
import { EventCalendar } from "@/interface";
import PublicButton from "../public_button";
import { CreateEventCalendarInput, useEvent } from "@/service/eventService";
import { Loading } from "@/components/skeleton";
import Warning from "@/components/warning";
import UpdateEvent from "../../dashboard/(pages)/calendar/updateEvent";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { pdf } from "@/assets";
import RenderEntryForm from "./_components/entry_form";
import Name from "../name";
import { useUser } from "@/context/user_context";
import { useApolloClient } from "@apollo/client";
import { GET_ALL_EVENTS } from "@/graphql/query/event";
import { useSearch } from "@/app/context/SearchContext";
import { getClubAbbreviation } from "@/utils/clubAbbreviations";
import { useSortDirection } from "../../_components/tab";

interface Column {
  accessorKey: keyof EventCalendar;
  header: React.ReactNode;
  width: string;
}

const DraftEventContent = () => {
  const [modalOpenEdit, setModalOpenEdit] = useState(false);
  const [modalOpenDelete, setModalOpenDelete] = useState(false);
  const [selectedEvent, setSelectedEvent] =
    useState<CreateEventCalendarInput | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [submittingEventId, setSubmittingEventId] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useUser();
  const client = useApolloClient();
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const pathname = usePathname();
  const isEvents = pathname === "/events";

  const { events, loading, error, deleteEvent, updateEvent } = useEvent();

  // Toggle sort direction
  const toggleSortDirection = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  };
  
  // Preferred Date column with sort button
  const preferredDateHeader = (
    <div className="text-center flex items-center justify-center gap-1">
      <span>Preferred Date</span>
      <button 
        onClick={toggleSortDirection}
        className="inline-flex items-center justify-center w-6 h-6 rounded hover:opacity-80 transition-opacity"
        title={`Sort by date (${sortDirection === 'asc' ? 'oldest' : 'newest'} first)`}
      >
        <ArrowUpDown className={`h-3 w-3 text-white ${sortDirection === 'asc' ? 'bg-blue-600 rounded-sm' : 'bg-gray-600 rounded-sm'}`} />
      </button>
    </div>
  );
  
  // Define columns with the new header for Preferred Date
  const columns: Column[] = [
    {
      accessorKey: "eventName",
      header: "Event Name",
      width: "20%",
    },
    {
      accessorKey: "preferredDate",
      header: preferredDateHeader,
      width: "12%",
    },
    {
      accessorKey: "alternativeDate",
      header: <div className="text-center">Alternative Date</div>,
      width: "12%",
    },
    {
      accessorKey: "region",
      header: <div className="text-center">Region</div>,
      width: "8%",
    },
    {
      accessorKey: "entryForm",
      header: <div className="text-center truncate">Entry Form</div>,
      width: "15%",
    },
    {
      accessorKey: "type",
      header: <div className="text-center">Type</div>,
      width: "13%",
    },
    {
      accessorKey: "action",
      header: <div className="text-center">Actions</div>,
      width: "20%",
    },
  ];

  // Add an effect that runs on component mount to show loading state for 2 seconds
  useEffect(() => {
    // Clear Apollo cache to ensure fresh data
    client.cache.evict({ fieldName: 'getAllEvents' });
    client.cache.gc();
    
    // Set a timeout to simulate loading for 2 seconds
    const timer = setTimeout(() => {
      setInitialLoading(false);
    }, 2000);

    // Clean up the timer when component unmounts
    return () => clearTimeout(timer);
  }, [user, client]);

  // Filter events based on:
  // 1. Events belonging to the current club (if user is CLUB role)
  // 2. Events that are NOT in any of these categories:
  //    - Submitted
  //    - Have status containing "approve" (case-insensitive)
  //    - Have status containing "pending" (case-insensitive)
  const { searchQuery } = useSearch();
  const draftedEvents = events.filter((event: CreateEventCalendarInput) => {
    // Log for debugging
    console.log(`Draft filter - Event ${event.eventName} details:`, {
      isSubmitted: event.isSubmitted,
      status: event.status,
      date: event.date,
      NZFSSSanctioning: event.NZFSSSanctioning,
      clubId: event.clubId,
      userId: user?._id,
      userRole: user?.role
    });
    
    // First convert to string, then check for "true" value
    const isSubmittedStr = String(event.isSubmitted).toLowerCase();
    const isEventSubmitted = isSubmittedStr === "true";
    
    // If the event is already submitted, it's not a draft
    if (isEventSubmitted) {
      console.log(`Event ${event.eventName}: Excluded from drafts - Already submitted`);
      return false;
    }
    
    // For ADMIN role, show all non-submitted events 
    if (user?.role === "ADMIN") {
      console.log(`Event ${event.eventName}: Included in drafts - Admin can see all non-submitted events`);
      return true;
    }
    
    // For CLUB role, show only their draft events
    const includeEvent = event.clubId === user?._id;
    console.log(`Event ${event.eventName}: ${includeEvent ? 'Included' : 'Excluded'} from drafts - ${includeEvent ? 'Owned by current club' : 'Not owned by current club'}`);
    return includeEvent;
  });

  const filteredDraftEvents = draftedEvents.filter((event: CreateEventCalendarInput) => {
    if (!searchQuery) return true;
    
    const searchLower = searchQuery.toLowerCase();
    return (
      (event.eventName?.toLowerCase().includes(searchLower)) ||
      (event.preferredDate?.toLowerCase().includes(searchLower)) ||
      (event.alternativeDate?.toLowerCase().includes(searchLower))
    );
  });

  // After filtering events, sort them by date
  const sortedDraftEvents = [...filteredDraftEvents].sort((a, b) => {
    try {
      // Convert dates to comparable values (timestamp)
      const dateA = a.preferredDate ? new Date(a.preferredDate).getTime() : 0;
      const dateB = b.preferredDate ? new Date(b.preferredDate).getTime() : 0;
      
      // Sort based on direction from context
      return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
    } catch (error) {
      // If sorting fails, maintain original order
      return 0;
    }
  });

  const handleDeleteEvent = () => {
    if (selectedEvent && selectedEvent._id) {
      deleteEvent(selectedEvent._id);
      toast({
        description: `Event deleted successfully`,
      });
      setModalOpenDelete(false);
    } else {
      toast({
        description: "Event ID is missing.",
        variant: "destructive",
      });
    }
  };

  const handleSubmitEvent = async (eventId: string) => {
    if (submittingEventId === eventId) return;
    
    const eventToSubmit = events.find((e: CreateEventCalendarInput) => e._id === eventId);
    
    if (!eventToSubmit) {
      toast({
        description: "Event not found",
        variant: "destructive",
      });
      return;
    }
    
    const isSubmittedStr = String(eventToSubmit.isSubmitted).toLowerCase();
    const isEventSubmitted = isSubmittedStr === "true";
    
    if (isEventSubmitted) {
      toast({
        description: "Event is already submitted",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setSubmittingEventId(eventId);
      await updateEvent(eventId, { isSubmitted: true });
      await client.refetchQueries({ include: [GET_ALL_EVENTS] });
      toast({ description: "Event submitted successfully" });
    } catch (error) {
      console.error("Error submitting event:", error);
      toast({
        description: "Error submitting event",
        variant: "destructive",
      });
    } finally {
      setSubmittingEventId(null);
    }
  };

  // Show loading state during initial 2-second delay or when Apollo is loading data
  if (initialLoading || loading) return <Loading />;

  if (error) {
    return (
      <div className="mx-6 h-[60vh] w-full flex justify-center items-center">
        <div className="text-destructive">Error: {error.message}</div>
      </div>
    );
  }

  return (
    <Suspense fallback={<Loading />}>
      <div className="w-full px-6">
        <div className="w-full border rounded-b-[24px] overflow-hidden">
          <Table
            columns={columns}
            data={sortedDraftEvents}
            renderAction={(event: any) => {
              const canManageEvent = user?.role === "ADMIN" || event.clubId === user?._id;
              const isSubmitting = submittingEventId === event._id;

              if (!canManageEvent) {
                return (
                  <div className="flex items-center justify-center">
                    <button
                      onClick={() => handleSubmitEvent(event._id)}
                      disabled={isSubmitting}
                      className={`px-3 py-1 text-sm bg-primary text-white rounded-md ${
                        isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary/90'
                      }`}
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit'}
                    </button>
                  </div>
                );
              }

              // Pass icons directly as props
              const icons = [
                <Pencil
                  onClick={() => {
                    setSelectedEvent(event);
                    setModalOpenEdit(true);
                  }}
                  className={`w-[14px] h-[14px] transition-colors duration-200 ${
                    isSubmitting 
                      ? "text-gray-400 cursor-not-allowed" 
                      : "text-[#323232] cursor-pointer hover:text-blue-600"
                  }`}
                  key="pen"
                />,
                <Trash2
                  onClick={() => {
                    setSelectedEvent(event);
                    setModalOpenDelete(true);
                  }}
                  className={`w-[14px] h-[14px] transition-colors duration-200 ${
                    isSubmitting 
                      ? "text-gray-400 cursor-not-allowed" 
                      : "text-[#323232] cursor-pointer hover:text-red-600"
                  }`}
                  key="trash"
                />,
              ];

              return (
                <div className="flex items-center justify-center gap-4 ml-24">
                  <ActionIcons 
                    eventId={event._id} 
                    icons={icons} 
                    event={event}
                  />
                  <button
                    onClick={() => handleSubmitEvent(event._id)}
                    disabled={isSubmitting}
                    className={`px-3 py-1 text-sm bg-primary text-white rounded-md ${
                      isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary/90'
                    }`}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit'}
                  </button>
                </div>
              );
            }}
            renderClub={(clubObject) => {
              const club = clubObject.club;

              if (typeof club === "string") {
                return <div>{getClubAbbreviation(club)}</div>;
              } else {
                return <div>Invalid club name</div>;
              }
            }}
            renderName={(event: any) => {
              return (
                <Name
                 name={event.eventName} 
                />
              );
            }}
            renderEntryForm={(event: any) => {
              return (
                <div className="text-center">
                  <RenderEntryForm
                   event={event}
                   showSanctionStatus={false}
                  />
                  {event.website && (
                    <div className="mt-1">
                      <a 
                        href={event.website.startsWith('http://') || event.website.startsWith('https://') 
                          ? event.website 
                          : `https://${event.website}`
                        } 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline text-sm"
                      >
                        Link
                      </a>
                    </div>
                  )}
                </div>
              );
            }}
            renderType={(event: any) => {
              if (event.type === "sanctioning applied") {
                return <div className="text-blue-600 font-semibold text-center whitespace-nowrap">Sanctioning Applied</div>;
              } else if (event.NZFSSSanctioning === true) {
                return <div className="text-green-600 font-semibold text-center whitespace-nowrap">Sanctioned</div>;
              } else if (event.status === "Approve" && event.date) {
                return <div className="text-black font-semibold text-center whitespace-nowrap">Unsanctioned</div>;
              } else if (event.status === "Declined") {
                return <div className="text-red-600 text-center whitespace-nowrap">Declined</div>;
              } else {
                return <div className="text-center whitespace-nowrap">Unsanctioned</div>;
              }
            }}
            renderPublic={(event: any) => {
              return <PublicButton eventId={event._id} eventPublic={event.public} />;
            }}
            renderAddResult={(resultData) => {
              return <AddResult id={resultData._id} button={resultData.result} />;
            }}
            isCalendar={isEvents}
          />
        </div>

        {modalOpenEdit && selectedEvent && (
          <UpdateEvent
            open={modalOpenEdit}
            onClose={() => setModalOpenEdit(false)}
            event={selectedEvent}
          />
        )}

        {modalOpenDelete && selectedEvent && (
          <Warning
            open={modalOpenDelete}
            onClose={() => setModalOpenDelete(false)}
            data={selectedEvent}
            description="Are you sure you want to delete this event?"
            onConfirm={handleDeleteEvent}
          />
        )}
      </div>
    </Suspense>
  );
};

// Main component that wraps the content in Suspense
const DraftEvent = () => {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-3 text-gray-600">Loading draft events...</span>
      </div>
    }>
      <DraftEventContent />
    </Suspense>
  );
};

export default DraftEvent;

"use client";

import React, { useState, useEffect, Suspense, useMemo } from "react";
import { useQuery } from "@apollo/client";

import Table from "../../_components/data_table";
import { Pencil, Trash2, ArrowUpDown } from "lucide-react";
import ActionIcons from "../../_components/actions_ buttons";
import EntryForm from "../../_components/entry_form";
import AddResult from "../../_components/add_result";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { EventCalendar } from "@/interface";
import PublicButton from "../public_button";
import { CreateEventCalendarInput, useEvent } from "@/service/eventService";
import { Loading } from "@/components/skeleton";
import Warning from "@/components/warning";
import UpdateEvent from "../../dashboard/(pages)/calendar/updateEvent";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { pdf } from "@/assets";
import Status from "./status";
import RenderEntryForm from "./_components/entry_form";
import Name from "../name";
import { useUser } from "@/context/user_context";
import AddNewResult from "./_components/add_new_result";
import { GET_ALL_RESULTS } from "@/graphql/query/addResult";
import { ViewResultModal } from "./_components/view_result_modal";
import { useSearch } from "@/app/context/SearchContext";
import { getClubAbbreviation } from "@/utils/clubAbbreviations";
import { useSortDirection } from "../../_components/tab";

interface Column {
  accessorKey: keyof EventCalendar;
  header: React.ReactNode;
  width: string;
}

const SubmittedContent = (): JSX.Element => {
  const [modalOpenDelete, setModalOpenDelete] = useState(false);
  const [modalOpenEdit, setModalOpenEdit] = useState(false);
  const [modalOpenViewResult, setModalOpenViewResult] = useState(false);
  const [selectedEvent, setSelectedEvent] =
    useState<CreateEventCalendarInput | null>(null);
  const [selectedResults, setSelectedResults] = useState<any[]>([]);
  const [showAddResult, setShowAddResult] = useState(false);
  const [currentEventId, setCurrentEventId] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { searchQuery } = useSearch();
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [retryCount, setRetryCount] = useState(0);

  const pathname = usePathname();
  const isEvent = pathname === "/events";
  
  const { events, loading, error, refetch, deleteEvent } = useEvent();

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
      width: "auto%",
    },
    {
      accessorKey: "preferredDate",
      header: preferredDateHeader,
      width: "aut%",
    },
    {
      accessorKey: "alternativeDate",
      header: <div className="text-center">Alternative Date</div>,
      width: "auto",
    },
    {
      accessorKey: "region",
      header: <div className="text-center">Region</div>,
      width: "auto",
    },
    {
      accessorKey: "entryForm",
      header: <div className="text-center truncate">Entry Form</div>,
      width: "auto",
    },
    {
      accessorKey: "type",
      header: <div className="text-center">Type</div>,
      width: "auto",
    },
    {
      accessorKey: "result",
      header: <div className="text-center">Add Result</div>,
      width: "auto",
    },
    {
      accessorKey: "status",
      header: <div className="text-center">Status</div>,
      width: "auto",
    },
    {
      accessorKey: "action",
      header: <div className="text-center">Actions</div>,
      width: "auto",
    },
  ];

  // Add query for results
  const { data: resultsData, refetch: refetchResults } = useQuery(GET_ALL_RESULTS, {
    fetchPolicy: "cache-and-network",
    notifyOnNetworkStatusChange: true,
  });

  const [eventResultsMap, setEventResultsMap] = useState<Record<string, any[]>>({});
  
  // Update eventResultsMap when resultsData changes
  useEffect(() => {
    if (resultsData?.getAllEntrants) {
      const newMap: Record<string, any[]> = {};
      resultsData.getAllEntrants.forEach((entrant: any) => {
        if (entrant.eventId) {
          if (!newMap[entrant.eventId]) {
            newMap[entrant.eventId] = [];
          }
          newMap[entrant.eventId].push(entrant);
        }
      });
      setEventResultsMap(newMap);
    }
  }, [resultsData]);

  // Add effect to refetch results when component becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log("Page became visible, refetching results...");
        refetchResults();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refetchResults]);

  // Add effect to refetch results when navigating back to this tab
  useEffect(() => {
    // Refetch results when this component mounts or when user navigates back
    refetchResults();
  }, [refetchResults]);

  // Listen for custom events that indicate points have been submitted
  useEffect(() => {
    const handlePointsSubmitted = () => {
      console.log("Points submitted event detected in submitted events, refetching data...");
      refetchResults();
      refetch(); // Also refetch events
    };

    // Listen for custom events from other components
    window.addEventListener('pointsSubmitted', handlePointsSubmitted);

    return () => {
      window.removeEventListener('pointsSubmitted', handlePointsSubmitted);
    };
  }, [refetchResults, refetch]);

  // Add effect to handle data refresh
  useEffect(() => {
    const refreshData = async () => {
      try {
        await refetch();
        console.log("Data refreshed successfully");
      } catch (error) {
        console.error("Error refreshing data:", error);
        // Implement retry logic
        if (retryCount < 3) {
          setRetryCount(prev => prev + 1);
          setTimeout(refreshData, 1000 * (retryCount + 1)); // Exponential backoff
        } else {
          toast({
            variant: "destructive",
            description: "Failed to refresh events data. Please try refreshing the page.",
          });
        }
      }
    };

    // Refresh data on mount and when user changes
    refreshData();
  }, [user?._id, refetch, retryCount, toast]);

  // Add effect to handle URL parameters
  useEffect(() => {
    const isAddingResultFromURL = searchParams.get("adding_result") === "true";
    const eventIdFromURL = searchParams.get("eventId");
    
    if (isAddingResultFromURL && eventIdFromURL) {
      setShowAddResult(true);
      setCurrentEventId(eventIdFromURL);
    } else if (!isAddingResultFromURL) {
      setShowAddResult(false);
      setCurrentEventId(null);
    }
  }, [searchParams]);

  // Filter events that are submitted with better logging
  const submittedEvents = events.length > 0 ? events.filter((event: CreateEventCalendarInput) => {
    const isSubmittedStr = String(event.isSubmitted).toLowerCase();
    const isEventSubmitted = isSubmittedStr === "true";
    const isOwnedByCurrentClub = event.clubId === user?._id;
    
    console.log(`Event ${event.eventName} filter check:`, {
      isSubmitted: isEventSubmitted,
      status: event.status,
      date: event.date,
      NZFSSSanctioning: event.NZFSSSanctioning,
      clubId: event.clubId,
      userId: user?._id,
      isOwnedByCurrentClub,
      userRole: user?.role
    });
    
    // If the event is not submitted, exclude it
    if (!isEventSubmitted) {
      console.log(`Event ${event.eventName}: Excluded - Not submitted`);
      return false;
    }
    
    // For ADMIN users, show all submitted events
    if (user?.role === "ADMIN") {
      console.log(`Event ${event.eventName}: Included - Admin can see all submitted events`);
      return true;
    }
    
    // For CLUB users, only show their own events
    const includeEvent = event.clubId === user?._id;
    console.log(`Event ${event.eventName}: ${includeEvent ? 'Included' : 'Excluded'} - ${includeEvent ? 'Owned by current club' : 'Not owned by current club'}`);
    return includeEvent;
  }) : [];
  
  console.log("FILTERED SUBMITTED EVENTS:", submittedEvents.length, "events");

  // Filter submitted events based on search
  const filteredSubmittedEvents = submittedEvents.filter((event: CreateEventCalendarInput) => {
    if (!searchQuery) return true;
    
    const searchLower = searchQuery.toLowerCase();
    return (
      (event.eventName?.toLowerCase().includes(searchLower)) ||
      (event.preferredDate?.toLowerCase().includes(searchLower)) ||
      (event.alternativeDate?.toLowerCase().includes(searchLower))
    );
  });
  
  // After filtering events, sort them by date
  const sortedSubmittedEvents = [...filteredSubmittedEvents].sort((a, b) => {
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

  // Render preferred date with green color for approved events
  const renderPreferredDate = (event: any) => {
    // Only show green if the event is approved, has a date set, and the preferred date is the one being used
    const isApproved = event.status === "Approve" && event.date === true && event.eventDate === event.preferredDate;
    
    return (
      <div className={`text-center ${isApproved ? "text-green-600 font-semibold" : ""}`}>
        {event.preferredDate}
      </div>
    );
  };

  // Render alternative date with green color for approved events
  const renderAlternativeDate = (event: any) => {
    // Only show green if the event is approved, has a date set, and the alternative date is the one being used
    const isApproved = event.status === "Approve" && event.date === true && event.eventDate === event.alternativeDate;
    
    return (
      <div className={`text-center ${isApproved ? "text-green-600 font-semibold" : ""}`}>
        {event.alternativeDate}
      </div>
    );
  };

  const handleDeleteEvent = async () => {
    if (selectedEvent && selectedEvent._id) {
      try {
        await deleteEvent(selectedEvent._id);
        toast({
          description: `Event and all associated results deleted successfully`,
        });
        setModalOpenDelete(false);
        // Refetch both events and results to update the lists
        await refetch();
        await refetchResults();
      } catch (error) {
        console.error("Error deleting event:", error);
        toast({
          description: "Failed to delete event. Please try again.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        description: "Event ID is missing.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="mx-6 h-[60vh] w-full flex flex-col justify-center items-center gap-4">
        <div className="text-destructive">Error: {error.message}</div>
        <button
          onClick={() => {
            setRetryCount(0);
            refetch();
          }}
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
        >
          Retry Loading Events
        </button>
      </div>
    );
  }

  // If showAddResult is true, render the AddNewResult component
  if (showAddResult && currentEventId) {
    // No need to manually update URL here since we're using router.push above
    return <AddNewResult eventId={currentEventId} />;
  }

  const renderAddResult = (event: any) => {
    const hasResults = eventResultsMap[event._id]?.length > 0;
    
    return (
      <div className="flex justify-center items-center">
        <button
          onClick={() => {
            if (hasResults) {
              // If there are results, show the view result modal
              setSelectedEvent(event);
              // Ensure we pass the complete result objects including _id
              const allEntrantsForEvent = eventResultsMap[event._id] || [];
            
              // Set all entrants for the event without filtering
              setSelectedResults(allEntrantsForEvent);
              setModalOpenViewResult(true);
            } else if (event.status === "Approve") {
              // If no results but event is approved, allow adding new result
              router.push(`/events/${event._id}?tab=1`);
            } else {
              toast({
                description: "Event must be approved before adding results",
                variant: "destructive",
              });
            }
          }}
          disabled={event.status !== "Approve" && !hasResults}
          className={`${
            event.status === "Approve" || hasResults
              ? "bg-[#F3F3F3] border-[#CDCECE] text-[#1A1A1A] cursor-pointer" 
              : "bg-[#E6E6E6] border-[#CDCECE] text-[#9C9D9D] cursor-not-allowed"
          } text-[0.781vw] font-[600] w-[6.042vw] h-[1.875vw] border rounded-[12px]`}
        >
          {hasResults ? "View Result" : "+ Add Result"}
        </button>
      </div>
    );
  };

  return (
    <div className="px-6 ">
      <div className="border rounded-b-[24px] overflow-hidden">
        <Table
          columns={columns}
          data={sortedSubmittedEvents}
          renderAction={(event: any) => {
            // Pass icons directly as props
            const icons = [
              <Pencil
                onClick={() => {
                  // Allow edit if user is admin or if the event belongs to the user's club
                  if (user?.role === "ADMIN" || event.clubId === user?._id) {
                    setSelectedEvent(event);
                    setModalOpenEdit(true);
                  } else {
                    toast({
                      description: "You don't have permission to edit this event.",
                      variant: "destructive",
                    });
                  }
                }}
                className={`w-[14px] h-[14px] transition-colors duration-200 ${
                  user?.role === "ADMIN" || event.clubId === user?._id
                    ? "text-[#323232] cursor-pointer hover:text-blue-600"
                    : "text-gray-400 cursor-not-allowed"
                }`}
                key="pen"
              />,
              <Trash2
                onClick={() => {
                  // Allow delete if user is admin or if the event belongs to the user's club
                  if (user?.role === "ADMIN" || event.clubId === user?._id) {
                    setSelectedEvent(event);
                    setModalOpenDelete(true);
                  } else {
                    toast({
                      description: "You don't have permission to delete this event.",
                      variant: "destructive",
                    });
                  }
                }}
                className={`w-[14px] h-[14px] transition-colors duration-200 ${
                  user?.role === "ADMIN" || event.clubId === user?._id
                    ? "text-[#323232] cursor-pointer hover:text-red-600"
                    : "text-gray-400 cursor-not-allowed"
                }`}
                key="trash"
              />,
            ];

            return (
              <ActionIcons 
                eventId={event._id} 
                icons={icons} 
                event={event}
              />
            );
          }}
          renderAddResult={renderAddResult}
          renderCheckDatePreferred={renderPreferredDate}
          renderCheckDateAlternative={renderAlternativeDate}
          renderClub={(clubObject) => {
            const club = clubObject.club;
            if (typeof club === "string") {
              return <div className="text-center">{getClubAbbreviation(club)}</div>;
            } else {
              return <div className="text-center">Invalid club name</div>;
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
                 truncateAt={13}
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
            let typeDisplay = "";
            let colorClass = "text-center whitespace-nowrap";
            
            if (event.NZFSSSanctioning === true) {
              typeDisplay = "Sanctioned";
              colorClass = "text-green-600 font-semibold text-center whitespace-nowrap";
            } else if (event.type === "sanctioning applied") {
              typeDisplay = "Sanctioning Applied";
              colorClass = "text-blue-600 font-semibold text-center whitespace-nowrap";
            } else if (event.status === "Declined") {
              typeDisplay = "Declined";
              colorClass = "text-red-600 text-center whitespace-nowrap";
            } else {
              typeDisplay = "Unsanctioned";
              colorClass = "text-center whitespace-nowrap";
            }
            
            return <div className={colorClass}>{typeDisplay}</div>;
          }}
          renderPublic={(event: any) => {
            return <PublicButton eventId={event._id} eventPublic={event.public} />;
          }}
          renderStatus={(event: any) => {
            // Determine the status text based on approval conditions
            let statusText = event.status;
            
            if (event.status === "Approve") {
              // Default to "Pending" for approved events with no specific approval yet
              statusText = "Pending";
              
              if (event.date === true) {
                statusText = "Date Approved";
              }
              
              if (event.NZFSSSanctioning === true) {
                statusText = "Sanctioning Approved";
              }
            }
            
            return <Status status={statusText} />;
          }}
          isCalendar={isEvent}
        />
      </div>

      {modalOpenDelete && selectedEvent && (
        <Warning
          open={modalOpenDelete}
          onClose={() => setModalOpenDelete(false)}
          data={selectedEvent}
          description="Are you sure you want to delete this event?"
          onConfirm={handleDeleteEvent}
        />
      )}

      {modalOpenEdit && selectedEvent && (
        <UpdateEvent
          open={modalOpenEdit}
          onClose={() => setModalOpenEdit(false)}
          event={selectedEvent}
        />
      )}

      {modalOpenViewResult && selectedEvent && (
        <ViewResultModal
          isOpen={modalOpenViewResult}
          onClose={() => {
            setModalOpenViewResult(false);
            setSelectedEvent(null);
            setSelectedResults([]);
          }}
          eventName={selectedEvent.eventName}
          results={selectedResults}
          onResultsUpdate={(updatedResults) => {
            setSelectedResults(updatedResults);
            // Update the eventResultsMap with the new results
            if (selectedEvent && selectedEvent._id) {
              const eventId = selectedEvent._id as string;
              setEventResultsMap((prev) => {
                const newMap = { ...prev };
                newMap[eventId] = updatedResults;
                return newMap;
              });
            }
          }}
        />
      )}
    </div>
  );
};

// Main component that wraps the content in Suspense
const Submitted = () => {
  return (
    <Suspense fallback={<Loading />}>
      <SubmittedContent />
    </Suspense>
  );
};

export default Submitted;

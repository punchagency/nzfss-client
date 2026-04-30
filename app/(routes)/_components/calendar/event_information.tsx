import React, { useState, useEffect } from "react";

import Table from "../../_components/data_table";
import { Pencil, Trash2, ArrowUpDown } from "lucide-react";
import ActionIcons from "../../_components/actions_ buttons";
import EntryForm from "../../_components/entry_form";
import AddResult from "../../_components/add_result";
import { usePathname, useRouter } from "next/navigation";
import { EventCalendar } from "@/interface";
import PublicButton from "../public_button";
import { CreateEventCalendarInput, useEvent } from "@/service/eventService";
import { Loading } from "@/components/skeleton";
import Warning from "@/components/warning";
import UpdateEvent from "../../dashboard/(pages)/calendar/updateEvent";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { pdf } from "@/assets";
import RenderEntryForm from "../events/_components/entry_form";
import Name from "../name";
import { useSearch } from "@/app/context/SearchContext";
import { getClubAbbreviation } from "@/utils/clubAbbreviations";
import { Button } from "@/components/ui/button";
import { useQuery } from "@apollo/client";
import { GET_ALL_RESULTS } from "@/graphql/query/addResult";
import { ViewResultModal } from "../events/_components/view_result_modal";
import { formatDate } from "../events/_components/saved_results/utils";

interface Column {
  accessorKey: keyof EventCalendar;
  header: React.ReactNode;
  width: string;
}

const EventInformation = () => {
  const [modalOpenEdit, setModalOpenEdit] = useState(false);
  const [modalOpenDelete, setModalOpenDelete] = useState(false);
  const [selectedEvent, setSelectedEvent] =
    useState<CreateEventCalendarInput | null>(null);
  const { toast } = useToast();
  const { searchQuery } = useSearch();
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Add state for result viewing
  const [modalOpenViewResult, setModalOpenViewResult] = useState(false);
  const [selectedResults, setSelectedResults] = useState<any[]>([]);
  const [eventResultsMap, setEventResultsMap] = useState<Record<string, any[]>>({});
  const [resultSortDirection, setResultSortDirection] = useState<'with-results' | 'without-results'>('with-results');
  const [isResultSortActive, setIsResultSortActive] = useState(false);

  const pathname = usePathname();
  const isCalendar = pathname === "/calendar";
  const router = useRouter();

  const { events, loading, error, deleteEvent, refetch } = useEvent();

  // Add query for results
  const { data: resultsData, refetch: refetchResults } = useQuery(GET_ALL_RESULTS, {
    fetchPolicy: "network-only",
  });

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

  // Toggle sort direction
  const toggleSortDirection = () => {
    setIsResultSortActive(false); // Deactivate result sorting when date sorting is clicked
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  // Toggle result sort direction
  const toggleResultSortDirection = () => {
    setIsResultSortActive(true);
    setResultSortDirection(prev => prev === 'with-results' ? 'without-results' : 'with-results');
  };

  // Event Date column with sort button
  const eventDateHeader = (
    <div className="text-center flex items-center justify-center gap-1">
      <span>Event Date</span>
      <button 
        onClick={toggleSortDirection}
        className="inline-flex items-center justify-center w-6 h-6 rounded hover:opacity-80 transition-opacity"
        title={`Sort by date (${sortDirection === 'asc' ? 'oldest' : 'newest'} first)`}
      >
        <ArrowUpDown className={`h-3 w-3 text-white ${!isResultSortActive ? (sortDirection === 'asc' ? 'bg-blue-600 rounded-sm' : 'bg-blue-800 rounded-sm') : 'bg-gray-600 rounded-sm'}`} />
      </button>
    </div>
  );

  // Result column with sort button
  const resultHeader = (
    <div className="text-center flex items-center justify-center gap-1">
      <span>Result</span>
      <button 
        onClick={toggleResultSortDirection}
        className="inline-flex items-center justify-center w-6 h-6 rounded hover:opacity-80 transition-opacity"
        title={`Sort by results (${resultSortDirection === 'with-results' ? 'with results' : 'without results'} first)`}
      >
        <ArrowUpDown className={`h-3 w-3 text-white ${isResultSortActive ? (resultSortDirection === 'with-results' ? 'bg-green-600 rounded-sm' : 'bg-green-800 rounded-sm') : 'bg-gray-600 rounded-sm'}`} />
      </button>
    </div>
  );

  // Define columns with the new header for Event Date
  const columns: Column[] = [
    {
      accessorKey: "eventName",
      header: <div className="text-left">Event Name</div>,
      width: "20%",
    },
    {
      accessorKey: "eventDate",
      header: eventDateHeader,
      width: "10%",
    },
    {
      accessorKey: "club",
      header: <div className="text-center">Club</div>,
      width: "10%",
    },
    {
      accessorKey: "region",
      header: <div className="text-center">Region</div>,
      width: "8%",
    },
    {
      accessorKey: "entryForm",
      header: <div className="text-center">Entry Form</div>,
      width: "12%",
    },
    {
      accessorKey: "type",
      header: <div className="text-center">Type</div>,
      width: "12%",
    },
    {
      accessorKey: "result",
      header: resultHeader,
      width: "12%",
    },
    {
      accessorKey: "public",
      header: <div className="text-center">Public</div>,
      width: "8%",
    },
    {
      accessorKey: "action",
      header: <div className="text-center">Actions</div>,
      width: "8%",
    },
  ];

  // Show all NZFSS sanctioned events and events with approved dates, but only if they are submitted
  const publishedEvents = events.filter((event: CreateEventCalendarInput) => {
    // First convert to string, then check for "true" value
    const isSubmittedStr = String(event.isSubmitted).toLowerCase();
    const isEventSubmitted = isSubmittedStr === "true";
    
    // Only show events that are submitted
    if (!isEventSubmitted) {
      return false;
    }
    
    // Then check if event meets the other criteria
    return (
      event.NZFSSSanctioning === true || 
      event.status === "Approve" ||
      event.status === "Declined" ||
      event.status === "Pending"
    );
  });

  const filteredEvents = publishedEvents.filter((event: CreateEventCalendarInput) => {
    if (!searchQuery) return true;
    
    const searchLower = searchQuery.toLowerCase();
    return (
      (event.eventName?.toLowerCase().includes(searchLower)) ||
      (event.eventDate?.toLowerCase().includes(searchLower))
    );
  });

  // Sort events by date and results
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    try {
      // By default, sort by date first
      const dateA = a.eventDate ? new Date(a.eventDate).getTime() : 0;
      const dateB = b.eventDate ? new Date(b.eventDate).getTime() : 0;
      
      const dateDiff = sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      
             // If result sorting was clicked and is active, prioritize result sorting
       if (isResultSortActive) {
        const hasResultsA = eventResultsMap[a._id]?.length > 0;
        const hasResultsB = eventResultsMap[b._id]?.length > 0;
        
        if (hasResultsA !== hasResultsB) {
          if (resultSortDirection === 'with-results') {
            return hasResultsA ? -1 : 1; // Events with results first
          } else {
            return hasResultsA ? 1 : -1; // Events without results first
          }
        }
        
        // Within same result group, sort by date
        return dateDiff;
      }
      
      // Default behavior: just sort by date
      return dateDiff;
    } catch (error) {
      return 0;
    }
  });

  const handleDeleteEvent = () => {
    if (selectedEvent && selectedEvent._id) {
      deleteEvent(selectedEvent._id); // Pass the eventId directly
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

  if (loading) return <Loading />;

  if (error) {
    return (
      <div className="mx-6 h-[60vh] w-full flex justify-center items-center">
        <div className="text-destructive">Error: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="container mx-0 max-w-none w-full overflow-hidden px-6">
      <div className="border rounded-b-[24px] w-full">
        <Table
          columns={columns}
          data={sortedEvents}
          renderAction={(event: any) => {
            // Pass icons directly as props
            const icons = [
              <Pencil
                onClick={() => {
                  setSelectedEvent(event);
                  setModalOpenEdit(true);
                }}
                className="w-[14px] h-[14px] text-[#323232]"
                key="pen"
              />,
              <Trash2
                onClick={() => {
                  setSelectedEvent(event);
                  setModalOpenDelete(true);
                }}
                className="w-[14px] h-[14px] text-[#323232]"
                key="trash"
              />,
            ];

            return <ActionIcons icons={icons} />;
          }}

          renderName={(event: any) => {
            return (
              <div className="text-left">
                <Name name={event.eventName} />
              </div>
            );
          }}

          renderEventDate={(event: any) => {
            return (
              <div className="text-center">
                {formatDate(event.eventDate)}
              </div>
            );
          }}

          renderClub={(clubObject) => {
            const club = clubObject.club;
            if (typeof club === "string") {
              return <div className="text-center">{getClubAbbreviation(club)}</div>;
            } else {
              return <div className="text-center">Invalid club name</div>;
            }
          }}
          renderEntryForm={(event: any) => {
            return (
              <RenderEntryForm
               event={event}
               showSanctionStatus={false}
              />
            );
          }}
          renderType={(event: any) => {
            if (event.NZFSSSanctioning === true) {
              return <div className="text-green-600 font-semibold text-center">Sanctioned</div>;
            } else if (event.status === "Approve" && event.date && event.type !== "sanctioning applied") {
              return <div className="text-black font-semibold text-center">Unsanctioned</div>;
            } else if (event.status === "Declined" && event.NZFSSSanctioning === false) {
              return <div className="text-red-600 text-center">Declined</div>;
            } else if (event.type === "sanctioning applied") {
              return <div className="text-blue-600 font-semibold text-center">Sanctioning applied</div>;
            } else {
              return <div className="text-center">Unsanctioned</div>;
            }
          }}
          renderPublic={(event: any) => {
            return <PublicButton eventId={event._id} eventPublic={event.public} />;
          }}
          renderAddResult={(event: any) => {
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
                    } else if (event.status === "Approve" || event.NZFSSSanctioning === true) {
                      // If no results but event is approved or sanctioned, allow adding new result
                      router.push(`/events/${event._id}?tab=1`);
                    } else {
                      toast({
                        description: "Event must be approved or sanctioned before adding results",
                        variant: "destructive",
                      });
                    }
                  }}
                  disabled={!hasResults && event.status !== "Approve" && !event.NZFSSSanctioning}
                  className={`${
                    hasResults || event.status === "Approve" || event.NZFSSSanctioning
                      ? "bg-[#F3F3F3] border-[#CDCECE] text-[#1A1A1A] hover:bg-[#E6E6E6]" 
                      : "bg-[#E6E6E6] border-[#CDCECE] text-[#9C9D9D] cursor-not-allowed"
                  } text-[15px] font-[600] w-[116px] h-[36px] border rounded-[12px] transition-colors`}
                >
                  {hasResults ? "View Result" : "+ Add Result"}
                </button>
              </div>
            );
          }}
          renderStatus={(event: any) => {
            if (event.NZFSSSanctioning === true) {
              return <div className="text-green-600 font-semibold">Sanctioned</div>;
            } else if (event.status === "Approve" && event.date) {
              return <div className="text-blue-600 font-semibold">Date Approved</div>;
            } else if (event.status === "Declined") {
              return <div className="text-red-600">Declined</div>;
            } else if (event.type === "sanctioning applied") {
              return <div className="text-blue-600 font-semibold">Sanctioning applied</div>;
            } else {
              return <div>{event.status}</div>;
            }
          }}
          isCalendar={isCalendar}
        />
      </div>

      {modalOpenEdit && selectedEvent && (
        <UpdateEvent
          open={modalOpenEdit}
          onClose={async () => {
            setModalOpenEdit(false);
            // Refetch events data to ensure we have the latest information
            try {
              await refetch();
            } catch (error) {
              console.error("Error refetching events:", error);
            }
          }}
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

export default EventInformation;

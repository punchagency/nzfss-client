"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { GET_SAVED_RESULTS, GET_ALL_EVENTS, DELETE_ENTRANT } from "@/graphql/queries";
import { SavedResult, Entrant as EntrantType, Event as EventType } from "@/graphql/types";
import { formatDistance as formatDistanceToNow } from "date-fns";
import { GET_CURRENT_USER_CLUB_DETAILS } from "@/graphql/query/clubs";
import { Loading } from "@/components/skeleton";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { SUBMIT_POINTS } from "@/graphql/mutation/points";
import { ViewResultModal } from "../view_result_modal";
import { LogHistoryModal } from "../log_history_modal";
import { toast } from "sonner";
import { useTab } from "@/context/tab_context";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Result } from "../view_result_modal";
import { formatDistance, getLocalStorageItem, setLocalStorageItem, formatDate } from "./utils";

// Define types
interface Dog {
  driverName: string;
  name: string;
  NZFSSRegistration: string;
  dob: string;
  breed: string;
}

interface Driver {
  name: string;
  dogs: string[];
  raceTime?: string;
  raceStatus: "Started" | "Did not start" | "Did not qualify";
}

interface Entrant {
  _id: string;
  name: string;
  raceFormat: string;
  class: string;
  customClass: string;
  associatedDog: Dog[];
  drivers: Driver[];
  raceType: "musher" | "harness" | "weightpull" | "started";
  startTime: string;
  time?: string;
  userId: string;
  eventId: string;
  temperature?: string;
  distance?: string;
  createdAt: string;
  raceTime?: string;
}

interface Event {
  _id: string;
  eventName: string;
  eventDate: string;
  club: string;
  clubId: string;
  region: string;
}

// Define local formatDistance function
const formatDistance = (distance: string): string => {
  if (!distance) return "-";
  const distanceNum = parseFloat(distance);
  if (isNaN(distanceNum)) return distance;
  return distanceNum < 1 
    ? `${(distanceNum * 1000).toFixed(0)}m` 
    : `${distanceNum.toFixed(1)}km`;
};

/**
 * SavedResultsContent component that handles the main functionality
 * This component contains all the business logic and UI for saved results
 */
export const SavedResultsContent: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isClient, setIsClient] = useState(false);

  // Add client-side check
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Add error boundary state
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Wrap GraphQL queries in error boundary
  const { loading: resultsLoading, error: resultsError, data: resultsData } = useQuery(GET_SAVED_RESULTS, {
    fetchPolicy: "network-only",
    onError: (error) => {
      console.error("Error fetching results:", error);
      setHasError(true);
      setErrorMessage(error.message);
    }
  });

  const { loading: eventsLoading, error: eventsError, data: eventsData, refetch: refetchEvents } = useQuery(GET_ALL_EVENTS, {
    fetchPolicy: "network-only",
    onError: (error) => {
      console.error("Error fetching events:", error);
      setHasError(true);
      setErrorMessage(error.message);
    }
  });

  const { loading: clubLoading, error: clubError, data: clubData } = useQuery(GET_CURRENT_USER_CLUB_DETAILS, {
    fetchPolicy: "network-only",
    onError: (error) => {
      console.error("Error fetching club details:", error);
      setHasError(true);
      setErrorMessage(error.message);
    }
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [filteredResults, setFilteredResults] = useState<EntrantType[]>([]);
  const [eventMap, setEventMap] = useState<Record<string, EventType>>({});
  const [selectedEntrant, setSelectedEntrant] = useState<EntrantType | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLogHistoryModalOpen, setIsLogHistoryModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { setActiveTab, setActiveTabEvents } = useTab();
  const [retryCount, setRetryCount] = useState(0);
  const [deleteEntrantId, setDeleteEntrantId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [areEventsLoaded, setAreEventsLoaded] = useState(false);

  const [deleteEntrant] = useMutation(DELETE_ENTRANT, {
    refetchQueries: [{ query: GET_SAVED_RESULTS }],
  });

  const [submitPoints] = useMutation(SUBMIT_POINTS, {
    refetchQueries: [{ query: GET_SAVED_RESULTS }],
  });

  // Create a mapping from event ID to event object
  useEffect(() => {
    if (eventsData?.getAllEvents) {
      console.log("Events data received:", eventsData.getAllEvents.length, "events");
      
      const map: Record<string, EventType> = {};
      eventsData.getAllEvents.forEach((event: EventType) => {
        if (event._id) {
          map[event._id] = event;
        }
      });
      setEventMap(map);
      setAreEventsLoaded(true);
      console.log("Event map created with", Object.keys(map).length, "events");
      
      // Debug missing events
      if (resultsData?.getAllEntrants) {
        const entrantEventIds = [...new Set(resultsData.getAllEntrants.map((entrant: any) => entrant.eventId))];
        console.log("Entrant event IDs:", entrantEventIds);
        
        const missingEvents = entrantEventIds.filter(id => !map[id as keyof typeof map]);
        if (missingEvents.length > 0) {
          console.warn("Missing events in map:", missingEvents);
          
          // If we have missing events and haven't exceeded retry count, try to refetch events
          if (retryCount < 2) {
            console.log(`Retrying events fetch (attempt ${retryCount + 1})...`);
            setTimeout(() => {
              refetchEvents();
              setRetryCount(prevCount => prevCount + 1);
            }, 1000); // Wait 1 second before retrying
          }
        } else {
          console.log("All entrant events are in the event map");
        }
      }
    }
  }, [eventsData, resultsData, retryCount, refetchEvents]);

  // Update nonSubmittedResults to use safe localStorage access
  const nonSubmittedResults = useMemo(() => {
    if (!resultsData?.getAllEntrants) return [];

    let submittedIds: string[] = [];
    try {
      const storedIds = getLocalStorageItem('submittedResultIds');
      submittedIds = storedIds ? JSON.parse(storedIds) : [];
    } catch (e) {
      console.error("Error retrieving submitted results from localStorage:", e);
    }

    return resultsData.getAllEntrants.filter(
      (entrant: any) => !submittedIds.includes(entrant._id)
    );
  }, [resultsData, isClient]);

  useEffect(() => {
    if (resultsData?.getAllEntrants) {
      // Filter results by the user's club
      const userClubId = clubData?.getCurrentUserClubDetails?._id;
      console.log("User's club ID:", userClubId);
      console.log("All events:", eventsData?.getAllEvents);
      
      // Debug the actual event IDs from the entrants data
      const entrantEventIds = [...new Set(nonSubmittedResults.map((entrant: EntrantType) => entrant.eventId))];
      console.log("Event IDs from entrants:", entrantEventIds);
      console.log("Events in map:", Object.keys(eventMap));
      console.log("Missing events:", entrantEventIds.filter(id => !eventMap[id as keyof typeof eventMap]));
      
      let filteredByClub = nonSubmittedResults;
      
      if (userClubId) {
        // First, get all event IDs that belong to the user's club
        const userClubEventIds = eventsData?.getAllEvents
          ?.filter((event: EventType) => event.clubId === userClubId)
          ?.map((event: EventType) => event._id) || [];
        
        console.log("User's club event IDs:", userClubEventIds);
        
        // Then filter entrants to only those from the user's club events
        filteredByClub = nonSubmittedResults.filter((entrant: EntrantType) => {
          const belongsToUserClub = userClubEventIds.includes(entrant.eventId);
          console.log(`Entrant ${entrant._id} event ${entrant.eventId} belongs to user's club:`, belongsToUserClub);
          return belongsToUserClub;
        });
        
        console.log("Filtered results count:", filteredByClub.length);
      }

      // If there's a search term, filter results further
      if (searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase();
        setFilteredResults(
          filteredByClub.filter((entrant: EntrantType) => 
            entrant.name.toLowerCase().includes(searchLower) ||
            entrant.class.toLowerCase().includes(searchLower) ||
            entrant.customClass.toLowerCase().includes(searchLower) ||
            entrant.raceType.toLowerCase().includes(searchLower) ||
            (entrant.associatedDog && entrant.associatedDog.some(dog => 
              dog.name.toLowerCase().includes(searchLower) ||
              dog.breed.toLowerCase().includes(searchLower)
            )) ||
            // Also search by event name if available
            (eventMap[entrant.eventId] && 
             eventMap[entrant.eventId].eventName.toLowerCase().includes(searchLower))
          )
        );
      } else {
        // Otherwise, use all results filtered by club
        setFilteredResults(filteredByClub);
      }
    }
  }, [nonSubmittedResults, searchTerm, eventMap, clubData, eventsData]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleAddNewResult = () => {
    router.push("/events?tab=1");
  };

  const handleEdit = (entrant: EntrantType) => {
    setSelectedEntrant(entrant);
    setIsEditModalOpen(true);
  };

  // Helper function to convert Entrant type to Result type for ViewResultModal
  const adaptEntrantToResult = (entrant: EntrantType): Result => {
    return {
      ...entrant,
      drivers: entrant.drivers?.map(driver => ({
        ...driver,
        dogs: Array.isArray(driver.dogs) 
          ? driver.dogs.map(dogName => {
              // Find the matching dog in associatedDog array
              const dogObj = entrant.associatedDog?.find(d => d.name === dogName);
              return {
                id: dogObj?.NZFSSRegistration || `dog-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                name: dogName,
                NZFSSRegistration: dogObj?.NZFSSRegistration || "",
                dob: dogObj?.dob || "",
                breed: dogObj?.breed || "",
                driverName: driver.name
              };
            })
          : []
      }))
    };
  };

  // Helper function to convert Result type back to Entrant type
  const adaptResultToEntrant = (result: Result, originalEntrant: EntrantType): EntrantType => {
    return {
      ...originalEntrant,
      ...result,
      raceType: result.raceType as "musher" | "harness" | "weightpull" | "started", // Cast to correct type
      drivers: result.drivers?.map((driver: { name: string; dogs: { name: string }[]; raceTime?: string | null; raceStatus: string }) => ({
        ...driver,
        dogs: driver.dogs.map((dog: { name: string }) => dog.name), // Convert back to string array
        raceTime: driver.raceTime || undefined, // Convert null to undefined
        raceStatus: driver.raceStatus as "Started" | "Did not start" | "Did not qualify" // Cast to correct type
      })) || [] // Provide empty array as fallback
    };
  };

  const handleDelete = async (entrantId: string) => {
    setDeleteEntrantId(entrantId);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!deleteEntrantId) return;
    
    try {
      await deleteEntrant({
        variables: { entrantId: deleteEntrantId },
      });
      toast.success("Result deleted successfully");
      
      // Force a refetch to update the pill count
      // This will trigger useEffect in the Tab component to recalculate counts
      if (resultsData && typeof resultsData.refetch === 'function') {
        await resultsData.refetch();
      }
    } catch (error) {
      console.error("Error deleting entrant:", error);
      toast.error("Failed to delete result");
    } finally {
      setShowDeleteDialog(false);
      setDeleteEntrantId(null);
    }
  };

  const handleLogHistory = (entrant: EntrantType) => {
    setSelectedEntrant(entrant);
    setIsLogHistoryModalOpen(true);
  };

  const getRaceTime = (entrant: EntrantType): string | undefined => {
    // First check if there are drivers with race times
    if (entrant.drivers && entrant.drivers.length > 0) {
      // Get all valid race times from drivers with "Started" status
      const validTimes = entrant.drivers
        .filter(d => d.raceStatus === "Started" && d.raceTime && /^\d{2}:\d{2}:\d{2}(\.\d+)?$/.test(d.raceTime))
        .map(d => d.raceTime as string);

      if (validTimes.length > 0) {
        // Convert times to seconds and sum them
        const totalSeconds = validTimes.reduce((acc, time) => {
          const [hours, minutes, seconds] = time.split(':').map(Number);
          return acc + (hours * 3600) + (minutes * 60) + seconds;
        }, 0);

        // Convert back to HH:MM:SS format
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = Math.floor(totalSeconds % 60);
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      }
    }

    // Fallback to entrant's direct time or raceTime
    return entrant.time || entrant.raceTime;
  };

  const calculatePoints = (entrant: EntrantType, allEntrantsInClass: EntrantType[]): { points: number; cutoffTime: string } => {
    const dogPoints = entrant.dogs?.map((dog: { name: string; points: number }) => ({
      name: dog.name,
      points: dog.points
    })) || [];
    return { points: 0, cutoffTime: "" };
  };

  const calculateDogPoints = (entrant: EntrantType, allEntrantsInClass: EntrantType[]): Record<string, number> => {
    const driverPoints = entrant.drivers?.map((driver: { name: string; points: number }) => ({
      name: driver.name,
      points: driver.points
    })) || [];
    const dogPoints = entrant.dogs?.map((dogName: string) => {
      const dog = entrant.dogs?.find((d: { name: string }) => d.name === dogName);
      return {
        name: dogName,
        points: dog?.points || 0
      };
    }) || [];
    const sortedDrivers = [...allEntrantsInClass].sort((d1: EntrantType, d2: EntrantType) => {
      // ... existing code ...
    });
    const sortedDogs = [...dogPoints].sort((d1: { name: string; points: number }, d2: { name: string; points: number }) => {
      // ... existing code ...
    });
    const dogPointsMap = sortedDogs.reduce((acc: Record<string, number>, dog: { name: string; points: number }) => {
      // ... existing code ...
    }, {});
    return dogPointsMap;
  };

  const handleSubmitPoints = async () => {
    // ... rest of the handleSubmitPoints implementation ...
  };

  // Add error boundary UI
  if (hasError) {
    return (
      <div className="h-[60vh] w-full flex flex-col justify-center items-center">
        <div className="text-destructive mb-4">An error occurred while loading the data</div>
        <div className="text-sm text-gray-600 mb-4">{errorMessage}</div>
        <Button 
          onClick={() => {
            setHasError(false);
            setErrorMessage(null);
            window.location.reload();
          }}
          className="bg-black text-white hover:bg-gray-800"
        >
          Retry
        </Button>
      </div>
    );
  }

  if (resultsLoading || eventsLoading || clubLoading) return <Loading />;

  // Add additional loading state for event data synchronization
  if (!areEventsLoaded && Object.keys(eventMap).length === 0) {
    return (
      <div className="h-[60vh] w-full flex justify-center items-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900 mr-3"></div>
        <div>Synchronizing event data...</div>
      </div>
    );
  }

  if (resultsError) {
    return (
      <div className="h-[60vh] w-full flex justify-center items-center">
        <div className="text-destructive">Error loading results: {resultsError.message}</div>
      </div>
    );
  }

  if (eventsError) {
    return (
      <div className="h-[60vh] w-full flex justify-center items-center">
        <div className="text-destructive">Error loading events: {eventsError.message}</div>
      </div>
    );
  }

  if (clubError) {
    return (
      <div className="h-[60vh] w-full flex justify-center items-center">
        <div className="text-destructive">Error loading club details: {clubError.message}</div>
      </div>
    );
  }

  return (
    <div className="px-6 mt-4 min-h-screen pb-6">
      {/* ... rest of the JSX implementation ... */}
    </div>
  );
}; 
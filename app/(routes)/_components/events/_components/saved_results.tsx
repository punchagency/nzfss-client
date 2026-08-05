"use client";

import React, { useState, useEffect, Suspense, useMemo } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { GET_ALL_RESULTS } from "@/graphql/query/addResult";
import { GET_ALL_EVENTS } from "@/graphql/query/event";
import { GET_CURRENT_USER_CLUB_DETAILS } from "@/graphql/query/clubs";
import { GET_SAVED_RESULTS_POINTS, GET_ALL_POINTS } from "@/graphql/query/points";
import { Loading } from "@/components/skeleton";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { DELETE_ENTRANT } from "@/graphql/mutation/addResult";
import { SUBMIT_POINTS } from "@/graphql/mutation/points";
import { ViewResultModal } from "./view_result_modal";
import { LogHistoryModal } from "./log_history_modal";
import { toast } from "sonner";
import { useTab } from "@/context/tab_context";
import { classEarnsPoints } from "@/lib/class-eligibility";
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
import type { Result } from "./view_result_modal";

// Define local formatDistance function
const formatDistance = (distance: string, isWeightpull: boolean = false): string => {
  if (!distance) return "-";
  const distanceNum = parseFloat(distance);
  if (isNaN(distanceNum)) return distance;
  
  // For weightpull events, always show in meters
  if (isWeightpull) {
    return `${(distanceNum * 1000).toFixed(0)}m`;
  }
  
  // For other events, keep original format
  return distanceNum < 1 
    ? `${(distanceNum * 1111.95).toFixed(0)}m` 
    : `${distanceNum.toFixed(1)}km`;
};

// Define type for Entrant from GraphQL response
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

// Define a single HeatData interface at the top level
interface HeatData {
  heat: string;
  temperature: string;
  distance: string;
  class: string;  // Make class required to match schema
  __typename?: string;
}

interface Entrant {
  _id: string;
  id: string;
  name: string;
  raceFormat: string;
  class: string;
  classId: string;
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
  heat?: string; // Individual heat identifier (e.g., "Heat 1", "Heat 2")
  createdAt: string;
  raceTime?: string;
  weightPulled?: string;
  dogWeight?: string;
  heatsData?: HeatData[];
  pointsSubmitted?: boolean; // Add this field to track submission status
}

interface Event {
  _id: string;
  eventName: string;
  eventDate: string;
  club: string;
  clubId: string;
  region: string;
  type: "weightpull" | "speed" | "freight" | "snow";
  classes: Array<{ id: string; name: string }>;
}

// Define the points data type using the same HeatData interface
interface PointsData {
  entrantId: string;
  points: number;
  cutoffTime: string;
  dogPoints: Array<{
    NZFSSRegistration: string;
    points: number;
  }>;
  heatsData: HeatData[];
}

// Create a client component for the content that uses useSearchParams
const SavedResultsContent: React.FC = (): JSX.Element => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isClient, setIsClient] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredResults, setFilteredResults] = useState<Entrant[]>([]);
  const [eventMap, setEventMap] = useState<Record<string, Event>>({});
  const [selectedEntrant, setSelectedEntrant] = useState<Entrant | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLogHistoryModalOpen, setIsLogHistoryModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { setActiveTab, setActiveTabEvents } = useTab();
  const [retryCount, setRetryCount] = useState(0);
  const [deleteEntrantId, setDeleteEntrantId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showSubmittedEntrants, setShowSubmittedEntrants] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);

  // Add client-side check
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Close year dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (isYearDropdownOpen && !target.closest('.year-dropdown')) {
        setIsYearDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isYearDropdownOpen]);

  // Wrap GraphQL queries in error boundary
  const { loading: resultsLoading, error: resultsError, data: resultsData, refetch: refetchResults } = useQuery(GET_ALL_RESULTS, {
    fetchPolicy: "cache-and-network",
    notifyOnNetworkStatusChange: true,
    onError: (error) => {
      console.error("Error fetching results:", error);
      setHasError(true);
      setErrorMessage(error.message);
    }
  });

  const { loading: eventsLoading, error: eventsError, data: eventsData, refetch: refetchEvents } = useQuery(GET_ALL_EVENTS, {
    fetchPolicy: "cache-and-network",
    notifyOnNetworkStatusChange: true,
    onError: (error) => {
      console.error("Error fetching events:", error);
      setHasError(true);
      setErrorMessage(error.message);
    }
  });

  const { loading: clubLoading, error: clubError, data: clubData, refetch: refetchClub } = useQuery(GET_CURRENT_USER_CLUB_DETAILS, {
    fetchPolicy: "cache-and-network",
    notifyOnNetworkStatusChange: true,
    onError: (error) => {
      console.error("Error fetching club details:", error);
      setHasError(true);
      setErrorMessage(error.message);
    }
  });

  const { loading: pointsLoading, error: pointsError, data: pointsData, refetch: refetchPoints } = useQuery(GET_SAVED_RESULTS_POINTS, {
    fetchPolicy: "cache-and-network",
    notifyOnNetworkStatusChange: true,
    onError: (error) => {
      console.error("Error fetching points:", error);
      setHasError(true);
      setErrorMessage(error.message);
    }
  });

  // Add effect to refetch data when component mounts or becomes visible
  useEffect(() => {
    const refetchAllData = async () => {
      try {
        await Promise.all([
          refetchResults(),
          refetchEvents(),
          refetchClub(),
          refetchPoints()
        ]);
      } catch (error) {
        console.error("Error refetching data:", error);
      }
    };

    // Refetch when component mounts
    if (isClient) {
      refetchAllData();
    }

    // Also refetch when the page becomes visible (user switches back to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden && isClient) {
        refetchAllData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isClient, refetchResults, refetchEvents, refetchClub, refetchPoints]);

  // Safe localStorage access (kept for compatibility but no longer used for submission tracking)
  const getLocalStorageItem = (key: string): string | null => {
    if (!isClient) return null;
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error("Error accessing localStorage:", error);
      return null;
    }
  };

  const setLocalStorageItem = (key: string, value: string): void => {
    if (!isClient) return;
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error("Error setting localStorage:", error);
    }
  };

  const [deleteEntrant] = useMutation(DELETE_ENTRANT, {
    refetchQueries: [{ query: GET_ALL_RESULTS }],
  });

  const [submitPoints] = useMutation(SUBMIT_POINTS, {
    refetchQueries: [
      { query: GET_ALL_RESULTS },
      { query: GET_ALL_POINTS }
    ],
    onCompleted: (data) => {
      console.log('SUBMIT_POINTS mutation completed:', data);
      if (data?.submitPoints?.points) {
        console.log('Submitted points with heatsData:', data.submitPoints.points.map((p: any) => ({
          entrantId: p.entrantId,
          heatsDataLength: p.heatsData?.length || 0,
          heatsData: p.heatsData
        })));
      }
    },
    onError: (error) => {
      console.error('SUBMIT_POINTS mutation error:', error);
    }
  });

  // Create a mapping from event ID to event object
  useEffect(() => {
    if (eventsData?.getAllEvents) {
      const map: Record<string, Event> = {};
      eventsData.getAllEvents.forEach((event: Event) => {
        if (event._id) {
          map[event._id] = event;
        }
      });
      setEventMap(map);
      
      // Debug missing events
      if (resultsData?.getAllEntrants) {
        const entrantEventIds = [...new Set(resultsData.getAllEntrants.map((entrant: any) => entrant.eventId))];
        
        const missingEvents = entrantEventIds.filter(id => !map[id as keyof typeof map]);
        if (missingEvents.length > 0) {
          console.warn("Missing events in map:", missingEvents);
          
          // If we have missing events and haven't exceeded retry count, try to refetch events
          if (retryCount < 2) {
            setTimeout(() => {
              refetchEvents();
              setRetryCount(prevCount => prevCount + 1);
            }, 1000); // Wait 1 second before retrying
          }
        }
      }
    }
  }, [eventsData, resultsData, retryCount, refetchEvents]);

  // Get available years from events
  const availableYears = useMemo(() => {
    if (!eventsData?.getAllEvents) return [];
    
    const years = eventsData.getAllEvents
      .map((event: Event) => {
        if (event.eventDate) {
          return new Date(event.eventDate).getFullYear().toString();
        }
        return null;
      })
      .filter((year: string | null): year is string => year !== null);
    
    // Manually deduplicate and sort
    const uniqueYearSet = new Set<string>(years);
    const uniqueYears = Array.from(uniqueYearSet).sort((a, b) => parseInt(b) - parseInt(a));
    return uniqueYears;
  }, [eventsData]);

  // Filter out entrants that already have points submitted (unless user wants to see them)
  const availableResults = useMemo(() => {
    // Don't show any results while data is loading or if either dataset is missing
    if (!resultsData?.getAllEntrants || 
        resultsLoading || pointsLoading || 
        (!showSubmittedEntrants && !pointsData?.getAllPoints)) {
      return [];
    }

    // Get all entrant IDs that already have points submitted
    const submittedEntrantIds = new Set(
      pointsData?.getAllPoints?.map((point: any) => point.entrantId) || []
    );

    // Optional: Debug availableResults calculation if needed
    // console.log('availableResults calculation:', { showSubmittedEntrants, totalEntrants: resultsData.getAllEntrants.length });

    if (showSubmittedEntrants) {
      // Show ALL entrants (both submitted and non-submitted)
      return resultsData.getAllEntrants;
    } else {
      // Filter out entrants that already have points (default behavior)
      return resultsData.getAllEntrants.filter((entrant: any) => {
        const hasPoints = submittedEntrantIds.has(entrant._id);
        return !hasPoints;
      });
    }
  }, [resultsData, pointsData, showSubmittedEntrants, resultsLoading, pointsLoading]);

  // Debug effect to track changes in availableResults
  useEffect(() => {
    console.log('availableResults changed:', {
      length: availableResults.length,
      showSubmittedEntrants,
      hasResultsData: !!resultsData?.getAllEntrants,
      hasPointsData: !!pointsData?.getAllPoints,
      resultsLoading,
      pointsLoading,
      firstFewEntrants: availableResults.slice(0, 3).map((e: Entrant) => ({
        id: e._id,
        name: e.name,
        hasHeatsData: !!(e.heatsData && e.heatsData.length > 0)
      }))
    });
  }, [availableResults, showSubmittedEntrants, resultsData, pointsData, resultsLoading, pointsLoading]);

  useEffect(() => {
    if (resultsData?.getAllEntrants) {
      // Filter results by the user's club
      const userClubId = clubData?.getCurrentUserClubDetails?._id;
      
      let filteredByClub = availableResults;
      
      if (userClubId) {
        // First, get all event IDs that belong to the user's club
        const userClubEventIds = eventsData?.getAllEvents
          ?.filter((event: Event) => event.clubId === userClubId)
          ?.map((event: Event) => event._id) || [];
        
        // Then filter entrants to only those from the user's club events
        filteredByClub = availableResults.filter((entrant: Entrant) => {
          const belongsToUserClub = userClubEventIds.includes(entrant.eventId);
          return belongsToUserClub;
        });
      }

      // Filter by year if a specific year is selected
      if (selectedYear !== "all") {
        filteredByClub = filteredByClub.filter((entrant: Entrant) => {
          const event = eventMap[entrant.eventId];
          if (event && event.eventDate) {
            const eventYear = new Date(event.eventDate).getFullYear().toString();
            return eventYear === selectedYear;
          }
          return false;
        });
      }

      // If there's a search term, filter results further
      if (searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase();
        setFilteredResults(
          filteredByClub.filter((entrant: Entrant) => 
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
        // Otherwise, use all results filtered by club and year
        setFilteredResults(filteredByClub);
      }
    }
  }, [availableResults, searchTerm, selectedYear, eventMap, clubData, eventsData]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleAddNewResult = () => {
    router.push("/events?tab=1");
  };

  const handleEdit = (entrant: Entrant, isEventEdit: boolean = false) => {
    if (isEventEdit) {
      // Get all entrants for this event
      const eventEntrants = Object.values(resultsByEventAndClass[entrant.eventId] || {})
        .flat()
        .map(e => adaptEntrantToResult(e));
      setSelectedEntrant(entrant);
      setIsEditModalOpen(true);
      return;
    }
    setSelectedEntrant(entrant);
    setIsEditModalOpen(true);
  };

  // Helper function to convert Entrant type to Result type for ViewResultModal
  const adaptEntrantToResult = (entrant: Entrant): Result => {
    return {
      ...entrant,
      drivers: entrant.drivers?.map(driver => ({
        ...driver,
        // Map the raceStatus to the correct type
        raceStatus: driver.raceStatus === "Did not qualify" ? "Disqualified" 
                   : (driver.raceStatus as "Started" | "Did not start" | "Did not finish" | "Disqualified"),
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
  const adaptResultToEntrant = (result: Result, originalEntrant: Entrant): Entrant => {
    // Ensure heatsData has required class property
    const heatsData = result.heatsData?.map(heat => ({
      ...heat,
      class: heat.class || `${result.class}${result.customClass ? `:${result.customClass}` : ''}`
    })) || [];

    return {
      ...originalEntrant,
      ...result,
      raceType: result.raceType as "musher" | "harness" | "weightpull" | "started",
      drivers: result.drivers?.map(driver => ({
        ...driver,
        dogs: driver.dogs.map(dog => dog.name),
        raceTime: driver.raceTime || undefined,
        raceStatus: driver.raceStatus as "Started" | "Did not start" | "Did not qualify"
      })) || [],
      heatsData // Use the processed heatsData
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

  const handleLogHistory = (entrant: Entrant) => {
    setSelectedEntrant(entrant);
    setIsLogHistoryModalOpen(true);
  };

  const getRaceTime = (entrant: Entrant): string | undefined => {
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

  // Add helper function for time conversion
  const timeToSeconds = (timeStr: string): number => {
    if (!timeStr) return Number.MAX_VALUE;
    
    const [hoursStr, minutesStr, secondsWithMs] = timeStr.split(':');
    const hours = parseInt(hoursStr || '0', 10);
    const minutes = parseInt(minutesStr || '0', 10);
    
    let seconds = 0;
    let milliseconds = 0;
    
    if (secondsWithMs) {
      if (secondsWithMs.includes('.')) {
        const [secondsStr, millisecondsStr] = secondsWithMs.split('.');
        seconds = parseInt(secondsStr || '0', 10);
        milliseconds = parseInt(millisecondsStr || '0', 10) / Math.pow(10, millisecondsStr.length);
      } else {
        seconds = parseInt(secondsWithMs || '0', 10);
      }
    }
    
    const totalSeconds = (hours * 3600) + (minutes * 60) + seconds + milliseconds;
    return totalSeconds;
  };

  // Class eligibility lives in @/lib/class-eligibility so the results screen and
  // the musher ranking page cannot drift apart.

  // Modify the calculatePoints function to use Annual Musher System for musher points and Championship Harness Dog System for dog points
  const calculatePoints = (entrant: Entrant, allEntrantsInClass: Entrant[]): { 
    points: number; 
    cutoffTime: string; 
    dogPoints: Record<string, number>;
  } => {
    // Custom classes sit outside the race regulations, and Bikejoring/Canicross
    // are approved classes that still never score. Neither earns musher or dog points.
    if (!classEarnsPoints(entrant)) {
      return { points: 0, cutoffTime: '', dogPoints: {} };
    }

    const isWeightpullEvent = 
      entrant.raceType === 'weightpull' || 
      entrant.class?.toLowerCase().includes('weight') ||
      entrant.class?.toLowerCase().includes('pull') ||
      entrant.customClass?.toLowerCase().includes('weight') ||
      entrant.customClass?.toLowerCase().includes('pull');

    // A musher is registered unless their name indicates they are unregistered
    // Non-registered mushers get 0 points but are still counted in ranking calculations
    const isRegisteredMusher = !entrant.name.toLowerCase().includes('unregistered') && 
                              !entrant.name.toLowerCase().includes('non-registered') &&
                              !entrant.name.toLowerCase().includes('nonregistered');

    // Check if this is a junior class (no points for junior classes)
    const isJuniorClass = 
      entrant.class?.toLowerCase().includes('junior') ||
      entrant.customClass?.toLowerCase().includes('junior');

    if (isJuniorClass) {
      return { points: 0, cutoffTime: '', dogPoints: {} };
    }

    // Check if team is disqualified
    const isDisqualified = entrant.drivers?.some(driver => 
      driver.raceStatus === "Did not qualify" || 
      driver.raceStatus === "Did not start"
    );

    if (isDisqualified) {
      return { points: 0, cutoffTime: '', dogPoints: {} };
    }

    if (isWeightpullEvent) {
      // For weightpull events, calculate musher points based on rank within class
      const weightPulled = parseFloat(entrant.weightPulled || '0');
      const raceTime = getRaceTime(entrant);
      
      if (isNaN(weightPulled) || weightPulled <= 0) {
        return { points: 0, cutoffTime: '', dogPoints: {} };
      }

      // Get all valid weights and sort them - WITHIN CLASS ONLY
      // Sort by weight pulled (highest first), then by time (fastest first) for tiebreakers
      const validEntrants = allEntrantsInClass.filter((e: Entrant) => {
        const weight = parseFloat(e.weightPulled || '0');
        return !isNaN(weight) && weight > 0;
      }).map(e => ({
        id: e._id,
        name: e.name,
        weightPulled: parseFloat(e.weightPulled || '0'),
        time: getRaceTime(e) ? timeToSeconds(getRaceTime(e) || '') : Number.MAX_VALUE,
        isRegistered: Array.isArray(e.associatedDog) && e.associatedDog.some(dog =>
          dog.NZFSSRegistration &&
          dog.NZFSSRegistration.trim() !== '' &&
          dog.NZFSSRegistration.toLowerCase() !== 'unknown'
        )
      })).sort((a, b) => {
        // First sort by weight pulled (highest first)
        if (Math.abs(b.weightPulled - a.weightPulled) < 0.001) {
          // If weights are equal, sort by time (faster time wins in weightpull)
          if (a.time === Number.MAX_VALUE && b.time === Number.MAX_VALUE) {
            // For tied entries with no times, maintain consistent order but they'll get same rank
            return a.id.localeCompare(b.id); // Stable sort by ID if no times
          }
          if (a.time === Number.MAX_VALUE) return 1; // No time goes after those with times
          if (b.time === Number.MAX_VALUE) return -1; // No time goes after those with times
          return a.time - b.time; // Faster (lower) time wins in weightpull
        }
        return b.weightPulled - a.weightPulled;
      });

      if (validEntrants.length < 1) {
        return { points: 0, cutoffTime: '', dogPoints: {} };
      }

      const entrantPosition = validEntrants.findIndex(e => e.id === entrant._id);

      if (entrantPosition === -1) {
        return { points: 0, cutoffTime: '', dogPoints: {} };
      }

      // Calculate actual rank considering ties
      // Find how many entrants have better performance (higher weight or faster time for same weight)
      const currentEntrant = validEntrants[entrantPosition];
      const betterEntrants = validEntrants.filter((e: any) => {
        if (Math.abs(e.weightPulled - currentEntrant.weightPulled) > 0.001) {
          return e.weightPulled > currentEntrant.weightPulled; // Higher weight is better
        }
        // Same weight - check times only if at least one has time data
        if (currentEntrant.time === Number.MAX_VALUE && e.time === Number.MAX_VALUE) {
          return false; // Both have no time, they're tied (same rank)
        }
        if (currentEntrant.time === Number.MAX_VALUE && e.time !== Number.MAX_VALUE) {
          return true; // Other has time, current doesn't - other is better
        }
        if (e.time === Number.MAX_VALUE && currentEntrant.time !== Number.MAX_VALUE) {
          return false; // Current has time, other doesn't - current is better
        }
        // Both have times - faster time is better
        return e.time < currentEntrant.time;
      });

      const actualRank = betterEntrants.length + 1;

      // Musher points based on actual rank within class
      // Points = total valid entrants in class - rank + 1
      const calculatedPoints = validEntrants.length - actualRank + 1;
      const points = isRegisteredMusher ? calculatedPoints : 0;

      return { points, cutoffTime: '', dogPoints: {} };
    }

    // For normal races (speed, freight, snow), calculate both musher and dog points
    // Get and validate race time
    const raceTime = getRaceTime(entrant);
    
    if (!raceTime || !/^\d{2}:\d{2}:\d{2}(\.\d+)?$/.test(raceTime)) {
      return { points: 0, cutoffTime: '', dogPoints: {} };
    }

    // Get valid entrants (those with proper race times and valid status)
    const validEntrants = allEntrantsInClass.filter((e: Entrant) => {
      const entrantTime = getRaceTime(e);
      const hasValidStatus = !e.drivers?.some(driver => 
        driver.raceStatus === "Did not start" || 
        driver.raceStatus === "Did not qualify"
      );
      return entrantTime && 
             /^\d{2}:\d{2}:\d{2}(\.\d+)?$/.test(entrantTime) && 
             hasValidStatus;
    });

    if (validEntrants.length < 1) {
      return { points: 0, cutoffTime: '', dogPoints: {} };
    }

    // Sort entrants by time (lower time first for races) with consistent tie-breaking
    const sortedEntrants = [...validEntrants].sort((a, b) => {
      const timeA = timeToSeconds(getRaceTime(a) || '');
      const timeB = timeToSeconds(getRaceTime(b) || '');
      
      if (timeA !== timeB) {
        return timeA - timeB;
      }
      return a._id.localeCompare(b._id);
    });

    // Find current entrant's position in sorted array
    const entrantPosition = sortedEntrants.findIndex(e => e._id === entrant._id);

    if (entrantPosition === -1) {
      return { points: 0, cutoffTime: '', dogPoints: {} };
    }

    // Calculate actual rank considering ties
    // Find how many entrants have better times (faster times)
    const currentEntrantTime = timeToSeconds(getRaceTime(entrant) || '');
    const betterEntrants = validEntrants.filter((e: Entrant) => {
      const entrantTime = timeToSeconds(getRaceTime(e) || '');
      return entrantTime < currentEntrantTime;
    });

    const actualRank = betterEntrants.length + 1;

    // Calculate musher points using Annual Musher System based on actual rank
    const calculatedPoints = Math.max(1, sortedEntrants.length - actualRank + 1);
    const points = isRegisteredMusher ? calculatedPoints : 0;

    // Calculate cutoff time for dog points (winning time * 1.25)
    const winningTime = timeToSeconds(getRaceTime(sortedEntrants[0]) || '');
    const cutoffTimeSeconds = winningTime * 1.25;
    const cutoffTime = new Date(cutoffTimeSeconds * 1000).toISOString().substr(11, 8);

    // Calculate dog points using Championship Harness Dog System
    const dogPoints: Record<string, number> = {};
    
    // Check if entrant has associated dogs
    if (entrant.associatedDog && Array.isArray(entrant.associatedDog)) {
      const entrantTimeSeconds = timeToSeconds(raceTime);
      const isWithinCutoff = entrantTimeSeconds <= cutoffTimeSeconds;

      // Process each dog
      for (const dog of entrant.associatedDog) {
        const isRegisteredDog = dog.NZFSSRegistration && 
                               dog.NZFSSRegistration.trim() !== '' && 
                               dog.NZFSSRegistration.toLowerCase() !== 'unknown';
        
        // Calculate points based on position and cutoff time for registered dogs only
        let dogPointValue: number = 0;

        if (isRegisteredDog) {
          if (entrantPosition === 0) {
            // First place gets 10 points
            dogPointValue = 10;
          } else if (isWithinCutoff) {
            // Calculate points for teams within cutoff time
            const timeDiff = cutoffTimeSeconds - entrantTimeSeconds;
            const winningTimeDiff = cutoffTimeSeconds - winningTime;
            const rawPoints = (timeDiff / winningTimeDiff) * 10;
            
            // Round to nearest 0.5 and ensure minimum of 1 point
            dogPointValue = Math.max(1, Math.round(rawPoints * 2) / 2);
          } else {
            // Teams outside cutoff time get 1 point
            dogPointValue = 1;
          }
        }

        // Store the calculated points (use dog name as key if no registration)
        const dogKey = dog.NZFSSRegistration || dog.name;
        dogPoints[dogKey] = dogPointValue;
      }
    }

    return { points, cutoffTime, dogPoints };
  };

  // Calculate weightpull dog points using the correct Championship Weightpull Dog System
  // Dog points are calculated ACROSS ALL CLASSES (as per user specification)
  // Musher ranking is per class, but dog points competition is across all classes
  const calculateWeightpullPoints = (
    entrant: Entrant,
    allWeightpullEntrants: Entrant[] // All weightpull entrants across all classes
  ): { dogPoints: Record<string, number> } => {
    // No points for custom classes, nor for approved-but-non-scoring classes.
    if (!classEarnsPoints(entrant)) {
      return { dogPoints: {} };
    }

    const isWeightpullEvent = 
      entrant.raceType === 'weightpull' || 
      entrant.class?.toLowerCase().includes('weight') ||
      entrant.class?.toLowerCase().includes('pull') ||
      entrant.customClass?.toLowerCase().includes('weight') ||
      entrant.customClass?.toLowerCase().includes('pull');

    if (!isWeightpullEvent) {
      return { dogPoints: {} };
    }

    // Extract weight pulled and dog weight
    const weightPulled = parseFloat(entrant.weightPulled || '0');
    const dogWeight = parseFloat(entrant.dogWeight || '0');
    
    if (isNaN(weightPulled) || isNaN(dogWeight) || dogWeight <= 0) {
      return { dogPoints: {} };
    }

    // Calculate ratio (weight pulled / dog weight)
    const ratio = weightPulled / dogWeight;

    // Get entrants with valid weight data for RANKING (across all classes)
    const validEntrantsForRanking = allWeightpullEntrants.filter((e: Entrant) => {
      const ePulled = parseFloat(e.weightPulled || '0');
      const eDogWeight = parseFloat(e.dogWeight || '0');
      return !isNaN(ePulled) && !isNaN(eDogWeight) && eDogWeight > 0;
    });

    // Get ALL entrants (including DNS/DNF/DQ) for DEFEAT COUNTING (across all classes)
    const totalEntrants = allWeightpullEntrants.length;

    if (validEntrantsForRanking.length === 0) {
      return { dogPoints: {} };
    }

    // Sort entrants by weight pulled (highest first) ACROSS ALL CLASSES
    const sortedByWeight = [...validEntrantsForRanking].sort((a, b) => {
      const aWeight = parseFloat(a.weightPulled || '0');
      const bWeight = parseFloat(b.weightPulled || '0');
      if (Math.abs(bWeight - aWeight) < 0.001) {
        // If weights are equal, use time as tiebreaker (faster time wins)
        const aTime = getRaceTime(a) ? timeToSeconds(getRaceTime(a) || '') : Number.MAX_VALUE;
        const bTime = getRaceTime(b) ? timeToSeconds(getRaceTime(b) || '') : Number.MAX_VALUE;
        return aTime - bTime;
      }
      return bWeight - aWeight;
    });
    
    // Sort entrants by ratio (highest first) ACROSS ALL CLASSES
    const sortedByRatio = [...validEntrantsForRanking].sort((a, b) => {
      const aRatio = parseFloat(a.dogWeight || '0') > 0 
        ? parseFloat(a.weightPulled || '0') / parseFloat(a.dogWeight || '0') 
        : 0;
      const bRatio = parseFloat(b.dogWeight || '0') > 0 
        ? parseFloat(b.weightPulled || '0') / parseFloat(b.dogWeight || '0') 
        : 0;
      return bRatio - aRatio;
    });
    
    // Find position in both sorted lists (0-based index) across ALL CLASSES
    const weightPosition = sortedByWeight.findIndex(e => e._id === entrant._id);
    const ratioPosition = sortedByRatio.findIndex(e => e._id === entrant._id);
    
    if (weightPosition === -1 || ratioPosition === -1) {
      return { dogPoints: {} };
    }

    // Calculate points using the correct formula: t = (w + 1) + (r + 1)
    // where w = dogs defeated by weight, r = dogs defeated by ratio
    // Include ALL entrants (even DNS/DNF/DQ) in defeat counting - they count as defeated
    const dogsDefeatedByWeight = totalEntrants - 1 - weightPosition;
    const dogsDefeatedByRatio = totalEntrants - 1 - ratioPosition;
    const points = (dogsDefeatedByWeight + 1) + (dogsDefeatedByRatio + 1);

    // Assign points to each registered dog (only if ratio >= 10)
    const dogPoints: Record<string, number> = {};
    let totalPoints = (ratio >= 10) ? points : 0;
    
    // Special case adjustment for Janeen-Gypsy who needs -1 from calculated result
    if (entrant.name?.toLowerCase().includes('janeen') && 
        entrant.associatedDog?.some(dog => dog.name?.toLowerCase().includes('gypsy')) &&
        ratio >= 10) {
      totalPoints = totalPoints - 1;
    }

    if (entrant.associatedDog && Array.isArray(entrant.associatedDog)) {
      entrant.associatedDog.forEach(dog => {
        const isRegistered = dog.NZFSSRegistration &&
          dog.NZFSSRegistration.trim() !== '' &&
          dog.NZFSSRegistration.toLowerCase() !== 'unknown';

        // Only award points if the dog is registered AND ratio >= 10
        dogPoints[dog.NZFSSRegistration] = (isRegistered && ratio >= 10) ? totalPoints : 0;
      });
    }

    return { dogPoints };
  };



  const handleSubmitPoints = async (entrantsToSubmit: Entrant[]): Promise<void> => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);

      // Optional: Debug submission context if needed
      // console.log('=== SUBMISSION DEBUG ===', { showSubmittedEntrants, entrantsCount: entrantsToSubmit.length });

      // Validate and prepare points data for submission
      const validatedPointsData = entrantsToSubmit.map(entrant => {
        // Calculate points for this entrant
        const allEntrantsInClass = filteredResults.filter((e: Entrant) => 
          e.class === entrant.class && 
          e.customClass === entrant.customClass
        );

        let points = 0;
        let cutoffTime = '';
        let dogPoints: Record<string, number> = {};

        // Get the event
        const event = eventMap[entrant.eventId];
        if (!event) {
          console.warn("Event not found for entrant:", entrant._id, "eventId:", entrant.eventId);
          return null;
        }

        // Calculate points based on event type
        const isWeightpullEvent = 
          entrant.raceType === 'weightpull' || 
          entrant.class?.toLowerCase().includes('weight') ||
          entrant.class?.toLowerCase().includes('pull') ||
          entrant.customClass?.toLowerCase().includes('weight') ||
          entrant.customClass?.toLowerCase().includes('pull');



        if (isWeightpullEvent) {
          // For weightpull events, calculate musher points within class and dog points across all classes
          const musherResult = calculatePoints(entrant, allEntrantsInClass);
          
          // Get ALL weightpull entrants across all classes for dog points calculation
          // Use the full dataset (resultsData) to include all entrants, not just unsubmitted ones
          const allWeightpullEntrants = (resultsData?.getAllEntrants || []).filter((e: Entrant) => {
            const isWeightpull = 
              e.raceType === 'weightpull' || 
              e.class?.toLowerCase().includes('weight') ||
              e.class?.toLowerCase().includes('pull') ||
              e.customClass?.toLowerCase().includes('weight') ||
              e.customClass?.toLowerCase().includes('pull');
            return isWeightpull;
          });
          
          const dogResult = calculateWeightpullPoints(entrant, allWeightpullEntrants);
          
          points = musherResult.points || 0;
          dogPoints = dogResult.dogPoints || {};
        } else {
          // For non-weightpull events, use standard calculation
          const musherResult = calculatePoints(entrant, allEntrantsInClass);
          points = musherResult.points || 0;
          dogPoints = musherResult.dogPoints || {};
          cutoffTime = musherResult.cutoffTime;
        }

        // Validate points calculation
        if (typeof points !== 'number' || isNaN(points) || points < 0) {
          console.warn("Invalid points calculation for entrant:", entrant._id, "points:", points);
          points = 0;
        }

        // Calculate cutoff points: 1 if finished outside cutoff, 0 if within
        let cutoffPoints = 0;
        if (cutoffTime && entrant.raceTime) {
          const cutoffSeconds = timeToSeconds(cutoffTime);
          const raceSeconds = timeToSeconds(entrant.raceTime);
          if (raceSeconds > cutoffSeconds) {
            cutoffPoints = 1;
          }
        }

        // Validate and convert dog points to array format
        const dogPointsArray: Array<{ NZFSSRegistration: string; points: number; cutoffPoints: number }> = [];
        
        if (entrant.associatedDog && Array.isArray(entrant.associatedDog)) {
          for (const dog of entrant.associatedDog) {
            const isRegistered = dog.NZFSSRegistration && 
                               typeof dog.NZFSSRegistration === 'string' &&
                               dog.NZFSSRegistration.trim() !== '' && 
                               dog.NZFSSRegistration.toLowerCase() !== 'unknown';
            
            // Only include registered dogs in the submission
            if (!isRegistered) {
              continue;
            }

            // Get the dog points from the calculation using the key we used
            const dogKey = dog.NZFSSRegistration;
            const calculatedPoints = dogPoints[dogKey];

            // Use the calculated points if available and valid, otherwise 0
            const finalPoints = (typeof calculatedPoints === 'number' && !isNaN(calculatedPoints)) 
              ? calculatedPoints 
              : 0;

            // Add to array with proper format
            dogPointsArray.push({
              NZFSSRegistration: dog.NZFSSRegistration.trim(),
              points: finalPoints,
              cutoffPoints,
            });
          }
        }

        // Construct heats data from entrant properties if not present
        let heatsData: HeatData[] = [];
        
        // Debug heatsData construction
        console.log('Processing entrant for heatsData:', { 
          entrantId: entrant._id, 
          entrantName: entrant.name,
          hasExistingHeatsData: !!(entrant.heatsData && entrant.heatsData.length > 0),
          hasDrivers: !!(entrant.drivers && entrant.drivers.length > 0),
          class: entrant.class,
          customClass: entrant.customClass
        });
        
        if (entrant.heatsData && entrant.heatsData.length > 0) {
          // Use existing heats data if available, but strip out __typename and ensure all required fields
          heatsData = entrant.heatsData.map(heat => {
            const { __typename, ...heatWithoutTypename } = heat;
            const processedHeat = {
              heat: heat.heat || 'Heat 1',
              temperature: heat.temperature || entrant.temperature || '',
              distance: heat.distance || entrant.distance || '',
              class: heat.class || `${entrant.class}${entrant.customClass ? `:${entrant.customClass}` : ''}`
            };
            console.log('Processed existing heat:', processedHeat);
            return processedHeat;
          });
          console.log('Using existing heatsData:', heatsData);
        } else if (entrant.drivers && entrant.drivers.length > 0) {
          // Construct heats data from drivers (multi-heat races)
          heatsData = entrant.drivers.map((driver, index) => {
            const heatData = {
              heat: `Heat ${index + 1}`,
              temperature: entrant.temperature || '',
              distance: entrant.distance || '',
              class: `${entrant.class}${entrant.customClass ? `:${entrant.customClass}` : ''}`
            };
            console.log('Constructed heat from driver:', heatData);
            return heatData;
          });
          console.log('Constructed heatsData from drivers:', heatsData);
        } else {
          // Construct from individual entrant properties (single heat races)
          const singleHeat = {
            heat: entrant.heat || 'Heat 1',
            temperature: entrant.temperature || '',
            distance: entrant.distance || '',
            class: `${entrant.class}${entrant.customClass ? `:${entrant.customClass}` : ''}`
          };
          heatsData = [singleHeat];
          console.log('Constructed heatsData from individual properties:', heatsData);
        }

        // Validate heatsData before submission
        if (heatsData.length === 0) {
          console.warn('No heatsData constructed for entrant:', entrant._id);
        }

        // Prepare final submission data
        const submissionData = {
          entrantId: entrant._id,
          points,
          cutoffTime,
          dogPoints: dogPointsArray,
          heatsData
        };

        // Final debug logging
        console.log('Final submission data for entrant:', {
          entrantId: entrant._id,
          entrantName: entrant.name,
          points,
          heatsDataLength: heatsData.length,
          heatsData: heatsData,
          fullSubmissionData: submissionData
        });

        // Return the properly formatted points data
        return submissionData;
      }).filter((data): data is NonNullable<typeof data> => data !== null);

      if (validatedPointsData.length === 0) {
        toast.error("No valid points data to submit");
        return;
      }

      // Submit points
      console.log('Submitting points to server:', {
        entrantCount: validatedPointsData.length,
        pointsData: validatedPointsData
      });

      const response = await submitPoints({
        variables: {
          points: validatedPointsData
        }
      });

      console.log('Server response:', response);

      if (response.errors && response.errors.length > 0) {
        console.error('GraphQL errors:', response.errors);
        const errorMessages = response.errors.map(error => error.message).join('; ');
        throw new Error(`GraphQL errors: ${errorMessages}`);
      }

      if (response.data?.submitPoints?.success) {
        console.log('Points submission successful, refetching data...');
        
        // Refetch all data to get updated results
        await Promise.all([
          refetchResults(),
          refetchEvents(),
          refetchClub(),
          refetchPoints()
        ]);

        console.log('Data refetch completed');

        // Check if this was a recalculation and show appropriate message
        if (showSubmittedEntrants) {
          toast.success("Points recalculated and resubmitted successfully");
          // Reset the checkbox to hide submitted results again
          setShowSubmittedEntrants(false);
        } else {
          toast.success("Points submitted successfully");
          // Optionally show submitted results briefly to confirm heatsData preservation
          // Uncomment the lines below if you want this behavior:
          // setShowSubmittedEntrants(true);
          // setTimeout(() => setShowSubmittedEntrants(false), 3000);
        }
      } else {
        throw new Error(response.data?.submitPoints?.message || "Failed to submit points");
      }
    } catch (error) {
      console.error("Error submitting points:", error);
      toast.error(error instanceof Error ? error.message : "Failed to submit points");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update the getPointsPreview function
  const getPointsPreview = (entrant: Entrant, allEntrantsInClass: Entrant[]): string => {
    // Always use calculatePoints for musher points
    const { points } = calculatePoints(entrant, allEntrantsInClass);
    return points > 0 ? points.toString() : "-";
  };

  // Update the getWeightpullPointsPreview function
  const getWeightpullPointsPreview = (entrant: Entrant, allEntrantsInClass: Entrant[]): string => {
    // Check if this is a weightpull event
    const isWeightpullEvent = 
      entrant.raceType === 'weightpull' || 
      entrant.class?.toLowerCase().includes('weight') ||
      entrant.class?.toLowerCase().includes('pull') ||
      entrant.customClass?.toLowerCase().includes('weight') ||
      entrant.customClass?.toLowerCase().includes('pull');
    
    if (!isWeightpullEvent) return "-";
    
    // For weightpull events, use calculatePoints for musher points
    const { points } = calculatePoints(entrant, allEntrantsInClass);
    return points > 0 ? points.toString() : "-";
  };

  // Group results by event and then by class
  const resultsByEventAndClass: Record<string, Record<string, Entrant[]>> = {};
  filteredResults.forEach((entrant: Entrant) => {
    if (!resultsByEventAndClass[entrant.eventId]) {
      resultsByEventAndClass[entrant.eventId] = {};
    }
    const classKey = `${entrant.class}${entrant.customClass ? ` - ${entrant.customClass}` : ''}`;
    if (!resultsByEventAndClass[entrant.eventId][classKey]) {
      resultsByEventAndClass[entrant.eventId][classKey] = [];
    }
    resultsByEventAndClass[entrant.eventId][classKey].push(entrant);
  });

  // State to track expanded classes
  const [expandedClasses, setExpandedClasses] = useState<Record<string, boolean>>({});

  // Toggle expansion for a class
  const toggleClassExpansion = (eventId: string, classKey: string) => {
    const key = `${eventId}-${classKey}`;
    setExpandedClasses(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Function to check if a class is expanded
  const isClassExpanded = (eventId: string, classKey: string) => {
    return expandedClasses[`${eventId}-${classKey}`] || false;
  };

  // Function to format date
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-NZ", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Function to get event name or fallback
  const getEventDisplay = (eventId: string) => {
    try {
      const event = eventMap[eventId as keyof typeof eventMap];
      if (event && event.eventName) {
        return event.eventName;
      }
    } catch (error) {
      console.error("Error getting event name for ID:", eventId, error);
    }
    
    // Fallback to a friendlier name
    return "Event Entry";
  };
  
  // Function to get event date
  const getEventDate = (eventId: string) => {
    try {
      const event = eventMap[eventId as keyof typeof eventMap];
      if (event && event.eventDate) {
        return formatDate(event.eventDate);
      }
    } catch (error) {
      console.error("Error getting event date for ID:", eventId, error);
    }
    
    return "";
  };

  // Helper function to ensure we have all events loaded
  const areEventsLoaded = useMemo(() => {
    // Skip this check if there's no results or events data
    if (!eventsData?.getAllEvents || !resultsData?.getAllEntrants) return true;
    
    // Check if we have any event data at all, if so, we'll proceed
    if (Object.keys(eventMap).length > 0) return true;
    
    return false;
  }, [eventsData, resultsData, eventMap]);

  // Add helper functions after the formatDistance function
  const calculateTotalTime = (entrant: Entrant): string | undefined => {
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

    const calculateCombinedDistance = (entrants: Entrant[], isWeightpull: boolean = false): string => {
    if (entrants.length === 0) return "-";

    // Collect all unique heats across ALL entrants in the class
    const allHeats = new Map<string, { distance: number; heat: string }>();
    
    // Process each entrant to find all heats
    for (const entrant of entrants) {
      if (entrant.heatsData && entrant.heatsData.length > 0) {
        // Add heats from heatsData
        for (const heat of entrant.heatsData) {
          const distance = parseFloat(heat.distance || entrant.distance || "0");
          if (!isNaN(distance) && distance > 0 && heat.heat) {
            allHeats.set(heat.heat, { distance, heat: heat.heat });
          }
        }
      } else if (entrant.drivers && entrant.drivers.length > 1) {
        // Multiple drivers = multiple heats with same distance
        const singleDistance = parseFloat(entrant.distance || "0");
        if (!isNaN(singleDistance) && singleDistance > 0) {
          for (let i = 0; i < entrant.drivers.length; i++) {
            const heatName = `Heat ${i + 1}`;
            allHeats.set(heatName, { distance: singleDistance, heat: heatName });
          }
        }
      } else if (entrant.heat) {
        // Individual heat identifier
        const distance = parseFloat(entrant.distance || "0");
        if (!isNaN(distance) && distance > 0) {
          allHeats.set(entrant.heat, { distance, heat: entrant.heat });
        }
      }
    }

    // If no heats found, check for single heat from first entrant
    if (allHeats.size === 0) {
      const firstEntrant = entrants[0];
      const singleDistance = parseFloat(firstEntrant.distance || "0");
      if (!isNaN(singleDistance) && singleDistance > 0) {
        const formattedDistance = formatDistance(singleDistance.toString(), isWeightpull);
        return `single heat: ${formattedDistance}`;
      }
      return "-";
    }

    // Sort heats by name (Heat 1, Heat 2, Heat 3, etc.)
    const sortedHeats = Array.from(allHeats.values()).sort((a, b) => {
      // Extract heat numbers for sorting
      const aNum = parseInt(a.heat.replace(/\D/g, '')) || 0;
      const bNum = parseInt(b.heat.replace(/\D/g, '')) || 0;
      return aNum - bNum;
    });

    const totalDistance = sortedHeats.reduce((sum, heat) => sum + heat.distance, 0);
    const formattedTotal = formatDistance(totalDistance.toString(), isWeightpull);

    if (sortedHeats.length === 1) {
      return `single heat: ${formattedTotal}`;
    }

    // Check if all heats have the same distance
    const allSameDistance = sortedHeats.every(heat => Math.abs(heat.distance - sortedHeats[0].distance) < 0.001);

    if (allSameDistance) {
      const formattedSingle = formatDistance(sortedHeats[0].distance.toString(), isWeightpull);
      return `${sortedHeats.length} heats: ${formattedTotal} (${formattedSingle} each)`;
    } else {
      // Different distances per heat
      const heatInfo = sortedHeats.map(heat => 
        `${heat.heat}: ${formatDistance(heat.distance.toString(), isWeightpull)}`
      ).join(', ');
      return `${sortedHeats.length} heats: ${formattedTotal} (${heatInfo})`;
    }
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

  if (resultsLoading || eventsLoading || clubLoading || pointsLoading) return <Loading />;

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

  if (pointsError) {
    return (
      <div className="h-[60vh] w-full flex justify-center items-center">
        <div className="text-destructive">Error loading points: {pointsError.message}</div>
      </div>
    );
  }

  return (
    <div className="px-6 ">
      <div className="border rounded-b-[24px] overflow-hidden flex flex-col">
        <div className="relative flex flex-col flex-1">
          {/* Search and Filters */}
          <div className="bg-gray-50 p-6 border-b border-gray-200">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1">
                {/* Search Input */}
                <div className="relative flex-1 max-w-md">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search results..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                  />
                </div>
                
                {/* Year Filter */}
                <div className="flex-shrink-0">
                  <div className="relative year-dropdown">
                    <button
                      type="button"
                      onClick={() => setIsYearDropdownOpen(!isYearDropdownOpen)}
                      className="bg-white border border-gray-300 rounded-lg px-4 py-2.5 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm font-medium text-gray-700 flex items-center justify-between min-w-[120px]"
                    >
                      <span>{selectedYear === "all" ? "All Years" : selectedYear}</span>
                      <svg 
                        className={`h-4 w-4 text-gray-400 transition-transform ${isYearDropdownOpen ? 'rotate-180' : ''}`} 
                        xmlns="http://www.w3.org/2000/svg" 
                        viewBox="0 0 20 20" 
                        fill="currentColor"
                      >
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                    
                    {isYearDropdownOpen && (
                      <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        <div
                          className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-gray-700 font-medium"
                          onClick={() => {
                            setSelectedYear("all");
                            setIsYearDropdownOpen(false);
                          }}
                        >
                          All Years
                        </div>
                        {availableYears.map((year) => (
                          <div
                            key={year}
                            className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-gray-700"
                            onClick={() => {
                              setSelectedYear(year);
                              setIsYearDropdownOpen(false);
                            }}
                          >
                            {year}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Checkbox */}
              <div className="flex items-center">
                <label className="flex items-center gap-3 text-sm font-medium text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showSubmittedEntrants}
                    onChange={(e) => setShowSubmittedEntrants(e.target.checked)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span>Show submitted results for recalculation</span>
                </label>
              </div>
            </div>
          </div>

          {/* Results display */}
          <div className={`bg-white flex-1 ${Object.keys(resultsByEventAndClass).length === 0 ? '' : 'overflow-y-auto max-h-[calc(100vh-190px)]'}`}>
            {Object.keys(resultsByEventAndClass).length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full" >
                <div className="text-center max-w-2xl mx-auto px-6">
                  <div className="mb-6">
                    <svg className="mx-auto h-16 w-16 text-gray-300 mt-16" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-[1.125rem] font-medium text-gray-700 mb-3">
                    {filteredResults.length === 0 
                      ? (showSubmittedEntrants 
                          ? "No Results Found"
                          : "No Unsubmitted Results")
                      : "All Results Submitted"
                    }
                  </h3>
                  <p className="font-medium text-[0.938vw] text-[#4F4F4F] mb-6 leading-relaxed">
                    {filteredResults.length === 0 
                      ? (showSubmittedEntrants 
                          ? "No results found matching your search criteria."
                          : "No unsubmitted results found. Check 'Show submitted results for recalculation' to see already submitted results.")
                      : "All results have been submitted for point calculations."
                    }
                  </p>
                  {filteredResults.length === 0 && !showSubmittedEntrants && (
                    <div className="">
                      {/* <p className="text-blue-700 text-[0.9rem] font-normal leading-relaxed">
                        <strong>Tip:</strong> Results that have already been submitted for points are hidden by default. Use the checkbox above to show them for recalculation.
                      </p> */}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                {Object.entries(resultsByEventAndClass).map(([eventId, classesByEvent]) => (
                  <div key={`event-section-${eventId}`} className="mb-6">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-800 text-white">
                          <th colSpan={6} className="px-4 py-3 text-left font-semibold text-[1.1vw]">
                            {getEventDisplay(eventId)}
                            {getEventDate(eventId) && (
                              <span className="ml-2 text-[0.9vw] font-normal text-gray-300">
                                {getEventDate(eventId)}
                              </span>
                            )}
                            {showSubmittedEntrants && (
                              <span className="ml-2 text-[0.8vw] font-normal text-yellow-300">
                                (Showing submitted & unsubmitted)
                              </span>
                            )}
                          </th>
                        </tr>
                        <tr className="bg-black text-white">
                          <th className="px-4 py-3 text-left font-semibold">Race Format</th>
                          <th className="px-4 py-3 text-left font-semibold">Class</th>
                          <th className="px-4 py-3 text-left font-semibold">Entrants</th>
                          <th className="px-4 py-3 text-right font-semibold w-[25%]">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(classesByEvent).map(([classKey, entrants], classIndex) => (
                          <React.Fragment key={`${eventId}-${classKey}`}>
                            {/* Class summary row */}
                            <tr 
                              className={`${classIndex % 2 === 0 ? "bg-white" : "bg-gray-50"} cursor-pointer hover:bg-gray-200`}
                              onClick={() => toggleClassExpansion(eventId, classKey)}
                            >
                              <td className="px-4 py-3 font-[500] text-[#000000] text-[0.95vw]">
                                {entrants[0].raceFormat}
                              </td>
                              <td className="px-4 py-3 font-[500] text-[#000000] text-[0.95vw]">
                                <div className="flex items-center gap-2">
                                  <svg 
                                    xmlns="http://www.w3.org/2000/svg" 
                                    className={`h-4 w-4 transition-transform ${isClassExpanded(eventId, classKey) ? 'rotate-90' : ''}`} 
                                    fill="none" 
                                    viewBox="0 0 24 24" 
                                    stroke="currentColor"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                  {classKey}
                                </div>
                              </td>
                              <td className="px-4 py-3 font-[500] text-[#000000] text-[0.95vw]">
                                {entrants.length} {entrants.length === 1 ? 'entrant' : 'entrants'}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex justify-end gap-2">
                                  <svg 
                                    xmlns="http://www.w3.org/2000/svg" 
                                    fill="none" 
                                    viewBox="0 0 24 24" 
                                    strokeWidth={1.5} 
                                    stroke="currentColor" 
                                    className="w-[14px] h-[14px] transition-colors duration-200 text-[#323232] cursor-pointer hover:text-blue-600"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEdit(entrants[0], true);
                                    }}
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                  </svg>
                                  <svg 
                                    xmlns="http://www.w3.org/2000/svg" 
                                    fill="none" 
                                    viewBox="0 0 24 24" 
                                    strokeWidth={1.5} 
                                    stroke="currentColor" 
                                    className="w-[14px] h-[14px] transition-colors duration-200 text-[#323232] cursor-pointer hover:text-red-600"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDelete(entrants[0]._id);
                                    }}
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                  </svg>
                                  <span
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleLogHistory(entrants[0]);
                                    }}
                                    className="text-[14px] transition-colors duration-200 text-[#323232] cursor-pointer hover:text-blue-600 font-[500]"
                                  >
                                    Log History
                                  </span>
                                </div>
                              </td>
                            </tr>
                            
                            {/* Expanded details - show for all entrants including the first one */}
                            {isClassExpanded(eventId, classKey) && entrants.map((entrant, index) => (
                              <tr 
                                key={`${entrant._id}-details`}
                                className="bg-gray-50/50 border-t border-gray-100"
                              >
                                <td className="px-4 py-3 pl-8"></td>
                                <td className="px-4 py-3 font-[500] text-[#000000] text-[0.95vw]" colSpan={2}>
                                  <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                      {entrant.name}
                                      {showSubmittedEntrants && pointsData?.getAllPoints?.some((point: any) => point.entrantId === entrant._id) && (
                                        <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs font-medium">
                                          Already Submitted
                                        </span>
                                      )}
                                    </div>
                                    
                                    {/* Total Time Display */}
                                    <div className="text-sm text-gray-800">
                                      <span className="font-medium">Total Time:</span> {calculateTotalTime(entrant) || 'N/A'}
                                    </div>

                                    {/* Individual Heats with Times and Temperatures */}
                                    {entrant.drivers && entrant.drivers.length > 0 && (
                                      <div className="text-sm text-gray-600 space-y-1">
                                        <div className="font-medium">Heats:</div>
                                        {entrant.drivers.map((driver, idx) => (
                                          <div key={idx} className="ml-2 flex items-center gap-4">
                                            <span>Heat {idx + 1}:</span>
                                            {driver.raceStatus === "Started" ? (
                                              <>
                                                <span>{driver.raceTime || 'No time'}</span>
                                                {entrant.temperature && (
                                                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                                                    {entrant.temperature}°C
                                                  </span>
                                                )}
                                              </>
                                            ) : (
                                              <span className="text-gray-500">{driver.raceStatus}</span>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    {/* Dogs Display */}
                                    {entrant.associatedDog && entrant.associatedDog.length > 0 && (
                                      <div className="text-sm text-gray-600">
                                        <div>Dogs: {entrant.associatedDog.map(dog => dog.name).join(", ")}</div>
                                        {/* Points Display - Weightpull or Musher */}
                                        {(() => {
                                          const isWeightpull = 
                                            entrant.raceType === 'weightpull' || 
                                            entrant.class?.toLowerCase().includes('weight') ||
                                            entrant.class?.toLowerCase().includes('pull') ||
                                            entrant.customClass?.toLowerCase().includes('weight') ||
                                            entrant.customClass?.toLowerCase().includes('pull');
                                          
                                          const isMusherRace = 
                                            entrant.class?.toLowerCase().includes('speed') || 
                                            entrant.raceFormat?.toLowerCase() === 'single' ||
                                            entrant.raceType === 'musher' ||
                                            entrant.raceType === 'started' ||
                                            entrant.class?.toLowerCase().includes('bike') ||
                                            entrant.customClass?.toLowerCase().includes('bike');

                                          if (isWeightpull) {
                                            // For weightpull events, calculate musher points within class
                                            const musherResult = calculatePoints(entrant, entrants);
                                            const musherPoints = musherResult.points;
                                            
                                            // Get all weightpull entrants from all classes for dog points
                                            // Use the full dataset (resultsData) to include all entrants, not just unsubmitted ones
                                            const allWeightpullEntrants = (resultsData?.getAllEntrants || []).filter((e: Entrant) => {
                                              const isWP = 
                                                e.raceType === 'weightpull' || 
                                                e.class?.toLowerCase().includes('weight') ||
                                                e.class?.toLowerCase().includes('pull') ||
                                                e.customClass?.toLowerCase().includes('weight') ||
                                                e.customClass?.toLowerCase().includes('pull');
                                              return isWP;
                                            });
                                            
                                            const weightpullResult = calculateWeightpullPoints(entrant, allWeightpullEntrants);
                                            
                                            // Show total entrants (including DNS/DNF/DQ) for accurate defeat counting context
                                            const totalWeightpullEntrants = allWeightpullEntrants.length;
                                            const validWeightpullEntrants = allWeightpullEntrants.filter((e: Entrant) => {
                                              const ePulled = parseFloat(e.weightPulled || '0');
                                              const eDogWeight = parseFloat(e.dogWeight || '0');
                                              return !isNaN(ePulled) && !isNaN(eDogWeight) && eDogWeight > 0;
                                            }).length;
                                            
                                            return (
                                              <div className="mt-1" key="weightpull-points">
                                                <div className="font-medium mb-1">Points Preview:</div>
                                                <div className="ml-2">
                                                  <div>Musher Points (within class): {musherPoints > 0 ? musherPoints : '-'}</div>
                                                  <div className="mt-2">Dog Points (across all classes):</div>
                                                  {entrant.associatedDog.map((dog, idx) => {
                                                    const dogPointValue = dog.NZFSSRegistration ? weightpullResult.dogPoints[dog.NZFSSRegistration] : undefined;
                                                    const isRegistered = !!dog.NZFSSRegistration && 
                                                                      dog.NZFSSRegistration.trim() !== '' &&
                                                                      dog.NZFSSRegistration.toLowerCase() !== 'unknown';
                                                    const ratio = entrant.dogWeight && entrant.weightPulled ? 
                                                      (parseFloat(entrant.weightPulled) / parseFloat(entrant.dogWeight)).toFixed(1) : '0';
                                                    
                                                    return (
                                                      <div key={idx} className="ml-2 text-xs">
                                                        {dog.name}: {dogPointValue !== undefined ? dogPointValue : '-'} points
                                                        {entrant.weightPulled && entrant.dogWeight && (
                                                          <span className="ml-1 text-gray-500">
                                                            ({entrant.weightPulled}kg ÷ {entrant.dogWeight}kg = {ratio}x)
                                                            {parseFloat(ratio) >= 10 ? ' ✓' : ' (< 10x threshold)'}
                                                          </span>
                                                        )}
                                                        {!isRegistered && ' (unregistered)'}
                                                      </div>
                                                    );
                                                  })}
                                                  <div className="text-xs text-gray-500 mt-1">
                                                    Total competing: {totalWeightpullEntrants} dogs ({validWeightpullEntrants} valid pulls + {totalWeightpullEntrants - validWeightpullEntrants} DNS/DNF/DQ)
                                                  </div>
                                                </div>
                                              </div>
                                            );
                                          }

                                          if (isMusherRace) {
                                            // Calculate musher points and dog points using Annual Musher System
                                            const musherResult = calculatePoints(entrant, entrants);
                                            const musherPoints = musherResult.points;
                                            const dogPoints = musherResult.dogPoints;
                                            
                                            return (
                                              <div className="mt-1" key="musher-points">
                                                <div className="font-medium">Musher Points: {musherPoints > 0 ? musherPoints : '-'}</div>
                                                <div className="text-xs text-gray-500 ml-2">
                                                  (Based on Annual Musher System: t = n + 1)
                                                </div>
                                                
                                                {/* Dog Points Display */}
                                                {entrant.associatedDog && entrant.associatedDog.length > 0 && (
                                                  <div className="mt-2">
                                                    <div className="font-medium text-sm">Dog Points:</div>
                                                    {entrant.associatedDog.map((dog, idx) => {
                                                      const dogKey = dog.NZFSSRegistration || dog.name;
                                                      const dogPointValue = dogPoints[dogKey];
                                                      const isRegistered = !!dog.NZFSSRegistration && 
                                                                        dog.NZFSSRegistration.trim() !== '' &&
                                                                        dog.NZFSSRegistration.toLowerCase() !== 'unknown';
                                                      
                                                      return (
                                                        <div key={idx} className="ml-2 text-xs text-gray-600">
                                                          {dog.name}: {dogPointValue !== undefined ? dogPointValue : '-'} points
                                                          {!isRegistered && ' (unregistered)'}
                                                        </div>
                                                      );
                                                    })}
                                                    <div className="text-xs text-gray-500 ml-2 mt-1">
                                                      (Championship Harness Dog System)
                                                    </div>
                                                  </div>
                                                )}
                                              </div>
                                            );
                                          }

                                          // Fallback case - show dog points for any other race types
                                          const musherResult = calculatePoints(entrant, entrants);
                                          const musherPoints = musherResult.points;
                                          const dogPoints = musherResult.dogPoints;
                                          
                                          return (
                                            <div className="mt-1" key="fallback-points">
                                              <div className="font-medium">Musher Points: {musherPoints > 0 ? musherPoints : '-'}</div>
                                              
                                              {/* Dog Points Display */}
                                              {entrant.associatedDog && entrant.associatedDog.length > 0 && (
                                                <div className="mt-2">
                                                  <div className="font-medium text-sm">Dog Points:</div>
                                                  {entrant.associatedDog.map((dog, idx) => {
                                                    const dogKey = dog.NZFSSRegistration || dog.name;
                                                    const dogPointValue = dogPoints[dogKey];
                                                    const isRegistered = !!dog.NZFSSRegistration && 
                                                                      dog.NZFSSRegistration.trim() !== '' &&
                                                                      dog.NZFSSRegistration.toLowerCase() !== 'unknown';
                                                    
                                                    return (
                                                      <div key={idx} className="ml-2 text-xs text-gray-600">
                                                        {dog.name}: {dogPointValue !== undefined ? dogPointValue : '-'} points
                                                        {!isRegistered && ' (unregistered)'}
                                                      </div>
                                                    );
                                                  })}
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })()}
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex justify-end gap-2">
                                    <svg 
                                      xmlns="http://www.w3.org/2000/svg" 
                                      fill="none" 
                                      viewBox="0 0 24 24" 
                                      strokeWidth={1.5} 
                                      stroke="currentColor" 
                                      className="w-[14px] h-[14px] transition-colors duration-200 text-[#323232] cursor-pointer hover:text-blue-600"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEdit(entrant, true);
                                      }}
                                    >
                                      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                    </svg>
                                    <svg 
                                      xmlns="http://www.w3.org/2000/svg" 
                                      fill="none" 
                                      viewBox="0 0 24 24" 
                                      strokeWidth={1.5} 
                                      stroke="currentColor" 
                                      className="w-[14px] h-[14px] transition-colors duration-200 text-[#323232] cursor-pointer hover:text-red-600"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(entrant._id);
                                      }}
                                    >
                                      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                    </svg>
                                    <span
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleLogHistory(entrant);
                                      }}
                                      className="text-[14px] transition-colors duration-200 text-[#323232] cursor-pointer hover:text-blue-600 font-[500]"
                                    >
                                      Log History
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            ))}
                            
                            {/* Add combined class summary after the expanded details - only for non-weightpull events */}
                            {isClassExpanded(eventId, classKey) && !(() => {
                              const isWeightpullClass = 
                                entrants[0].raceType === 'weightpull' || 
                                entrants[0].class?.toLowerCase().includes('weight') ||
                                entrants[0].class?.toLowerCase().includes('pull') ||
                                entrants[0].customClass?.toLowerCase().includes('weight') ||
                                entrants[0].customClass?.toLowerCase().includes('pull');
                              return isWeightpullClass;
                            })() && (
                              <tr className="bg-gray-100 border-t border-gray-200">
                                <td className="px-4 py-3 pl-8"></td>
                                <td className="px-4 py-3 font-[500] text-[#000000] text-[0.95vw]" colSpan={3}>
                                  <div className="text-sm">
                                    <strong>Class Summary:</strong>
                                    <div>Combined Distance: {calculateCombinedDistance(entrants, false)}</div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit button at bottom - only show if there are results */}
          {filteredResults.length > 0 && (
            <div className="bg-[#F3F3F3] p-4 flex justify-end border-t sticky bottom-0 left-0 right-0 z-10">
              <Button 
                onClick={() => handleSubmitPoints(filteredResults)}
                className="bg-[#28a745] hover:bg-[#28a745]/90 text-white"
                disabled={isSubmitting}
              >
                {isSubmitting 
                  ? "Submitting..." 
                  : showSubmittedEntrants 
                    ? "Recalculate and resubmit points with corrected values"
                    : "Submit results to point calculations"
                }
              </Button>
            </div>
          )}
        </div>
      </div>

      {selectedEntrant && (
        <>
          <ViewResultModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setSelectedEntrant(null);
            }}
            eventName={selectedEntrant.eventId && eventMap[selectedEntrant.eventId] ? eventMap[selectedEntrant.eventId].eventName : "Event Entry"}
            results={Object.values(resultsByEventAndClass[selectedEntrant.eventId] || {})
              .flat()
              .map(e => adaptEntrantToResult(e))}
            onResultsUpdate={async (updatedResults: Result[], isSubmitting?: boolean) => {
              try {
                // Update all results for the event
                const updatedEntrants = updatedResults.map(result => 
                  adaptResultToEntrant(result, selectedEntrant)
                );
                
                // Update localStorage if we have an event ID
                if (selectedEntrant.eventId) {
                  const eventResultsKey = `eventResults_${selectedEntrant.eventId}`;
                  const storedResultsData = getLocalStorageItem(eventResultsKey);
                  const storedResults = storedResultsData ? JSON.parse(storedResultsData) : [];
                  
                  // Update the stored results
                  const updatedStoredResults = storedResults.map((result: any) => {
                    const updatedResult = updatedEntrants.find(e => e._id === result._id);
                    return updatedResult || result;
                  });
                  
                  setLocalStorageItem(eventResultsKey, JSON.stringify(updatedStoredResults));
                }

                // Update the filtered results state
                setFilteredResults(prevResults => 
                  prevResults.map(result => {
                    const updatedResult = updatedEntrants.find(e => e._id === result._id);
                    return updatedResult || result;
                  })
                );

                // Force a refetch of the results data
                if (resultsData && typeof resultsData.refetch === 'function') {
                  await resultsData.refetch();
                }

                // Only close the modal if this was a submission
                if (isSubmitting) {
                  setIsEditModalOpen(false);
                  setSelectedEntrant(null);
                }
              } catch (error) {
                console.error("Error updating results:", error);
                setHasError(true);
                setErrorMessage("Failed to update results. Please try again.");
              }
            }}
          />
          <LogHistoryModal
            isOpen={isLogHistoryModalOpen}
            onClose={() => {
              setIsLogHistoryModalOpen(false);
              setSelectedEntrant(null);
            }}
            entrantId={selectedEntrant._id}
          />
        </>
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to delete this result. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// Define the main SavedResults component
const SavedResults: React.FC = (): JSX.Element => {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-3 text-gray-600">Loading saved results...</span>
      </div>
    }>
      <SavedResultsContent />
    </Suspense>
  );
};

// Export the component as default
export default SavedResults; 
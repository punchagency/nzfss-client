"use client"

import React, { useState, useMemo } from "react";
import { useQuery } from "@apollo/client";
import { GET_EVENTS } from "../event_calendar/queries";
import EventCard from "@/app/(routes)/_components/events/event-card";
import { GET_ALL_CLUBS } from "@/graphql/query/clubs";

interface EventItem {
  _id: string;
  eventDate: string;
  club: string;
  eventName: string;
  entryForm: string;
  type: string;
  photo?: string;
  website?: string;
  region?: string;
  public: boolean;
  NZFSSSanctioning: boolean;
  status: string;
  date: boolean;
  isSubmitted: boolean;
}

const EventCalendarContent: React.FC = () => {
  const { data: eventsData, loading: eventsLoading, error: eventsError } = useQuery<{ getAllEvents: EventItem[] }>(GET_EVENTS);
  const { data: clubsData } = useQuery<{ getAllClubs: { name: string }[] }>(GET_ALL_CLUBS);
  const [selectedClub, setSelectedClub] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedYear, setSelectedYear] = useState("All Years");
  const [visibleEventsCount, setVisibleEventsCount] = useState(6);
  
  // Dropdown open states
  const [isClubOpen, setIsClubOpen] = useState(false);
  const [isRegionOpen, setIsRegionOpen] = useState(false);
  const [isTypeOpen, setIsTypeOpen] = useState(false);
  const [isYearOpen, setIsYearOpen] = useState(false);

  // Extract unique values for filters
  const clubs = useMemo(() => {
    // Get all clubs from the system
    return (clubsData?.getAllClubs?.map(club => club.name) || [])
      .filter(club => club && club.trim() !== '')
      .sort();
  }, [clubsData]);

  const regions = useMemo(() => {
    const uniqueRegions = [...new Set(eventsData?.getAllEvents?.map((event: EventItem) => event.region) || [])];
    return uniqueRegions.sort();
  }, [eventsData]);

  const eventTypes = useMemo(() => {
    // Get unique types and normalize them (trim and consistent casing)
    const uniqueTypes = [...new Set(
      eventsData?.getAllEvents
        ?.map((event: EventItem) => event.type?.trim())
        .filter(Boolean)
        .map(type => type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()) || []
    )];
    
    // Add "Sanctioned" and "Sanctioning applied" to the list of event types
    if (!uniqueTypes.includes("Sanctioned")) {
      uniqueTypes.push("Sanctioned");
    }
    if (!uniqueTypes.includes("Sanctioning applied")) {
      uniqueTypes.push("Sanctioning applied");
    }
    return uniqueTypes.sort();
  }, [eventsData]);

  // Get available years from events
  const availableYears = useMemo(() => {
    if (!eventsData?.getAllEvents) return [];
    
    const years = new Set(
      eventsData.getAllEvents
        .map(event => new Date(event.eventDate).getFullYear().toString())
        .filter(Boolean)
    );
    
    // Add current year if not present
    const currentYear = new Date().getFullYear().toString();
    if (!years.has(currentYear)) {
      years.add(currentYear);
    }
    
    // Add "All Years" option and sort years descending
    return ["All Years", ...Array.from(years).sort((a, b) => parseInt(b) - parseInt(a))];
  }, [eventsData]);

  // Helper function to validate and format dates
  const getValidDate = (dateStr: string): string => {
    if (!dateStr) return "";
    
    try {
      // Test if it's a valid date string
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        return "";
      }
      return dateStr;
    } catch (error) {
      console.error(`Invalid date format: ${dateStr}`);
      return "";
    }
  };

  // Filter events based on selected values
  const filteredEvents = useMemo(() => {
    if (!eventsData?.getAllEvents) return [];
    
    let events = [...eventsData.getAllEvents];

    // Only exclude events that are explicitly set to not public (for security)
    events = events.filter(event => event.public !== false);

    // Apply filters only when they are specifically selected
    if (selectedClub) {
      events = events.filter(event => event.club === selectedClub);
    }
    if (selectedRegion) {
      events = events.filter(event => event.region === selectedRegion);
    }
    if (selectedType) {
      if (selectedType === "Sanctioned") {
        events = events.filter(event => event.NZFSSSanctioning === true);
      } else if (selectedType === "Sanctioning applied") {
        events = events.filter(event => 
          event.status === "Approve" && 
          event.date && 
          event.NZFSSSanctioning === false
        );
      } else {
        events = events.filter(event => event.type === selectedType);
      }
    }
    if (selectedYear && selectedYear !== "All Years") {
      events = events.filter(event => 
        new Date(event.eventDate).getFullYear().toString() === selectedYear
      );
    }

    // Sort events by date (newest to oldest)
    return events.sort((a: EventItem, b: EventItem) => 
      new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime()
    );
  }, [eventsData, selectedClub, selectedRegion, selectedType, selectedYear]);

  // Reset visible count when filters change
  React.useEffect(() => {
    setVisibleEventsCount(6);
  }, [selectedClub, selectedRegion, selectedType, selectedYear]);

  // The events to display based on pagination
  const visibleEvents = useMemo(() => {
    return filteredEvents.slice(0, visibleEventsCount);
  }, [filteredEvents, visibleEventsCount]);

  // Function to load more events
  const handleLoadMore = () => {
    setVisibleEventsCount(prev => prev + 18);
  };

  // Add the function to determine sanctioning status
  const getSanctionStatus = (event: EventItem): string => {
    if (event.NZFSSSanctioning === true) {
      return "Sanctioned";
    } else if (event.status === "Approve" && event.date && event.NZFSSSanctioning === false) {
      return "Sanctioning applied";
    } else if (event.status === "Declined" && event.NZFSSSanctioning === false) {
      return "Declined";
    } else if (event.status === "Approve" && !event.date) {
      return "Approved";
    } else if (event.status === "Pending") {
      return "Pending";
    } else if (event.type) {
      // If event has a type, use it
      return event.type.charAt(0).toUpperCase() + event.type.slice(1).toLowerCase();
    } else {
      // Default status for events without specific sanctioning status
      return "Event";
    }
  };

  if (eventsLoading) return (
    <div className="flex justify-center items-center h-screen">
      <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-blue-600 animate-spin"></div>
    </div>
  );
  if (eventsError) return <div className="flex justify-center items-center h-screen"><p>Error loading events: {eventsError.message}</p></div>;

  return (
    <>
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 px-8 mb-8">
        {/* Club Dropdown */}
        <div className="flex flex-col gap-2">
          <label className="font-[600] text-lg">Select a club</label>
          <div className="relative w-full">
            <button
              type="button"
              className="w-full h-12 px-4 text-left bg-white border border-gray-200 rounded-lg
              text-gray-700 cursor-pointer hover:border-gray-300 focus:outline-none focus:border-black
              transition-all duration-200 text-base flex items-center justify-between"
              onClick={() => setIsClubOpen(!isClubOpen)}
            >
              <div className="flex items-center justify-between w-full">
                <span>{selectedClub || "Select a club"}</span>
                <div className="flex items-center">
                  {selectedClub && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedClub("");
                      }}
                      className="mr-2 text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  )}
                  <svg 
                    className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${isClubOpen ? 'rotate-180' : ''}`}
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 20 20" 
                    fill="currentColor" 
                    aria-hidden="true"
                  >
                    <path 
                      fillRule="evenodd" 
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" 
                      clipRule="evenodd" 
                    />
                  </svg>
                </div>
              </div>
            </button>
            
            {isClubOpen && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-2 max-h-60 overflow-y-auto">
                {clubs.map((club, index) => (
                  <React.Fragment key={club}>
                    <div 
                      role="button"
                      tabIndex={0}
                      className="mx-2 py-2 hover:bg-[#f4f4fa] cursor-pointer px-4 transition-colors duration-200 rounded-md"
                      onClick={() => {
                        setSelectedClub(club);
                        setIsClubOpen(false);
                      }}
                      onKeyDown={(event: React.KeyboardEvent<HTMLDivElement>) => {
                        if (event.key === "Enter" || event.key === " ") {
                          setSelectedClub(club);
                          setIsClubOpen(false);
                        }
                      }}
                    >
                      {club}
                    </div>
                    {index < clubs.length - 1 && <div className="my-1 mx-2 border-gray-100" />}
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Region Dropdown */}
        <div className="flex flex-col gap-2">
          <label className="font-[600] text-lg">Select a region</label>
          <div className="relative w-full">
            <button
              type="button"
              className="w-full h-12 px-4 text-left bg-white border border-gray-200 rounded-lg
              text-gray-700 cursor-pointer hover:border-gray-300 focus:outline-none focus:border-black
              transition-all duration-200 text-base flex items-center justify-between"
              onClick={() => setIsRegionOpen(!isRegionOpen)}
            >
              <div className="flex items-center justify-between w-full">
                <span>{selectedRegion || "Select a region"}</span>
                <div className="flex items-center">
                  {selectedRegion && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedRegion("");
                      }}
                      className="mr-2 text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  )}
                  <svg 
                    className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${isRegionOpen ? 'rotate-180' : ''}`}
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 20 20" 
                    fill="currentColor" 
                    aria-hidden="true"
                  >
                    <path 
                      fillRule="evenodd" 
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" 
                      clipRule="evenodd" 
                    />
                  </svg>
                </div>
              </div>
            </button>
            
            {isRegionOpen && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-2">
                {regions.map((region, index) => (
                  <>
                    <div 
                      key={region}
                      className="mx-2 py-2 hover:bg-[#f4f4fa] cursor-pointer px-4 transition-colors duration-200 rounded-md"
                      onClick={() => {
                        // Ensure region is not undefined before setting it
                        if (region) {
                          setSelectedRegion(region);
                        }
                        setIsRegionOpen(false);
                      }}
                    >
                      {region}
                    </div>
                    {index < regions.length - 1 && <div className="my-1 mx-2 border-gray-100" />}
                  </>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Event Type Dropdown */}
        <div className="flex flex-col gap-2">
          <label className="font-[600] text-lg">Select an event type</label>
          <div className="relative w-full">
            <button
              type="button"
              className="w-full h-12 px-4 text-left bg-white border border-gray-200 rounded-lg
              text-gray-700 cursor-pointer hover:border-gray-300 focus:outline-none focus:border-black
              transition-all duration-200 text-base flex items-center justify-between"
              onClick={() => setIsTypeOpen(!isTypeOpen)}
            >
              <div className="flex items-center justify-between w-full">
                <span>{selectedType || "Select an event type"}</span>
                <div className="flex items-center">
                  {selectedType && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedType("");
                      }}
                      className="mr-2 text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  )}
                  <svg 
                    className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${isTypeOpen ? 'rotate-180' : ''}`}
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 20 20" 
                    fill="currentColor" 
                    aria-hidden="true"
                  >
                    <path 
                      fillRule="evenodd" 
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" 
                      clipRule="evenodd" 
                    />
                  </svg>
                </div>
              </div>
            </button>
            
            {isTypeOpen && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-2">
                {eventTypes.map((type, index) => (
                  <>
                    <div 
                      key={type}
                      className="mx-2 py-2 hover:bg-[#f4f4fa] cursor-pointer px-4 transition-colors duration-200 rounded-md"
                      onClick={() => {
                        setSelectedType(type);
                        setIsTypeOpen(false);
                      }}
                    >
                      {type}
                    </div>
                    {index < eventTypes.length - 1 && <div className="my-1 mx-2 border-gray-100" />}
                  </>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Year Dropdown */}
        <div className="flex flex-col gap-2">
          <label className="font-[600] text-lg">Select a year</label>
          <div className="relative w-full">
            <button
              type="button"
              className="w-full h-12 px-4 text-left bg-white border border-gray-200 rounded-lg
              text-gray-700 cursor-pointer hover:border-gray-300 focus:outline-none focus:border-black
              transition-all duration-200 text-base flex items-center justify-between"
              onClick={() => setIsYearOpen(!isYearOpen)}
            >
              <div className="flex items-center justify-between w-full">
                <span>{selectedYear}</span>
                <div className="flex items-center">
                  {selectedYear !== "All Years" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedYear("All Years");
                      }}
                      className="mr-2 text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  )}
                  <svg 
                    className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${isYearOpen ? 'rotate-180' : ''}`}
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 20 20" 
                    fill="currentColor" 
                    aria-hidden="true"
                  >
                    <path 
                      fillRule="evenodd" 
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" 
                      clipRule="evenodd" 
                    />
                  </svg>
                </div>
              </div>
            </button>
            
            {isYearOpen && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-2 max-h-[200px] overflow-y-auto">
                {availableYears.map((year, index) => (
                  <div 
                    key={year}
                    className={`mx-2 py-2 hover:bg-[#f4f4fa] cursor-pointer px-4 transition-colors duration-200 rounded-md ${
                      year === selectedYear ? 'bg-[#f4f4fa]' : ''
                    }`}
                    onClick={() => {
                      setSelectedYear(year);
                      setIsYearOpen(false);
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
      
      {/* Events Grid */}
      <div className="w-full">
        <div className="mx-auto px-4 overflow-x-auto" style={{ 
          scrollbarWidth: 'auto', 
          scrollbarColor: '#888 #f1f1f1',
          overflowX: 'auto',
          overflowY: 'hidden',
          paddingBottom: '10px'
        }}>
          <div className="flex flex-col items-center">
            <div className="grid grid-cols-3 gap-x-8 gap-y-8 w-full">
              {visibleEvents.map((event) => (
                <div key={event._id} className="flex justify-center">
                  <EventCard
                    title={event.eventName}
                    date={getValidDate(event.eventDate)}
                    club={event.club}
                    photo={event.photo}
                    status={getSanctionStatus(event)}
                    region={event.region}
                    onDownload={
                      event.entryForm 
                        ? () => window.open(event.entryForm, "_blank")
                        : undefined
                    }
                    website={event.website}
                  />
                </div>
              ))}
            </div>
            {/* Load More Button */}
            {visibleEventsCount < filteredEvents.length && (
              <button
                onClick={handleLoadMore}
                className="mt-8 border border-[#21212133] rounded-[16px] w-[173px] lg:w-[9vw] h-[56px] lg:h-[2.92vw] hover:bg-[#000000] hover:text-white font-[500] text-[16px] lg:text-[0.83vw] text-[#212121]"
              >
                Load More
              </button>
            )}
            {/* Events count indicator */}
            <p className="mt-4 text-gray-600">
              Showing {Math.min(visibleEventsCount, filteredEvents.length)} of {filteredEvents.length} events
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default EventCalendarContent; 
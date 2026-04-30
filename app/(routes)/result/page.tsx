"use client";

import React, { useState, useEffect } from 'react';
import { gql, useQuery } from '@apollo/client';
import { useRouter } from 'next/navigation';
import Header from '@/app/(homepage)/_components/header';
import Footer from '@/app/(homepage)/_components/footer';
import Inquires from '@/app/(homepage)/_components/inquires';

const GET_EVENTS_WITH_POINTS = gql`
  query GetEventsWithPoints {
    getAllEvents {
      _id
      eventName
      eventDate
      club
      type
      region
      result
      public
      createdAt
      isSubmitted
    }
    getAllPoints {
      _id
      entrantId
      points
      entrant {
        _id
        name
        eventId
      }
    }
  }
`;

interface Event {
  _id: string;
  eventDate: string;
  club: string;
  eventName: string;
  type: string;
  region: string;
  result: boolean;
  public: boolean;
  hasResults: boolean;
  season: string;
  createdAt: string;
  isSubmitted: boolean;
}

interface GraphQLResponse {
  getAllEvents: Event[] | null;
  getAllPoints: Array<{
    _id: string;
    entrantId: string;
    points: number;
    entrant: {
      _id: string;
      name: string;
      eventId: string;
    } | null;
  }> | null;
}

const ResultsPage = () => {
  const [selectedSeason, setSelectedSeason] = useState('2025');
  const [eventsWithResults, setEventsWithResults] = useState<Event[]>([]);
  const router = useRouter();
  
  const { loading, error, data } = useQuery<GraphQLResponse>(GET_EVENTS_WITH_POINTS);
  
  useEffect(() => {
    if (!data?.getAllEvents || !data?.getAllPoints) {
      setEventsWithResults([]);
      return;
    }

    const { getAllEvents, getAllPoints } = data;
    
    // Create a set of eventIds that have points
    const eventIdsWithPoints = new Set<string>();
    getAllPoints.forEach((point) => {
      if (point.entrant?.eventId) {
        eventIdsWithPoints.add(point.entrant.eventId);
      }
    });
    
    // Filter events that have results or have points
    const filteredEvents = getAllEvents
      .filter((event) => {
        // First check if event is submitted
        const isSubmittedStr = String(event.isSubmitted).toLowerCase();
        const isEventSubmitted = isSubmittedStr === "true";
        
        // Only show submitted events that also have results or points and are public
        return isEventSubmitted && 
               (event.result === true || eventIdsWithPoints.has(event._id)) && 
               event.public === true;
      })
      .map((event) => {
        // Extract the year from eventDate or createdAt
        let season = "";
        if (event.eventDate) {
          const date = new Date(event.eventDate);
          if (!isNaN(date.getTime())) {
            season = date.getFullYear().toString();
          }
        }
        
        // Fallback to createdAt if eventDate is not valid
        if (!season && event.createdAt) {
          const date = new Date(event.createdAt);
          if (!isNaN(date.getTime())) {
            season = date.getFullYear().toString();
          }
        }
        
        return {
          ...event,
          hasResults: eventIdsWithPoints.has(event._id),
          season: season || selectedSeason
        };
      })
      .filter((event) => 
        !selectedSeason || event.season === selectedSeason
      );
    
    setEventsWithResults(filteredEvents);
  }, [data, selectedSeason]);
  
  const handleEventClick = (eventId: string) => {
    router.push(`/result/${eventId}`);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <div className="max-w-[1200px] mx-auto px-4 py-8">
          <h1 className="text-[4.375vw] font-bold text-center mb-8">Results</h1>
          
          <div className="flex justify-center mb-8">
            <div className="w-[62.917vw]">
              {loading && <div className="text-center p-4">Loading event results...</div>}
              {error && <div className="text-center p-4 text-red-500">Error loading results: {error.message}</div>}
              
              {!loading && !error && (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold"></h2>
                    <select 
                      value={selectedSeason}
                      onChange={(e) => setSelectedSeason(e.target.value)}
                      className="px-4 py-2 border rounded-md"
                    >
                      <option value="">All Seasons</option>
                      <option value="2025">2025</option>
                      <option value="2024">2024</option>
                      <option value="2023">2023</option>
                    </select>
                  </div>
                  
                  {/* Table */}
                  <div className="overflow-x-auto border border-[#DEE2E6] rounded">
                    <table className="w-full">
                      <thead className="bg-[#E9ECEF]">
                        <tr>
                          <th className="px-4 py-2 text-left text-[1.146vw] font-[700] border-b">Event Date</th>
                          <th className="px-4 py-2 text-left text-[1.146vw] font-[700] border-b">Club</th>
                          <th className="px-4 py-2 text-left text-[1.146vw] font-[700] border-b">Event Name</th>
                          <th className="px-4 py-2 text-left text-[1.146vw] font-[700] border-b">Type</th>
                          <th className="px-4 py-2 text-left text-[1.146vw] font-[700] border-b">Season</th>
                          <th className="px-4 py-2 text-left text-[1.146vw] font-[700] border-b">Region</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white">
                        {eventsWithResults.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-4 py-4 text-center">No events with results found</td>
                          </tr>
                        ) : (
                          eventsWithResults.map((event, index) => (
                            <tr 
                              key={event._id} 
                              className={`${index % 2 === 0 ? 'bg-white' : 'bg-[#F2F2F2]'} ${event.hasResults ? 'cursor-pointer hover:bg-gray-200' : ''}`}
                              onClick={event.hasResults ? () => handleEventClick(event._id) : undefined}
                            >
                              <td className="px-4 py-2 text-[0.938vw]">{event.eventDate}</td>
                              <td className="px-4 py-2 text-[0.938vw]">{event.club}</td>
                              <td className="px-4 py-2 text-[0.938vw]">
                                {event.hasResults ? (
                                  <span className="underline font-medium text-black">{event.eventName}</span>
                                ) : (
                                  event.eventName
                                )}
                              </td>
                              <td className="px-4 py-2 text-[0.938vw]">{event.type}</td>
                              <td className="px-4 py-2 text-[0.938vw]">{event.season}</td>
                              <td className="px-4 py-2 text-[0.938vw]">{event.region}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        <Inquires />
      </main>
      <Footer />
    </div>
  );
};

export default ResultsPage; 
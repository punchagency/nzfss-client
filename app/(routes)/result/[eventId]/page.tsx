"use client";

import React, { useState, useEffect } from 'react';
import { gql, useQuery } from '@apollo/client';
import { useRouter } from 'next/navigation';
import Header from '@/app/(homepage)/_components/header';
import Footer from '@/app/(homepage)/_components/footer';
import Inquires from '@/app/(homepage)/_components/inquires';
import Spinner from '@/app/_components/Spinner';
import { MusherResultRows } from '@/app/(routes)/result/_components/musher-result-rows';

const GET_EVENT_RESULTS = gql`
  query GetEventResults($eventId: String!) {
    getEntrantsByEventId(eventId: $eventId) {
      _id
      name
      eventId
      raceFormat
      class
      customClass
      associatedDog {
        driverName
        name
        NZFSSRegistration
        dob
        breed
      }
      raceType
      raceTime
      temperature
      distance
      heat
      dogWeight
      weightPulled
      heatsData {
        heat
        temperature
        distance
        class
      }
    }

    getPointsByEventId(eventId: $eventId) {
      _id
      entrantId
      points
      dogPoints {
        NZFSSRegistration
        points
        cutoffPoints
      }
      heatsData {
        heat
        temperature
        distance
        class
      }
    }

    findEventCalendarById(input: { _id: $eventId }) {
      _id
      eventName
      eventDate
      club
      type
      region
      createdAt
    }
  }
`;

interface Dog {
  driverName: string;
  name: string;
  NZFSSRegistration: string;
  dob: string;
  breed: string;
}

interface HeatData {
  heat: string;
  temperature: string;
  distance: string;
  class: string;
}

interface Entrant {
  _id: string;
  name: string;
  eventId: string;
  raceFormat: string;
  class: string;
  customClass: string;
  associatedDog: Dog[];
  raceType: string;
  raceTime: string;
  temperature?: string;
  distance?: string;
  heat?: string;
  heatsData?: HeatData[];
  dogWeight?: string;
  weightPulled?: string;
}

interface DisplayResultRow {
  _id: string;
  entrant: Entrant;
  musherRank: number;
  points: number;
  dogPoints: DogPoint[];
  heatsData?: HeatData[];
}

interface DogPoint {
  NZFSSRegistration: string;
  points: number;
  cutoffPoints?: number;
}

interface Event {
  _id: string;
  eventName: string;
  eventDate: string;
  club: string;
  type: string;
  region: string;
  createdAt: string;
  season?: string;
}

interface ClassResults {
  [key: string]: {
    title: string;
    results: DisplayResultRow[];
  };
}

import { computeMusherRanks, musherKey } from '@/lib/race-result-grouping';

function normalizeClassKey(entrant: Entrant): string {
  const cls = (entrant.class || '').trim().toLowerCase();
  const custom = (entrant.customClass || '').trim().toLowerCase();
  return `${cls}::${custom}`;
}

export default function EventResultPage({ params }: { params: { eventId: string } }) {
  const eventId = params.eventId;
  const router = useRouter();
  const [eventDetails, setEventDetails] = useState<Event | null>(null);
  const [classResults, setClassResults] = useState<ClassResults>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { loading, error, data } = useQuery(GET_EVENT_RESULTS, {
    variables: { eventId },
    fetchPolicy: "cache-and-network", // Ensure fresh data
    notifyOnNetworkStatusChange: true,
    onError: (error) => {
      // Set error message but don't redirect
      setErrorMessage(error.message || "Error loading results");
    }
  });
  
  useEffect(() => {
    if (data) {
      console.log('Raw data from query:', data);
      
      // Set event details
      if (data.findEventCalendarById) {
        // Extract season from eventDate or createdAt
        let season = "";
        const eventData = data.findEventCalendarById;
        
        if (eventData.eventDate) {
          const date = new Date(eventData.eventDate);
          if (!isNaN(date.getTime())) {
            season = date.getFullYear().toString();
          }
        }
        
        // Fallback to createdAt
        if (!season && eventData.createdAt) {
          const date = new Date(eventData.createdAt);
          if (!isNaN(date.getTime())) {
            season = date.getFullYear().toString();
          }
        }
        
        setEventDetails({
          ...eventData,
          season
        });
      }
      
      // Same source as admin View Result: entrants per heat row
      if (data.getEntrantsByEventId?.length) {
        const entrants = data.getEntrantsByEventId as Entrant[];
        const pointsByEntrantId = new Map<
          string,
          { points: number; dogPoints: DogPoint[]; heatsData?: HeatData[] }
        >();

        for (const point of data.getPointsByEventId || []) {
          pointsByEntrantId.set(point.entrantId, {
            points: point.points ?? 0,
            dogPoints: point.dogPoints || [],
            heatsData: point.heatsData,
          });
        }

        const resultsByClass: ClassResults = {};
        const entrantsByClass = new Map<string, Entrant[]>();

        for (const entrant of entrants) {
          const classKey = normalizeClassKey(entrant);
          if (!entrantsByClass.has(classKey)) entrantsByClass.set(classKey, []);
          entrantsByClass.get(classKey)!.push(entrant);
        }

        for (const [classKey, classEntrants] of entrantsByClass) {
          const musherRanks = computeMusherRanks(classEntrants);
          const sample = classEntrants[0];
          const customLabel = sample.customClass?.trim();

          const rows: DisplayResultRow[] = classEntrants.map((entrant) => {
            const scored = pointsByEntrantId.get(entrant._id);
            return {
              _id: entrant._id,
              entrant,
              musherRank: musherRanks.get(musherKey(entrant.name)) ?? 0,
              points: scored?.points ?? 0,
              dogPoints: scored?.dogPoints ?? [],
              heatsData: scored?.heatsData ?? entrant.heatsData,
            };
          });

          resultsByClass[classKey] = {
            title: customLabel ? `${sample.class} - ${customLabel}` : sample.class,
            results: rows,
          };
        }

        setClassResults(resultsByClass);
      }
    }
  }, [data, eventId]);
  
  const handleBack = () => {
    router.push('/result');
  };
  
  // Show loading state
  if (loading) return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <div className="max-w-[1200px] mx-auto px-4 py-8 text-center">
          <div className="flex justify-center py-10">
            <Spinner size="large" text="Loading results..." />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
  
  // Show error state but with back button
  if (errorMessage || error) return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <div className="max-w-[1200px] mx-auto px-4 py-8 text-center">
          <h1 className="text-[3.5vw] font-[600] mb-8">Error</h1>
          <p className="text-red-500 mb-6">{errorMessage || (error ? error.message : "Failed to load results")}</p>
          <button 
            onClick={handleBack}
            className="px-6 py-2 bg-black text-white rounded-md hover:bg-gray-800"
          >
            Back to Results
          </button>
        </div>
      </main>
      <Footer />
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-grow py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <button 
              onClick={handleBack}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mb-4 sm:mb-0"
            >
              <span className="mr-2">&larr;</span> Back
            </button>
            <h1 className="text-3xl font-bold text-gray-900">
              {eventDetails?.eventName || 'Event Results'}
            </h1>
          </div>
          
          {eventDetails && (
            <div className="mb-8 bg-white shadow overflow-hidden rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Date</dt>
                    <dd className="mt-1 text-sm text-gray-900">{eventDetails.eventDate}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Club</dt>
                    <dd className="mt-1 text-sm text-gray-900">{eventDetails.club}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Type</dt>
                    <dd className="mt-1 text-sm text-gray-900">{eventDetails.type}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Region</dt>
                    <dd className="mt-1 text-sm text-gray-900">{eventDetails.region}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Season</dt>
                    <dd className="mt-1 text-sm text-gray-900">{eventDetails.season || 'Unknown'}</dd>
                  </div>
                </dl>
              </div>
            </div>
          )}
          
          {Object.keys(classResults).length === 0 ? (
            <div className="text-center py-12 bg-white shadow rounded-lg">
              <p className="text-lg text-gray-500">No results found for this event.</p>
            </div>
          ) : (
            Object.entries(classResults).map(([classKey, data]) => (
              <div key={classKey} className="mb-8">
                <div className="bg-gray-800 text-white px-6 py-4 rounded-t-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-xl font-semibold">{data.title}</h2>
                    <div className="mt-2 sm:mt-0 flex flex-wrap gap-4 text-sm">
                      {(() => {
                        // Collect all unique heats from all results in this class
                        const allHeats = new Map<string, HeatData>();
                        data.results.forEach(result => {
                          if (result.heatsData && result.heatsData.length > 0) {
                            result.heatsData.forEach(heat => {
                              allHeats.set(heat.heat, heat);
                            });
                          }
                        });
                        
                        const uniqueHeats = Array.from(allHeats.values());
                        
                        return uniqueHeats.length > 0 ? (
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                              <span className="mr-1">🔥</span>
                              <span>{uniqueHeats.length} heat(s)</span>
                            </div>
                            <div className="grid grid-cols-1 gap-1 text-xs">
                              {uniqueHeats.map((heat, index) => (
                                <div key={index} className="flex items-center gap-2 bg-gray-700/50 px-2 py-1 rounded">
                                  <span className="font-medium">{heat.heat}:</span>
                                  <span className="flex items-center gap-1">
                                    <span className="text-gray-300">🌡️</span>
                                    {heat.temperature}°C
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <span className="text-gray-300">📏</span>
                                    {(() => {
                                      const firstEntrant = data.results[0]?.entrant;
                                      const isWeightpull = firstEntrant && (
                                        firstEntrant.raceType === 'weightpull' ||
                                        firstEntrant.class?.toLowerCase().includes('weight') ||
                                        firstEntrant.class?.toLowerCase().includes('pull') ||
                                        firstEntrant.customClass?.toLowerCase().includes('weight') ||
                                        firstEntrant.customClass?.toLowerCase().includes('pull')
                                      );
                                      if (isWeightpull) {
                                        return heat.distance && heat.distance.trim() !== "" 
                                          ? (heat.distance.includes('metres') ? heat.distance : `${heat.distance} metres`)
                                          : "10 metres";
                                      }
                                      return heat.distance.includes('km') ? heat.distance : `${heat.distance}km`;
                                    })()}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                        <div className="flex items-center gap-4">
                          <div className="flex items-center">
                            <span className="mr-1">🌡️</span>
                            <span>
                              {data.results[0]?.entrant.temperature && (data.results[0].entrant.temperature || '').trim() !== ""
                                ? (data.results[0].entrant.temperature || '').trim() + "°C"
                                : 'N/A'}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <span className="mr-1">📏</span>
                            <span>
                              {(() => {
                                const firstEntrant = data.results[0]?.entrant;
                                const isWeightpull = firstEntrant && (
                                  firstEntrant.raceType === 'weightpull' ||
                                  firstEntrant.class?.toLowerCase().includes('weight') ||
                                  firstEntrant.class?.toLowerCase().includes('pull') ||
                                  firstEntrant.customClass?.toLowerCase().includes('weight') ||
                                  firstEntrant.customClass?.toLowerCase().includes('pull')
                                );
                                const distance = data.results[0]?.entrant.distance;
                                
                                if (isWeightpull) {
                                  if (distance && distance.trim() !== "") {
                                    return distance.includes('metres') ? distance : `${distance} metres`;
                                  }
                                  return "10 metres";
                                }
                                
                                if (distance && distance !== "") {
                                  return distance.includes('km') ? distance : `${distance}km`;
                                }
                                return 'N/A';
                              })()}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <span className="mr-1">🔥</span>
                            <span>1 heat</span>
                          </div>
                        </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
                
                <div className="overflow-x-auto bg-white shadow-md rounded-b-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr className="bg-gray-50">
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Musher</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dog(s)</th>
                        {(() => {
                          const firstEntrant = data.results[0]?.entrant;
                          const isWeightpull = firstEntrant && (
                            firstEntrant.raceType === 'weightpull' ||
                            firstEntrant.class?.toLowerCase().includes('weight') ||
                            firstEntrant.class?.toLowerCase().includes('pull') ||
                            firstEntrant.customClass?.toLowerCase().includes('weight') ||
                            firstEntrant.customClass?.toLowerCase().includes('pull')
                          );
                          if (isWeightpull) {
                            return (
                              <>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dog Weight</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weight Pulled</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Race Time</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dog Points</th>
                              </>
                            );
                          }
                          return (
                            <>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Race Time</th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dog Points</th>
                            </>
                          );
                        })()}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <MusherResultRows rows={data.results} classKey={classKey} />
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
      <Inquires />
      <Footer />
    </div>
  );
}
"use client";

import React, { useState, useEffect } from 'react';
import { gql, useQuery } from '@apollo/client';
import { useRouter } from 'next/navigation';
import Header from '@/app/(homepage)/_components/header';
import Footer from '@/app/(homepage)/_components/footer';
import Inquires from '@/app/(homepage)/_components/inquires';
import Spinner from '@/app/_components/Spinner';

const GET_EVENT_RESULTS = gql`
  query GetEventResults($eventId: String!) {
    getAllPoints {
      _id
      entrantId
      points
      dogPoints {
        NZFSSRegistration
        points
      }
      heatsData {
        heat
        temperature
        distance
        class
      }
      createdAt
      updatedAt
      entrant {
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
        dogWeight
        weightPulled
      }
    }

    getMushers {
      id
      name
      registrationNo
      kennelRegistrationNo
      club
      dogs {
        _id
        name
        pedigreeName
        nzkcNo
        nzfssNo
        dateOfBirth
        breed
        deceased
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

interface MusherDog {
  _id: string;
  name: string;
  pedigreeName?: string;
  nzkcNo?: string;
  nzfssNo?: string;
  dateOfBirth?: string;
  breed?: string;
  deceased: boolean;
}

interface Musher {
  id: string;
  name: string;
  registrationNo: string;
  kennelRegistrationNo: string;
  club: string;
  dogs: MusherDog[];
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
  heatsData?: HeatData[];
  dogWeight?: string;
  weightPulled?: string;
}

interface DogPoint {
  NZFSSRegistration: string;
  points: number;
}

interface Point {
  _id: string;
  entrantId: string;
  points: number;
  dogPoints: DogPoint[] | null;
  heatsData?: HeatData[];
  createdAt: string;
  updatedAt: string;
  entrant: Entrant;
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
    results: Point[];
  };
}

// Helper function to get the display name for dogs (pedigree name if available, otherwise regular name)
const getDogDisplayName = (dog: Dog, pedigreeMap: Map<string, string>): string => {
  // Try to find pedigree name by NZFSSRegistration
  const pedigreeName = pedigreeMap.get(dog.NZFSSRegistration);
  if (pedigreeName && pedigreeName.trim() !== '') {
    return pedigreeName;
  }
  
  // Fall back to regular name
  return dog.name || '';
};

export default function EventResultPage({ params }: { params: { eventId: string } }) {
  const eventId = params.eventId;
  const router = useRouter();
  const [eventDetails, setEventDetails] = useState<Event | null>(null);
  const [classResults, setClassResults] = useState<ClassResults>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pedigreeMap, setPedigreeMap] = useState<Map<string, string>>(new Map());
  
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
      
      // Debug the getAllPoints data specifically
      if (data.getAllPoints) {
        console.log('Total getAllPoints count:', data.getAllPoints.length);
        console.log('Sample point (first):', data.getAllPoints[0]);
        console.log('Sample point heatsData (first):', data.getAllPoints[0]?.heatsData);
        
        // Check if ANY point has heatsData
        const pointsWithHeats = data.getAllPoints.filter((point: Point) => point.heatsData && point.heatsData.length > 0);
        console.log('Points with heatsData:', pointsWithHeats.length);
        if (pointsWithHeats.length > 0) {
          console.log('First point with heatsData:', pointsWithHeats[0]);
        }
      }
      
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
      
      // Create pedigree name lookup map from musher data
      const newPedigreeMap = new Map<string, string>();
      if (data.getMushers) {
        data.getMushers.forEach((musher: Musher) => {
          musher.dogs.forEach((dog: MusherDog) => {
            if (dog.nzfssNo && dog.pedigreeName && dog.pedigreeName.trim() !== '') {
              newPedigreeMap.set(dog.nzfssNo, dog.pedigreeName);
            }
          });
        });
      }
      setPedigreeMap(newPedigreeMap);

      // Process points data
      if (data.getAllPoints) {
        const pointsForEvent = data.getAllPoints.filter(
          (point: Point) => point.entrant && point.entrant.eventId === eventId
        );
        
        console.log('Filtered points for event:', pointsForEvent);
        console.log('First point heatsData:', pointsForEvent[0]?.heatsData);
        console.log('First point entrant:', pointsForEvent[0]?.entrant);
        
        // Debug heatsData for all points
        pointsForEvent.forEach((point: Point, index: number) => {
          console.log(`Point ${index} heatsData:`, point.heatsData);
          console.log(`Point ${index} heatsData length:`, point.heatsData?.length);
        });
        
        // Group results by class
        const resultsByClass: ClassResults = {};
        
        pointsForEvent.forEach((point: Point) => {
          console.log('Processing point:', {
            id: point._id,
            heatsData: point.heatsData,
            entrant: point.entrant,
            points: point.points
          });
          
          const classKey = `${point.entrant.class}-${point.entrant.customClass}`;
          if (!resultsByClass[classKey]) {
            resultsByClass[classKey] = {
              title: `${point.entrant.class} - ${point.entrant.customClass}`,
              results: []
            };
          }
          resultsByClass[classKey].results.push(point);
        });
        
        // Sort each class results by points (descending)
        Object.keys(resultsByClass).forEach(classKey => {
          resultsByClass[classKey].results.sort((a, b) => b.points - a.points);
          console.log(`Class ${classKey} first result:`, {
            heatsData: resultsByClass[classKey].results[0]?.heatsData,
            entrant: resultsByClass[classKey].results[0]?.entrant
          });
        });
        
        console.log('Processed results by class:', resultsByClass);
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
                      {data.results.map((point, index) => {
                        const isWeightpull = point.entrant && (
                          point.entrant.raceType === 'weightpull' ||
                          point.entrant.class?.toLowerCase().includes('weight') ||
                          point.entrant.class?.toLowerCase().includes('pull') ||
                          point.entrant.customClass?.toLowerCase().includes('weight') ||
                          point.entrant.customClass?.toLowerCase().includes('pull')
                        );
                        return (
                          <tr key={point._id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{index + 1}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{point.entrant.name}</td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {point.entrant.associatedDog.map(dog => getDogDisplayName(dog, pedigreeMap)).join(', ')}
                            </td>
                            {isWeightpull ? (
                              <>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                  {point.entrant.dogWeight ? `${point.entrant.dogWeight} kg` : 'N/A'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                  {point.entrant.weightPulled ? `${point.entrant.weightPulled} kg` : 'N/A'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{point.entrant.raceTime || 'N/A'}</td>
                                <td className="px-6 py-4 text-sm text-gray-900">
                                  <div className="space-y-1">
                                    {point.entrant.associatedDog.map((dog, i) => {
                                      const dogPoint = point.dogPoints?.find(dp => 
                                        dp.NZFSSRegistration === dog.NZFSSRegistration
                                      );
                                      return (
                                        <div key={i} className="flex items-center gap-2">
                                          <span className="font-medium text-gray-900">
                                            {dogPoint ? dogPoint.points : '0'}
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{point.entrant.raceTime || 'N/A'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{point.points}</td>
                                <td className="px-6 py-4 text-sm text-gray-900">
                                  <div className="space-y-1">
                                    {point.entrant.associatedDog.map((dog, i) => {
                                      const dogPoint = point.dogPoints?.find(dp => 
                                        dp.NZFSSRegistration === dog.NZFSSRegistration
                                      );
                                      return (
                                        <div key={i} className="flex items-center gap-2">
                                          <span className="font-medium text-gray-900">
                                            {dogPoint ? dogPoint.points : '0'}
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </td>
                              </>
                            )}
                          </tr>
                        );
                      })}
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
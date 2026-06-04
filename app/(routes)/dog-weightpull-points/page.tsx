"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@apollo/client';
import { GET_DOG_WEIGHTPULL_POINTS } from '@/graphql/query/points';
import Header from '@/app/(homepage)/_components/header';
import Footer from '@/app/(homepage)/_components/footer';
import Inquires from '@/app/(homepage)/_components/inquires';
import { Loading } from '@/components/skeleton';

interface DogWeightpullPoint {
  regNumber: string;
  pedigreeName: string;
  breed: string;
  maxWeight: number;
  maxBWR: number;
  points: number;
  awards: string;
  bwrAchievements: {
    twelveX: number;
    fifteenX: number;
    sixteenX: number;
  };
  hasWonClass: boolean;
}

interface WprPoint {
  _id: string;
  dogId?: string | null;
  wprFlag?: string | null;
  wprReg?: string | null;
  wprPedigreeName?: string | null;
  wprBreed?: string | null;
  wprMaxWeight?: number | null;
  wprMaxBWR?: number | null;
  wprPoints?: number | null;
  wprAwards?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Dog {
  driverName: string;
  name: string;
  NZFSSRegistration: string;
  dob: string;
  breed: string;
}

interface Entrant {
  _id: string;
  name: string;
  raceFormat: string;
  class: string;
  customClass: string;
  associatedDog: Dog[];
  raceType: string;
  dogWeight: string;
  weightPulled: string;
  eventId: string;
  createdAt: string;
}

interface Point {
  _id: string;
  entrantId: string;
  points: number;
  dogPoints: {
    NZFSSRegistration: string;
    points: number;
  }[];
  createdAt: string;
  updatedAt: string;
}

interface Event {
  _id: string;
  eventName: string;
  eventDate: string;
  club: string;
  clubId: string;
  region: string;
}

const DogWeightpullPointsPage = () => {
  const [regId, setRegId] = useState('');
  const [breed, setBreed] = useState('');
  const [name, setName] = useState('');
  const [isDeceased, setIsDeceased] = useState(false);
  const [filteredData, setFilteredData] = useState<DogWeightpullPoint[]>([]);
  const [isFiltered, setIsFiltered] = useState(false);
  
  // Load More state (replacing pagination)
  const [displayedRecords, setDisplayedRecords] = useState(25);
  const [allData, setAllData] = useState<DogWeightpullPoint[]>([]);

  // Fetch the data from GraphQL
  const { loading, error, data } = useQuery(GET_DOG_WEIGHTPULL_POINTS, {
    fetchPolicy: 'network-only'
  });

  useEffect(() => {
    if (data) {
      const weightpullEntrants = data.getAllEntrants.filter((entrant: Entrant) => {
        return (
          entrant.raceType === 'weightpull' || 
          entrant.class?.toLowerCase().includes('weight') ||
          entrant.class?.toLowerCase().includes('pull') ||
          entrant.customClass?.toLowerCase().includes('weight') ||
          entrant.customClass?.toLowerCase().includes('pull')
        );
      });

      // Calculate points data from entrants
      const calculatedPointsData = calculatePointsData(weightpullEntrants);
      
      // Get WPR points data from collection
      const wprPointsData = data.getAllWprPoints || [];
      
      // Merge both data sources
      const mergedData = mergeWprData(calculatedPointsData, wprPointsData);
      
      // Sort by points descending
      const sortedData = mergedData.sort((a, b) => b.points - a.points);
      
      setAllData(sortedData);
      setFilteredData(sortedData);
    }
  }, [data]);

  const getAwards = (dogData: Omit<DogWeightpullPoint, 'awards'>): string => {
    // WPCh requirements: 225 points + 15x+ at least 5 times + (won class OR 16x+ once)
    // Note: 16x pulls also count toward the "15x+ at least 5 times" requirement
    if (dogData.points >= 225 && 
        (dogData.bwrAchievements.fifteenX + dogData.bwrAchievements.sixteenX) >= 5 && 
        (dogData.hasWonClass || dogData.bwrAchievements.sixteenX > 0)) {
      return 'WPCh';
    }
    
    // WPX requirements: 150 points + 12x+ at least 5 times
    if (dogData.points >= 150 && 
        (dogData.bwrAchievements.twelveX + dogData.bwrAchievements.fifteenX + dogData.bwrAchievements.sixteenX) >= 5) {
      return 'WPX';
    }
    
    // WP requirements: 75 points
    if (dogData.points >= 75) {
      return 'WP';
    }
    
    return 'N/A';
  };

  // Function to merge calculated data with WPR points collection data
  const mergeWprData = (calculatedData: DogWeightpullPoint[], wprData: WprPoint[]): DogWeightpullPoint[] => {
    const mergedMap: Record<string, DogWeightpullPoint> = {};
    
    // First, add all calculated data
    calculatedData.forEach(dog => {
      mergedMap[dog.regNumber] = dog;
    });
    
    // Then, merge in WPR points collection data
    wprData.forEach(wprPoint => {
      // Use wprReg if available, then wprFlag, otherwise use pedigree name as identifier
      const identifier = wprPoint.dogId || wprPoint.wprReg || wprPoint.wprFlag || `wpr_${wprPoint._id}`;
      
      if (!identifier) return; // Skip if we can't identify the record
      
      if (mergedMap[identifier]) {
        // Update existing entry with WPR data (prioritize WPR collection data)
        const existing = mergedMap[identifier];
        mergedMap[identifier] = {
          ...existing,
          pedigreeName: wprPoint.wprPedigreeName || existing.pedigreeName,
          breed: wprPoint.wprBreed || existing.breed,
          maxWeight: Math.max(wprPoint.wprMaxWeight || 0, existing.maxWeight),
          maxBWR: Math.max(wprPoint.wprMaxBWR || 0, existing.maxBWR),
          points: (wprPoint.wprPoints || 0) + existing.points, // Add WPR points to calculated points
          awards: wprPoint.wprAwards || existing.awards
        };
      } else {
        // Create new entry from WPR data
        mergedMap[identifier] = {
          regNumber: wprPoint.wprReg || wprPoint.wprFlag || 'N/A',
          pedigreeName: wprPoint.wprPedigreeName || 'Unknown',
          breed: wprPoint.wprBreed || 'Unknown',
          maxWeight: wprPoint.wprMaxWeight || 0,
          maxBWR: wprPoint.wprMaxBWR || 0,
          points: wprPoint.wprPoints || 0,
          awards: wprPoint.wprAwards || 'N/A',
          bwrAchievements: {
            twelveX: 0,
            fifteenX: 0,
            sixteenX: 0
          },
          hasWonClass: false
        };
      }
    });
    
    return Object.values(mergedMap);
  };

  // Extract points calculation logic into a separate function for reuse
  const calculatePointsData = (weightpullEntrants: Entrant[]) => {
    // Group entrants by class for points calculation
    const entrantsByClass: Record<string, Entrant[]> = {};
    weightpullEntrants.forEach((entrant: Entrant) => {
      const classKey = `${entrant.class}${entrant.customClass ? `-${entrant.customClass}` : ''}`;
      if (!entrantsByClass[classKey]) {
        entrantsByClass[classKey] = [];
      }
      entrantsByClass[classKey].push(entrant);
    });

    // Create a map of NZFSSRegistration to total points from all events
    const dogPointsMap: Record<string, { 
      regNumber: string;
      name: string;
      pedigreeName: string;
      breed: string;
      maxWeight: number;
      maxBWR: number;
      points: number;
      bwrAchievements: {
        twelveX: number;
        fifteenX: number;
        sixteenX: number;
      };
      hasWonClass: boolean;
    }> = {};

    // Process each class of entrants
    Object.values(entrantsByClass).forEach(entrantsInClass => {
      // Calculate points for each entrant using Championship Weightpull Dog System
      entrantsInClass.forEach(entrant => {
        if (entrant.associatedDog && entrant.associatedDog.length > 0) {
          const weightPulled = parseFloat(entrant.weightPulled || '0');
          const dogWeight = parseFloat(entrant.dogWeight || '0');
          
          // Skip if weight data is invalid
          if (isNaN(weightPulled) || isNaN(dogWeight) || dogWeight <= 0) {
            return;
          }
          
          // Calculate ratio (weight pulled / dog weight)
          const ratio = weightPulled / dogWeight;
          
          // Continue processing even if dog didn't pull 10x body weight (for ranking calculations)
          // but they won't receive points
          
          // Get all entrants with valid weight data (for ranking calculations)
          const validEntrants = entrantsInClass.filter(e => {
            const ePulled = parseFloat(e.weightPulled || '0');
            const eDogWeight = parseFloat(e.dogWeight || '0');
            return !isNaN(ePulled) && !isNaN(eDogWeight) && eDogWeight > 0;
          });
          
          // Sort entrants by weight pulled (highest first)
          const sortedByWeight = [...validEntrants].sort((a, b) => {
            const aWeight = parseFloat(a.weightPulled || '0');
            const bWeight = parseFloat(b.weightPulled || '0');
            return bWeight - aWeight;
          });
          
          // Sort entrants by ratio (highest first)
          const sortedByRatio = [...validEntrants].sort((a, b) => {
            const aRatio = parseFloat(a.dogWeight || '0') > 0 
              ? parseFloat(a.weightPulled || '0') / parseFloat(a.dogWeight || '0') 
              : 0;
            const bRatio = parseFloat(b.dogWeight || '0') > 0 
              ? parseFloat(b.weightPulled || '0') / parseFloat(b.dogWeight || '0') 
              : 0;
            return bRatio - aRatio;
          });
          
          // Find position in both sorted lists
          const weightPosition = sortedByWeight.findIndex(e => e._id === entrant._id);
          const ratioPosition = sortedByRatio.findIndex(e => e._id === entrant._id);
          
          if (weightPosition !== -1 && ratioPosition !== -1) {
            // Calculate points using the formula: t = (w + 1) + (r + 1)
            const dogsDefeatedByWeight = validEntrants.length - 1 - weightPosition;
            const dogsDefeatedByRatio = validEntrants.length - 1 - ratioPosition;
            const points = (dogsDefeatedByWeight + 1) + (dogsDefeatedByRatio + 1);
            
            // Add points to each dog in this entrant
            entrant.associatedDog.forEach(dog => {
              if (dog.NZFSSRegistration && dog.NZFSSRegistration.trim() !== '') {
                if (!dogPointsMap[dog.NZFSSRegistration]) {
                  dogPointsMap[dog.NZFSSRegistration] = {
                    regNumber: dog.NZFSSRegistration,
                    name: dog.name,
                    pedigreeName: dog.name,
                    breed: dog.breed,
                    maxWeight: weightPulled,
                    maxBWR: Math.round(ratio * 10) / 10, // Round to 1 decimal place
                    points: 0,
                    bwrAchievements: {
                      twelveX: 0,
                      fifteenX: 0,
                      sixteenX: 0
                    },
                    hasWonClass: false
                  };
                }
                
                // Update max weight and BWR if higher
                if (weightPulled > dogPointsMap[dog.NZFSSRegistration].maxWeight) {
                  dogPointsMap[dog.NZFSSRegistration].maxWeight = weightPulled;
                }
                
                if (ratio > dogPointsMap[dog.NZFSSRegistration].maxBWR) {
                  dogPointsMap[dog.NZFSSRegistration].maxBWR = Math.round(ratio * 10) / 10;
                }
                
                // Add points from this event (only if eligible - ratio >= 10x)
                if (ratio >= 10) {
                  dogPointsMap[dog.NZFSSRegistration].points += points;
                }

                // Track BWR achievements (only for eligible pulls - ratio >= 10x)
                if (ratio >= 12) {
                  if (ratio >= 16) {
                    dogPointsMap[dog.NZFSSRegistration].bwrAchievements.sixteenX++;
                  } else if (ratio >= 15) {
                    dogPointsMap[dog.NZFSSRegistration].bwrAchievements.fifteenX++;
                  } else {
                    dogPointsMap[dog.NZFSSRegistration].bwrAchievements.twelveX++;
                  }
                }

                // Track if the dog won its class (highest weight pulled and eligible)
                if (weightPosition === 0 && ratio >= 10) {
                  dogPointsMap[dog.NZFSSRegistration].hasWonClass = true;
                }
              }
            });
          }
        }
      });
    });

    // Convert map to array for display
    return Object.values(dogPointsMap).map(dogData => ({
      ...dogData,
      awards: getAwards(dogData)
    }));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset to original data if all search fields are empty
    if (!regId && !breed && !name) {
      setFilteredData(allData);
      setIsFiltered(false);
      setDisplayedRecords(25);
      return;
    }
    
    // Filter the data based on search criteria
    const filtered = allData.filter((dog) => {
      const regMatch = regId ? dog.regNumber.toLowerCase().includes(regId.toLowerCase().trim()) : true;
      const breedMatch = breed ? dog.breed.toLowerCase().includes(breed.toLowerCase().trim()) : true;
      const nameMatch = name ? dog.pedigreeName.toLowerCase().includes(name.toLowerCase().trim()) : true;
      
      return regMatch && breedMatch && nameMatch;
    });

    setFilteredData(filtered);
    setIsFiltered(true);
    setDisplayedRecords(25); // Reset to show first 25 when filtering
  };

  const handleReset = () => {
    setRegId('');
    setBreed('');
    setName('');
    setIsDeceased(false);
    setFilteredData(allData);
    setIsFiltered(false);
    setDisplayedRecords(25); // Reset to show first 25 when resetting
  };

  if (loading) return <Loading />;
  
  if (error) return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <div className="max-w-[1200px] mx-auto px-4 py-8">
          <h1 className="text-[4.375vw] font-[700] text-center mb-16">Dog Weightpull Points</h1>
          <div className="text-center text-red-500">
            Error loading data: {error.message}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <div className="max-w-[1200px] mx-auto px-4 py-8">
          <h1 className="text-[4.375vw] font-[700] text-center mb-16">Dog Weightpull Points</h1>
          
          {/* Search Section */}
          <form onSubmit={handleSearch} className="flex gap-4 mb-8 justify-center">
            <input
              type="text"
              placeholder="Reg#"
              value={regId}
              onChange={(e) => setRegId(e.target.value)}
              className="px-4 py-2 border rounded-[16px] w-64"
            />
            
            <input
              type="text"
              placeholder="Breed"
              value={breed}
              onChange={(e) => setBreed(e.target.value)}
              className="px-4 py-2 border rounded-[16px] w-64"
            />

            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="px-4 py-2 border rounded-[16px] w-64"
            />
            
            <button 
              type="submit"
              className="px-8 py-2 bg-black text-white rounded-[16px] hover:bg-gray-800"
            >
              Search
            </button>
            
            {isFiltered && (
              <button 
                type="button"
                onClick={handleReset}
                className="px-8 py-2 bg-gray-200 text-gray-800 rounded-[16px] hover:bg-gray-300"
              >
                Reset
              </button>
            )}
          </form>

          {/* Results count */}
          <div className="mb-4 text-sm text-gray-600">
            Showing {displayedRecords} of {filteredData.length} records
            {isFiltered && <span className=" ml-2 text-blue-600">(filtered)</span>}
          </div>

          {/* Table Section */}
          <div className="overflow-x-auto border border-[#DEE2E6] rounded">
            <table className="w-full">
              <thead className="bg-[#E9ECEF]">
                <tr>
                  <th className="px-4 py-2 text-left text-[1.146vw] font-[700] border-b">Reg Number</th>
                  <th className="px-4 py-2 text-left text-[1.146vw] font-[700] border-b">Pedigree Name</th>
                  <th className="px-4 py-2 text-left text-[1.146vw] font-[700] border-b">Breed</th>
                  <th className="px-4 py-2 text-left text-[1.146vw] font-[700] border-b">Max Weight</th>
                  <th className="px-4 py-2 text-left text-[1.146vw] font-[700] border-b">Max BWR</th>
                  <th className="px-4 py-2 text-left text-[1.146vw] font-[700] border-b">Points</th>
                  <th className="px-4 py-2 text-left text-[1.146vw] font-[700] border-b">Awards</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {filteredData.length > 0 ? (
                  filteredData.slice(0, displayedRecords).map((dog, index) => (
                    <tr key={`${dog.regNumber}-${index}`} className={index % 2 === 0 ? 'bg-white' : 'bg-[#F2F2F2]'}>
                      <td className="px-4 py-2 text-[0.938vw]">{dog.regNumber}</td>
                      <td className="px-4 py-2 text-[0.938vw]">{dog.pedigreeName}</td>
                      <td className="px-4 py-2 text-[0.938vw]">{dog.breed}</td>
                      <td className="px-4 py-2 text-[0.938vw]">{dog.maxWeight}</td>
                      <td className="px-4 py-2 text-[0.938vw]">{dog.maxBWR}x</td>
                      <td className="px-4 py-2 text-[0.938vw]">{dog.points}</td>
                      <td className="px-4 py-2 text-[0.938vw]">{dog.awards}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      No dog weightpull points data found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Load More Button */}
          {displayedRecords < filteredData.length && (
            <div className="mt-6 text-center">
              <button
                onClick={() => setDisplayedRecords(displayedRecords + 25)}
                className="px-8 py-2 bg-black text-white rounded-[16px] hover:bg-gray-800"
              >
                Load More
              </button>
            </div>
          )}
        </div>
        <Inquires />
      </main>
      <Footer />
    </div>
  );
};

export default DogWeightpullPointsPage;
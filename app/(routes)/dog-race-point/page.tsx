"use client";

import React, { useState, useEffect } from 'react';
import Header from '@/app/(homepage)/_components/header';
import Footer from '@/app/(homepage)/_components/footer';
import Inquires from '@/app/(homepage)/_components/inquires';
import { gql, useQuery } from '@apollo/client';
import { GET_DOG_RACE_POINTS } from '@/graphql/query/points';

interface DogPoint {
  NZFSSRegistration: string;
  points: number;
}

interface Point {
  _id: string;
  entrantId: string;
  points: number;
  cutoffTime?: string;
  dogPoints?: DogPoint[];
  createdAt: string;
  updatedAt: string;
  entrant: {
    _id: string;
    name: string;
    raceFormat: string;
    class: string;
    customClass: string;
    associatedDog: {
      driverName: string;
      name: string;
      NZFSSRegistration: string;
      dob: string;
      breed: string;
    }[];
    raceType: string;
    raceTime: string | null;
    eventId: string;
  } | null;
}

interface RcrPoint {
  _id: string;
  rcrFlag?: string;
  rcrReg?: string;
  rcrPedigreeName?: string;
  rcrBreed?: string;
  rcrPoints?: number;
  rcrEvents?: number;
  rcrAwards?: string;
  rcrCutoff?: string;
  createdAt: string;
  updatedAt: string;
}

interface Dog {
  name: string;
  regNumber: string;
  breed: string;
  points: number;
  pointsOutsideCutoff: number; // Points outside of cutoff time
  events: number;
  drivers: {
    name: string;
    points: number;
    events: number;
  }[];
  raceFormats: string[];
  cutoff: number | null;
  cutoffSum: number; // Sum of all cutoff times
  cutoffCount: number; // Count of events with cutoff
  awards: string;
  positions: {
    first: number;
    second: number;
    third: number;
  };
  isFromCollection?: boolean; // Flag to identify if data comes from rcrpoints collection
}

// Add a type guard function to check if entrant is not null
function hasValidEntrant(point: Point): point is Point & { entrant: NonNullable<Point['entrant']> } {
  return point.entrant !== null;
}

// Add a type guard function to check if entrant has valid associated dogs
function hasValidDogs(point: Point): point is Point & { 
  entrant: NonNullable<Point['entrant']> & { 
    associatedDog: NonNullable<Point['entrant']>['associatedDog'] & { length: number } 
  } 
} {
  return point.entrant !== null && 
         point.entrant.associatedDog !== undefined && 
         point.entrant.associatedDog.length > 0;
}

// Function to round points based on decimal thresholds (>0.25 -> 0.5, >0.75 -> next whole number)
function roundToHalf(value: number): number {
  const wholePart = Math.floor(value);
  const decimalPart = value - wholePart;
  
  if (decimalPart <= 0.25) {
    return wholePart;
  } else if (decimalPart <= 0.75) {
    return wholePart + 0.5;
  } else {
    return wholePart + 1;
  }
}

// Function to format points display (no .0 for whole numbers)
function formatPoints(value: number): string {
  const rounded = roundToHalf(value);
  return rounded % 1 === 0 ? rounded.toString() : rounded.toFixed(1);
}

// Function to convert time string to seconds for proper comparison
function parseTimeToSeconds(timeString: string): number {
  if (!timeString || timeString.trim() === '') return 0;
  
  // Handle formats like "00:21:25" or "00:17:08.77"
  const parts = timeString.split(':');
  if (parts.length < 2) return 0;
  
  const hours = parseInt(parts[0]) || 0;
  const minutes = parseInt(parts[1]) || 0;
  const seconds = parseFloat(parts[2]) || 0;
  
  return hours * 3600 + minutes * 60 + seconds;
}

// Function to convert seconds back to readable time format with periods
function formatSecondsToTime(totalSeconds: number): string {
  if (!totalSeconds || totalSeconds <= 0) return '0';
  
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60); 
  const seconds = Math.floor(totalSeconds % 60);
  
  if (hours > 0) {
    // For hours format: only show .00 if needed
    if (seconds === 0 && minutes === 0) {
      return `${hours}`;
    } else if (seconds === 0) {
      return `${hours}.${minutes.toString().padStart(2, '0')}`;
    } else {
      return `${hours}.${minutes.toString().padStart(2, '0')}.${seconds.toString().padStart(2, '0')}`;
    }
  } else {
    // For minutes format: only show .00 if seconds > 0
    if (seconds === 0) {
      return `${minutes}`;
    } else {
      return `${minutes}.${seconds.toString().padStart(2, '0')}`;
    }
  }
}

// Function to determine award based on points and positions
function determineAward(points: number, totalPoints: number, positions: { first: number; second: number; third: number; }): string {
  // Calculate position credits for SDCh
  // Need equivalent of 4 firsts OR 8 seconds OR 16 thirds
  // So a first = 4 credits, a second = 2 credits, a third = 1 credit
  const positionCredits = positions.first * 4 + positions.second * 2 + positions.third;
  
  // SDCh: 180 points within cutoff + position requirements (16 credits)
  if (points >= 180 && positionCredits >= 16) {
    return "SDCh";
  }
  
  // SDX: 90 points within cutoff
  if (points >= 90) {
    return "SDX";
  }
  
  // SD: 45 total points (including those outside cutoff)
  if (totalPoints >= 45) {
    return "SD";
  }
  
  return "";
}

// Function to merge RCR points data with calculated data
function mergeRcrData(calculatedData: Dog[], rcrData: RcrPoint[]): Dog[] {
  // Create a map to track dogs by normalized name for merging
  const dogMap: Record<string, Dog> = {};
  
  // First, add all calculated data to the map using normalized keys
  calculatedData.forEach(dog => {
    const normalizedKey = dog.name ? dog.name.trim().toLowerCase() : 'unknown';
    dogMap[normalizedKey] = { ...dog };
  });
  
  // Then merge RCR data with existing dogs or add new ones
  rcrData.forEach(rcrPoint => {
    const dogName = rcrPoint.rcrPedigreeName;
    
    // Skip if no valid pedigree name
    if (!dogName || dogName.trim() === '' || dogName.toLowerCase() === 'n/a') {
      return;
    }
    
    const normalizedDogName = dogName.trim().toLowerCase();
    
    if (dogMap[normalizedDogName]) {
      // Dog already exists, merge the data
      const existingDog = dogMap[normalizedDogName];
      
      // Add points and events
      existingDog.points += rcrPoint.rcrPoints || 0;
      existingDog.events += rcrPoint.rcrEvents || 0;
      
      // Update registration and breed if RCR has better data
      if (rcrPoint.rcrReg && (existingDog.regNumber === 'N/A' || !existingDog.regNumber)) {
        existingDog.regNumber = rcrPoint.rcrReg;
      }
      if (rcrPoint.rcrBreed && (existingDog.breed === 'Unknown' || !existingDog.breed)) {
        existingDog.breed = rcrPoint.rcrBreed;
      }
      
            // Update cutoff if RCR has data (convert to seconds for consistency)
      if (rcrPoint.rcrCutoff) {
        let rcrCutoffSeconds = 0;
        
        // Handle different formats: numeric (minutes) or time string
        if (typeof rcrPoint.rcrCutoff === 'number') {
          // Assume it's in minutes, convert to seconds
          rcrCutoffSeconds = rcrPoint.rcrCutoff * 60;
        } else if (typeof rcrPoint.rcrCutoff === 'string') {
          // Check if it's a pure number string (minutes)
          const numericValue = parseFloat(rcrPoint.rcrCutoff);
          if (!isNaN(numericValue) && !rcrPoint.rcrCutoff.includes(':')) {
            // It's a numeric string representing minutes
            rcrCutoffSeconds = numericValue * 60;
          } else {
            // Parse as time string (HH:MM:SS format)
            rcrCutoffSeconds = parseTimeToSeconds(rcrPoint.rcrCutoff);
          }
        }
        
        if (rcrCutoffSeconds > 0) {
          existingDog.cutoffSum += rcrCutoffSeconds;
          existingDog.cutoffCount += 1;
          existingDog.cutoff = existingDog.cutoffSum / existingDog.cutoffCount;
          console.log(`RCR ${dogName}: Added cutoff ${rcrCutoffSeconds}s (${rcrCutoffSeconds/60} min) from "${rcrPoint.rcrCutoff}"`);
        }
      }
      
      // Update awards if RCR has better data
      if (rcrPoint.rcrAwards && !existingDog.awards) {
        existingDog.awards = rcrPoint.rcrAwards;
      }
      
      // Update dog name with original casing from RCR if it's more complete
      if (dogName && dogName.length > existingDog.name.length) {
        existingDog.name = dogName;
      }
    } else {
      // New dog from RCR data
      // Parse RCR registration number similar to how we parse NZFSSRegistration
      let rcrParsedRegNumber = rcrPoint.rcrReg || rcrPoint.rcrFlag || 'N/A';
      let rcrParsedDogName = dogName;
      
      // Check if RCR reg contains dog name (format: CLUB/NUMBER/DOGNAME)
      const rcrRegValue = rcrPoint.rcrReg || rcrPoint.rcrFlag;
      if (rcrRegValue && rcrRegValue.includes('/')) {
        const parts = rcrRegValue.split('/');
        if (parts.length >= 3) {
          // Extract dog name from the last part if not already provided
          const nameFromReg = parts[parts.length - 1].trim();
          if (nameFromReg && nameFromReg !== '' && (!dogName || dogName === nameFromReg)) {
            rcrParsedDogName = nameFromReg;
          }
          // Extract registration number (everything except the last part)
          rcrParsedRegNumber = parts.slice(0, -1).join('/');
        }
      }
      
      dogMap[normalizedDogName] = {
        name: rcrParsedDogName,
        regNumber: rcrParsedRegNumber,
        breed: rcrPoint.rcrBreed || 'N/A',
        points: rcrPoint.rcrPoints || 0,
        pointsOutsideCutoff: 0,
        events: rcrPoint.rcrEvents || 0,
        drivers: [], // RCR data doesn't have driver info
        raceFormats: [],
                  cutoff: (() => {
          if (!rcrPoint.rcrCutoff) return null;
          let seconds = 0;
          if (typeof rcrPoint.rcrCutoff === 'number') {
            seconds = rcrPoint.rcrCutoff * 60;
          } else if (typeof rcrPoint.rcrCutoff === 'string') {
            const numericValue = parseFloat(rcrPoint.rcrCutoff);
            if (!isNaN(numericValue) && !rcrPoint.rcrCutoff.includes(':')) {
              seconds = numericValue * 60;
            } else {
              seconds = parseTimeToSeconds(rcrPoint.rcrCutoff);
            }
          }
          return seconds > 0 ? seconds : null;
        })(),
        cutoffSum: (() => {
          if (!rcrPoint.rcrCutoff) return 0;
          let seconds = 0;
          if (typeof rcrPoint.rcrCutoff === 'number') {
            seconds = rcrPoint.rcrCutoff * 60;
          } else if (typeof rcrPoint.rcrCutoff === 'string') {
            const numericValue = parseFloat(rcrPoint.rcrCutoff);
            if (!isNaN(numericValue) && !rcrPoint.rcrCutoff.includes(':')) {
              seconds = numericValue * 60;
            } else {
              seconds = parseTimeToSeconds(rcrPoint.rcrCutoff);
            }
          }
          return seconds > 0 ? seconds : 0;
        })(),
        cutoffCount: (() => {
          if (!rcrPoint.rcrCutoff) return 0;
          let seconds = 0;
          if (typeof rcrPoint.rcrCutoff === 'number') {
            seconds = rcrPoint.rcrCutoff * 60;
          } else if (typeof rcrPoint.rcrCutoff === 'string') {
            const numericValue = parseFloat(rcrPoint.rcrCutoff);
            if (!isNaN(numericValue) && !rcrPoint.rcrCutoff.includes(':')) {
              seconds = numericValue * 60;
            } else {
              seconds = parseTimeToSeconds(rcrPoint.rcrCutoff);
            }
          }
          return seconds > 0 ? 1 : 0;
        })(),
          awards: rcrPoint.rcrAwards || '',
          positions: {
            first: 0,
            second: 0,
            third: 0
          },
          isFromCollection: true
        };
    }
  });
  
  return Object.values(dogMap);
}

const DogRacePointPage = () => {
  const [regNumber, setRegNumber] = useState('');
  const [breed, setBreed] = useState('');
  const [name, setName] = useState('');
  const [dogsData, setDogsData] = useState<Dog[]>([]);
  const [displayedCount, setDisplayedCount] = useState(25);
  const [isFiltered, setIsFiltered] = useState(false);

  const { loading, error, data } = useQuery(GET_DOG_RACE_POINTS);

  useEffect(() => {
    if (data?.getAllPoints && data?.getAllRcrPoints) {
      // Group all points by dog
      const dogGrouped: Record<string, Dog> = {};

      // DEBUG: Key difference between musher and dog points:
      // - point.points = musher points (for entire entry/team)
      // - point.dogPoints = individual dog points (calculated per dog)
      // This page should use dogPoints, not divide musher points by dog count

      // Process each point entry
      data.getAllPoints.forEach((point: Point) => {
        if (!hasValidDogs(point)) return;
        
        // Get the cutoff time from the point data (stored in database)
        const storedCutoff = point.cutoffTime ? parseTimeToSeconds(point.cutoffTime) : null;
        const raceTime = point.entrant.raceTime ? parseTimeToSeconds(point.entrant.raceTime) : null;
        

        
        // Determine if this entry is within cutoff
        const isWithinCutoff = storedCutoff && raceTime ? raceTime <= storedCutoff : false;

        // Time parsing and cutoff comparison is now working correctly
        
        // Update each dog in the entry
        point.entrant.associatedDog.forEach(dog => {
          // Parse registration number to extract dog name and actual reg number
          let parsedDogName = dog.name || 'Unknown';
          let parsedRegNumber = dog.NZFSSRegistration || 'N/A';
          
          // Check if NZFSSRegistration contains dog name (format: CLUB/NUMBER/DOGNAME)
          if (dog.NZFSSRegistration && dog.NZFSSRegistration.includes('/')) {
            const parts = dog.NZFSSRegistration.split('/');
            if (parts.length >= 3) {
              // Extract dog name from the last part
              const nameFromReg = parts[parts.length - 1].trim();
              if (nameFromReg && nameFromReg !== '') {
                parsedDogName = nameFromReg;
              }
              // Extract registration number (everything except the last part)
              parsedRegNumber = parts.slice(0, -1).join('/');
            }
          }
          
          // Create a unique key using normalized dog name (to combine dogs with same name but different case)
          const dogKey = parsedDogName.trim().toLowerCase();
          
          if (!dogGrouped[dogKey]) {
            dogGrouped[dogKey] = {
              name: parsedDogName, // Use parsed name for display
              regNumber: parsedRegNumber,
              breed: dog.breed || 'Unknown',
              points: 0,
              pointsOutsideCutoff: 0,
              events: 0,
              drivers: [],
              raceFormats: [],
              cutoff: null,
              cutoffSum: 0,
              cutoffCount: 0,
              awards: '',
              positions: {
                first: 0,
                second: 0,
                third: 0
              }
            };
          } else {
            // If dog already exists, update registration number and breed if current ones are better
            if (parsedRegNumber && parsedRegNumber !== 'N/A' && (dogGrouped[dogKey].regNumber === 'N/A' || !dogGrouped[dogKey].regNumber)) {
              dogGrouped[dogKey].regNumber = parsedRegNumber;
            }
            if (dog.breed && (dogGrouped[dogKey].breed === 'Unknown' || !dogGrouped[dogKey].breed)) {
              dogGrouped[dogKey].breed = dog.breed;
            }
            // Use the more complete/proper name (prefer names with proper capitalization)
            if (parsedDogName && parsedDogName.length > dogGrouped[dogKey].name.length) {
              dogGrouped[dogKey].name = parsedDogName;
            }
          }
          
          // Use the individual dog points if available (correct approach)
          // Otherwise fall back to dividing musher points (legacy support)
          let dogPoints = 0;
          
          // Check if we have specific dog points for this dog
          if (point.dogPoints && Array.isArray(point.dogPoints)) {
            // Try to match using both original registration and parsed registration
            const dogPointEntry = point.dogPoints.find(dp => 
              dp.NZFSSRegistration === dog.NZFSSRegistration || 
              dp.NZFSSRegistration === parsedRegNumber
            );
            if (dogPointEntry) {
              dogPoints = dogPointEntry.points;
            } else {
              // No specific dog points found, fall back to legacy calculation
              const dogsCount = point.entrant.associatedDog.length;
              dogPoints = point.points / dogsCount;
            }
          } else {
            // No dog points array, fall back to legacy calculation
            const dogsCount = point.entrant.associatedDog.length;
            dogPoints = point.points / dogsCount;
          }
          
          // Points are now correctly allocated based on cutoff time comparison
          
          // Add points to the appropriate category
          // For dog points, we don't need to separate by cutoff as they're already calculated correctly
          if (isWithinCutoff) {
            dogGrouped[dogKey].points += dogPoints;
          } else {
            dogGrouped[dogKey].pointsOutsideCutoff += dogPoints;
          }
          
          dogGrouped[dogKey].events += 1;
          
          // Track cutoff times for averaging
          if (storedCutoff && storedCutoff > 0) {
            dogGrouped[dogKey].cutoffSum += storedCutoff;
            dogGrouped[dogKey].cutoffCount += 1;
            // Calculate average cutoff
            dogGrouped[dogKey].cutoff = dogGrouped[dogKey].cutoffSum / dogGrouped[dogKey].cutoffCount;

          }
          
          // Track race formats
          if (point.entrant.raceFormat && !dogGrouped[dogKey].raceFormats.includes(point.entrant.raceFormat)) {
            dogGrouped[dogKey].raceFormats.push(point.entrant.raceFormat);
          }
          
          // Track drivers/mushers associated with this dog
          const driverName = dog.driverName || 'Unknown';
          let driverExists = false;
          
          for (const driver of dogGrouped[dogKey].drivers) {
            if (driver.name === driverName) {
              driver.points += isWithinCutoff ? dogPoints : 0;
              driver.events += 1;
              driverExists = true;
              break;
            }
          }
          
          if (!driverExists) {
            dogGrouped[dogKey].drivers.push({
              name: driverName,
              points: isWithinCutoff ? dogPoints : 0,
              events: 1
            });
          }
        });
      });

      // Calculate awards for each dog
      Object.values(dogGrouped).forEach(dog => {
        const totalPoints = dog.points + dog.pointsOutsideCutoff;
        dog.awards = determineAward(dog.points, totalPoints, dog.positions);
      });

      // Convert to array and merge with RCR points data
      const dogsArray = Object.values(dogGrouped);
      const mergedData = mergeRcrData(dogsArray, data.getAllRcrPoints);
      
      // Filter out dogs with no valid name (N/A, empty, or undefined)
      const validDogsData = mergedData.filter(dog => {
        const hasValidName = dog.name && 
                           dog.name.trim() !== '' && 
                           dog.name.toLowerCase() !== 'n/a' &&
                           dog.name !== 'N/A';
        return hasValidName;
      });
      
      // Calculate awards for merged data (including RCR-only dogs)
      validDogsData.forEach(dog => {
        if (!dog.awards) {
          const totalPoints = dog.points + dog.pointsOutsideCutoff;
          dog.awards = determineAward(dog.points, totalPoints, dog.positions);
        }
      });
      
      // Sort dogs by total points (highest first)
      validDogsData.sort((a, b) => {
        const aTotal = a.points + a.pointsOutsideCutoff;
        const bTotal = b.points + b.pointsOutsideCutoff;
        return bTotal - aTotal;
      });
      
      // Debug: Log cutoff processing results
      const dogsWithCutoff = validDogsData.filter(dog => dog.cutoff !== null && dog.cutoff > 0);
      console.log(`Found ${dogsWithCutoff.length} dogs with cutoff times out of ${validDogsData.length} total dogs`);
      
      // Check first 25 for cutoffs after RCR processing
      const first25 = validDogsData.slice(0, 25);
      const first25WithCutoff = first25.filter(dog => dog.cutoff !== null && dog.cutoff > 0);
      console.log(`After RCR processing: First 25 dogs contain ${first25WithCutoff.length} dogs with cutoffs`);
      
      setDogsData(validDogsData);
    }
  }, [data]);

  // Filter function for search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsFiltered(true);
    setDisplayedCount(25); // Reset displayed count when searching
  };

  const clearFilters = () => {
    setRegNumber('');
    setBreed('');
    setName('');
    setIsFiltered(false);
    setDisplayedCount(25);
  };

  const loadMore = () => {
    setDisplayedCount(prev => prev + 25);
  };

  const getFilteredDogs = () => {
    if (!isFiltered) return dogsData;

    return dogsData.filter(dog => {
      const regMatch = regNumber ? dog.regNumber.toLowerCase().includes(regNumber.toLowerCase()) : true;
      const breedMatch = breed ? dog.breed.toLowerCase().includes(breed.toLowerCase()) : true;
      const nameMatch = name ? dog.name.toLowerCase().includes(name.toLowerCase()) : true;
      
      return regMatch && breedMatch && nameMatch;
    });
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading dog race points...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center min-h-screen">Error loading dog race points: {error.message}</div>;
  }

  const filteredDogs = getFilteredDogs();
  const displayedDogs = filteredDogs.slice(0, displayedCount);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <div className="max-w-[1400px] mx-auto px-4 py-8">
          <h1 className="text-[4.375vw] font-[700] text-center mb-16">Dog Race Points</h1>
          
          {/* Search Section */}
          <form onSubmit={handleSearch} className="flex gap-4 mb-8 justify-center">
            <input
              type="text"
              placeholder="Search by Reg#"
              value={regNumber}
              onChange={(e) => setRegNumber(e.target.value)}
              className="px-4 py-2 border rounded-[16px] w-[30vw] bg-white"
            />
            
            <input
              type="text"
              placeholder="Search by Breed"
              value={breed}
              onChange={(e) => setBreed(e.target.value)}
              className="px-4 py-2 border rounded-[16px] w-[30vw] bg-white"
            />

            <input
              type="text"
              placeholder="Search by Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="px-4 py-2 border rounded-[16px] w-[30vw] bg-white"
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
                onClick={clearFilters}
                className="px-8 py-2 bg-gray-500 text-white rounded-[16px] hover:bg-gray-600"
              >
                Clear
              </button>
            )}
          </form>

          {/* Results count */}
          <div className="mb-4 text-sm text-gray-600">
            Showing {displayedDogs.length} of {filteredDogs.length} records
            {isFiltered && <span className=" ml-2 text-blue-600">(filtered)</span>}
          </div>

          {/* Table Section */}
          <div className="mb-8 flex justify-center">
            <div className="w-full">
              <div className="bg-[#212529] text-white p-3 rounded-t">
                <h2 className="text-[1.25vw] font-normal">Dog Race Points</h2>
              </div>
              <div className="overflow-x-auto border border-[#DEE2E6] rounded-b">
                <table className="w-full">
                  <thead className="bg-[#E9ECEF]">
                    <tr>
                      <th className="px-4 py-2 text-left text-[1.146vw] font-[700] border-b">Name</th>
                      <th className="px-4 py-2 text-left text-[1.146vw] font-[700] border-b">Reg#</th>
                      <th className="px-4 py-2 text-left text-[1.146vw] font-[700] border-b">Breed</th>
                      <th className="px-4 py-2 text-left text-[1.146vw] font-[700] border-b">Points</th>
                      <th className="px-4 py-2 text-left text-[1.146vw] font-[700] border-b">Events</th>
                      <th className="px-4 py-2 text-left text-[1.146vw] font-[700] border-b">Cutoff</th>
                      <th className="px-4 py-2 text-left text-[1.146vw] font-[700] border-b">Awards</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {displayedDogs.map((dog, index) => {
                      const totalPoints = dog.points + dog.pointsOutsideCutoff;
                      
                      return (
                        <tr key={`dog-${index}`} className={index % 2 === 0 ? 'bg-white' : 'bg-[#F2F2F2]'}>
                          <td className="px-4 py-2 text-[0.938vw] font-medium">{dog.name || 'N/A'}</td>
                          <td className="px-4 py-2 text-[0.938vw]">{dog.regNumber || 'N/A'}</td>
                          <td className="px-4 py-2 text-[0.938vw]">{dog.breed || 'N/A'}</td>
                          <td className="px-4 py-2 text-[0.938vw]">{formatPoints(totalPoints)}</td>
                          <td className="px-4 py-2 text-[0.938vw]">{dog.events}</td>
                          <td className="px-4 py-2 text-[0.938vw]">
                            {dog.cutoff !== null && dog.cutoff > 0 ? formatSecondsToTime(dog.cutoff) : '0'}
                          </td>
                          <td className="px-4 py-2 text-[0.938vw]">{dog.awards || 'N/A'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Load More Button */}
              {displayedCount < filteredDogs.length && (
                <div className="flex justify-center mt-4">
                  <button 
                    onClick={loadMore}
                    className="px-8 py-2 bg-black text-white rounded-[16px] hover:bg-gray-800"
                  >
                    Load More
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default DogRacePointPage;
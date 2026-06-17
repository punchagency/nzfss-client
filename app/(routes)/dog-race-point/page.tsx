"use client";

import React, { useState, useEffect } from 'react';
import Header from '@/app/(homepage)/_components/header';
import Footer from '@/app/(homepage)/_components/footer';
import { useQuery } from '@apollo/client';
import { GET_DOG_RACE_POINTS } from '@/graphql/query/points';

interface DogRacePointSummary {
  name: string;
  regNumber: string;
  breed: string;
  pointsWithinCutoff: number;
  pointsOutsideCutoff: number;
  events: number;
  avgCutoffSeconds?: number | null;
  awards: string;
}

interface Dog {
  name: string;
  regNumber: string;
  breed: string;
  totalPoints: number;
  events: number;
  cutoff: number | null;
  awards: string;
}

function roundToHalf(value: number): number {
  const wholePart = Math.floor(value);
  const decimalPart = value - wholePart;

  if (decimalPart <= 0.25) {
    return wholePart;
  }
  if (decimalPart <= 0.75) {
    return wholePart + 0.5;
  }
  return wholePart + 1;
}

function formatPoints(value: number): string {
  const rounded = roundToHalf(value);
  return rounded % 1 === 0 ? rounded.toString() : rounded.toFixed(1);
}

function formatSecondsToTime(totalSeconds: number): string {
  if (!totalSeconds || totalSeconds <= 0) return '0';

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  if (hours > 0) {
    if (seconds === 0 && minutes === 0) {
      return `${hours}`;
    }
    if (seconds === 0) {
      return `${hours}.${minutes.toString().padStart(2, '0')}`;
    }
    return `${hours}.${minutes.toString().padStart(2, '0')}.${seconds.toString().padStart(2, '0')}`;
  }

  if (seconds === 0) {
    return `${minutes}`;
  }
  return `${minutes}.${seconds.toString().padStart(2, '0')}`;
}

function mapSummaryToDog(summary: DogRacePointSummary): Dog {
  return {
    name: summary.name,
    regNumber: summary.regNumber,
    breed: summary.breed,
    totalPoints: summary.pointsWithinCutoff + summary.pointsOutsideCutoff,
    events: summary.events,
    cutoff: summary.avgCutoffSeconds ?? null,
    awards: summary.awards,
  };
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
    if (data?.getDogRacePointSummaries) {
      setDogsData(data.getDogRacePointSummaries.map(mapSummaryToDog));
    }
  }, [data]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsFiltered(true);
    setDisplayedCount(25);
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

          <div className="mb-4 text-sm text-gray-600">
            Showing {displayedDogs.length} of {filteredDogs.length} records
            {isFiltered && <span className=" ml-2 text-blue-600">(filtered)</span>}
          </div>

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
                    {displayedDogs.map((dog, index) => (
                      <tr key={`${dog.regNumber}-${dog.name}-${index}`} className={index % 2 === 0 ? 'bg-white' : 'bg-[#F2F2F2]'}>
                        <td className="px-4 py-2 text-[0.938vw] font-medium">{dog.name || 'N/A'}</td>
                        <td className="px-4 py-2 text-[0.938vw]">{dog.regNumber || 'N/A'}</td>
                        <td className="px-4 py-2 text-[0.938vw]">{dog.breed || 'N/A'}</td>
                        <td className="px-4 py-2 text-[0.938vw]">{formatPoints(dog.totalPoints)}</td>
                        <td className="px-4 py-2 text-[0.938vw]">{dog.events}</td>
                        <td className="px-4 py-2 text-[0.938vw]">
                          {dog.cutoff !== null && dog.cutoff > 0 ? formatSecondsToTime(dog.cutoff) : '0'}
                        </td>
                        <td className="px-4 py-2 text-[0.938vw]">{dog.awards || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

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

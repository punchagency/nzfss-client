"use client";

import SelectComponent from '@/components/selectComponent'
import { GET_CLUB_USERS, GET_ALL_CLUB_DETAILS } from "@/graphql/query/clubs";
import { useQuery } from "@apollo/client";
import React, { useEffect, Suspense } from 'react'
import Image from 'next/image'
import { FaMapMarkerAlt } from 'react-icons/fa'
import { FiExternalLink } from 'react-icons/fi'
import Link from 'next/link'
import gif from "@/assets/gg.gif";

/**
 * Loading spinner component
 */
const LoadingSpinner = () => (
  <div className="min-h-screen w-full bg-white flex flex-col items-center justify-center gap-4">
    <div className="w-12 h-12 rounded-full border-4 border-[#E5E7EB] border-t-[#FFB800] animate-spin"></div>
    <p className="text-lg text-gray-600">Loading clubs</p>
  </div>
);

interface Club {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ClubManagement {
  clubName: string;
  coverImage: string;
  location: {
    description: string;
    address: string;
  };
}

/**
 * Interface for query responses
 */
interface ClubsQueryResponse {
  getAllUsers: Club[];
}

interface ClubManagementResponse {
  getAllClubManagements: ClubManagement[];
}

/**
 * Converts URLs in text to clickable hyperlinks
 * @param text The text that may contain URLs
 * @returns JSX with URLs converted to hyperlinks
 */
const convertUrlsToLinks = (text: string): JSX.Element => {
  if (!text) return <></>;
  
  // Fix any duplicate https:// in the text first
  const fixedText = text.replace(/https:\/\/https:\/\//g, "https://");
  
  // Regular expression to match URLs starting with http, https, www, etc.
  const urlRegex = /(https?:\/\/|www\.)[^\s]+/g;
  
  // Split the text by URLs
  const parts = fixedText.split(urlRegex);
  
  // Extract all URLs that match the regex
  const urls = fixedText.match(urlRegex) || [];
  
  // Combine parts and URLs
  const result: JSX.Element[] = [];
  
  parts.forEach((part, index) => {
    // Add the text part
    result.push(<span key={`text-${index}`}>{part}</span>);
    
    // Add the URL as a hyperlink if it exists
    if (urls[index]) {
      const url = urls[index];
      
      // Clean URL for href: ensure proper protocol without duplication
      let href = url;
      if (url.startsWith("www.")) {
        href = `https://${url}`;
      }
      // Remove any duplicated https://
      href = href.replace(/https:\/\/https:\/\//g, "https://");
      
      result.push(
        <a 
          key={`link-${index}`} 
          href={href} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          {url}
        </a>
      );
    }
  });
  
  return <>{result}</>;
};

const ClubPageContent: React.FC = () => {
  // Execute queries to fetch all clubs and their details
  const { data: userData, loading: userLoading, error: userError } = useQuery<ClubsQueryResponse>(GET_CLUB_USERS);
  const { data: clubData, loading: clubLoading, error: clubError } = useQuery<ClubManagementResponse>(GET_ALL_CLUB_DETAILS);

  // Handle loading state
  if (userLoading || clubLoading) {
    return (
      <div className="min-h-screen w-full bg-white flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-[#E5E7EB] border-t-[#FFB800] animate-spin"></div>
        <p className="text-lg text-gray-600">Loading clubs</p>
      </div>
    );
  }

  // Handle error state
  if (userError || clubError) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-red-500">Error loading clubs: {userError?.message || clubError?.message}</p>
      </div>
    );
  }

  // Filter users with role "CLUB" and ensure they have a name
  const clubs = userData?.getAllUsers
    ?.filter(user => user.role === "CLUB" && user.name) // Only include users with a name
    .map(user => ({
      ...user,
      name: user.name || 'Unnamed Club' // Fallback name if somehow null
    })) || [];
  const clubManagements = clubData?.getAllClubManagements || [];

  // Create a map of club details by name for easy lookup
  const clubDetailsMap = new Map(
    clubManagements.map(club => [club.clubName.toLowerCase(), club])
  );

  return (
    <div className="flex flex-col w-full h-full pb-[148px] gap-y-[107px] bg-white px-[48px]">
      {/* Login button with gif at top right */}
      <div className="flex justify-end items-center w-full mt-6">
        <Link href="/login">
        
        </Link>
      </div>
      <h1 className="text-[40px] md:text-[60px] lg:text-[80px] xl:text-[8vw] font-[700] text-center leading-tight">
        Clubs
      </h1>

      <div className='w-full flex flex-col gap-y-[36px]'>
        {/* Display clubs in a grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clubs.length === 0 ? (
            <p className="col-span-full text-center text-gray-500 py-8">
              No clubs found. Please check if there are clubs in the database.
            </p>
          ) : (
            clubs.map((club: Club) => {
              const clubDetails = clubDetailsMap.get(club.name.toLowerCase());
              return (
                <div
                  key={club._id}
                  className="group overflow-hidden border border-[#00000033] rounded-[16px] hover:shadow-lg transition-shadow relative block focus:outline-none focus:ring-2 focus:ring-blue-500"
                  tabIndex={0}
                >
                  {/* Image and external link icon are clickable */}
                  {clubDetails?.coverImage && (
                    <Link
                      href={`/clubs/${club._id}`}
                      className="relative w-full h-[200px] block focus:outline-none"
                      tabIndex={-1}
                    >
                      {/* External link icon in top-right */}
                      <span className="absolute top-4 right-4 z-10 bg-white p-2 rounded-full shadow-md group-hover:shadow-lg transition-shadow pointer-events-none">
                        <FiExternalLink className="w-5 h-5 text-gray-600" />
                      </span>
                      <Image
                        src={clubDetails.coverImage}
                        alt={`${club.name} cover`}
                        fill
                        className="object-cover"
                      />
                    </Link>
                  )}
                  <div className="p-6">
                    <h2 className="text-xl font-semibold mb-2">{club.name}</h2>
                    <p className="text-gray-600 mb-2">{club.email}</p>
                    {clubDetails?.location && (
                      <div className="flex items-start gap-2 text-gray-600 mt-2">
                        <FaMapMarkerAlt className="mt-1 flex-shrink-0" />
                        <p className="text-sm">
                          {convertUrlsToLinks( clubDetails.location.address)}
                        </p>
                      </div>
                    )}
                    {club.createdAt && (
                      <p className="text-sm text-gray-400 mt-2">
                        Joined: {new Date(club.createdAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  );
};

const ClubPage: React.FC = () => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ClubPageContent />
    </Suspense>
  );
};

export default ClubPage;
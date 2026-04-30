"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { useQuery } from "@apollo/client";
import { GET_ALL_CLUBS, GET_CLUB_CONTACTS } from "@/graphql/query/clubs";
import Header from "@/app/(homepage)/_components/header";
import Footer from "@/app/(homepage)/_components/footer";
import Inquires from "@/app/(homepage)/_components/inquires";
import { User } from "lucide-react";

/**
 * Interface for Club data
 */
interface Club {
  _id: string;
  name: string;
  email: string;
}

/**
 * Interface for query response
 */
interface ClubsQueryResponse {
  getAllClubs: Club[] | null;
}

/**
 * Interface for Contact data
 */
interface Contact {
  _id: string;
  name: string;
  designation: string;
  email: string;
  image?: string;
  created_at: string;
  club: string;
}

interface ContactsQueryResponse {
  getAllContacts: Contact[] | null;
}

/**
 * Generates a club abbreviation from the full club name
 * @param clubName - The full name of the club
 * @returns The abbreviated form of the club name
 */
const getClubAbbreviation = (clubName: string): string => {
  // Special case for NZFSS
  if (clubName.toLowerCase().includes("new zealand federation of sled dog sports")) {
    return "NZFSS";
  }
  
  // For other clubs, take first letter of each word
  return clubName
    .split(" ")
    .map(word => word[0])
    .join("")
    .toUpperCase();
};

/**
 * Contacts page component that displays contact information.
 * 
 * @returns {JSX.Element} The rendered Contacts page component.
 */
const ContactsPage: React.FC = () => {
  // State for selected club
  const [selectedClubId, setSelectedClubId] = useState<string>("");
  
  // Cache the last successfully loaded clubs data
  const [cachedClubs, setCachedClubs] = useState<Club[]>([]);

  // Fetch contacts data using GraphQL
  const { data: contactsData, loading: contactsLoading, error: contactsError } = useQuery<ContactsQueryResponse>(GET_CLUB_CONTACTS, {
    fetchPolicy: "cache-and-network",
    errorPolicy: "all",
    onError: (error) => {
      console.error("Error fetching contacts:", error);
    }
  });

  // Fetch clubs data to get NZFSS club ID
  const { data: clubsData, loading: clubsLoading, error: clubsError } = useQuery<ClubsQueryResponse>(GET_ALL_CLUBS, {
    fetchPolicy: "cache-and-network",
    errorPolicy: "all",
    onError: (error) => {
      console.error("Error fetching clubs:", error);
    }
  });

  // Keep a cache of clubs data if it loaded successfully
  useEffect(() => {
    if (clubsData?.getAllClubs && clubsData.getAllClubs.length > 0) {
      console.log("Caching clubs data for potential fallback:", clubsData.getAllClubs);
      setCachedClubs(clubsData.getAllClubs);
    }
  }, [clubsData]);

  // Set NZFSS as default club when data is loaded
  useEffect(() => {
    if (clubsData?.getAllClubs) {
      console.log("Clubs data loaded:", clubsData.getAllClubs);
      const nzfssClub = clubsData.getAllClubs.find(club => 
        club.name.toLowerCase().includes("new zealand federation of sled dog sports")
      );
      console.log("Found NZFSS club:", nzfssClub);
      if (nzfssClub) {
        console.log("Setting selected club ID to:", nzfssClub._id);
        setSelectedClubId(nzfssClub._id);
      }
    } else if (clubsError && contactsData?.getAllContacts?.length) {
      // In fallback mode, use the first contact's club ID if available
      const firstClubId = contactsData.getAllContacts[0].club;
      if (firstClubId) {
        setSelectedClubId(firstClubId);
      }
    }
  }, [clubsData, clubsError, contactsData]);

  // Check if we need to use fallback mode
  const useFallbackMode = !!clubsError || !clubsData?.getAllClubs;

  // Get the selected club and filtered contacts
  const selectedClub = clubsData?.getAllClubs?.find(club => club?._id === selectedClubId) || 
                       cachedClubs.find(club => club._id === selectedClubId);

  const filteredContacts = useMemo(() => {
    if (!contactsData?.getAllContacts) {
      console.log("No contacts data available");
      return [];
    }
    
    // If no club is selected, show all contacts
    if (!selectedClubId) {
      console.log("No club selected, showing all contacts");
      return contactsData.getAllContacts;
    }
    
    console.log("Filtering contacts for club:", selectedClubId);
    console.log("Available contacts:", contactsData.getAllContacts);
    
    const filtered = contactsData.getAllContacts.filter(contact => {
      const matches = contact.club === selectedClubId;
      console.log(`Contact ${contact._id} club: ${contact.club}, matches: ${matches}`);
      return matches;
    });
    
    console.log("Filtered contacts:", filtered);
    return filtered;
  }, [contactsData, selectedClubId]);

  // Map of club IDs to club names derived from all available sources
  const clubMap = useMemo(() => {
    const map: Record<string, string> = {};
    
    // First try to use the club data from the query
    if (clubsData?.getAllClubs) {
      clubsData.getAllClubs.forEach(club => {

        console.log(club,"club")
        map[club._id] = club.name;
      });
    }
    
    // Then add any cached clubs not already in the map
    cachedClubs.forEach(club => {
      if (!map[club._id]) {
        map[club._id] = club.name;
      }
    });
    
    // Lastly, add any club IDs found in contacts but not in clubs data
    if (contactsData?.getAllContacts) {
      const clubIdsInContacts = [...new Set(contactsData.getAllContacts.map(contact => contact.club))];
      
      clubIdsInContacts.forEach(clubId => {
        if (!map[clubId]) {
          // Use a generic club name instead of using contact's name
          map[clubId] = `Club ${clubId.substring(0, 8)}`;
        }
      });
    }
    
    return map;
  }, [clubsData, cachedClubs, contactsData]);

  // Get a display name for a club ID
  const getClubDisplayName = (clubId: string): string => {
    console.log(clubMap,"clubMap")
    console.log(clubMap[clubId] || `Club ${clubId.substring(0, 8)}`,"clubMap")
    return clubMap[clubId] || `Club ${clubId.substring(0, 8)}`;
  };

  // Get unique club IDs from all contacts
  const uniqueClubIds = useMemo(() => {
    if (!contactsData?.getAllContacts) {
      return [];
    }
    
    const clubIds = contactsData.getAllContacts.map(contact => contact.club);
    return [...new Set(clubIds)];
  }, [contactsData]);

  // Get club IDs that have "Club" in their name
  const clubIdsWithClubInName = useMemo(() => {
    // If we have clubs data from the query, filter based on name containing "Club"
    if (clubsData?.getAllClubs) {
      return clubsData.getAllClubs
        .filter(club => club.name.includes("Club"))
        .map(club => club._id);
    }
    
    // In fallback mode, use club names from the clubMap that contain "Club"
    return uniqueClubIds.filter(clubId => {
      const clubName = getClubDisplayName(clubId);
      return clubName.includes("Club");
    });
  }, [clubsData, uniqueClubIds, getClubDisplayName]);

  // Handle loading state
  if (contactsLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-yellow-500 animate-spin"></div>
        </main>
        <Footer />
      </div>
    );
  }

  // Handle complete error state (both queries failed)
  if (contactsError) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-xl text-red-600">
            Error loading data: {contactsError?.message || "Unknown error"}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  console.log("Current state:", {
    selectedClubId,
    selectedClub,
    useFallbackMode,
    allClubs: clubsData?.getAllClubs || cachedClubs,
    allContacts: contactsData?.getAllContacts,
    filteredContacts
  });

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header component */}
      <Header />
      
      {/* Main content */}
      <main className="flex-grow">
        {/* Contacts section */}
        <div className="px-4 py-8">
          <div className="max-w-[1800px] mx-auto">
            <h1 className="text-[84px] font-[700] text-center mb-16">Contact</h1>
            
            {/* Club header with dropdown - only shown if clubs data is available or contacts exist */}
            {((!useFallbackMode && clubsData?.getAllClubs && clubsData.getAllClubs.length > 0) || 
               (useFallbackMode && uniqueClubIds.length > 0)) && (
              <div className="mb-12 flex justify-between items-center bg-[#ECECEF] rounded-lg px-4 py-2">
                <span className="text-[#000000] text-[1.146vw] font-[700]">
                  {selectedClub 
                    ? getClubAbbreviation(selectedClub.name) 
                    : selectedClubId 
                      ? getClubAbbreviation(getClubDisplayName(selectedClubId))
                      : "Club"
                  }
                </span>
                <div className="w-[500px]">
                  {!useFallbackMode && clubsData?.getAllClubs ? (
                    // Regular club selection
                    <select 
                      value={selectedClubId}
                      onChange={(e) => setSelectedClubId(e.target.value)}
                      className="w-full bg-transparent text-[1.146vw] font-[700] border-none focus:outline-none"
                    >
                      <option value="">All Clubs</option>
                      {clubsData.getAllClubs.map((club) => (
                        <option key={club._id} value={club._id}>
                          {club.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    // Fallback club selection with full names
                    <select 
                      value={selectedClubId}
                      onChange={(e) => setSelectedClubId(e.target.value)}
                      className="w-full bg-transparent text-[1.146vw] font-[700] border-none focus:outline-none"
                    >
                      <option value="">All Contacts</option>
                      {uniqueClubIds.map((clubId) => (
                        <option key={clubId} value={clubId}>
                          {getClubDisplayName(clubId)}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            )}
       
            
            {useFallbackMode && selectedClubId && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-2">
                  {getClubDisplayName(selectedClubId)}
                </h2>
              </div>
            )}
            
            {/* Contact cards grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-16">
              {filteredContacts.map((contact) => (
                <div key={contact._id} className="bg-white rounded-lg overflow-hidden">
                  {/* Image container with fixed aspect ratio */}
                  <div className="relative w-full pt-[100%]">
                    {contact.image && !contact.image.includes("data:image/png loading") ? (
                      <Image 
                        src={contact.image} 
                        alt={contact.name}
                        fill
                        className="object-cover absolute rounded-[16px] top-0 left-0"
                      />
                    ) : (
                      <div className="absolute top-0 left-0 w-full h-full bg-gray-100 flex items-center justify-center">
                        <User size={100} className="text-gray-300" />
                      </div>
                    )}
                  </div>
                  {/* Content section */}
                  <div className="p-6">
                    <h3 className="text-[1.146vw] text-[#000000] font-semibold">{contact.name}</h3>
                    <p className="text-[0.938vw] text-[#00000080] mt-2">{contact.designation}</p>
                    <a 
                      href={`mailto:${contact.email}`} 
                      className="text-[0.938vw] text-[#00000080] hover:underline mt-1 block"
                    >
                      {contact.email}
                    </a>
                  </div>
                </div>
              ))}
            </div>
            
            {/* No contacts message */}
            {contactsData?.getAllContacts && filteredContacts.length === 0 && (
              <div className="text-center py-[40px]">
                <p className="text-[18px] text-gray-500">
                  {useFallbackMode 
                    ? `No contacts available for ${selectedClubId ? getClubDisplayName(selectedClubId) : "any club"}.`
                    : `No contacts found for ${selectedClub?.name || "selected club"}.`
                  }
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* Inquires component */}
        <Inquires />
      </main>
      
      {/* Footer component */}
      <Footer />
    </div>
  );
};

export default ContactsPage; 
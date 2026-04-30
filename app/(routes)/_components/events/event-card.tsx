import Image from "next/image";
import { format } from "date-fns";
import Link from "next/link";
import { useState } from "react";
import { getClubAbbreviation } from "@/utils/clubAbbreviations";

interface EventCardProps {
  title: string;
  date: string;
  club: string;
  photo?: string;
  status: string;
  region?: string;
  onDownload?: () => void;
  downloadUrl?: string;
  website?: string;
}

/**
 * EventCard component displays individual event information in a card format
 */
const EventCard: React.FC<EventCardProps> = ({
  title,
  date,
  club,
  photo,
  status,
  region,
  onDownload,
  downloadUrl,
  website
}) => {
  const [imageError, setImageError] = useState(false);

  // Function to generate club abbreviation
  const generateClubAbbreviation = (clubName: string): string => {
    // Remove common words that shouldn't be part of abbreviation
    const wordsToRemove = ['of', 'the', 'and'];
    const compoundWords = ['sled dog', 'dog sports', 'dog club'];
    const words = clubName.split(' ');
    
    // First, check for compound words and mark their indices
    let skipIndices = new Set<number>();
    compoundWords.forEach(compound => {
      const compoundParts = compound.split(' ');
      for (let i = 0; i < words.length - compoundParts.length + 1; i++) {
        if (words.slice(i, i + compoundParts.length)
            .map(w => w.toLowerCase())
            .join(' ') === compound) {
          // Mark all indices of the compound word
          for (let j = 0; j < compoundParts.length; j++) {
            skipIndices.add(i + j);
          }
          // Add the first letters of each part to our result
          words[i] = compoundParts.map(part => part[0].toUpperCase()).join('');
          // Clear other parts
          for (let j = 1; j < compoundParts.length; j++) {
            words[i + j] = '';
          }
        }
      }
    });
    
    // Filter and map the words
    const abbreviation = words
      .filter((word, index) => {
        if (skipIndices.has(index)) return true;
        const lowerWord = word.toLowerCase();
        return !wordsToRemove.includes(lowerWord) && word !== '';
      })
      .map(word => word[0])
      .join('')
      .toUpperCase();
    
    return abbreviation;
  };

  // Handle direct download function
  const handleDownload = () => {
    if (downloadUrl) {
      // Direct download approach
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `${title}-entry-form.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (onDownload) {
      // Fallback to provided callback
      onDownload();
    }
  };

  // Debug logs with more detailed information
  console.log(`Event Card Props for ${title}:`, {
    title,
    photo: photo?.slice(0, 100),
    onDownload: !!onDownload,
    downloadUrl: !!downloadUrl,
    website
  });

  // Function to validate image URL with more detailed logging
  const isValidImageUrl = (url?: string): boolean => {
    if (!url) {
      console.log(`[${title}] No image URL provided`);
      return false;
    }

    try {
      console.log(`[${title}] Processing image URL:`, url);
      
      if (url.startsWith('data:image/')) {
        console.log(`[${title}] Valid base64 image detected`);
        return true;
      }
      
      const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp'];
      const isValid = (
        (url.startsWith('http://') || url.startsWith('https://')) &&
        (url.includes('amazonaws.com') || 
        validExtensions.some(ext => url.toLowerCase().endsWith(ext)))
      );
      
      console.log(`[${title}] Image validation result:`, {
        url,
        isValid,
        hasValidProtocol: url.startsWith('http://') || url.startsWith('https://'),
        extension: validExtensions.find(ext => url.toLowerCase().endsWith(ext))
      });
      
      return isValid;
    } catch (error) {
      console.error(`[${title}] Error validating image URL:`, error);
      return false;
    }
  };

  // Function to ensure URL has proper protocol
  const formatUrl = (url: string): string => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    return `https://${url}`;
  };

  return (
    <div className="bg-white rounded-lg overflow-hidden border hover:shadow-lg transition-shadow w-full max-w-xl mx-auto h-auto">
      {/* Image Section */}
      <div className="px-2 mt-[8px]">
        <div className="relative w-full h-[250px] md:h-[20vw] md:max-h-[350px]">
          {isValidImageUrl(photo) && !imageError ? (
            <Image
              src={`${photo}?t=${Date.now()}`}
              alt={`${title} event`}
              fill
              className="rounded-[8px] object-cover"
              unoptimized
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center rounded-lg">
              <span className="text-gray-400">
                {photo ? "Failed to load image" : "No Image Available"}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4 md:p-6">
        {/* Event Name and Dateasdasdas */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <h3 className="text-gray-600 font-[600] text-[#000000] text-base md:text-[0.9375vw] leading-[1.2]">Event Name</h3>
            <p className="font-[500] text-[#000000] text-base md:text-[0.9375vw] leading-[1.2] w-[20vw]">{title}</p>
          </div>
          {date && (
            <div className="text-right">
              <p className="font-[500] text-[#000000] text-base md:text-[0.9375vw] leading-[1.2]">
                {format(new Date(date), "d MMM yyyy")}
              </p>
            </div>
          )}
        </div>

        {/* Club, Type, and Form Link in one row */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <p className="text-gray-600 font-[600] text-[#000000] text-base md:text-[0.9375vw] leading-[1.2]">Club</p>
            <div className="group relative inline-block">
              <p className="font-[500] text-[#000000] text-base md:text-[0.9375vw] leading-[1.2]">
                {getClubAbbreviation(club)}
              </p>
              <div className="opacity-0  text-sm rounded py-1 px-2 absolute z-[9999] bottom-full left-1/2 transform -translate-x-1/2 mb-1 ">
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                  <div className="border-solid border-t-black border-t-4 border-x-transparent border-x-4 border-b-0 h-0 w-0"></div>
                </div>
              </div>
            </div>
          </div>
          <div>
            <p className="text-gray-600 font-[600] text-[#000000] text-base md:text-[0.9375vw] leading-[1.2]">Type</p>
            {status === "Sanctioned" ? (
              <p className="font-[500] text-green-600 text-base md:text-[0.9375vw] leading-[1.2]">{status}</p>
            ) : status === "Sanctioning applied" ? (
              <p className="font-[500] text-blue-600 text-base md:text-[0.9375vw] leading-[1.2]">{status}</p>
            ) : status === "Declined" ? (
              <p className="font-[500] text-red-600 text-base md:text-[0.9375vw] leading-[1.2]">{status}</p>
            ) : (
              <p className="font-[500] text-[#000000] text-base md:text-[0.9375vw] leading-[1.2]">{status}</p>
            )}
          </div>
          <div className="flex flex-col items-end">
            <p className="text-gray-600 font-[600] text-[#000000] text-base md:text-[0.9375vw] leading-[1.2]">Form Link</p>
            {website ? (
              <a 
                href={formatUrl(website)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline font-[500] text-base md:text-[0.9375vw] leading-[1.2]"
              >
                Click here
              </a>
            ) : (
              <p className="font-[500] text-[#000000] text-base md:text-[0.9375vw] leading-[1.2]">No form link</p>
            )}
          </div>
        </div>

        {/* Region and Entry Form */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-gray-600 font-[600] text-[#000000] text-base md:text-[0.9375vw] leading-[1.2]">Region</p>
            <p className="font-[500] text-[#000000] text-base md:text-[0.9375vw] leading-[1.2]">{region || "Not specified"}</p>
          </div>
          <div className="flex flex-col items-end">
            <p className="text-gray-600 font-[600] text-[#000000] text-base md:text-[0.9375vw] leading-[1.2]">Entry Form</p>
            {downloadUrl || onDownload ? (
              <button
                onClick={handleDownload}
                className="text-blue-600 hover:underline font-[500] text-base md:text-[0.9375vw] leading-[1.2]"
              >
                Download
              </button>
            ) : (
              <p className="font-[500] text-[#000000] text-base md:text-[0.9375vw] leading-[1.2]">No form available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventCard; 
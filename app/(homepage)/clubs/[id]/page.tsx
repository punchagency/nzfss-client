"use client";

import { GET_CLUB_BY_ID, GET_ALL_CLUB_DETAILS } from "@/graphql/query/clubs";
import { useQuery } from "@apollo/client";
import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { FaMapMarkerAlt } from 'react-icons/fa'
import StaticImage from "@/assets/Rectangle.png"
import Link from 'next/link'
import { 
  User, 
  Users, 
  Trophy, 
  Star, 
  Medal, 
  Crown, 
  Award, 
  Shield,
  LucideIcon,
  MapPin,
  Flag
} from "lucide-react";
import Medical from "@/assets/medical-cross-animals.png";
import { StaticImageData } from 'next/image';
import DOMPurify from 'dompurify';
import LeftArrow from "@/assets/leftArrow.svg"
import RightArrow from "@/assets/rightArrow.svg"

interface ClubDetails {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface Coordinates {
  lat: number;
  lng: number;
}

interface Location {
  description: string;
  address: string;
  coordinates?: Coordinates;
  image?: string;
}

interface Statistic {
  name: string;
  value: string;
  icon: string;
  isCustomIcon?: boolean;
  link?: string;
}

interface WhoWeAreSection {
  description: string;
  images: string[];
}

interface Service {
  name: string;
  image?: string;
}

// Update VideoItem to be just a string type
type VideoItem = string;

interface Gallery {
  images: string[];
  videos: VideoItem[];
}

interface Driver {
  name: string;
  image?: string;
  nzfssRR: string;
  ipssRR: string;
}

interface ClubForm {
  fileName: string;
  fileType: string;
  fileSize: number;
  fileData: string;
}

interface ClubManagement {
  clubName: string;
  shortDescription: string;
  clubLogo?: string;
  coverImage?: string;
  statistics: Statistic[];
  whoWeAre: WhoWeAreSection[];
  services: Service[];
  gallery: Gallery;
  location?: Location;
  drivers: Driver[];
  forms?: ClubForm[];
}

interface PageProps {
  params: Promise<{
    id: string;
  }>;
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

// Add icon mapping
type IconType = {
  component: LucideIcon | StaticImageData;
  type: 'lucide' | 'image';
};

const iconMap: Record<string, IconType> = {
  trophy: { component: Trophy, type: 'lucide' },
  star: { component: Star, type: 'lucide' },
  medal: { component: Medal, type: 'lucide' },
  crown: { component: Crown, type: 'lucide' },
  award: { component: Award, type: 'lucide' },
  shield: { component: Shield, type: 'lucide' },
  user: { component: User, type: 'lucide' },
  users: { component: Users, type: 'lucide' },
  location: { component: MapPin, type: 'lucide' },
  medical: { component: Medical, type: 'image' },
  flag: { component: Flag, type: 'lucide' }
};

// Add getVideoPosterUrl function after the iconMap definition
const getVideoPosterUrl = (videoUrl: string): string => {
  console.log('Getting poster URL for video:', videoUrl);
  
  // Ensure URL has proper protocol
  if (!videoUrl.startsWith('http://') && !videoUrl.startsWith('https://')) {
    videoUrl = `https://${videoUrl}`;
  }
  
  // Check if the video is stored in a common video platform like YouTube or Vimeo
  if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
    // Extract YouTube video ID
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = videoUrl.match(youtubeRegex);
    const videoId = match ? match[1] : null;
    if (videoId) {
      const posterUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
      console.log('Generated YouTube poster URL:', posterUrl);
      return posterUrl;
    }
  }
  
  // For other videos, we'll rely on the video element's natural poster behavior
  console.log('Using video element for poster');
  return '';
};

// Helper function to check if a string has meaningful content
const hasMeaningfulContent = (value: any): boolean => {
  if (!value) return false;
  if (typeof value === 'string') {
    // Remove HTML tags and check if there's any non-whitespace content
    const strippedContent = value.replace(/<[^>]*>/g, '').trim();
    return strippedContent !== '';
  }
  if (Array.isArray(value)) {
    return value.length > 0 && value.some(item => hasMeaningfulContent(item));
  }
  if (typeof value === 'object' && value !== null) {
    return Object.values(value).some(val => hasMeaningfulContent(val));
  }
  return false;
};

const hasStatisticsContent = (statistics: Statistic[]): boolean => {
  if (!statistics || !Array.isArray(statistics)) return false;
  return statistics.some(stat => 
    hasMeaningfulContent(stat.name) || 
    hasMeaningfulContent(stat.value) || 
    hasMeaningfulContent(stat.icon)
  );
};

const hasWhoWeAreContent = (whoWeAre: WhoWeAreSection[]): boolean => {
  if (!whoWeAre || !Array.isArray(whoWeAre)) return false;
  return whoWeAre.some(section => 
    hasMeaningfulContent(section.description) || 
    (Array.isArray(section.images) && section.images.length > 0)
  );
};

const hasServicesContent = (services: Service[]): boolean => {
  if (!services || !Array.isArray(services)) return false;
  return services.some(service => 
    hasMeaningfulContent(service.name) || 
    hasMeaningfulContent(service.image)
  );
};

const hasGalleryContent = (gallery: Gallery): boolean => {
  if (!gallery) return false;
  
  // Check if images array has content
  const hasImages = Array.isArray(gallery.images) && gallery.images.length > 0;
  
  // Check if videos array has content (as strings)
  const hasVideos = Array.isArray(gallery.videos) && gallery.videos.length > 0 && 
    gallery.videos.some(video => typeof video === 'string' && video.trim() !== '');
  
  return hasImages || hasVideos;
};

const hasDriversContent = (drivers: Driver[]): boolean => {
  if (!drivers || !Array.isArray(drivers)) return false;
  return drivers.some(driver => 
    hasMeaningfulContent(driver.name) || 
    hasMeaningfulContent(driver.nzfssRR) || 
    hasMeaningfulContent(driver.ipssRR) || 
    hasMeaningfulContent(driver.image)
  );
};

// Helper to check if location has any meaningful content
function hasLocationContent(location?: Location | null): boolean {
  if (!location) return false;
  return Boolean(
    hasMeaningfulContent(location.description) ||
    hasMeaningfulContent(location.address) ||
    hasMeaningfulContent(location.image) ||
    (location.coordinates && 
     (location.coordinates.lat !== 0 || location.coordinates.lng !== 0))
  );
}

const ClubDetailsPage: React.FC<PageProps> = ({ params }) => {
  const resolvedParams = React.use(params) as { id: string };
  
  // Fetch club basic info
  const { data: clubData, loading: clubLoading, error: clubError } = useQuery(GET_CLUB_BY_ID, {
    variables: {
      input: {
        _id: resolvedParams.id
      }
    }
  });

  // Fetch club management details
  const { data: managementData, loading: managementLoading, error: managementError } = useQuery(GET_ALL_CLUB_DETAILS);

  const [activeTab, setActiveTab] = useState<'images' | 'videos'>('images');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [whoWeAreCurrentSlides, setWhoWeAreCurrentSlides] = useState<Record<number, number>>({});
  const [currentPage, setCurrentPage] = useState(0);
  const [currentVideoPage, setCurrentVideoPage] = useState(0);
  const [showAllVideos, setShowAllVideos] = useState(false);
  const [showForms, setShowForms] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const formsDropdownRef = React.useRef<HTMLDivElement>(null);

  // Add the logVideoError function
  const logVideoError = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    const errorMessage = video.error?.message || 'Unknown error';
    
    console.error('Video playback error:', {
      error: errorMessage,
      networkState: video.networkState,
      readyState: video.readyState,
      src: video.src
    });
    
    setVideoError(errorMessage);
  };

  // Effect to close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (formsDropdownRef.current && !formsDropdownRef.current.contains(event.target as Node)) {
        setShowForms(false);
      }
    }
    
    // Add event listener
    document.addEventListener('mousedown', handleClickOutside);
    
    // Clean up
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Constants for pagination
  const imagesPerPage = 8;
  const videosPerPage = 4;

  // Calculate total pages
  const getTotalImagePages = (images: string[]) => {
    return Math.ceil(images?.length / imagesPerPage) || 0;
  };

  const getVisibleImages = (images: string[]) => {
    const start = currentPage * imagesPerPage;
    return images?.slice(start, start + imagesPerPage) || [];
  };

  // Update the getVisibleVideos function
  const getVisibleVideos = (videos: Gallery['videos']) => {
    if (!videos || !Array.isArray(videos)) return [];
    
    if (showAllVideos) return videos;
    const start = currentVideoPage * videosPerPage;
    return videos.slice(start, start + videosPerPage);
  };

  const handleNextPage = () => {
    const totalPages = getTotalImagePages(clubManagement?.gallery?.images || []);
    setCurrentPage((prev) => (prev + 1) % totalPages);
  };

  const handlePrevPage = () => {
    const totalPages = getTotalImagePages(clubManagement?.gallery?.images || []);
    setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages);
  };

  const getVisibleThumbnails = () => {
    const images = clubManagement?.gallery?.images || [];
    const currentIndex = images.indexOf(selectedImage as string);
    const start = Math.max(0, Math.min(currentIndex - 2, images.length - 5));
    return images.slice(start, start + 5);
  };

  const getVisibleVideoThumbnails = (currentVideo: string) => {
    const videos = clubManagement?.gallery?.videos || [];
    const currentIndex = videos.indexOf(currentVideo);
    const start = Math.max(0, Math.min(currentIndex - 2, videos.length - 5));
    return videos.slice(start, start + 5);
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedImage) {
      const images = clubManagement?.gallery?.images || [];
      const currentIndex = images.indexOf(selectedImage as string);
      const nextIndex = (currentIndex + 1) % images.length;
      setSelectedImage(images[nextIndex]);
    }
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedImage) {
      const images = clubManagement?.gallery?.images || [];
      const currentIndex = images.indexOf(selectedImage as string);
      const prevIndex = (currentIndex - 1 + images.length) % images.length;
      setSelectedImage(images[prevIndex]);
    }
  };

  // Update the handleNextVideo function
  const handleNextVideo = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedVideo) {
      const videos = clubManagement?.gallery?.videos || [];
      if (videos.length === 0) {
        console.error("No valid videos found");
        return;
      }
      
      const currentVideoIndex = videos.indexOf(selectedVideo);
      if (currentVideoIndex > -1) {
        const nextIndex = (currentVideoIndex + 1) % videos.length;
        setSelectedVideo(videos[nextIndex]);
      } else {
        console.error("Current video not found in videos array");
      }
    }
  };

  // Update the handlePrevVideo function
  const handlePrevVideo = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedVideo) {
      const videos = clubManagement?.gallery?.videos || [];
      if (videos.length === 0) {
        console.error("No valid videos found");
        return;
      }
      
      const currentVideoIndex = videos.indexOf(selectedVideo);
      if (currentVideoIndex > -1) {
        const prevIndex = (currentVideoIndex - 1 + videos.length) % videos.length;
        setSelectedVideo(videos[prevIndex]);
      } else {
        console.error("Current video not found in videos array");
      }
    }
  };

  // Helper function to navigate slides in Who We Are section
  const navigateWhoWeAreSlide = (sectionIndex: number, direction: 'prev' | 'next', totalSlides: number) => {
    setWhoWeAreCurrentSlides(prev => {
      const currentIndex = prev[sectionIndex] || 0;
      let newIndex;
      
      if (direction === 'prev') {
        newIndex = (currentIndex - 1 + totalSlides) % totalSlides;
      } else {
        newIndex = (currentIndex + 1) % totalSlides;
      }
      
      return { ...prev, [sectionIndex]: newIndex };
    });
  };

  // Helper to validate image URL
  const isValidImageUrl = (url: string): boolean => {
    if (!url) return false;
    
    // Handle data URLs (base64 encoded images)
    if (url.startsWith('data:image/')) {
      return true;
    }
    
    return url.startsWith('http') || url.startsWith('/');
  };

  // Update the getImageSrc function to return undefined instead of null
  const getImageSrc = (imageUrl: string): string | undefined => {
    if (!imageUrl) return undefined;
    
    // If it's already a valid URL, use it
    if (isValidImageUrl(imageUrl)) {
      return imageUrl;
    }
    
    // Return undefined for invalid URLs
    return undefined;
  };

  const sanitizeHtml = (html: string) => {
    if (!html) return { __html: '' };
    
    // First sanitize the HTML content
    const sanitized = DOMPurify.sanitize(html, {
      ADD_ATTR: ['target', 'rel'], // Allow target and rel attributes for links
      ADD_TAGS: ['a'] // Ensure 'a' tags are allowed
    });
    
    return { __html: sanitized };
  };

  // Enhanced function that both sanitizes HTML and converts URLs to links
  const sanitizeAndConvertLinks = (content: string) => {
    if (!content) return { __html: '' };
    
    // Check if the content already has HTML tags
    const hasHtmlTags = /<[a-z][\s\S]*>/i.test(content);
    
    // If it has HTML tags, just sanitize it
    if (hasHtmlTags) {
      return sanitizeHtml(content);
    } 
    
    // For plain text content, convert URLs to links
    // URL regex pattern
    const urlRegex = /(https?:\/\/|www\.)[^\s]+/g;
    
    // Replace URLs with HTML anchor tags
    const contentWithLinks = content.replace(urlRegex, (url) => {
      let href = url;
      if (url.startsWith("www.")) {
        href = `https://${url}`;
      }
      return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">${url}</a>`;
    });
    
    // Sanitize the resulting HTML
    return { __html: DOMPurify.sanitize(contentWithLinks) };
  };

  // Helper to check if a string is non-empty after trimming
  function isNonEmptyString(value?: string | null): boolean {
    return typeof value === 'string' && value.trim() !== '';
  }

  if (clubLoading || managementLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-xl font-semibold">Loading club details...</p>
      </div>
    );
  }

  if (clubError || managementError) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-red-500">Error loading club details: {clubError?.message || managementError?.message}</p>
      </div>
    );
  }

  const club = clubData?.findClubById;
  const clubManagement = managementData?.getAllClubManagements?.find(
    (cm: ClubManagement) => cm.clubName.toLowerCase() === club?.name.toLowerCase()
  );

  if (!club) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-red-500">Club not found</p>
      </div>
    );
  }

  const handleImageClick = (image: string) => {
    setSelectedImage(image);
  };

  // Update the handleVideoClick function
  const handleVideoClick = (videoUrl: string) => {
    if (!videoUrl) {
      console.error("Attempted to play invalid video:", videoUrl);
      return;
    }
    setVideoError(null);
    setSelectedVideo(videoUrl);
  };

  const handleCloseImage = () => {
    setSelectedImage(null);
  };

  const handleCloseVideo = () => {
    setSelectedVideo(null);
  };

  // Add this before the return in ClubDetailsPage
  const showLocationSection = hasLocationContent(clubManagement?.location);

  return (
    <div className="min-h-screen bg-white">
      <div className="w-full px-4 sm:px-6 md:px-[48px]">
        {/* Logo and Title Section */}
        <div className="flex flex-col items-center text-center pt-8 md:pt-16 pb-6 md:pb-12">
          {clubManagement?.clubLogo && (
            <div className="w-20 h-20 md:w-24 md:h-24 lg:w-[7.708vw] lg:h-[7.708vw] mb-4 overflow-hidden rounded-full">
              {getImageSrc(clubManagement.clubLogo) && (
                <img
                  src={getImageSrc(clubManagement.clubLogo)!}
                  alt={`${club.name} logo`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.error("Logo failed to load:", 
                      clubManagement.clubLogo && clubManagement.clubLogo.length > 100 
                        ? `${clubManagement.clubLogo.substring(0, 100)}...` 
                        : clubManagement.clubLogo);
                    e.currentTarget.style.display = 'none';
                  }}
                />
              )}
              {!getImageSrc(clubManagement.clubLogo) && (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                  <span className="text-gray-400 text-sm">No logo</span>
                </div>
              )}
            </div>
          )}
          <h1 className="text-4xl md:text-5xl lg:text-[84px] font-[700] mb-3 md:mb-6">{club.name}</h1>
          {clubManagement?.shortDescription && (
            <div
              className="text-base md:text-xl lg:text-[24px] text-gray-600 max-w-full md:max-w-[80%] lg:max-w-[60%] mx-auto"
              dangerouslySetInnerHTML={sanitizeAndConvertLinks(clubManagement.shortDescription)}
            />
          )}

          {/* Forms Dropdown Section */}
          {clubManagement?.forms && clubManagement.forms.length > 0 && (
            <div className="mt-6 md:mt-8 relative" ref={formsDropdownRef}>
              <button
                onClick={() => setShowForms(!showForms)}
                className="bg-black text-white py-2 px-4 md:py-3 md:px-6 rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                <span className="text-sm md:text-base">Check out forms</span>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  className={`ml-1 transition-transform ${showForms ? 'rotate-180' : ''}`}
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
              
              {showForms && (
                <div className="absolute z-10 mt-2 w-56 md:w-64 bg-white rounded-md shadow-lg overflow-hidden">
                  <div className="py-1 max-h-64 overflow-y-auto">
                    {clubManagement.forms.map((form: ClubForm, index: number) => (
                      <a
                        key={index}
                        href={form.fileData}
                        download={form.fileName}
                        className="flex items-center justify-between px-3 py-2 md:px-4 md:py-3 text-xs md:text-sm text-gray-700 hover:bg-gray-200 transition-colors group"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <div className="flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" className="md:w-4 md:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                          </svg>
                          <span className="truncate max-w-[120px] md:max-w-[180px]">{form.fileName}</span>
                        </div>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" className="text-gray-500 group-hover:text-gray-700 md:w-4 md:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                          <polyline points="7 10 12 15 17 10"></polyline>
                          <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Cover Image Section - Only show if cover image exists */}
        {clubManagement?.coverImage && (
          <div className="h-[200px] sm:h-[300px] md:h-[400px] lg:h-[51.615vw] border border-gray-200 w-full mb-8 md:mb-20 rounded-2xl overflow-hidden">
            {getImageSrc(clubManagement.coverImage) && (
              <img
                src={getImageSrc(clubManagement.coverImage)!}
                alt={club.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.error("Cover image failed to load:", 
                    clubManagement.coverImage && clubManagement.coverImage.length > 100 
                      ? `${clubManagement.coverImage.substring(0, 100)}...` 
                      : clubManagement.coverImage);
                  e.currentTarget.style.display = 'none';
                }}
              />
            )}
            {!getImageSrc(clubManagement.coverImage) && (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                <span className="text-gray-400">No cover image</span>
              </div>
            )}
          </div>
        )}

        {/* Statistics Icons Section */}
        {clubManagement?.statistics && hasStatisticsContent(clubManagement.statistics) && (
          <div className="mb-16 md:mb-32">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[64px] font-[700] mb-8 md:mb-16 text-center">Statistics</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-12">
              {clubManagement.statistics.map((stat: Statistic, index: number) => {
                if (!hasMeaningfulContent(stat.name) && !hasMeaningfulContent(stat.value) && !hasMeaningfulContent(stat.icon)) return null;
                const iconData = stat.icon ? iconMap[stat.icon.toLowerCase()] : null;
                return (
                  <div key={index} className="p-4 md:p-6 text-center">
                    <div className="flex justify-center mb-4">
                      {iconData && (
                        <div className="w-16 h-16 md:w-24 md:h-24 bg-gray-100 rounded-full flex items-center justify-center">
                          {iconData.type === 'lucide' ? (
                            React.createElement(iconData.component as LucideIcon, {
                              size: 24,
                              className: "text-gray-800"
                            })
                          ) : (
                            <Image 
                              src={iconData.component as StaticImageData}
                              alt={stat.name}
                              width={24}
                              height={24}
                              className="object-contain"
                            />
                          )}
                        </div>
                      )}
                    </div>
                    <p className="text-base sm:text-lg md:text-xl lg:text-[1.25vw] text-[#1A1A1ACC] font-[500] mb-1">{stat.name}</p>
                    {stat.value && <p className="text-gray-600 text-sm md:text-base">{stat.value}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Who We Are Section */}
        {clubManagement?.whoWeAre && hasWhoWeAreContent(clubManagement.whoWeAre) && (
          <div className="mb-16 md:mb-32">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[64px] font-[700] mb-8 md:mb-16 text-center">Who We Are</h2>
            {clubManagement.whoWeAre.map((section: WhoWeAreSection, index: number) => {
              if (!hasMeaningfulContent(section.description) && !hasMeaningfulContent(section.images)) return null;
              
              const currentSlideIndex = whoWeAreCurrentSlides[index] || 0;
              const hasMultipleImages = section.images && section.images.length > 1;
              
              return (
                <div key={index} className="bg-white border rounded-lg p-4 md:p-8 flex flex-col md:flex-row items-center mb-8 md:mb-16">
                  {hasMeaningfulContent(section.description) && (
                    <div className="w-full md:w-1/2 mb-6 md:mb-0">
                      <h3 className="text-xl md:text-2xl lg:text-[1.667vw] font-bold mb-4">{clubManagement.clubName}</h3>
                      <div 
                        className="text-base md:text-lg lg:text-[1.25vw] text-gray-700 mb-6"
                        dangerouslySetInnerHTML={sanitizeAndConvertLinks(section.description)}
                      />
                    </div>
                  )}
                  {hasMeaningfulContent(section.images) && (
                    <div className={`w-full ${hasMeaningfulContent(section.description) ? 'md:w-1/2' : ''}`}>
                      <div className="relative h-[250px] sm:h-[300px] md:h-[400px] lg:h-[34vw] w-full rounded-xl overflow-hidden">
                        {/* Navigation buttons */}
                        {hasMultipleImages && (
                          <>
                            <button 
                              className="absolute left-4 md:left-16 top-1/2 transform -translate-y-1/2 z-10 bg-white bg-opacity-100 text-gray-700 w-8 h-8 md:w-12 md:h-12 rounded-full flex items-center justify-center hover:bg-opacity-90 transition-all"
                              onClick={() => navigateWhoWeAreSlide(index, 'prev', section.images.length)}
                            >
                              <span className="text-2xl md:text-4xl font-bold">‹</span>
                            </button>
                            <button 
                              className="absolute right-4 md:right-16 top-1/2 transform -translate-y-1/2 z-10 bg-white bg-opacity-100 text-gray-700 w-8 h-8 md:w-12 md:h-12 rounded-full flex items-center justify-center hover:bg-opacity-90 transition-all"
                              onClick={() => navigateWhoWeAreSlide(index, 'next', section.images.length)}
                            >
                              <span className="text-2xl md:text-4xl font-bold">›</span>
                            </button>
                          </>
                        )}
                        {/* Current image */}
                        <div className="w-full h-full relative">
                          <img
                            src={getImageSrc(section.images[currentSlideIndex] || '')}
                            alt={`Who we are ${currentSlideIndex + 1}`}
                            className="w-full h-full object-contain object-top"
                            onError={(e) => {
                              const imageUrl = section.images[currentSlideIndex];
                              console.error("Image failed to load:", 
                                imageUrl && imageUrl.length > 100 
                                  ? `${imageUrl.substring(0, 100)}...` 
                                  : imageUrl);
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>

                        {/* Slide indicators */}
                        {hasMultipleImages && (
                          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                            {section.images.map((_, imgIndex: number) => (
                              <button
                                key={imgIndex}
                                className={`w-2 h-2 rounded-full transition-all ${
                                  imgIndex === currentSlideIndex ? 'bg-white w-4' : 'bg-white bg-opacity-50'
                                }`}
                                onClick={() => setWhoWeAreCurrentSlides(prev => ({ ...prev, [index]: imgIndex }))}
                              ></button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Services Section */}
        {clubManagement?.services && hasServicesContent(clubManagement.services) && (
          <div className="mb-16 md:mb-32">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[64px] font-[700] mb-8 md:mb-16 text-center">Our Services</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-12">
              {clubManagement.services.map((service: Service, index: number) => {
                if (!hasMeaningfulContent(service.name) && !hasMeaningfulContent(service.image)) return null;
                
                return (
                  <div key={index} className="bg-[#ECECEF] border rounded-lg overflow-hidden">
                    {hasMeaningfulContent(service.image) && service.image && (
                      <div className="h-[150px] sm:h-[180px] md:h-[200px]">
                        <img
                          src={getImageSrc(service.image)}
                          alt={service.name?.trim() || 'Service image'}
                          className="w-full h-full object-cover px-2 py-2 rounded-[16px]"
                          onError={(e) => {
                            console.error("Service image failed to load:", 
                              service.image && service.image.length > 100 
                                ? `${service.image.substring(0, 100)}...` 
                                : service.image);
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    {hasMeaningfulContent(service.name) && (
                      <div className="p-4 md:p-6">
                        <h3 className="text-lg md:text-xl font-semibold text-center mb-2">{service.name}</h3>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* See Us In Action Section */}
        {clubManagement?.gallery && hasGalleryContent(clubManagement.gallery) && (
          <div className="mb-16 md:mb-32">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[64px] font-[700] mb-8 md:mb-16 text-center">See Us In Action</h2>
            <div className="w-full flex justify-center mb-6 md:mb-8">
              <div className="flex rounded-[15px] border border-[#E5E5E5] overflow-hidden">
                <button 
                  className={`px-4 md:px-[48px] w-[140px] md:w-[47.5vw] py-[10px] md:py-[15px] transition-colors
                    ${activeTab === 'images' 
                      ? 'bg-[#F2F2F2]' 
                      : 'bg-white hover:bg-gray-200'
                    } text-sm md:text-[16px] font-[500]`}
                  onClick={() => setActiveTab('images')}
                  disabled={!clubManagement.gallery?.images || clubManagement.gallery.images.length === 0}
                >
                  Images
                </button>
                <button 
                  className={`px-4 md:px-[48px] w-[140px] md:w-[47.5vw] py-[10px] md:py-[15px] transition-colors
                    ${activeTab === 'videos' 
                      ? 'bg-[#F2F2F2]' 
                      : 'bg-white hover:bg-gray-200'
                    } text-sm md:text-[16px] font-[500]`}
                  onClick={() => setActiveTab('videos')}
                  disabled={!clubManagement.gallery?.videos || clubManagement.gallery.videos.length === 0}
                >
                  Video
                </button>
              </div>
            </div>

            {activeTab === 'images' && clubManagement.gallery?.images && clubManagement.gallery.images.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-[24px]">
                {getVisibleImages(clubManagement.gallery.images).map((image: string, index: number) => (
                  <div 
                    key={index} 
                    className="rounded-[16px] overflow-hidden cursor-pointer h-[120px] sm:h-[160px] md:h-[200px] lg:h-[240px] bg-gray-100"
                    onClick={() => handleImageClick(image)}
                  >
                    {getImageSrc(image) && (
                      <img
                        src={getImageSrc(image)!}
                        alt={`Gallery image ${currentPage * imagesPerPage + index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.error("Gallery image failed to load:", 
                            image && image.length > 100 
                              ? `${image.substring(0, 100)}...` 
                              : image);
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    )}
                    {!getImageSrc(image) && (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-gray-400 text-sm">Image unavailable</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : activeTab === 'videos' && clubManagement?.gallery?.videos && clubManagement.gallery.videos.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 lg:gap-10">
                {getVisibleVideos(clubManagement.gallery.videos).map((videoUrl, index: number) => (
                  <div 
                    key={index} 
                    className="relative w-full aspect-video rounded-xl overflow-hidden cursor-pointer shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] bg-gray-900"
                    onClick={() => handleVideoClick(videoUrl)}
                  >
                    {/* Video Thumbnail */}
                    <video 
                      className="w-full h-full object-cover"
                      src={videoUrl}
                      poster={getVideoPosterUrl(videoUrl)}
                      muted
                      preload="metadata"
                      onLoadedMetadata={(e) => {
                        console.log('Debug - Video metadata loaded:', { index, url: videoUrl });
                        const videoElement = e.target as HTMLVideoElement;
                        videoElement.currentTime = 0.5;
                      }}
                      onLoadedData={(e) => {
                        console.log('Debug - Video data loaded:', { index, url: videoUrl });
                      }}
                      onError={(e) => {
                        console.error('Debug - Video error:', { index, url: videoUrl, error: e });
                        const target = e.target as HTMLVideoElement;
                        target.style.display = 'none';
                      }}
                    />
                    
                    {/* Play Button Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center z-20">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 bg-black bg-opacity-70 rounded-full flex items-center justify-center hover:bg-opacity-80 transition-all duration-200">
                        <svg 
                          width="20" 
                          height="20" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          xmlns="http://www.w3.org/2000/svg"
                          className="md:w-6 md:h-6 lg:w-8 lg:h-8 ml-1"
                        >
                          <path 
                            d="M8 5L19 12L8 19V5Z" 
                            fill="white" 
                            stroke="white" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {/* Navigation for Images */}
            {activeTab === 'images' && clubManagement.gallery?.images && clubManagement.gallery.images.length > imagesPerPage && (
              <div className="flex justify-center items-center gap-x-[8px] mt-6 md:mt-8">
                <button 
                  onClick={handlePrevPage}
                  className="w-[32px] h-[32px] flex items-center justify-center"
                >
                  <Image src={LeftArrow} alt="Previous" />
                </button>
                {[...Array(getTotalImagePages(clubManagement.gallery.images))].map((_, index) => (
                  <div
                    key={index}
                    className={`w-[8px] h-[8px] rounded-full ${
                      currentPage === index ? 'bg-black' : 'bg-[#D9D9D9]'
                    }`}
                  ></div>
                ))}
                <button 
                  onClick={handleNextPage}
                  className="w-[32px] h-[32px] flex items-center justify-center"
                >
                  <Image src={RightArrow} alt="Next" />
                </button>
              </div>
            )}

            {/* Load More Videos Button */}
            {activeTab === 'videos' && !showAllVideos && 
              clubManagement.gallery?.videos && 
              clubManagement.gallery.videos.length > videosPerPage && (
              <div className="flex justify-center mt-6 md:mt-8">
                <button
                  onClick={() => setShowAllVideos(true)}
                  className="px-4 py-2 md:px-6 md:py-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm md:text-base"
                >
                  Load More
                </button>
              </div>
            )}
          </div>
        )}

        {/* Where You Can Find Us Section */}
        {showLocationSection && (
          <div className="mb-16 md:mb-32">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[4.375vw] font-[700] mb-6 md:mb-12 text-center">Where You Can Find Us</h2>
            <div className="flex flex-col md:flex-row items-center">
              {isNonEmptyString(clubManagement.location?.image) && (
                <div className="w-full md:w-[80vw] h-[36.979vw] p-2 md:p-4">
                  <div className="p-2 md:p-4 relative w-full h-full">
                    {getImageSrc(clubManagement.location.image as string) && (
                      <img
                        src={getImageSrc(clubManagement.location.image as string)!}
                        alt="Location"
                        className="rounded-xl w-full h-full object-cover"
                        onError={(e) => {
                          const imageUrl = clubManagement.location?.image as string;
                          console.error("Location image failed to load:", 
                            imageUrl && imageUrl.length > 100 
                              ? `${imageUrl.substring(0, 100)}...` 
                              : imageUrl);
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    )}
                  </div>
                </div>
              )}
              <div className="p-2 md:p-4 w-full md:w-auto">
                {isNonEmptyString(clubManagement.location?.description) && (
                  <div 
                    className="text-base md:text-lg lg:text-[1.25vw] mx-2 md:ml-8 text-gray-600 mb-4"
                    dangerouslySetInnerHTML={sanitizeAndConvertLinks(clubManagement.location.description as string)}
                  />
                )}
                {isNonEmptyString(clubManagement.location?.address) && (
                  <div className="flex items-center mx-2 md:ml-8 gap-2 md:gap-4 text-base md:text-xl mb-4">
                    <FaMapMarkerAlt className="text-red-500 -mr-1 md:-mr-2 text-lg md:text-2xl" />
                    <div dangerouslySetInnerHTML={sanitizeAndConvertLinks(clubManagement.location.address as string)} />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* NZFSS and IFSS Registered Drivers Section */}
        {clubManagement?.drivers && hasDriversContent(clubManagement.drivers) && (
          <div className="mb-16 md:mb-32">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[64px] font-[700] mb-8 md:mb-16 text-center">NZFSS & IFSS Registered Drivers</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-12">
              {clubManagement.drivers.map((driver: Driver, index: number) => {
                if (!hasMeaningfulContent(driver.name) && 
                    !hasMeaningfulContent(driver.nzfssRR) && 
                    !hasMeaningfulContent(driver.ipssRR) && 
                    !hasMeaningfulContent(driver.image)) {
                  return null;
                }
                
                return (
                  <div key={index} className="rounded-xl overflow-hidden hover:shadow-xl transition-shadow">
                    {hasMeaningfulContent(driver.image) && driver.image && (
                      <div className="h-[19vw]">
                        <img
                          src={getImageSrc(driver.image)}
                          alt={driver.name?.trim() || 'Driver image'}
                          className="w-full h-full object-cover rounded-[16px]"
                          onError={(e) => {
                            console.error("Driver image failed to load:", 
                              driver.image && driver.image.length > 100 
                                ? `${driver.image.substring(0, 100)}...` 
                                : driver.image);
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    <div className="p-6 text-left">
                      {hasMeaningfulContent(driver.name) && (
                        <h4 className="text-2xl font-semibold mb-2">{driver.name}</h4>
                      )}
                      {hasMeaningfulContent(driver.nzfssRR) && (
                        <p className="text-gray-600 text-lg">NZFSS RR: {driver.nzfssRR}</p>
                      )}
                      {hasMeaningfulContent(driver.ipssRR) && (
                        <p className="text-gray-600 text-lg">IFSS Registration: {driver.ipssRR}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Back to Clubs Link */}
        <div className="pb-16">
          <Link
            href="/clubs"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium text-xl"
          >
            <span className="mr-3">←</span>
            Back to Clubs
          </Link>
        </div>
      </div>

      {/* Video Lightbox */}
      {selectedVideo && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col items-center justify-center"
          onClick={handleCloseVideo}
        >
          <button 
            className="absolute top-4 right-4 text-white text-4xl font-bold z-50 cursor-pointer"
            onClick={handleCloseVideo}
          >
            ×
          </button>

          <div className="relative w-full h-full flex items-center justify-center">
            {/* Left Arrow */}
            <button 
              className="absolute left-4 md:left-48 text-white text-4xl font-bold z-50 w-12 h-12 flex items-center justify-center cursor-pointer"
              onClick={handlePrevVideo}
            >
              <Image src={LeftArrow} alt="Previous" width={20} height={20} />
            </button>

            {/* Main Video */}
            <div className="max-w-[90vw] md:max-w-[80vw] h-[75vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
              <div className="w-full h-full bg-black flex items-center justify-center">
                {videoError ? (
                  <div className="text-white text-center p-8 max-w-lg">
                    <div className="mb-4 text-red-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold mb-2">Video playback error</h3>
                    <p className="mb-4">{videoError}</p>
                    <p className="text-gray-400 text-sm">
                      This could be due to an invalid video URL, an unsupported format, or CORS policy restrictions.
                    </p>
                  </div>
                ) : selectedVideo ? (
                  <video 
                    key={selectedVideo}
                    className="max-w-full max-h-full"
                    controls
                    autoPlay
                    playsInline
                    preload="auto"
                    onError={logVideoError}
                  >
                    <source src={selectedVideo} type="video/mp4" />
                    <source src={selectedVideo} type="video/webm" />
                    <p className="text-white p-4">
                      Your browser does not support HTML5 video or the video format is not supported.
                    </p>
                  </video>
                ) : (
                  <div className="text-white p-4">
                    Unable to play video. The video URL is missing or invalid.
                  </div>
                )}
              </div>
            </div>

            {/* Right Arrow */}
            <button 
              className="absolute right-4 md:right-48 text-white text-4xl font-bold z-50 w-12 h-12 flex items-center justify-center cursor-pointer"
              onClick={handleNextVideo}
            >
              <Image src={RightArrow} alt="Next" width={20} height={20} />
            </button>
          </div>
        </div>
      )}

      {/* Image Lightbox */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col items-center justify-center"
          onClick={(e) => {
            // Get the clicked element
            const target = e.target as HTMLElement;
            
            // Check if the click was on the outer container or its direct children that aren't part of the image/navigation
            if (
              target === e.currentTarget || // Clicked the outer container
              (target.parentElement === e.currentTarget && // Clicked a direct child of the container
               !target.closest('.image-container') && // Not part of the image container
               !target.closest('.navigation-button') && // Not a navigation button
               !target.closest('.thumbnails-container')) // Not part of thumbnails
            ) {
              handleCloseImage();
            }
          }}
        >
          <div className="relative w-full h-full flex flex-col items-center pt-16">
            {/* Close button - centered above image */}
            <button 
              className="absolute top-2 left-1/2 transform -translate-x-1/2 text-white text-4xl font-bold z-50 cursor-pointer w-12 h-12 bg-black bg-opacity-50 rounded-full flex items-center justify-center hover:bg-opacity-70"
              onClick={handleCloseImage}
            >
              ×
            </button>

            <div className="relative w-full flex-1 flex items-center justify-center mt-8">
              {/* Main Image container with relative positioning */}
              <div className="relative max-w-[90vw] md:max-w-[80vw] h-[60vh] flex items-center justify-center image-container" onClick={(e) => e.stopPropagation()}>
                {/* Left Arrow - Overlap image even more */}
                <button 
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-white z-[100] w-10 h-10 flex items-center justify-center cursor-pointer bg-black bg-opacity-50 rounded-full hover:bg-opacity-70 navigation-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrevImage(e);
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15 18L9 12L15 6" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>

                {/* Main Image */}
                {getImageSrc(selectedImage) && (
                  <img
                    src={getImageSrc(selectedImage)!}
                    alt="Selected image"
                    className="max-h-full max-w-full object-contain"
                    onError={(e) => {
                      console.error("Lightbox image failed to load:", 
                        selectedImage && selectedImage.length > 100 
                          ? `${selectedImage.substring(0, 100)}...` 
                          : selectedImage);
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                )}

                {/* Right Arrow - Overlap image even more */}
                <button 
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-white z-[100] w-10 h-10 flex items-center justify-center cursor-pointer bg-black bg-opacity-50 rounded-full hover:bg-opacity-70 navigation-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNextImage(e);
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 18L15 12L9 6" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Thumbnails row */}
            {clubManagement?.gallery?.images && clubManagement.gallery.images.length > 1 && (
              <div className="w-full flex justify-center overflow-x-auto px-4 py-4 mt-4 thumbnails-container">
                <div className="flex space-x-4 max-w-full">
                  {(() => {
                    // Get the current index
                    const currentIndex = clubManagement.gallery.images.indexOf(selectedImage as string);
                    // Determine which 5 images to show
                    let startIndex = Math.max(0, currentIndex - 2);
                    const endIndex = Math.min(startIndex + 5, clubManagement.gallery.images.length);
                    
                    // Adjust start index if we're near the end
                    if (endIndex - startIndex < 5) {
                      startIndex = Math.max(0, endIndex - 5);
                    }
                    
                    // Get the visible thumbnails
                    const visibleThumbnails = clubManagement.gallery.images.slice(startIndex, endIndex);
                    
                    return (
                      <React.Fragment>
                        {visibleThumbnails.map((image: string, index: number) => {
                          const isActive = image === selectedImage;
                          const actualIndex = startIndex + index;
                          
                          return (
                            <div 
                              key={actualIndex}
                              className={`h-20 w-20 flex-shrink-0 cursor-pointer rounded-md overflow-hidden transition-all ${
                                isActive ? 'border-2 border-white scale-110 z-10' : 'opacity-70 hover:opacity-100'
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedImage(image);
                              }}
                            >
                              {getImageSrc(image) && (
                                <img 
                                  src={getImageSrc(image)!} 
                                  alt={`Thumbnail ${actualIndex + 1}`}
                                  className={`w-full h-full object-cover transition-all ${!isActive ? 'blur-sm' : ''}`}
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              )}
                            </div>
                          );
                        })}
                      </React.Fragment>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ClubDetailsPage; 
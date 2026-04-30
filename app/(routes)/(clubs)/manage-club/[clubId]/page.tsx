"use client";

import React, { use } from 'react';
import { Sidebar } from "@/app/(routes)/_components/sidebar";
import TopHeader from "@/app/(routes)/_components/top_header";
import { useState, useRef, useEffect } from "react";
import { 
  User, 
  Users, 
  Trophy, 
  Star, 
  Medal, 
  Crown, 
  Award, 
  Shield,
  MapPin,
  Flag,
  LucideIcon 
} from "lucide-react";
import Image from "next/image";
import { useMutation, useQuery } from '@apollo/client';
import { CREATE_CLUB_MANAGEMENT, UPDATE_CLUB_MANAGEMENT } from '../../../../../graphql/mutation/clubManagement';
import { GET_ALL_CLUB_DETAILS } from '../../../../../graphql/query/clubs';
import { useParams } from 'next/navigation';
import Link from "next/link";
import Medical from "@/assets/medical-cross-animals.png";
import { StaticImageData } from 'next/image';

// Add type for statistics
interface Statistic {
  name: string;
  value: string;
  icon: string;
  isCustomIcon?: boolean;
  iconType?: 'lucide' | 'image';
  link?: string;
}

interface ClubManagement {
  clubName: string;
  shortDescription: string;
  clubLogo?: string;
  coverImage?: string;
  statistics: Statistic[];
  whoWeAre: Array<{
    description: string;
    images: string[];
    link?: string;
  }>;
  services: Array<{
    name: string;
    image?: string;
    link?: string;
  }>;
}

// Add type for icon mapping
type IconType = {
    component: LucideIcon | StaticImageData;
    type: 'lucide' | 'image';
};

/**
 * Converts URLs in text to clickable hyperlinks
 * @param text The text that may contain URLs
 * @returns JSX with URLs converted to hyperlinks
 */
const convertUrlsToLinks = (text: string): JSX.Element => {
  if (!text) return <></>;
  
  // Pre-process text to handle malformed URLs
  let fixedText = text;
  
  // Fix any duplicate protocols and strip all protocols for display
  fixedText = fixedText.replace(/https:\/\/https:\/\//g, "https://");
  fixedText = fixedText.replace(/http:\/\/http:\/\//g, "http://");
  
  // Fix https:// appended to domains incorrectly
  fixedText = fixedText.replace(/([a-zA-Z0-9-]+\.[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*)https:\/\//g, "$1");
  
  // Regular expression to match URLs (including both with and without protocols)
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
      
      // Remove any duplicated protocols
      href = href.replace(/https?:\/\/https:\/\//g, "https://");
      href = href.replace(/http:\/\/http:\/\//g, "http://");
      href = href.replace(/([a-zA-Z0-9-]+\.[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*)https:\/\//g, "$1");
      
      // Extremely aggressive protocol stripping for display text
      let displayText = url;
      
      // Remove all http:// and https:// occurrences, not just at the start
      displayText = displayText.replace(/https?:\/\//ig, "");
      
      // Remove www. prefix if it exists
      displayText = displayText.replace(/^www\./i, "");
      
      // Make sure no additional protocols are left
      displayText = displayText.replace(/https?:\/\//ig, "");
      
      result.push(
        <a 
          key={`link-${index}`} 
          href={href} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 underline hover:underline"
        >
          {displayText}
        </a>
      );
    }
  });
  
  return <>{result}</>;
};

const ManageClub = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedClub, setSelectedClub] = useState<any>(null);
    const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
    
    // Get club ID from URL params using useParams
    const params = useParams();
    const clubId = params?.clubId as string;
    
    // Add debug log for params
    useEffect(() => {
        console.log("URL Parameters:", params);
        console.log("Current clubId:", clubId);
    }, [params, clubId]);
    
    // Update the query to use GET_ALL_CLUB_DETAILS
    const { data: clubData, loading: clubLoading, error: clubError } = useQuery(GET_ALL_CLUB_DETAILS, {
        onError: (error) => {
            console.error("Error fetching club details:", error);
        }
    });
    
    // Add state to track if user has a club
    const [hasClub, setHasClub] = useState(false);
    
    // Update useEffect to check club data
    useEffect(() => {
        if (clubData?.getAllClubManagements) {
            console.log("Club data received:", clubData.getAllClubManagements);
            const currentClub = clubData.getAllClubManagements.find(
                (club: ClubManagement) => club.clubName === clubId
            );
            if (currentClub) {
                setHasClub(true);
                handleEdit(currentClub);
            }
        }
    }, [clubData, clubId]);

    // Add debug logging
    useEffect(() => {
        if (clubData) {
            const club = clubData.getAllClubManagements?.find(
                (club: ClubManagement) => club.clubName === clubId
            );
            console.log('Debug - Club Data:', {
                clubFound: !!club,
                clubName: club?.clubName,
                hasGallery: !!club?.gallery,
                videoCount: club?.gallery?.videos?.length,
                videos: club?.gallery?.videos
            });
        }
    }, [clubData, clubId]);

    // Add error handling for when clubId is missing
    if (!clubId) {
        return (
            <div className="flex h-screen">
                <Sidebar />
                <div className="flex-1 p-6">
                    <TopHeader 
                        placeholder="Search..."
                    />
                    <div className="container mx-auto px-6 py-6">
                        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                            <h2 className="text-red-800 font-semibold mb-2">Error</h2>
                            <p className="text-red-600">No club ID provided. Please make sure you're accessing this page with a valid club ID.</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Add loading state
    if (clubLoading) {
        return (
            <div className="flex h-screen">
                <Sidebar />
                <div className="flex-1 p-6">
                    <TopHeader 
                        placeholder="Search..."
                    />
                    <div className="container mx-auto px-6 py-6">
                        <div className="bg-white rounded-lg p-6">
                            <p className="text-gray-600">Loading club details...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Add error state
    if (clubError) {
        return (
            <div className="flex h-screen">
                <Sidebar />
                <div className="flex-1 p-6">
                    <TopHeader 
                  
                        placeholder="Search..."
                    />
                    <div className="container mx-auto px-6 py-6">
                        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                            <h2 className="text-red-800 font-semibold mb-2">Error</h2>
                            <p className="text-red-600">Failed to load club details: {clubError.message}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Add state to track if we're creating a new club
    const [isCreatingNew, setIsCreatingNew] = useState(true);
    
    // Add states for file uploads
    const [clubLogo, setClubLogo] = useState<File | null>(null);
    const [clubLogoPreview, setClubLogoPreview] = useState<string>("");
    const [coverImage, setCoverImage] = useState<File | null>(null);
    const [coverImagePreview, setCoverImagePreview] = useState<string>("");
    const [statisticsIcons, setStatisticsIcons] = useState<(File | null)[]>([null, null, null, null]);
    const [whoWeAreImages, setWhoWeAreImages] = useState<File[][]>([[], []]);
    const [servicesImages, setServicesImages] = useState<(File | null)[]>([null, null, null, null]);
    const [galleryImages, setGalleryImages] = useState<File[]>([]);
    const [galleryVideos, setGalleryVideos] = useState<File[]>([]);
    const [driverImage, setDriverImage] = useState<File | null>(null);
    const [driverImagePreview, setDriverImagePreview] = useState<string>("");
    const [locationImage, setLocationImage] = useState<File | null>(null);
    const [locationImagePreview, setLocationImagePreview] = useState<string>("");

    // File input refs
    const fileInputRefs = {
        clubLogo: useRef<HTMLInputElement>(null),
        coverImage: useRef<HTMLInputElement>(null),
        driverImage: useRef<HTMLInputElement>(null),
        locationImage: useRef<HTMLInputElement>(null),
    };

    // Add these utility functions at the top of the component
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
    
    // Update icon mapping
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
        flag: { component: Flag, type: 'lucide' }
    };

    // Update compressImage function
    const compressImage = async (file: File): Promise<Blob> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = document.createElement('img');
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    
                    // Max dimensions
                    const MAX_WIDTH = 800;
                    const MAX_HEIGHT = 800;
                    
                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);
                    
                    canvas.toBlob(
                        (blob) => {
                            if (blob) {
                                resolve(blob);
                            } else {
                                reject(new Error('Canvas to Blob conversion failed'));
                            }
                        },
                        'image/jpeg',
                        0.7 // compression quality
                    );
                };
                img.onerror = () => reject(new Error('Failed to load image'));
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
        });
    };

    // Update convertFileToBase64 to include compression
    const convertFileToBase64 = async (file: File): Promise<string> => {
        if (file.size > MAX_FILE_SIZE) {
            try {
                const compressedBlob = await compressImage(file);
                if (compressedBlob.size > MAX_FILE_SIZE) {
                    throw new Error('File is still too large after compression');
                }
                file = new File([compressedBlob], file.name, { type: 'image/jpeg' });
            } catch (error) {
                console.error('Error compressing image:', error);
                throw new Error('File is too large. Maximum size is 5MB');
            }
        }
        
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
    };

    // Update handleFileChange to include size validation
    const handleFileChange = (
        e: React.ChangeEvent<HTMLInputElement>,
        setter: (file: File | null) => void,
        previewSetter?: (preview: string) => void,
        acceptedTypes: string[] = ["image/jpeg", "image/png"]
    ) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!acceptedTypes.includes(file.type)) {
                alert("Please upload a valid file type");
                return;
            }
            
            if (file.size > MAX_FILE_SIZE) {
                alert("File is too large. Maximum size is 5MB. The file will be compressed.");
            }
            
            setter(file);
            if (previewSetter) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    previewSetter(reader.result as string);
                };
                reader.readAsDataURL(file);
            }
        }
    };

    // Update handleMultipleFiles to handle videos differently
    const handleMultipleFiles = (
        e: React.ChangeEvent<HTMLInputElement>,
        setter: (files: File[]) => void,
        maxFiles: number = 10,
        acceptedTypes: string[] = ["image/jpeg", "image/png"]
    ) => {
        const files = Array.from(e.target.files || []);
        const validFiles = files.filter(file => {
            // Check if it's a video file
            const isVideo = file.type.startsWith('video/');
            
            if (isVideo) {
                // Videos are stored directly in AWS, no size validation needed
                return true;
            }
            
            // For images, use existing validation
            if (!acceptedTypes.includes(file.type)) {
                alert(`File ${file.name} is not a valid type`);
                return false;
            }
            if (file.size > MAX_FILE_SIZE) {
                alert(`File ${file.name} is too large. It will be compressed.`);
            }
            return true;
        });
        
        if (validFiles.length > maxFiles) {
            alert(`You can only upload up to ${maxFiles} files`);
            return;
        }
        
        setter(validFiles);
    };

    // Add a function to handle video conversion
    const convertVideoToBase64 = async (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
    };

    // Update handleWhoWeAreImages to include size validation
    const handleWhoWeAreImages = (
        sectionIndex: number,
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const files = Array.from(e.target.files || []);
        const validFiles = files.filter(file => {
            if (!["image/jpeg", "image/png"].includes(file.type)) {
                alert(`File ${file.name} is not a valid type`);
                return false;
            }
            if (file.size > MAX_FILE_SIZE) {
                alert(`File ${file.name} is too large. It will be compressed.`);
            }
            return true;
        });

        if (validFiles.length > 3) {
            alert("You can only upload up to 3 images per section");
            return;
        }

        setWhoWeAreImages(prev => {
            const newImages = [...prev];
            newImages[sectionIndex] = validFiles;
            return newImages;
        });
    };

    // Update handleServiceImage to include size validation
    const handleServiceImage = (
        index: number,
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        if (!["image/jpeg", "image/png"].includes(file.type)) {
            alert("Please upload a valid image file (PNG or JPG)");
            return;
        }
        
        if (file.size > MAX_FILE_SIZE) {
            alert("File is too large. It will be compressed.");
        }
        
        setServicesImages(prev => {
            const newImages = [...prev];
            newImages[index] = file;
            return newImages;
        });
    };

    // Add form state
    const [clubName, setClubName] = useState("");
    const [description, setDescription] = useState("");
    const [locationDescription, setLocationDescription] = useState("");
    const [locationAddress, setLocationAddress] = useState("");
    const [servicesData, setServicesData] = useState(Array(4).fill({ name: "", link: "" }));
    const [statisticsData, setStatisticsData] = useState(Array(4).fill({ 
        name: "", 
        value: "", 
        icon: "",
        isCustomIcon: false,
        iconType: 'lucide',
        link: "",
        showDropdown: false
    }));
    const [whoWeAreData, setWhoWeAreData] = useState(Array(2).fill({ description: "", link: "" }));

    // Add state for club name validation
    const [clubNameError, setClubNameError] = useState("");

    // Update club name validation
    const validateClubName = (name: string) => {
        if (!name) {
            setClubNameError("Club name is required");
            return false;
        }
        
        if (isCreatingNew && clubData?.getAllClubManagements) {
            const existingClub = clubData.getAllClubManagements.find(
                (club: ClubManagement) => club.clubName.toLowerCase() === name.toLowerCase()
            );
            if (existingClub) {
                setClubNameError("You already have a club with this name");
                return false;
            }
        }
        
        setClubNameError("");
        return true;
    };

    // Update club name change handler
    const handleClubNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newName = e.target.value;
        setClubName(newName);
        validateClubName(newName);
    };

    // Add mutation hooks
    const [createClubManagement, { loading: createLoading, error: createError }] = useMutation(CREATE_CLUB_MANAGEMENT, {
        onCompleted: (data) => {
            console.log("Mutation completed successfully:", data);
        },
        onError: (error) => {
            console.error("Mutation error in hook:", error);
        }
    });
    const [updateClubManagement, { loading: updateLoading }] = useMutation(UPDATE_CLUB_MANAGEMENT);

    // Add driver state for the modal
    const [driverName, setDriverName] = useState("");
    const [nzfssRR, setNzfssRR] = useState("");
    const [ipssRR, setIpssRR] = useState("");
    const [drivers, setDrivers] = useState<any[]>([]);

    // Handle adding a new driver
    const handleAddDriver = async () => {
        if (!driverName || !nzfssRR || !ipssRR) {
            alert("Please fill in all driver details");
            return;
        }

        const newDriver = {
            name: driverName,
            image: driverImage ? await convertFileToBase64(driverImage) : null,
            nzfssRR,
            ipssRR
        };

        setDrivers([...drivers, newDriver]);
        setIsModalOpen(false);
        
        // Reset form
        setDriverName("");
        setNzfssRR("");
        setIpssRR("");
        setDriverImage(null);
        setDriverImagePreview("");
    };

    // Update handleSaveDetails to handle both create and update
    const handleSaveDetails = async () => {
        try {
            console.log("1. Save button clicked - Starting save process...");

            // Validate club name
            if (!validateClubName(clubName)) {
                return;
            }

            // Format statistics data
            const formattedStatistics = statisticsData.map(stat => ({
                name: stat.name || "",
                value: stat.value || "0",
                icon: stat.icon || "",
                isCustomIcon: false,
                iconType: 'lucide',
                link: stat.link || "",
                showDropdown: stat.showDropdown
            }));
            console.log("2. Formatted statistics:", formattedStatistics);

            // Process images in batches to avoid memory issues
            const processImagesInBatches = async (images: File[], batchSize: number = 2) => {
                const results: string[] = [];
                for (let i = 0; i < images.length; i += batchSize) {
                    const batch = images.slice(i, i + batchSize);
                    const batchPromises = batch.map(file => convertFileToBase64(file));
                    const batchResults = await Promise.all(batchPromises);
                    results.push(...batchResults);
                    // Small delay to allow garbage collection
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
                return results;
            };

            // Format who we are data with batch processing
            const formattedWhoWeAre = await Promise.all(whoWeAreData.map(async (section, index) => {
                let processedImages: string[] = [];
                if (whoWeAreImages[index] && whoWeAreImages[index].length > 0) {
                    processedImages = await processImagesInBatches(whoWeAreImages[index]);
                }
                
                return {
                    description: section.description,
                    images: processedImages,
                    link: section.link || ""
                };
            }));
            console.log("3. Formatted who we are data:", formattedWhoWeAre);

            // Format services data with batch processing
            const formattedServices = await Promise.all(servicesData.map(async (service: { name: string; image?: string; link?: string }, index) => {
                // Only include services that have both a name and an image
                if (!service.name || (!servicesImages[index] && !service.image)) {
                    return null;
                }
                
                let processedImage = service.image;
                if (servicesImages[index]) {
                    try {
                        processedImage = await convertFileToBase64(servicesImages[index]!);
                    } catch (error) {
                        console.error(`Error processing service image ${index}:`, error);
                        return null;
                    }
                }
                
                return {
                    name: service.name,
                    image: processedImage,
                    link: service.link || ""
                };
            }));
            
            // Filter out null services
            const validServices = formattedServices.filter(service => service !== null);
            console.log("4. Formatted services data:", validServices);

            // Process gallery images in batches
            console.log("4a. Processing gallery images...");
            const processedGalleryImages = await processImagesInBatches(galleryImages);

            // Handle gallery videos separately
            console.log("4b. Processing gallery videos...");
            const processedVideos = await Promise.all(galleryVideos.map(async file => {
                if (file.type.startsWith('video/')) {
                    return await convertVideoToBase64(file);
                }
                return null;
            }));

            // Clean up location data to ensure no protocol prefixes remain
            const cleanLocationDescription = locationDescription.replace(/https?:\/\//ig, "");
            const cleanLocationAddress = locationAddress.replace(/https?:\/\//ig, "");

            const input = {
                clubName,
                shortDescription: description,
                clubLogo: clubLogo ? await convertFileToBase64(clubLogo) : clubLogoPreview,
                coverImage: coverImage ? await convertFileToBase64(coverImage) : coverImagePreview,
                statistics: formattedStatistics,
                whoWeAre: formattedWhoWeAre,
                services: validServices,
                gallery: {
                    images: processedGalleryImages,
                    videos: processedVideos.filter(v => v !== null) as string[]
                },
                location: {
                    description: cleanLocationDescription,
                    address: cleanLocationAddress,
                    coordinates: {
                        lat: 0,
                        lng: 0
                    },
                    image: locationImage ? await convertFileToBase64(locationImage) : locationImagePreview
                },
                drivers: await Promise.all(drivers.map(async driver => ({
                    name: driver.name,
                    image: driver.image,
                    nzfssRR: driver.nzfssRR,
                    ipssRR: driver.ipssRR
                })))
            };

            console.log("5. Final input prepared");

            try {
                if (isEditing && selectedClub) {
                    console.log("8. Calling updateClubManagement mutation...");
                    const result = await updateClubManagement({
                        variables: { 
                            clubId: selectedClub.clubName, // Use clubName as the ID
                            input 
                        },
                        refetchQueries: [{ 
                            query: GET_ALL_CLUB_DETAILS,
                            variables: { clubId: selectedClub.clubName }
                        }],
                        onError: (error) => {
                            console.error("9. GraphQL Error in update mutation:", error);
                            throw error;
                        }
                    });

                    if (result.data) {
                        console.log("11. Update Success! Data received:", result.data);
                        alert("Club details updated successfully!");
                        setIsEditing(false);
                        setSelectedClub(null);
                    }
                } else {
                    console.log("8. Calling createClubManagement mutation...");
                    const result = await createClubManagement({
                        variables: { input },
                        refetchQueries: [{ 
                            query: GET_ALL_CLUB_DETAILS,
                            variables: { clubId: input.clubName }
                        }],
                        onError: (error) => {
                            console.error("9. GraphQL Error in create mutation:", error);
                            throw error;
                        }
                    });

                    if (result.data) {
                        console.log("11. Create Success! Data received:", result.data);
                        alert("Club details saved successfully!");
                    }
                }
            } catch (mutationError) {
                console.error("13. Caught mutation error:", mutationError);
                throw mutationError;
            }
        } catch (error) {
            console.error("14. Final error catch:", error);
            alert(`Error saving club details: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    // Function to handle edit
    const handleEdit = (club: any) => {
        setSelectedClub(club);
        setIsEditing(true);
        setIsCreatingNew(false);
        
        // Reset all file states to avoid using old values
        setClubLogo(null);
        setCoverImage(null);
        setServicesImages(Array(4).fill(null));
        setStatisticsIcons(Array(4).fill(null));
        setWhoWeAreImages([[], []]);
        setGalleryImages([]);
        setGalleryVideos([]);
        setDriverImage(null);
        
        // Populate form with existing data
        setClubName(club.clubName || "");
        setDescription(club.shortDescription || "");
        setClubLogoPreview(club.clubLogo || "");
        setCoverImagePreview(club.coverImage || "");
        
        // Populate statistics
        if (club.statistics?.length > 0) {
            const newStats = [...statisticsData];
            club.statistics.forEach((stat: any, index: number) => {
                if (index < newStats.length) {
                    newStats[index] = { ...stat, showDropdown: false };
                }
            });
            setStatisticsData(newStats);
        }
        
        // Populate who we are
        if (club.whoWeAre?.length > 0) {
            const newWhoWeAre = [...whoWeAreData];
            club.whoWeAre.forEach((section: any, index: number) => {
                if (index < newWhoWeAre.length) {
                    newWhoWeAre[index] = section;
                }
            });
            setWhoWeAreData(newWhoWeAre);
        }
        
        // Populate services
        if (club.services?.length > 0) {
            const newServices = [...servicesData];
            club.services.forEach((service: any, index: number) => {
                if (index < newServices.length) {
                    newServices[index] = service;
                }
            });
            setServicesData(newServices);
            
            // Also initialize servicesImages with null values to prevent using old values
            const newServicesImages = Array(4).fill(null);
            setServicesImages(newServicesImages);
        }
        
        // Populate location - Clean up description and address by removing protocol prefixes
        if (club.location) {
            let description = club.location.description || "";
            let address = club.location.address || "";
            
            // Clean up location URLs by removing protocols for clean display
            description = description.replace(/https?:\/\//ig, "");
            address = address.replace(/https?:\/\//ig, "");
            
            setLocationDescription(description);
            setLocationAddress(address);
            setLocationImagePreview(club.location.image || "");
        }
        
        // Populate drivers
        if (club.drivers?.length > 0) {
            setDrivers(club.drivers);
        }
    };

    // Function to cancel edit
    const handleCancelEdit = () => {
        setIsEditing(false);
        setSelectedClub(null);
        setIsCreatingNew(true);
        // Reset form
        setClubName("");
        setDescription("");
        setClubLogoPreview("");
        setCoverImagePreview("");
        setStatisticsData(Array(4).fill({ name: "", value: "", icon: "", isCustomIcon: false, iconType: 'lucide', link: "", showDropdown: false }));
        setWhoWeAreData(Array(2).fill({ description: "", link: "" }));
        setServicesData(Array(4).fill({ name: "", link: "" }));
        setLocationDescription("");
        setLocationAddress("");
        setLocationImagePreview("");
        setDrivers([]);
    };

    // Add debug log for component mount
    useEffect(() => {
        console.log("ManageClub component mounted");
    }, []);

    // Update the icon rendering in the statistics display
    const renderIcon = (icon: string, className: string = "w-6 h-6") => {
        if (!icon || !iconMap[icon.toLowerCase()]) return null;
        
        const iconData = iconMap[icon.toLowerCase()];
        if (iconData.type === 'image') {
            return (
                <div className={`relative ${className}`}>
                    <Image 
                        src={iconData.component as StaticImageData}
                        alt={icon}
                        fill
                        className="object-contain"
                    />
                </div>
            );
        }
        
        return React.createElement(iconData.component as LucideIcon, {
            className
        });
    };

    // Add a function to handle image loading errors at the component level
    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const target = e.target as HTMLImageElement;
        target.onerror = null; // Prevent infinite loop
        target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' font-family='sans-serif' font-size='12' text-anchor='middle' dominant-baseline='middle' fill='%236b7280'%3EImage%3C/text%3E%3C/svg%3E";
    };

    // Update getVideoPosterUrl to include logging
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

    // Add video handling functions
    const handleVideoClick = (videoUrl: string) => {
        setSelectedVideo(videoUrl);
    };

    const handleCloseVideo = () => {
        setSelectedVideo(null);
    };

    // Update the video display section
    const renderVideos = () => {
        const club = clubData?.getAllClubManagements?.find(
            (club: ClubManagement) => club.clubName === clubId
        );
        
        if (!club?.gallery?.videos?.length) {
            console.log('Debug - No videos to display');
            return null;
        }

        console.log('Debug - Rendering videos:', club.gallery.videos);
        
        return (
            <div className="mt-4">
                <p className="text-sm font-medium mb-2">Uploaded Videos:</p>
                <div className="grid grid-cols-2 gap-2">
                    {club.gallery.videos.map((video: string, i: number) => {
                        console.log('Debug - Rendering video:', { index: i, url: video });
                        return (
                            <div key={i} className="relative aspect-video rounded-[16px] overflow-hidden cursor-pointer group" onClick={() => handleVideoClick(video)}>
                                {/* Video Thumbnail with play button overlay */}
                                <div className="relative w-full h-full">
                                    {/* Play button overlay */}
                                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-10 group-hover:bg-black/40 transition-colors">
                                        <div className="w-12 h-12 rounded-full bg-white/80 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <div className="w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-l-[12px] border-l-black ml-1"></div>
                                        </div>
                                    </div>
                                    
                                    {/* Video element for thumbnail */}
                                    <video 
                                        className="w-full h-full object-cover hover:scale-110 transform transition-all duration-300"
                                        src={video}
                                        poster={getVideoPosterUrl(video)}
                                        muted
                                        preload="metadata"
                                        onLoadedMetadata={(e) => {
                                            console.log('Debug - Video metadata loaded:', { index: i, url: video });
                                            const videoElement = e.target as HTMLVideoElement;
                                            videoElement.currentTime = 0.5;
                                        }}
                                        onLoadedData={(e) => {
                                            console.log('Debug - Video data loaded:', { index: i, url: video });
                                        }}
                                        onError={(e) => {
                                            console.error('Debug - Video error:', { 
                                                index: i, 
                                                url: video, 
                                                error: e 
                                            });
                                            const target = e.target as HTMLVideoElement;
                                            target.style.display = 'none';
                                            const parent = target.parentElement;
                                            if (parent) {
                                                const fallback = document.createElement('div');
                                                fallback.className = "absolute inset-0 flex items-center justify-center bg-gray-200 text-gray-500";
                                                fallback.textContent = "Video Preview Unavailable";
                                                parent.appendChild(fallback);
                                            }
                                        }}
                                    ></video>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="flex h-screen">
            <Sidebar />
            <div className="flex-1">
                <TopHeader 
                    placeholder="Search..."
                />
                <div className="container mx-auto px-6 py-6">
                    <div className="flex flex-col gap-10 bg-gray-50 p-6 rounded-lg">
                        <div className="flex justify-between items-center">
                            <h1 className="text-2xl font-bold">Club Detail</h1>
                            {isEditing && (
                                <button
                                    onClick={handleCancelEdit}
                                    className="px-4 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50"
                                >
                                    Cancel Edit
                                </button>
                            )}
                        </div>
                        <p className="text-gray-600">This is the entry page for your club's details and public information.</p>
                        
                        {/* Display current club details if they exist and not editing */}
                        {!isEditing && hasClub && clubData?.getAllClubManagements && (
                            <div className="bg-white p-6 rounded-lg mb-8">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-semibold">Your Club Details</h2>
                                    <button
                                        onClick={() => handleEdit(clubData.getAllClubManagements.find(
                                            (club: ClubManagement) => club.clubName === clubId
                                        ))}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-gray-200"
                                    >
                                        Edit Details
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            {clubData.getAllClubManagements.find(
                                                (club: ClubManagement) => club.clubName === clubId
                                            )?.clubLogo && (
                                                <div className="relative w-20 h-20">
                                                    <Link href={`/clubs/${clubId}`}>
                                                        <Image 
                                                            src={clubData.getAllClubManagements.find(
                                                                (club: ClubManagement) => club.clubName === clubId
                                                            )?.clubLogo} 
                                                            alt="Club logo" 
                                                            fill
                                                            className="object-contain"
                                                        />
                                                    </Link>
                                                </div>
                                            )}
                                            <div>
                                                <Link href={`/clubs/${clubId}`} className="hover:underline">
                                                    <h3 className="font-semibold">{clubData.getAllClubManagements.find(
                                                        (club: ClubManagement) => club.clubName === clubId
                                                    )?.clubName}</h3>
                                                </Link>
                                                <p className="text-gray-600">{convertUrlsToLinks(clubData.getAllClubManagements.find(
                                                    (club: ClubManagement) => club.clubName === clubId
                                                )?.shortDescription || "")}</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Statistics */}
                                    {clubData.getAllClubManagements.find(
                                        (club: ClubManagement) => club.clubName === clubId
                                    )?.statistics?.length > 0 && (
                                        <div>
                                            <h4 className="font-medium mb-2">Statistics</h4>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                {(clubData.getAllClubManagements.find(
                                                    (club: ClubManagement) => club.clubName === clubId
                                                )?.statistics as Statistic[]).map((stat, i) => {
                                                    return (
                                                        <div key={i} className="bg-gray-50 p-3 rounded">
                                                            <div className="w-8 h-8 mb-2 flex items-center justify-center">
                                                                {stat.icon && renderIcon(stat.icon, "w-8 h-8")}
                                                            </div>
                                                            <p className="font-medium">{stat.name}</p>
                                                            <p className="text-gray-600">{stat.value}</p>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                    
                                    {/* Who We Are */}
                                    {clubData.getAllClubManagements.find(
                                        (club: ClubManagement) => club.clubName === clubId
                                    )?.whoWeAre?.length > 0 && (
                                        <div>
                                            <h4 className="font-medium mb-2">Who We Are</h4>
                                            {clubData.getAllClubManagements.find(
                                                (club: ClubManagement) => club.clubName === clubId
                                            )?.whoWeAre.map((section: any, i: number) => (
                                                <div key={i} className="mb-4">
                                                    {section.link ? (
                                                        <Link href={section.link} className="text-blue-600 underline hover:underline">
                                                            <p className="text-gray-600">{convertUrlsToLinks(section.description)}</p>
                                                        </Link>
                                                    ) : (
                                                        <p className="text-gray-600">{convertUrlsToLinks(section.description)}</p>
                                                    )}
                                                    {section.images?.length > 0 && (
                                                        <div className="flex gap-2 mt-2">
                                                            {section.images.map((img: string, imgIndex: number) => (
                                                                <div key={imgIndex} className="relative w-20 h-20">
                                                                    {section.link ? (
                                                                        <Link href={section.link} className="text-blue-600 underline hover:underline">
                                                                            <Image 
                                                                                src={img} 
                                                                                alt={`Section image ${imgIndex + 1}`} 
                                                                                fill
                                                                                className="object-cover rounded"
                                                                                onError={handleImageError}
                                                                                loading="lazy"
                                                                                unoptimized={img.includes('nzfss.s3')}
                                                                            />
                                                                        </Link>
                                                                    ) : (
                                                                        <Image 
                                                                            src={img} 
                                                                            alt={`Section image ${imgIndex + 1}`} 
                                                                            fill
                                                                            className="object-cover rounded"
                                                                            onError={handleImageError}
                                                                            loading="lazy"
                                                                            unoptimized={img.includes('nzfss.s3')}
                                                                        />
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    
                                    {/* Services */}
                                    {clubData.getAllClubManagements.find(
                                        (club: ClubManagement) => club.clubName === clubId
                                    )?.services?.length > 0 && (
                                        <div>
                                            <h4 className="font-medium mb-2">Services</h4>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                {clubData.getAllClubManagements.find(
                                                    (club: ClubManagement) => club.clubName === clubId
                                                )?.services.map((service: any, i: number) => (
                                                    <div key={i} className="bg-gray-50 p-3 border border-gray-800 rounded">
                                                        {service.link ? (
                                                            <Link href={service.link} className="block text-blue-600 underline hover:opacity-80">
                                                                {service.image && (
                                                                    <div className="relative w-full border border-gray-800 h-32 mb-2">
                                                                        <Image 
                                                                            src={service.image} 
                                                                            alt={service.name} 
                                                                            fill
                                                                            className="object-cover rounded"
                                                                            key={`service-image-${i}-${service.image}`}
                                                                            onError={handleImageError}
                                                                            loading="lazy"
                                                                            unoptimized={service.image.includes('nzfss.s3')}
                                                                        />
                                                                    </div>
                                                                )}
                                                                <p className="font-medium">{service.name}</p>
                                                            </Link>
                                                        ) : (
                                                            <>
                                                                {service.image && (
                                                                    <div className="relative w-full border border-gray-800 h-32 mb-2">
                                                                        <Image 
                                                                            src={service.image} 
                                                                            alt={service.name} 
                                                                            fill
                                                                            className="object-cover rounded"
                                                                            key={`service-image-${i}-${service.image}`}
                                                                            onError={handleImageError}
                                                                            loading="lazy"
                                                                            unoptimized={service.image.includes('nzfss.s3')}
                                                                        />
                                                                    </div>
                                                                )}
                                                                <p className="font-medium">{service.name}</p>
                                                            </>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        
                        <div className="space-y-10">
                            <div>
                                <label className="block mb-2">Upload Club Logo</label>
                                <div 
                                    className="border-2 border-dashed border-gray-300 p-8 text-center rounded-lg cursor-pointer"
                                    onClick={() => fileInputRefs.clubLogo.current?.click()}
                                >
                                    {clubLogoPreview ? (
                                        <div className="relative w-32 h-32 mx-auto">
                                            <Image 
                                                src={clubLogoPreview} 
                                                alt="Club logo preview" 
                                                fill
                                                className="object-contain"
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex justify-center">
                                            <button className="p-2">+</button>
                                        </div>
                                    )}
                                    <p className="text-sm text-gray-500 mt-2">*Must be PNG, JPG, SVG or PDF (max 5MB)</p>
                                    <input
                                        type="file"
                                        ref={fileInputRefs.clubLogo}
                                        className="hidden"
                                        accept="image/png,image/jpeg,image/svg+xml,application/pdf"
                                        onChange={(e) => handleFileChange(e, setClubLogo, setClubLogoPreview)}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block mb-2">Enter club name</label>
                                <input 
                                    type="text" 
                                    className={`w-full p-2 border rounded-lg ${clubNameError ? 'border-red-500' : ''}`}
                                    placeholder="Enter your club name"
                                    value={clubName}
                                    onChange={handleClubNameChange}
                                />
                                {clubNameError && (
                                    <p className="text-red-500 text-sm mt-1">{clubNameError}</p>
                                )}
                            </div>

                            <div>
                                <label className="block mb-2">Short Description</label>
                                <textarea 
                                    className="w-full p-2 border rounded-lg"
                                    placeholder="Enter your description"
                                    rows={4}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block mb-2">Upload Cover Image</label>
                                <button 
                                    className="flex items-center gap-2 border p-2 rounded-lg"
                                    onClick={() => fileInputRefs.coverImage.current?.click()}
                                >
                                    <span>↑</span> Upload
                                </button>
                                {coverImagePreview && (
                                    <div className="mt-2 relative w-full h-40">
                                        <Image 
                                            src={coverImagePreview} 
                                            alt="Cover preview" 
                                            fill
                                            className="object-cover rounded-lg"
                                        />
                                    </div>
                                )}
                                <input
                                    type="file"
                                    ref={fileInputRefs.coverImage}
                                    className="hidden"
                                    accept="image/png,image/jpeg"
                                    onChange={(e) => handleFileChange(e, setCoverImage, setCoverImagePreview)}
                                />
                                <p className="text-sm text-gray-500 mt-2">*Must be PNG or JPG. The cover should be 16:9 ratio</p>
                            </div>

                            <div>
                                <label className="block mb-2">Statistics</label>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    {statisticsData.map((stat, index) => (
                                        <div key={index} className="space-y-2">
                                            <input 
                                                type="text" 
                                                className="w-full p-2 border rounded-lg"
                                                placeholder="Statistics Name"
                                                value={stat.name}
                                                onChange={(e) => {
                                                    const newStats = [...statisticsData];
                                                    newStats[index] = { ...stat, name: e.target.value };
                                                    setStatisticsData(newStats);
                                                }}
                                            />
                                            <input 
                                                type="text" 
                                                className="w-full p-2 border rounded-lg mt-2"
                                                placeholder="Statistics Value"
                                                value={stat.value}
                                                onChange={(e) => {
                                                    const newStats = [...statisticsData];
                                                    newStats[index] = { ...stat, value: e.target.value };
                                                    setStatisticsData(newStats);
                                                }}
                                            />
                                            <input 
                                                type="text" 
                                                className="w-full p-2 border rounded-lg mt-2"
                                                placeholder="Link URL (optional)"
                                                value={stat.link || ""}
                                                onChange={(e) => {
                                                    const newStats = [...statisticsData];
                                                    newStats[index] = { ...stat, link: e.target.value };
                                                    setStatisticsData(newStats);
                                                }}
                                            />
                                            <div className="relative">
                                                <button
                                                    type="button"
                                                    className="w-full p-2 border rounded-lg mt-2 flex items-center justify-between"
                                                    onClick={() => {
                                                        const newStats = [...statisticsData];
                                                        newStats[index] = { ...stat, showDropdown: !stat.showDropdown };
                                                        setStatisticsData(newStats);
                                                    }}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        {stat.icon && renderIcon(stat.icon, "w-4 h-4")}
                                                        <span>{stat.icon || "Select Icon"}</span>
                                                    </div>
                                                    <span>▼</span>
                                                </button>
                                                {stat.showDropdown && (
                                                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg">
                                                        {Object.entries(iconMap).map(([key, value]) => (
                                                            <div
                                                                key={key}
                                                                className="p-2 hover:bg-gray-200 cursor-pointer flex items-center gap-2"
                                                                onClick={() => {
                                                                    const newStats = [...statisticsData];
                                                                    newStats[index] = { 
                                                                        ...stat, 
                                                                        icon: key,
                                                                        iconType: value.type,
                                                                        showDropdown: false 
                                                                    };
                                                                    setStatisticsData(newStats);
                                                                }}
                                                            >
                                                                {renderIcon(key, "w-4 h-4")}
                                                                {key.charAt(0).toUpperCase() + key.slice(1)}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-500">Or (Upload your icon)</p>
                                            <div className="border-2 border-dashed border-gray-300 p-4 text-center rounded-lg">
                                                <button className="p-2">+</button>
                                            </div>
                                            <p className="text-xs text-gray-500">*Must be PNG and Vector. The size maximum size should be 56x56 px</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block mb-2">Who We Are</label>
                                <div className="space-y-4">
                                    {whoWeAreData.map((section, index) => (
                                        <div key={index} className="flex gap-4">
                                            <div className="flex-1">
                                                <textarea 
                                                    className="w-full p-2 border rounded-lg"
                                                    placeholder="Enter descriptions"
                                                    rows={4}
                                                    value={section.description}
                                                    onChange={(e) => {
                                                        const newSections = [...whoWeAreData];
                                                        newSections[index] = { ...section, description: e.target.value };
                                                        setWhoWeAreData(newSections);
                                                    }}
                                                />
                                                <input 
                                                    type="text"
                                                    className="w-full p-2 border rounded-lg mt-2"
                                                    placeholder="Link URL (optional)"
                                                    value={section.link || ""}
                                                    onChange={(e) => {
                                                        const newSections = [...whoWeAreData];
                                                        newSections[index] = { ...section, link: e.target.value };
                                                        setWhoWeAreData(newSections);
                                                    }}
                                                />
                                                <p className="text-xs text-gray-500 mt-1">* Max character should be around 700</p>
                                            </div>
                                            <div className="w-48">
                                                <input
                                                    type="file"
                                                    multiple
                                                    accept="image/png,image/jpeg"
                                                    onChange={(e) => handleWhoWeAreImages(index, e)}
                                                    className="hidden"
                                                    id={`who-we-are-images-${index}`}
                                                />
                                                <label 
                                                    htmlFor={`who-we-are-images-${index}`}
                                                    className="border-2 border-dashed border-gray-300 p-4 text-center rounded-lg h-full flex flex-col items-center justify-center cursor-pointer"
                                                >
                                                    <button type="button" className="p-2">+</button>
                                                    <p className="text-xs text-gray-500 mt-2">* Upload maximum 3 images. Format should be PNG or JPG (max 5MB each)</p>
                                                    {whoWeAreImages[index]?.length > 0 && (
                                                        <div className="mt-2">
                                                            <p className="text-sm">{whoWeAreImages[index].length} images selected</p>
                                                            <div className="flex gap-2 mt-2">
                                                                {whoWeAreImages[index].map((file, i) => (
                                                                    <div key={i} className="relative w-10 h-10">
                                                                        <Image
                                                                            src={URL.createObjectURL(file)}
                                                                            alt={`Preview ${i + 1}`}
                                                                            fill
                                                                            className="object-cover rounded"
                                                                        />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </label>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block mb-2">Our Services</label>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    {servicesData.map((service, index) => (
                                        <div key={index} className="space-y-2">
                                            <input
                                                type="file"
                                                accept="image/png,image/jpeg"
                                                onChange={(e) => handleServiceImage(index, e)}
                                                className="hidden"
                                                id={`service-image-${index}`}
                                            />
                                            <label 
                                                htmlFor={`service-image-${index}`}
                                                className="border-2 border-dashed border-gray-300 p-8 text-center rounded-lg block cursor-pointer"
                                            >
                                                {servicesImages[index] ? (
                                                    <div className="relative w-full h-32">
                                                        <Image
                                                            src={URL.createObjectURL(servicesImages[index]!)}
                                                            alt={`Service ${index + 1}`}
                                                            fill
                                                            className="object-cover rounded"
                                                        />
                                                    </div>
                                                ) : service.image ? (
                                                    <div className="relative w-full h-32">
                                                        <Image
                                                            src={service.image}
                                                            alt={`Service ${index + 1}`}
                                                            fill
                                                            className="object-cover rounded"
                                                            onError={handleImageError}
                                                            loading="lazy"
                                                            unoptimized={service.image.includes('nzfss.s3')}
                                                        />
                                                    </div>
                                                ) : (
                                                    <>
                                                        <button type="button" className="p-2">+</button>
                                                        <p className="text-xs text-gray-500 mt-2">*Must be PNG or JPG (max 5MB)</p>
                                                    </>
                                                )}
                                            </label>
                                            <input 
                                                type="text" 
                                                className="w-full p-2 border rounded-lg"
                                                placeholder="Enter service name"
                                                value={service.name}
                                                onChange={(e) => {
                                                    const newServices = [...servicesData];
                                                    newServices[index] = { ...service, name: e.target.value };
                                                    setServicesData(newServices);
                                                }}
                                            />
                                            <input 
                                                type="text" 
                                                className="w-full p-2 border rounded-lg"
                                                placeholder="Link URL (optional)"
                                                value={service.link || ""}
                                                onChange={(e) => {
                                                    const newServices = [...servicesData];
                                                    newServices[index] = { ...service, link: e.target.value };
                                                    setServicesData(newServices);
                                                }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block mb-2">See us in Action (Gallery)</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm mb-2">Images</p>
                                        <input
                                            type="file"
                                            multiple
                                            accept="image/png,image/jpeg"
                                            onChange={(e) => handleMultipleFiles(e, setGalleryImages)}
                                            className="hidden"
                                            id="gallery-images"
                                        />
                                        <label 
                                            htmlFor="gallery-images"
                                            className="border-2 border-dashed border-gray-300 p-8 text-center rounded-lg block cursor-pointer"
                                        >
                                            <button className="p-2">+</button>
                                            {galleryImages.length > 0 && (
                                                <p className="mt-2">{galleryImages.length} images selected</p>
                                            )}
                                            <p className="text-xs text-gray-500 mt-2">*Images must be PNG or JPG (max 5MB each)</p>
                                        </label>
                                        
                                        {/* Display existing gallery images if they exist */}
                                        {clubData?.getAllClubManagements?.find(
                                            (club: ClubManagement) => club.clubName === clubId
                                        )?.gallery?.images?.length > 0 && (
                                            <div className="mt-4">
                                                <p className="text-sm font-medium mb-2">Uploaded Images:</p>
                                                <div className="grid grid-cols-4 gap-2">
                                                    {clubData.getAllClubManagements.find(
                                                        (club: ClubManagement) => club.clubName === clubId
                                                    )?.gallery?.images?.map((img: string, i: number) => (
                                                        <div key={i} className="relative w-16 h-16 border border-gray-200 rounded">
                                                            <Image
                                                                src={img}
                                                                alt={`Gallery image ${i + 1}`}
                                                                fill
                                                                className="object-cover rounded"
                                                                onError={handleImageError}
                                                                loading="lazy"
                                                                unoptimized={img.includes('nzfss.s3')}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm mb-2">Videos</p>
                                        <input
                                            type="file"
                                            multiple
                                            accept="video/*"
                                            onChange={(e) => handleMultipleFiles(
                                                e, 
                                                setGalleryVideos, 
                                                5, 
                                                ["video/mp4", "video/quicktime"]
                                            )}
                                            className="hidden"
                                            id="gallery-videos"
                                        />
                                        <label 
                                            htmlFor="gallery-videos"
                                            className="border-2 border-dashed border-gray-300 p-8 text-center rounded-lg block cursor-pointer"
                                        >
                                            <button className="p-2">+</button>
                                            {galleryVideos.length > 0 && (
                                                <p className="mt-2">{galleryVideos.length} videos selected</p>
                                            )}
                                            <p className="text-xs text-gray-500 mt-2">*Videos must be MP4 or MOV (stored directly in AWS)</p>
                                        </label>
                                        
                                        {/* Display existing gallery videos if they exist */}
                                        {renderVideos()}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block mb-2">Where You Can Find Us</label>
                                <textarea 
                                    className="w-full p-2 border rounded-lg mb-4"
                                    placeholder="Enter Description"
                                    rows={3}
                                    value={locationDescription}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/https?:\/\//ig, "");
                                        setLocationDescription(value);
                                    }}
                                />
                                <div className="flex gap-4 mb-4">
                                    <div className="flex-1">
                                        <div className="relative">
                                            <input 
                                                type="text" 
                                                className="w-full p-2 border rounded-lg"
                                                placeholder="Enter your location"
                                                value={locationAddress}
                                                onChange={(e) => {
                                                    // Strip any http/https protocols from URLs on input
                                                    const value = e.target.value.replace(/https?:\/\//ig, "");
                                                    setLocationAddress(value);
                                                }}
                                            />
                                            <button className="absolute right-2 top-1/2 transform -translate-y-1/2">
                                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="w-1/3">
                                        <div 
                                            className="border-2 border-dashed border-gray-300 p-4 text-center rounded-lg cursor-pointer h-32"
                                            onClick={() => fileInputRefs.locationImage.current?.click()}
                                        >
                                            {locationImagePreview ? (
                                                <div className="relative w-full h-full">
                                                    <Image 
                                                        src={locationImagePreview} 
                                                        alt="Location image" 
                                                        fill
                                                        className="object-cover rounded"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center h-full">
                                                    <button type="button" className="p-2">+</button>
                                                    <p className="text-sm text-gray-500 mt-2">Upload an image of your location</p>
                                                </div>
                                            )}
                                            <input
                                                type="file"
                                                ref={fileInputRefs.locationImage}
                                                className="hidden"
                                                accept="image/png,image/jpeg"
                                                onChange={(e) => handleFileChange(e, setLocationImage, setLocationImagePreview)}
                                            />
                                        </div>
                                        {locationImagePreview && (
                                            <button 
                                                type="button"
                                                className="p-2 text-red-500 hover:text-red-700 mt-2"
                                                onClick={() => {
                                                    setLocationImage(null);
                                                    setLocationImagePreview("");
                                                }}
                                            >
                                                Remove Image
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <label className="block">NZFSS & IPSS Registered Driver</label>
                                    <button 
                                        className="text-sm bg-gray-100 px-3 py-1 rounded-lg"
                                        onClick={() => setIsModalOpen(true)}
                                    >
                                        + Add New
                                    </button>
                                </div>
                                <div className="bg-white rounded-lg overflow-hidden">
                                    <table className="w-full">
                                        <thead className="bg-black text-white">
                                            <tr>
                                                <th className="p-3 text-left">Image</th>
                                                <th className="p-3 text-left">Name</th>
                                                <th className="p-3 text-left">NZFSS RR</th>
                                                <th className="p-3 text-left">IFSS RR</th>
                                                <th className="p-3 text-left">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {drivers.map((driver, index) => (
                                                <tr key={index} className="border-b hover:bg-gray-200 cursor-pointer">
                                                    <td className="p-3">
                                                        <Link href={`/drivers/${driver.name.replace(/\s+/g, '-').toLowerCase()}`}>
                                                            <div className="w-8 h-8 rounded-full bg-gray-200">
                                                                {driver.image && (
                                                                    <Image
                                                                        src={driver.image}
                                                                        alt={`Driver ${index + 1} image`}
                                                                        width={32}
                                                                        height={32}
                                                                        className="object-cover rounded-full"
                                                                    />
                                                                )}
                                                            </div>
                                                        </Link>
                                                    </td>
                                                    <td className="p-3">
                                                        <Link href={`/drivers/${driver.name.replace(/\s+/g, '-').toLowerCase()}`} className="hover:underline">
                                                            {driver.name}
                                                        </Link>
                                                    </td>
                                                    <td className="p-3">{driver.nzfssRR}</td>
                                                    <td className="p-3">{driver.ipssRR}</td>
                                                    <td className="p-3">
                                                        <div className="flex gap-2">
                                                            <button className="p-1">
                                                                <span className="text-gray-500">✏️</span>
                                                            </button>
                                                            <button className="p-1">
                                                                <span className="text-gray-500">🗑️</span>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="flex justify-start mt-6">
                                <button 
                                    className="bg-white text-black hover:bg-gray-200 px-6 py-2 rounded-lg"
                                    onClick={() => {
                                        console.log("Save button clicked");
                                        handleSaveDetails();
                                    }}
                                    disabled={createLoading}
                                >
                                    {createLoading ? "Saving..." : "Save Detail"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-[400px]">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">Add a New Driver</h2>
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ×
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="flex flex-col items-center mb-4">
                                <div 
                                    className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-2 cursor-pointer"
                                    onClick={() => fileInputRefs.driverImage.current?.click()}
                                >
                                    {driverImagePreview ? (
                                        <Image 
                                            src={driverImagePreview} 
                                            alt="Driver preview" 
                                            width={96}
                                            height={96}
                                            className="rounded-full object-cover"
                                        />
                                    ) : (
                                        <User size={40} className="text-gray-400" />
                                    )}
                                </div>
                                <input
                                    type="file"
                                    ref={fileInputRefs.driverImage}
                                    className="hidden"
                                    accept="image/png,image/jpeg"
                                    onChange={(e) => handleFileChange(e, setDriverImage, setDriverImagePreview)}
                                />
                                <button 
                                    className="text-sm text-blue-600"
                                    onClick={() => fileInputRefs.driverImage.current?.click()}
                                >
                                    Upload
                                </button>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Driver Name</label>
                                <input 
                                    type="text"
                                    className="w-full p-2 border rounded-lg"
                                    placeholder="Enter driver name"
                                    value={driverName}
                                    onChange={(e) => setDriverName(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">NZFSS RR</label>
                                <input 
                                    type="text"
                                    className="w-full p-2 border rounded-lg"
                                    placeholder="Enter NZFSS RR"
                                    value={nzfssRR}
                                    onChange={(e) => setNzfssRR(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">IFSS Registration</label>
                                <input 
                                    type="text"
                                    className="w-full p-2 border rounded-lg"
                                    placeholder="Enter IFSS Registration"
                                    value={ipssRR}
                                    onChange={(e) => setIpssRR(e.target.value)}
                                />
                            </div>

                            <div className="flex gap-2 pt-4">
                                <button 
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-4 py-2 border rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleAddDriver}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg"
                                >
                                    Add
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Add Video Lightbox */}
            {selectedVideo && (
                <div 
                    className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center"
                    onClick={handleCloseVideo}
                >
                    <button 
                        className="absolute top-4 right-4 text-white text-4xl font-bold z-50 cursor-pointer"
                        onClick={handleCloseVideo}
                    >
                        ×
                    </button>

                    <div className="relative w-full h-full flex items-center justify-center">
                        {/* Main Video */}
                        <div className="max-w-[80vw] h-[75vh]" onClick={(e) => e.stopPropagation()}>
                            <video 
                                src={selectedVideo}
                                className="w-full h-full"
                                controls
                                autoPlay
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ManageClub;
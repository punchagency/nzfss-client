"use client";

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
  Loader2,
  Pencil,
  Trash2
} from "lucide-react";
import Flag from "@/assets/Flag.png"
import Location from "@/assets/Pin, Location.png"
import Medical from "@/assets/medical-cross-animals.png"
import Image from "next/image";
import { useMutation, useQuery } from '@apollo/client';
import { CREATE_CLUB_MANAGEMENT, UPDATE_CLUB_MANAGEMENT } from '../../../../graphql/mutation/clubManagement';
import { GET_ALL_CLUB_DETAILS, GET_CURRENT_USER_CLUB_DETAILS } from '../../../../graphql/query/clubs';
import { useApolloClient } from '@apollo/client';
import { useUser } from '../../../../context/user_context';
import RichTextEditor from '../../../../components/rich-text-editor';
import HtmlContent from '../../../../components/html-content';
import { useToast } from '../../../../hooks/use-toast';
import Spinner from '@/app/_components/Spinner';

// Add a custom type for gallery videos
type VideoItem = (File & { originalName?: string }) | {
    isExistingVideo: boolean;
    url: string;
    name: string;
    originalName: string;
    size: number;
    type: string;
};

/**
 * ManageClub - Component for viewing and editing club details
 * 
 * This component operates in two modes:
 * 1. View Mode: Shows read-only club information with an "Edit Details" button.
 *    - All management UI (add/edit/delete buttons) is hidden in this mode.
 * 
 * 2. Edit Mode: Enables all editing functionality after clicking "Edit Details".
 *    - Allows adding/editing/removing club information, images, videos, drivers, etc.
 */
const ManageClub = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedClub, setSelectedClub] = useState<any>(null);
    // Update videos to show 6 at a time
    const [galleryImagesDisplayCount, setGalleryImagesDisplayCount] = useState(8);
    const [galleryVideosDisplayCount, setGalleryVideosDisplayCount] = useState(6);
    const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
    const [galleryTab, setGalleryTab] = useState<'images' | 'video'>('images');
    
    // Add file upload limits
    const MAX_IMAGE_SIZE = 25 * 1024 * 1024; // 10MB per image (increased from 5MB)
    const MAX_VIDEO_SIZE = 300 * 1024 * 1024; // 100MB per video (increased from 50MB)
    const MAX_BATCH_VIDEOS = 10; // Maximum 10 videos in one upload batch (increased from 6)
    const MAX_TOTAL_IMAGES = 200; // Maximum total images allowed
    const MAX_TOTAL_VIDEOS = 24; // Maximum total videos allowed
    
    // Get current user from context
    const { user } = useUser();
    
    // Add Apollo client
    const client = useApolloClient();
    
    // Add query for current user's club details with fetchPolicy set to network-only
    const { data: clubDetailsData, loading: clubDetailsLoading, refetch } = useQuery(GET_CURRENT_USER_CLUB_DETAILS, {
        fetchPolicy: 'network-only', // This forces Apollo to always fetch from the network
        nextFetchPolicy: 'cache-first' // After the first fetch, subsequent refetches will use the cache
    });
    
    // Add useEffect to refetch when user changes
    useEffect(() => {
        if (user) {
            console.log("User changed, refetching club details...");
            // Set the club name from the user object if available
            if (user.name) {
                setClubName(user.name);
            }
            // Reset all form data to prevent seeing old club data
            setDescription("");
            setClubLogoPreview("");
            setCoverImagePreview("");
            setStatisticsData(Array(4).fill({ name: "", icon: "", isCustomIcon: false }));
            setStatisticsIcons([null, null, null, null]);
            setWhoWeAreData({ description: "" });
            setWhoWeAreImagesPreview([]);
            setWhoWeAreImages([[]]);
            setServicesData(Array(4).fill({ name: "", image: "" }));
            setServiceImagePreviews(Array(4).fill(""));
            setLocationDescription("");
            setLocationAddress("");
            setCoordinates({ lat: 0, lng: 0 });
            setDrivers([]);
            setSelectedClub(null);
            setIsEditing(false);
            // Reset gallery images display count
            setGalleryImagesDisplayCount(8);
            setGalleryVideosDisplayCount(6);
            setSelectedVideo(null);
            setFormFiles([]);
            setFormFileNames([]);
            
            // Clear Apollo cache for this specific query
            client.cache.evict({ fieldName: 'getCurrentUserClubDetails' });
            client.cache.gc();
            
            // Refetch data from server
            refetch();
        }
    }, [user, client, refetch]);
    
    // Add states for file uploads
    const [clubLogo, setClubLogo] = useState<File | null>(null);
    const [clubLogoPreview, setClubLogoPreview] = useState<string>("");
    const [coverImage, setCoverImage] = useState<File | null>(null);
    const [coverImagePreview, setCoverImagePreview] = useState<string>("");
    const [statisticsIcons, setStatisticsIcons] = useState<(File | null)[]>([null, null, null, null]);
    const [whoWeAreImages, setWhoWeAreImages] = useState<File[][]>([[], []]);
    const [servicesImages, setServicesImages] = useState<(File | null)[]>([null, null, null, null]);
    const [galleryImages, setGalleryImages] = useState<File[]>([]);
    const [galleryVideos, setGalleryVideos] = useState<VideoItem[]>([]);
    const [driverImage, setDriverImage] = useState<File | null>(null);
    const [driverImagePreview, setDriverImagePreview] = useState<string>("");
    const [formFiles, setFormFiles] = useState<File[]>([]);
    const [formFileNames, setFormFileNames] = useState<string[]>([]);
    const [locationImage, setLocationImage] = useState<File | null>(null);
    const [locationImagePreview, setLocationImagePreview] = useState<string>("");

    // File input refs
    const fileInputRefs = {
        clubLogo: useRef<HTMLInputElement>(null),
        coverImage: useRef<HTMLInputElement>(null),
        formFiles: useRef<HTMLInputElement>(null),
        driverImage: useRef<HTMLInputElement>(null),
        statisticsIcons: Array(4).fill(0).map(() => useRef<HTMLInputElement>(null)),
        whoWeAreImages: useRef<HTMLInputElement>(null),
        serviceImages: Array(4).fill(0).map(() => useRef<HTMLInputElement>(null)),
        galleryImages: useRef<HTMLInputElement>(null),
        galleryVideos: useRef<HTMLInputElement>(null),
        locationImage: useRef<HTMLInputElement>(null),
    };

    // Add these utility functions at the top of the component
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // Increased to 5MB to allow for pre-compression files
    
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
                    
                    // Calculate scale factor based on file size
                    let scaleFactor = 1;
                    if (file.size > MAX_FILE_SIZE) {
                        scaleFactor = Math.sqrt(MAX_FILE_SIZE / file.size); // Square root for area-based scaling
                    }
                    
                    // Max dimensions
                    const MAX_WIDTH = 1920;
                    const MAX_HEIGHT = 1080;
                    
                    // Scale based on both file size and max dimensions
                    width = Math.min(width * scaleFactor, MAX_WIDTH);
                    height = Math.min(height * scaleFactor, MAX_HEIGHT);
                    
                    // Maintain aspect ratio
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
                    
                    // Progressive compression until size is under limit
                    const compressAndCheck = (quality: number): void => {
                        canvas.toBlob(
                            (blob) => {
                                if (!blob) {
                                    reject(new Error('Canvas to Blob conversion failed'));
                                    return;
                                }
                                
                                if (blob.size > MAX_FILE_SIZE && quality > 0.1) {
                                    // Try again with lower quality
                                    compressAndCheck(quality - 0.1);
                                } else {
                                    resolve(blob);
                                }
                            },
                            'image/jpeg',
                            quality
                        );
                    };
                    
                    // Start with high quality and progressively reduce if needed
                    compressAndCheck(0.9);
                };
                img.onerror = () => reject(new Error('Failed to load image'));
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
        });
    };

    // Update convertFileToBase64 to handle compression more efficiently
    const convertFileToBase64 = async (file: File): Promise<string> => {
        let processedFile = file;
        
        if (file.type.startsWith('image/')) {
            try {
                const compressedBlob = await compressImage(file);
                processedFile = new File([compressedBlob], file.name, { type: 'image/jpeg' });
                
                if (processedFile.size > MAX_FILE_SIZE) {
                    throw new Error('File is still too large after compression');
                }
            } catch (error) {
                console.error('Error processing image:', error);
                throw new Error('Unable to process image. Please try a smaller file.');
            }
        }
        
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(processedFile);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
    };

    // Update handleFileChange to handle compression
    const handleFileChange = async (
        e: React.ChangeEvent<HTMLInputElement>,
        setter: (file: File | null) => void,
        previewSetter?: (preview: string) => void,
        acceptedTypes: string[] = ["image/jpeg", "image/png"]
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        if (!acceptedTypes.includes(file.type)) {
            toast({
                title: "Error",
                description: "Please upload a valid file type",
                variant: "destructive",
            });
            return;
        }
        
        try {
            if (file.type.startsWith('image/')) {
                const compressedBlob = await compressImage(file);
                const compressedFile = new File([compressedBlob], file.name, { type: 'image/jpeg' });
                setter(compressedFile);
                
                if (previewSetter) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        previewSetter(reader.result as string);
                    };
                    reader.readAsDataURL(compressedFile);
                }
            } else {
                setter(file);
                if (previewSetter) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        previewSetter(reader.result as string);
                    };
                    reader.readAsDataURL(file);
                }
            }
        } catch (error) {
            console.error('Error handling file:', error);
            toast({
                title: "Error",
                description: 'Error processing file. Please try a smaller file.',
                variant: "destructive",
            });
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
                // For videos, just check the size (max 300MB for videos)
                const MAX_VIDEO_SIZE = 300 * 1024 * 1024; // 300MB
                if (file.size > MAX_VIDEO_SIZE) {
                    toast({
                        title: "Error",
                        description: `Video ${file.name} is too large. Maximum size is 300MB.`,
                        variant: "destructive",
                    });
                    return false;
                }
                return true;
            }
            
            // For images, use existing validation
            if (!acceptedTypes.includes(file.type)) {
                toast({
                    title: "Error",
                    description: `File ${file.name} is not a valid type`,
                    variant: "destructive",
                });
                return false;
            }
            if (file.size > MAX_FILE_SIZE) {
                toast({
                    title: "Error",
                    description: `File ${file.name} exceeds the maximum size limit of 10MB (${(file.size / (1024 * 1024)).toFixed(2)}MB)`,
                    variant: "destructive",
                });
                return false;
            }
            return true;
        });
        
        if (validFiles.length > maxFiles) {
            toast({
                title: "Error",
                description: `You can only upload up to ${maxFiles} files`,
                variant: "destructive",
            });
            return;
        }
        
        setter(validFiles);
    };

    // Update convertVideoToBase64 function to handle our custom type
    const convertVideoToBase64 = async (file: VideoItem): Promise<string> => {
        // If it's an existing video (which should not happen here), just return the URL
        if (isExistingVideo(file)) {
            return file.url;
        }
        
        // Otherwise process as a File
        console.log(`Converting video to base64: ${file.name}, size: ${(file.size / (1024 * 1024)).toFixed(2)} MB, type: ${file.type}`);
        
        // Check file size
        if (file.size > 300 * 1024 * 1024) {
            console.warn("Video file is very large, this may cause issues with the API");
            throw new Error("Video file is too large. Maximum size is 300MB.");
        }
        
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64String = reader.result as string;
                console.log(`Successfully converted video to base64. Length: ${base64String.length}`);
                // Verify the base64 string starts with the correct format
                if (!base64String.startsWith('data:video/')) {
                    console.warn(`Video base64 string has unexpected format: ${base64String.substring(0, 50)}...`);
                }
                resolve(base64String);
            };
            reader.onerror = (error) => {
                console.error("Error converting video to base64:", error);
                reject(error);
            };
            reader.readAsDataURL(file);
        });
    };

    // Update handleWhoWeAreImages to handle a single section
    const handleWhoWeAreImages = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const currentImagesCount = whoWeAreImages[0]?.length || 0;
        const remainingSlots = 3 - currentImagesCount;

        if (remainingSlots <= 0) {
            toast({
                title: "Maximum Images Reached",
                description: "You already have 3 images. Please remove some images before adding new ones.",
                variant: "destructive",
            });
            e.target.value = ''; // Reset file input
            return;
        }

        const validFiles = files.filter(file => {
            if (!["image/jpeg", "image/png"].includes(file.type)) {
                toast({
                    title: "Invalid File Type",
                    description: `File ${file.name} must be a JPEG or PNG image`,
                    variant: "destructive",
                });
                return false;
            }
            if (file.size > MAX_FILE_SIZE) {
                toast({
                    title: "File Too Large",
                    description: `File ${file.name} exceeds the maximum size limit of 10MB (${(file.size / (1024 * 1024)).toFixed(2)}MB)`,
                    variant: "destructive",
                });
                return false;
            }
            return true;
        });

        // Take only the number of files that will fit within the 3-image limit
        const filesToAdd = validFiles.slice(0, remainingSlots);

        if (validFiles.length > remainingSlots) {
            toast({
                title: "Too Many Images",
                description: `Only ${remainingSlots} more image${remainingSlots === 1 ? '' : 's'} can be added. First ${remainingSlots} valid image${remainingSlots === 1 ? '' : 's'} will be used.`,
                variant: "default",
            });
        }

        // Append new files to existing ones
        setWhoWeAreImages(prev => {
            const existingFiles = prev[0] || [];
            return [[...existingFiles, ...filesToAdd]];
        });

        // Generate previews for the new images and append them to existing previews
        filesToAdd.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setWhoWeAreImagesPreview(prev => [...prev, reader.result as string]);
            };
            reader.readAsDataURL(file);
        });

        // Reset file input
        e.target.value = '';
    };

    // Add this function to remove images
    const handleRemoveWhoWeAreImage = (index: number) => {
        setWhoWeAreImages(prev => {
            const existingFiles = prev[0] || [];
            return [[...existingFiles.slice(0, index), ...existingFiles.slice(index + 1)]];
        });
        setWhoWeAreImagesPreview(prev => [...prev.slice(0, index), ...prev.slice(index + 1)]);
    };

    // Add service image previews state
    const [serviceImagePreviews, setServiceImagePreviews] = useState<string[]>(Array(4).fill(""));

    // Add form state
    const [clubName, setClubName] = useState("");
    const [description, setDescription] = useState("");
    const [locationDescription, setLocationDescription] = useState("");
    const [locationAddress, setLocationAddress] = useState("");
    const [coordinates, setCoordinates] = useState({ lat: 0, lng: 0 });
    const [servicesData, setServicesData] = useState(Array(4).fill({ name: "", image: "" }));
    const [statisticsData, setStatisticsData] = useState(Array(4).fill({ 
        name: "", 
        icon: "",
        isCustomIcon: false 
    }));
    const [whoWeAreData, setWhoWeAreData] = useState({ description: "" });
    const [whoWeAreImagesPreview, setWhoWeAreImagesPreview] = useState<string[]>([]);

    // Add gallery image previews state
    const [galleryImagePreviews, setGalleryImagePreviews] = useState<string[]>([]);
    const [galleryVideoPreviews, setGalleryVideoPreviews] = useState<string[]>([]);

    // Add mutation hooks
    const [createClubManagement, { loading: createLoading, error: createError }] = useMutation(CREATE_CLUB_MANAGEMENT, {
        onCompleted: (data) => {
            console.log("Create mutation completed successfully:", data);
            // Clear cache for this query to ensure fresh data
            client.cache.evict({ fieldName: 'getCurrentUserClubDetails' });
            client.cache.gc();
            toast({
                title: "Success",
                description: "Club details saved successfully!",
            });
            
            // Refetch queries using promises instead of await
            client.refetchQueries({
                include: [GET_CURRENT_USER_CLUB_DETAILS],
            }).then(() => {
                console.log("Refetch completed from onCompleted");
            }).catch(err => {
                console.error("Error during refetch from onCompleted:", err);
            });
        },
        onError: (error) => {
            console.error("Update mutation error:", error);
            console.error("Update mutation error details:", {
                message: error.message,
                graphQLErrors: error.graphQLErrors?.map(err => ({
                    message: err.message,
                    path: err.path,
                    extensions: err.extensions,
                    locations: err.locations
                })),
                networkError: error.networkError && 'result' in error.networkError 
                    ? {
                        ...error.networkError,
                        result: error.networkError.result
                    } 
                    : error.networkError,
                extraInfo: error.extraInfo
            });
            toast({
                title: "Error",
                description: `Error updating club details: ${error.message || 'Unknown error'}`,
                variant: "destructive",
            });
            loadingToast?.dismiss();
        }
    });

    const [updateClubManagement, { loading: updateLoading, error: updateError }] = useMutation(UPDATE_CLUB_MANAGEMENT, {
        onCompleted: (data) => {
            console.log("Update mutation completed successfully:", data);
            // Clear cache for this query to ensure fresh data
            client.cache.evict({ fieldName: 'getCurrentUserClubDetails' });
            client.cache.gc();
            toast({
                title: "Success",
                description: "Club details updated successfully!",
            });
            
            // Refetch queries using promises instead of await
            client.refetchQueries({
                include: [GET_CURRENT_USER_CLUB_DETAILS],
            }).then(() => {
                console.log("Refetch completed from onCompleted");
            }).catch(err => {
                console.error("Error during refetch from onCompleted:", err);
            });
        },
        onError: (error) => {
            console.error("Update mutation error:", error);
            console.error("Update mutation error details:", {
                message: error.message,
                graphQLErrors: error.graphQLErrors?.map(err => ({
                    message: err.message,
                    path: err.path,
                    extensions: err.extensions,
                    locations: err.locations
                })),
                networkError: error.networkError && 'result' in error.networkError 
                    ? {
                        ...error.networkError,
                        result: error.networkError.result
                    } 
                    : error.networkError,
                extraInfo: error.extraInfo
            });
            toast({
                title: "Error",
                description: `Error updating club details: ${error.message || 'Unknown error'}`,
                variant: "destructive",
            });
            loadingToast?.dismiss();
        }
    });

    // Add driver state for the modal
    const [driverName, setDriverName] = useState("");
    const [nzfssRR, setNzfssRR] = useState("");
    const [ipssRR, setIpssRR] = useState("");
    const [drivers, setDrivers] = useState<any[]>([]);

    // Extract the toast function from useToast
    const { toast } = useToast();

    // Add a reference for loading toast
    let loadingToast: { dismiss: () => void } | null = null;

    // Function to handle edit
    const handleEdit = (club: any) => {
        // Set initial values
        setIsEditing(true);
        setSelectedClub(club);
        
        // Populate form with existing data
        setClubName(club.clubName || "");
        setDescription(club.shortDescription || "");
        setClubLogoPreview(club.clubLogo || "");
        setCoverImagePreview(club.coverImage || "");
        
        // Reset pagination counters
        setGalleryImagesDisplayCount(8);
        setGalleryVideosDisplayCount(6);
        
        // Reset statistics icons
        setStatisticsIcons([null, null, null, null]);
        
        // Populate statistics
        const newStats = Array(4).fill({ 
            name: "", 
            icon: "",
            isCustomIcon: false 
        });
        if (club.statistics?.length > 0) {
            club.statistics.forEach((stat: any, index: number) => {
                if (index < newStats.length) {
                    newStats[index] = {
                        name: stat.name || "",
                        icon: stat.icon || "",
                        isCustomIcon: stat.isCustomIcon || false
                    };
                }
            });
        }
        setStatisticsData(newStats);
        
        // Populate who we are
        if (club.whoWeAre?.length > 0) {
            setWhoWeAreData({ description: club.whoWeAre[0]?.description || "" });
            setWhoWeAreImagesPreview(club.whoWeAre[0]?.images || []);
        } else {
            setWhoWeAreData({ description: "" });
            setWhoWeAreImagesPreview([]);
        }
        
        // Populate services
        const newServices = Array(4).fill({ name: "", image: "" });
        const newServicePreviews = Array(4).fill("");
        if (club.services?.length > 0) {
            club.services.forEach((service: any, index: number) => {
                if (index < newServices.length) {
                    newServices[index] = {
                        name: service.name || "",
                        image: service.image || ""
                    };
                    newServicePreviews[index] = service.image || "";
                }
            });
        }
        setServicesData(newServices);
        setServiceImagePreviews(newServicePreviews);
        
        // Populate location
        if (club.location) {
            setLocationDescription(club.location.description || "");
            setLocationAddress(club.location.address || "");
            setCoordinates(club.location.coordinates || { lat: 0, lng: 0 });
            setLocationImagePreview(club.location.image || "");
        }
        
        // Populate drivers
        if (club.drivers?.length > 0) {
            setDrivers(club.drivers.map((driver: any) => ({
                name: driver.name || "",
                image: driver.image || null,
                nzfssRR: driver.nzfssRR || "",
                ipssRR: driver.ipssRR || ""
            })));
        } else {
            setDrivers([]);
        }

        // Populate gallery images and videos
        if (club.gallery) {
            // Handle images
            setGalleryImagePreviews(club.gallery.images || []);
            setGalleryImages([]); // We don't need File objects for existing images
            
            // Handle videos - store URLs in previews, but keep galleryVideos empty or as a marker array
            const existingVideos = club.gallery.videos || [];
            setGalleryVideoPreviews(existingVideos);
            
            // Create placeholder array with the same length to track existing videos
            // We'll mark existing videos with a special property 'isExistingVideo'
            const videoPlaceholders = existingVideos.map((url: string, index: number) => {
                return { 
                    isExistingVideo: true, 
                    url: url,
                    name: `Video ${index + 1}`,
                    originalName: `Video ${index + 1}`,
                    size: 0,
                    type: 'video/mp4'
                };
            });
            
            // @ts-ignore - these aren't actually File objects but we'll handle the difference in handleSaveDetails
            setGalleryVideos(videoPlaceholders);
        } else {
            setGalleryImages([]);
            setGalleryImagePreviews([]);
            setGalleryVideos([]);
            setGalleryVideoPreviews([]);
        }

        // Populate form files
        if (club.forms && club.forms.length > 0) {
            // We can't create File objects from the base64 data, so we'll just set the file names
            const fileNames = club.forms.map((form: any) => form.fileName || "");
            setFormFileNames(fileNames);
            setFormFiles([]); // We don't have actual File objects for existing forms
        } else {
            setFormFileNames([]);
            setFormFiles([]);
        }
    };

    // Function to cancel edit
    const handleCancelEdit = () => {
        setIsEditing(false);
        setSelectedClub(null);
        // Reset form
        setClubName("");
        setDescription("");
        setClubLogoPreview("");
        setCoverImagePreview("");
        setStatisticsData(Array(4).fill({ name: "", icon: "", isCustomIcon: false }));
        setStatisticsIcons([null, null, null, null]);
        setWhoWeAreData({ description: "" });
        setWhoWeAreImagesPreview([]);
        setWhoWeAreImages([[]]);
        setServicesData(Array(4).fill({ name: "", image: "" }));
        setServiceImagePreviews(Array(4).fill(""));
        setLocationDescription("");
        setLocationAddress("");
        setCoordinates({ lat: 0, lng: 0 });
        setDrivers([]);
        // Reset pagination counters
        setGalleryImagesDisplayCount(8);
        setGalleryVideosDisplayCount(6);
        setSelectedVideo(null);
        setFormFiles([]);
        setFormFileNames([]);
        setLocationImage(null);
        setLocationImagePreview("");
    };

    // Function to handle location selection
    const handleLocationSelect = async (address: string) => {
        try {
            setLocationAddress(address);
            // Here you could add geocoding to get coordinates if needed
            // For now, we'll just set dummy coordinates
            setCoordinates({ lat: 0, lng: 0 });
        } catch (error) {
            console.error("Error selecting location:", error);
        }
    };

    // Add debug log for component mount
    useEffect(() => {
        console.log("ManageClub component mounted");
    }, []);

    // Add a flag to check if there's club data for the current user
    const hasClubData = clubDetailsData?.getCurrentUserClubDetails ? true : false;

    // Set initial club name from query data when it loads
    useEffect(() => {
        if (clubDetailsData?.getCurrentUserClubDetails?.clubName) {
            setClubName(clubDetailsData.getCurrentUserClubDetails.clubName);
        } else if (user?.name) {
            // Use the name from the user object as fallback
            setClubName(user.name);
        }
    }, [clubDetailsData, user]);

    // Add a function to handle statistics icon upload
    const handleStatisticsIconUpload = async (
        index: number,
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        if (!["image/jpeg", "image/png", "image/svg+xml"].includes(file.type)) {
            toast({
                title: "Error",
                description: "Please upload a valid image file (PNG, JPG, or SVG)",
                variant: "destructive",
            });
            return;
        }
        
        if (file.size > MAX_FILE_SIZE) {
            toast({
                title: "Warning",
                description: "File is too large. It will be compressed.",
            });
        }
        
        try {
            // Compress the image if needed
            const compressedBlob = await compressImage(file);
            const compressedFile = new File([compressedBlob], file.name, { type: 'image/png' });
            
            // Convert to base64 for preview
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                
                // Update the statistics data with the custom icon
                const newStats = [...statisticsData];
                newStats[index] = { 
                    ...newStats[index], 
                    icon: base64String,
                    isCustomIcon: true 
                };
                setStatisticsData(newStats);
                
                // Update the statistics icons array
                const newIcons = [...statisticsIcons];
                newIcons[index] = compressedFile;
                setStatisticsIcons(newIcons);
            };
            reader.readAsDataURL(compressedFile);
        } catch (error) {
            console.error('Error processing icon:', error);
            toast({
                title: "Error",
                description: 'Error processing icon. Please try a smaller file.',
                variant: "destructive",
            });
        }
    };

    // Update handleServiceImage to use toast
    const handleServiceImage = (
        index: number,
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        if (!["image/jpeg", "image/png"].includes(file.type)) {
            toast({
                title: "Error",
                description: "Please upload a valid image file (PNG or JPG)",
                variant: "destructive",
            });
            return;
        }
        
        if (file.size > MAX_FILE_SIZE) {
            toast({
                title: "Error",
                description: `File ${file.name} exceeds the maximum size limit of 10MB (${(file.size / (1024 * 1024)).toFixed(2)}MB)`,
                variant: "destructive",
            });
            return;
        }
        
        try {
            // Create a unique identifier for this service image
            const uniqueId = `service_${index}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
            const uniqueFileName = `${uniqueId}_${file.name}`;
            
            // Set the file directly (no compression needed as we already enforce size limit)
            const imageFile = new File([file], uniqueFileName, { type: file.type });
            
            // Update the services images array
            setServicesImages(prev => {
                const newImages = [...prev];
                newImages[index] = imageFile;
                return newImages;
            });
            
            // Create a preview
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                
                // Update service previews
                setServiceImagePreviews(prev => {
                    const newPreviews = [...prev];
                    newPreviews[index] = base64String;
                    return newPreviews;
                });
                
                // Update the services data to include the image
                setServicesData(prev => {
                    const newServices = [...prev];
                    newServices[index] = { 
                        ...newServices[index], 
                        name: newServices[index].name || "",
                        image: base64String
                    };
                    return newServices;
                });
            };
            reader.readAsDataURL(imageFile);
        } catch (error) {
            console.error('Error processing image:', error);
            toast({
                title: "Error",
                description: 'Error processing image. Please try a smaller file.',
                variant: "destructive",
            });
        }
    };

    // Update handleSaveDetails to make all fields optional
    const handleSaveDetails = async () => {
        // Show loading toast
        loadingToast = toast({
            title: "Saving...",
            description: "Please wait while we save your club details.",
            duration: Infinity,
        });
        
        try {
            console.log("1. Save button clicked - Starting save process...");
            console.log("Current drivers data:", drivers);

            // Process gallery data - with size checks
            console.log(`Processing ${galleryImages.length} gallery images`);
            
            // Check if we have videos and log their sizes
            console.log(`Processing ${galleryVideos.length} gallery videos`);
            
            // Log video details before processing
            galleryVideos.forEach((video, index) => {
                console.log(`Video ${index + 1}: ${video.name}, size: ${(video.size / (1024 * 1024)).toFixed(2)} MB, type: ${video.type}`);
            });

            if (isEditing && selectedClub) {
                try {
                    // Process videos first to ensure they're properly converted
                    let processedVideos: string[] = [];
                    if (galleryVideos.length > 0) {
                        console.log("Processing videos...");
                        try {
                            processedVideos = await Promise.all(
                                galleryVideos.map(async (file) => {
                                    // If it's an existing video, just return the URL
                                    if (isExistingVideo(file)) {
                                        console.log(`Using existing video URL: ${file.url.substring(0, 50)}...`);
                                        return file.url;
                                    }
                                    
                                    // Otherwise process the new File object
                                    console.log(`Converting new video to base64: ${file.name}`);
                                    const base64 = await convertVideoToBase64(file);
                                    console.log(`Video converted successfully: ${file.name}`);
                                    return base64;
                                })
                            );
                            console.log(`Successfully processed ${processedVideos.length} videos`);
                        } catch (error) {
                            console.error("Error processing videos:", error);
                            toast({
                                title: "Error",
                                description: `Error processing videos: ${error instanceof Error ? error.message : 'Unknown error'}`,
                                variant: "destructive",
                            });
                            return;
                        }
                    }

                    // Prepare base input - all fields optional
                    const baseInput: any = {
                        clubName: clubName || "",  // Make club name optional but provide empty string as default
                        shortDescription: description || "",
                    };

                    // Add optional fields only if they have values
                    if (clubLogo || clubLogoPreview) {
                        baseInput.clubLogo = clubLogo ? await convertFileToBase64(clubLogo) : clubLogoPreview;
                    }

                    if (coverImage || coverImagePreview) {
                        baseInput.coverImage = coverImage ? await convertFileToBase64(coverImage) : coverImagePreview;
                    }

                    // Process form files if available
                    if (formFiles.length > 0) {
                        try {
                            const processedForms = await Promise.all(
                                formFiles.map(async (file) => {
                                    const base64 = await convertFileToBase64(file);
                                    return {
                                        fileName: file.name,
                                        fileType: file.type,
                                        fileSize: file.size,
                                        fileData: base64
                                    };
                                })
                            );
                            baseInput.forms = processedForms;
                        } catch (error) {
                            console.error("Error processing form files:", error);
                            throw error;
                        }
                    } else {
                        // Explicitly set empty forms array to remove all forms
                        baseInput.forms = [];
                    }

                    // Add statistics if available
                    if (statisticsData.some(stat => stat.name || stat.icon)) {
                        baseInput.statistics = statisticsData.map(stat => ({
                            name: stat.name || "",
                            icon: stat.icon || "",
                            isCustomIcon: stat.isCustomIcon || false
                        }));
                    }

                    // Add who we are if available
                    if (whoWeAreData.description || whoWeAreImagesPreview.length > 0) {
                        baseInput.whoWeAre = [{
                            description: whoWeAreData.description || "",
                            images: whoWeAreImagesPreview || []
                        }];
                    }

                    // Add services if available
                    if (servicesData.some(service => service.name || service.image)) {
                        baseInput.services = servicesData.map(service => ({
                            name: service.name || "",
                            image: service.image || ""
                        }));
                    }

                    // Prepare gallery data
                    const galleryData = {
                        images: [...galleryImagePreviews],
                        videos: await Promise.all(
                            galleryVideos.map(async (video) => {
                                if (isExistingVideo(video)) {
                                    return video.url;
                                }
                                // Convert new video to base64
                                return await convertVideoToBase64(video);
                            })
                        )
                    };

                    baseInput.gallery = galleryData;

                    // Add location if available - ensuring coordinates don't have __typename
                    if (locationDescription || locationAddress) {
                        // Create a clean coordinates object without __typename
                        const cleanCoordinates = { lat: 0, lng: 0 };
                        
                        // If we have existing coordinates, copy their values while removing __typename
                        if (coordinates) {
                            if ('__typename' in coordinates) {
                                const { __typename, ...rest } = coordinates as any;
                                Object.assign(cleanCoordinates, rest);
                            } else {
                                Object.assign(cleanCoordinates, coordinates);
                            }
                        }
                        
                        baseInput.location = {
                            description: locationDescription || "",
                            address: locationAddress || "",
                            coordinates: cleanCoordinates,
                            image: locationImagePreview || ""
                        };
                    }

                    // Add drivers if available
                    if (drivers.length > 0) {
                        baseInput.drivers = drivers.map(driver => ({
                            name: driver.name || "",
                            image: driver.image || "",
                            nzfssRR: driver.nzfssRR || "",
                            ipssRR: driver.ipssRR || ""
                        }));
                    }

                    const updateVariables = {
                        clubId: selectedClub.clubName,
                        input: baseInput
                    };

                    // Safe logging without large base64 data to avoid RangeError
                    console.log("Update mutation - Club ID:", updateVariables.clubId);
                    console.log("Update mutation - Input keys:", Object.keys(updateVariables.input));
                    if (updateVariables.input.gallery) {
                        console.log("Gallery images count:", updateVariables.input.gallery.images?.length || 0);
                        console.log("Gallery videos count:", updateVariables.input.gallery.videos?.length || 0);
                    }

                    const result = await updateClubManagement({
                        variables: updateVariables,
                        refetchQueries: [{ query: GET_CURRENT_USER_CLUB_DETAILS }],
                        awaitRefetchQueries: true,
                        fetchPolicy: 'network-only',
                        context: {
                            timeout: 120000
                        }
                    });

                    if (result.data) {
                        console.log("Update successful");
                        toast({
                            title: "Success",
                            description: "Club details updated successfully!",
                        });
                        setIsEditing(false);
                        setSelectedClub(null);
                        
                        // Clear cache and refetch data
                        client.cache.evict({ fieldName: 'getCurrentUserClubDetails' });
                        client.cache.gc();
                        // Use .then() instead of await here
                        client.refetchQueries({
                            include: [GET_CURRENT_USER_CLUB_DETAILS],
                        }).then(() => {
                            console.log("Refetch completed after update");
                        }).catch(err => {
                            console.error("Error during refetch after update:", err);
                        });
                    }
                } catch (error: any) {
                    console.error("Update mutation error:", error);
                    
                    // GraphQL errors
                    if (error.graphQLErrors && error.graphQLErrors.length > 0) {
                        console.error("GraphQL errors:", error.graphQLErrors);
                        
                        // Show specific GraphQL error to user
                        const message = error.graphQLErrors.map((e: any) => e.message).join('\n');
                        toast({
                            title: "GraphQL Error",
                            description: message,
                            variant: "destructive",
                        });
                        loadingToast?.dismiss();
                        return;
                    }
                    
                    // Bad request error
                    if (error.networkError && error.networkError.statusCode === 400) {
                        toast({
                            title: "Error",
                            description: "Bad Request (400). This might be due to an invalid input format. Check console for details.",
                            variant: "destructive",
                        });
                        loadingToast?.dismiss();
                        return;
                    }
                    
                    // General error for update
                    toast({
                        title: "Error",
                        description: `Error updating club details: ${error.message || 'Unknown error'}`,
                        variant: "destructive",
                    });
                    loadingToast?.dismiss();
                }
            } else {
                try {
                    // Process videos first
                    let processedVideos: string[] = [];
                    if (galleryVideos.length > 0) {
                        console.log("Converting videos to base64...");
                        try {
                            processedVideos = await Promise.all(
                                galleryVideos.map(async (file) => {
                                    // If it's an existing video, just return the URL
                                    if (isExistingVideo(file)) {
                                        console.log(`Using existing video URL: ${file.url.substring(0, 50)}...`);
                                        return file.url;
                                    }
                                    
                                    // Otherwise process the new File object
                                    console.log(`Converting new video to base64: ${file.name}`);
                                    const base64 = await convertVideoToBase64(file);
                                    console.log(`Video converted successfully: ${file.name}`);
                                    return base64;
                                })
                            );
                            console.log(`Successfully processed ${processedVideos.length} videos`);
                        } catch (error) {
                            console.error("Error processing videos:", error);
                            toast({
                                title: "Error",
                                description: `Error processing videos: ${error instanceof Error ? error.message : 'Unknown error'}`,
                                variant: "destructive",
                            });
                            return;
                        }
                    }

                    // Prepare base input - all fields optional
                    const baseInput: any = {
                        clubName: clubName || "",  // Make club name optional but provide empty string as default
                        shortDescription: description || "",
                    };

                    // Add optional fields only if they have values
                    if (clubLogo || clubLogoPreview) {
                        baseInput.clubLogo = clubLogo ? await convertFileToBase64(clubLogo) : clubLogoPreview;
                    }

                    if (coverImage || coverImagePreview) {
                        baseInput.coverImage = coverImage ? await convertFileToBase64(coverImage) : coverImagePreview;
                    }

                    // Add statistics if available
                    if (statisticsData.some(stat => stat.name || stat.icon)) {
                        baseInput.statistics = statisticsData.map(stat => ({
                            name: stat.name || "",
                            icon: stat.icon || "",
                            isCustomIcon: stat.isCustomIcon || false
                        }));
                    }

                    // Add who we are if available
                    if (whoWeAreData.description || whoWeAreImagesPreview.length > 0) {
                        baseInput.whoWeAre = [{
                            description: whoWeAreData.description || "",
                            images: whoWeAreImagesPreview || []
                        }];
                    }

                    // Add services if available
                    if (servicesData.some(service => service.name || service.image)) {
                        baseInput.services = servicesData.map(service => ({
                            name: service.name || "",
                            image: service.image || ""
                        }));
                    }

                    // Prepare gallery data
                    const galleryData = {
                        images: [...galleryImagePreviews],
                        videos: await Promise.all(
                            galleryVideos.map(async (video) => {
                                if (isExistingVideo(video)) {
                                    return video.url;
                                }
                                // Convert new video to base64
                                return await convertVideoToBase64(video);
                            })
                        )
                    };

                    baseInput.gallery = galleryData;

                    // Add location if available - ensuring coordinates don't have __typename
                    if (locationDescription || locationAddress) {
                        // Create a clean coordinates object without __typename
                        const cleanCoordinates = { lat: 0, lng: 0 };
                        
                        // If we have existing coordinates, copy their values while removing __typename
                        if (coordinates) {
                            if ('__typename' in coordinates) {
                                const { __typename, ...rest } = coordinates as any;
                                Object.assign(cleanCoordinates, rest);
                            } else {
                                Object.assign(cleanCoordinates, coordinates);
                            }
                        }
                        
                        baseInput.location = {
                            description: locationDescription || "",
                            address: locationAddress || "",
                            coordinates: cleanCoordinates,
                            image: locationImagePreview || ""
                        };
                    }

                    // Add drivers if available
                    if (drivers.length > 0) {
                        baseInput.drivers = drivers.map(driver => ({
                            name: driver.name || "",
                            image: driver.image || "",
                            nzfssRR: driver.nzfssRR || "",
                            ipssRR: driver.ipssRR || ""
                        }));
                    }

                    const createVariables = {
                        input: baseInput
                    };

                    // Safe logging without large base64 data to avoid RangeError
                    console.log("Create mutation - Input keys:", Object.keys(createVariables.input));
                    if (createVariables.input.gallery) {
                        console.log("Gallery images count:", createVariables.input.gallery.images?.length || 0);
                        console.log("Gallery videos count:", createVariables.input.gallery.videos?.length || 0);
                    }

                    const result = await createClubManagement({
                        variables: createVariables,
                        refetchQueries: [{ query: GET_CURRENT_USER_CLUB_DETAILS }],
                        awaitRefetchQueries: true,
                        fetchPolicy: 'network-only',
                        context: {
                            timeout: 120000
                        }
                    });
                    
                    if (result.data) {
                        console.log("Create successful, refetching data...");
                        toast({
                            title: "Success",
                            description: "Club details saved successfully!",
                        });
                        // Clear cache and refetch data
                        client.cache.evict({ fieldName: 'getCurrentUserClubDetails' });
                        client.cache.gc();
                        // Use .then() instead of await
                        client.refetchQueries({
                            include: [GET_CURRENT_USER_CLUB_DETAILS],
                        }).then(() => {
                            console.log("Refetch completed after create");
                        }).catch(err => {
                            console.error("Error during refetch after create:", err);
                        });
                    }
                } catch (error: any) {
                    console.error("Create mutation error:", error);
                    
                    // GraphQL errors
                    if (error.graphQLErrors && error.graphQLErrors.length > 0) {
                        console.error("GraphQL errors:", error.graphQLErrors);
                        
                        // Show specific GraphQL error to user
                        const message = error.graphQLErrors.map((e: any) => e.message).join('\n');
                        toast({
                            title: "GraphQL Error",
                            description: message,
                            variant: "destructive",
                        });
                        loadingToast?.dismiss();
                        return;
                    }
                    
                    // Bad request error
                    if (error.networkError && error.networkError.statusCode === 400) {
                        toast({
                            title: "Error",
                            description: "Bad Request (400). This might be due to an invalid input format. Check console for details.",
                            variant: "destructive",
                        });
                        loadingToast?.dismiss();
                        return;
                    }
                    
                    // Unexpected error
                    toast({
                        title: "Error",
                        description: `Unexpected error: ${error.message || 'Unknown error'}`,
                        variant: "destructive",
                    });
                    loadingToast?.dismiss();
                }
            }
        } catch (error: any) {
            console.error("Unexpected error in handleSaveDetails:", error);
            toast({
                title: "Error",
                description: `Unexpected error: ${error.message || 'Unknown error'}`,
                variant: "destructive",
            });
        }

        // Remember to dismiss loading toast in case of errors and on completion
        loadingToast?.dismiss();
    };

    // Add a function to render the icon based on the icon name or custom icon
    const renderIcon = (iconName: string, isCustomIcon: boolean = false) => {
        if (isCustomIcon && iconName.startsWith('data:')) {
            return (
                <div className="w-5 h-5 relative">
                    <Image 
                        src={iconName} 
                        alt="Custom icon" 
                        fill
                        className="object-contain"
                        style={{ filter: 'brightness(0.2)' }}
                    />
                </div>
            );
        }
        
        switch (iconName) {
            case 'flag':
                return <div className="w-5 h-5 relative"><Image src={Flag} alt="Flag icon" fill className="object-contain" style={{ filter: 'brightness(0.2)' }} /></div>;
            case 'location':
                return <div className="w-5 h-5 relative"><Image src={Location} alt="Location icon" fill className="object-contain" style={{ filter: 'brightness(0.2)' }} /></div>;
            case 'medical':
                return <div className="w-5 h-5 relative"><Image src={Medical} alt="Medical icon" fill className="object-contain" style={{ filter: 'brightness(0.2)' }} /></div>;
            case 'trophy':
                return <Trophy className="w-5 h-5 text-[#343535]" />;
            case 'user':
                return <User className="w-5 h-5 text-[#343535]" />;
            case 'users':
                return <Users className="w-5 h-5 text-[#343535]" />;
            case 'star':
                return <Star className="w-5 h-5 text-[#343535]" />;
            case 'medal':
                return <Medal className="w-5 h-5 text-[#343535]" />;
            case 'crown':
                return <Crown className="w-5 h-5 text-[#343535]" />;
            case 'award':
                return <Award className="w-5 h-5 text-[#343535]" />;
            case 'shield':
                return <Shield className="w-5 h-5 text-[#343535]" />;
            default:
                return null;
        }
    };

    // Icon options for the selector
    const iconOptions = [
        { name: 'flag', component: <div className="w-5 h-5 relative"><Image src={Flag} alt="Flag icon" fill className="object-contain" style={{ filter: 'brightness(0.2)' }} /></div> },
        { name: 'location', component: <div className="w-5 h-5 relative"><Image src={Location} alt="Location icon" fill className="object-contain" style={{ filter: 'brightness(0.2)' }} /></div> },
        { name: 'medical', component: <div className="w-5 h-5 relative"><Image src={Medical} alt="Medical icon" fill className="object-contain" style={{ filter: 'brightness(0.2)' }} /></div> },
        { name: 'trophy', component: <Trophy className="w-5 h-5 text-[#343535]" /> },
        { name: 'user', component: <User className="w-5 h-5 text-[#343535]" /> },
        { name: 'users', component: <Users className="w-5 h-5 text-[#343535]" /> },
        { name: 'star', component: <Star className="w-5 h-5 text-[#343535]" /> },
        { name: 'medal', component: <Medal className="w-5 h-5 text-[#343535]" /> },
        { name: 'crown', component: <Crown className="w-5 h-5 text-[#343535]" /> },
        { name: 'award', component: <Award className="w-5 h-5 text-[#343535]" /> },
        { name: 'shield', component: <Shield className="w-5 h-5 text-[#343535]" /> }
    ];

    // Add a function to render club details with default values
    const renderClubDetails = (club: any) => {
        // Safe logging without large base64 data to avoid RangeError
        console.log("Club data in renderClubDetails - Club name:", club?.clubName);
        console.log("Club data keys:", Object.keys(club || {}));
        if (club?.gallery) {
            console.log("Gallery images count:", club.gallery.images?.length || 0);
            console.log("Gallery videos count:", club.gallery.videos?.length || 0);
        }
        return (
            <div className="space-y-4">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                    {/* Logo Section */}
                    <div className="flex flex-col items-center md:items-start min-w-[120px]">
                        <h1 className="font-[600] text-[1.2vw] mb-2">Club Logo</h1>
                        <div className="relative w-[8.594vw] min-w-[120px] h-[5vw] min-h-[70px] rounded-[0.45vw] border border-gray-300 bg-white flex items-center justify-center">
                            {club.clubLogo ? (
                                <Image 
                                    src={club.clubLogo} 
                                    alt="Club logo" 
                                    fill
                                    className="object-contain rounded-[0.45vw]"
                                    sizes="(max-width: 768px) 40vw, 8.594vw"
                                />
                            ) : (
                                <span className="text-gray-400 text-[0.9vw]">No Logo</span>
                            )}
                        </div>
                    </div>
                    {/* Club Info Section */}
                    <div className="flex-1 flex flex-col gap-2">
                        <h1 className="font-[600] text-[1.2vw]">Club Name</h1>
                        <h3 className="text-[0.95vw] font-[500] text-gray-600">{club.clubName || 'N/A'}</h3>
                        <h1 className="font-[600] text-[1.2vw] mt-2">Club Description</h1>
                        <p className="font-[500] text-gray-600 text-[0.95vw]">
                            <HtmlContent html={convertUrlsToLinks(club.shortDescription || 'No description available')} />
                        </p>
                    </div>
                </div>
                {/* Statistics */}
                {club.statistics?.length > 0 ? (
                    <div>
                        <h4 className="font-[600] text-[1.2vw] w-[12.552vw] h-[2vw] -mt-4 ">Statistics</h4>
                        <div className="grid grid-cols-4 border border-[#CDCECE] rounded-[0.625vw]">
                            {club.statistics.map((stat: any, i: number) => (
                                <div key={i} className={`p-4 ${i < 3 ? "border-r border-[#CDCECE]" : ""} min-h-[100px] flex items-center justify-center`}>
                                    <div className="flex flex-col items-center text-center w-full">
                                        <div className="flex items-center gap-2 mb-2">
                                            {stat.icon && (
                                                <div className="flex-shrink-0">
                                                    {stat.isCustomIcon ? (
                                                        <div className="w-5 h-5 relative">
                                                            <Image 
                                                                src={stat.icon} 
                                                                alt="Custom icon" 
                                                                fill
                                                                className="object-contain"
                                                                style={{ filter: 'brightness(0.2)' }}
                                                            />
                                                        </div>
                                                    ) : renderIcon(stat.icon)}
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-[0.95vw] font-[500] text-gray-600 leading-tight">{stat.name || 'N/A'}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div>
                        <h4 className="font-[600] text-[1.2vw] w-[12.552vw] h-[2vw]  ">Statistics</h4>
                        <p className="text-gray-600 text-[0.95vw] font-[500]">No statistics available</p>
                    </div>
                )}
                {/* Who We Are */}
                {club.whoWeAre?.length > 0 ? (
                    <div>
                        <h4 className="font-[600] text-[1.2vw] w-[12.552vw] h-[2vw]">Who We Are</h4>
                        <div className="mb-4 text-[0.95vw] font-[500] text-gray-600">
                            {isEditing ? (
                                <RichTextEditor
                                    content={whoWeAreData.description}
                                    onChange={value => {
                                        const processedValue = convertUrlsToLinks(value);
                                        setWhoWeAreData({ ...whoWeAreData, description: processedValue });
                                    }}
                                    placeholder="Enter description of your club"
                                />
                            ) : (
                                <div className="prose max-w-none ">
                                    <HtmlContent html={club.whoWeAre[0]?.description || 'No description available'} />
                                </div>
                            )}
                            {club.whoWeAre[0]?.images?.length > 0 ? (
                                <div className="flex gap-2 mt-4">
                                    {club.whoWeAre[0].images.map((img: string, imgIndex: number) => (
                                        <div key={imgIndex} className="relative w-24 h-24 border rounded-lg overflow-hidden">
                                            <Image 
                                                src={img} 
                                                alt={`Section image ${imgIndex + 1}`} 
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="mt-2 text-gray-600 text-[0.95vw] font-[500]">No images available</p>
                            )}
                        </div>
                    </div>
                ) : (
                    <div>
                        <h4 className="font-[600] text-[1.2vw] w-[12.552vw] h-[2vw]">Who We Are</h4>
                        <p className="text-gray-600 text-[0.95vw] font-[500]">No information available</p>
                    </div>
                )}
                {/* Services */}
                {club.services?.length > 0 ? (
                    <div>
                        <h4 className="font-[600] text-[1.2vw] w-[12.552vw] h-[2vw]">Services</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {club.services.map((service: any, i: number) => (
                                <div key={i} className="space-y-4">
                                    {service.image ? (
                                        <div className="relative w-full h-32 border rounded-lg overflow-hidden">
                                            <Image 
                                                src={service.image} 
                                                alt={service.name || `Service ${i + 1}`}
                                                fill
                                                className="object-cover rounded-lg"
                                            />
                                        </div>
                                    ) : (
                                        <div className="w-full h-32 bg-gray-200 flex items-center justify-center rounded-lg">
                                            <span>No Image</span>
                                        </div>
                                    )}
                                    <p className="text-[0.95vw] font-[500] text-gray-600 text-center">{service.name || 'Unnamed Service'}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div>
                        <h4 className="font-[600] text-[1.2vw] w-[12.552vw] h-[1.5vw]">Services</h4>
                        <p className="text-gray-600 text-[0.95vw] font-[500]">No services available</p>
                    </div>
                )}
                {/* Location */}
                {club.location ? (
                    <div>
                        <h4 className="font-[600] text-[1.2vw] w-[12.552vw] h-[1.5vw]">Description</h4>
                        {isEditing ? (
                            <div className="text-[0.95vw] font-[500] text-gray-600 mb-4">
                                <RichTextEditor
                                    content={locationDescription}
                                    onChange={value => {
                                        const processedValue = convertUrlsToLinks(value);
                                        setLocationDescription(processedValue);
                                    }}
                                    placeholder=""
                                />
                            </div>
                        ) : (
                            <div className="font-[500] text-[#000000] text-[0.95vw] mb-4">
                                <HtmlContent html={club.location?.description || "No description available"} />
                            </div>
                        )}
                        <h4 className="font-[600] text-[1.2vw] w-[12.552vw] h-[1.5vw]">Address</h4>
                        <div className="font-[500] text-gray-600 text-[0.95vw] font-[500] text-[0.95vw]">
                            <HtmlContent html={convertUrlsToLinks(club.location.address || "No address available")} />
                        </div>
                        {club.location.image && (
                            <div className="mt-4">
                                <h4 className="font-[600] text-[1.2vw] w-[12.552vw] h-[1.5vw]">Location Image</h4>
                                <div className="relative w-40 h-40 rounded-lg overflow-hidden">
                                    <Image 
                                        src={club.location.image} 
                                        alt="Location image" 
                                        fill
                                        className="object-cover mt-4"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div>
                        <h4 className="font-[600] text-[1.2vw] w-[12.552vw] h-[1.5vw]">Location</h4>
                        <p className="text-gray-600 text-[0.95vw] mt-2 font-[500]">No location information available</p>
                    </div>
                )}
                {/* Gallery */}
                {club.gallery && (club.gallery.images?.length > 0 || club.gallery.videos?.length > 0) ? (
                    <div className="mt-6">
                        <h4 className="font-[600] text-[1.2vw] w-full text-center mb-8">See Us In Action</h4>
                        
                        {/* Tab Navigation */}
                        <div className="w-full flex justify-center mb-6">
                            <div className="flex rounded-[15px] border border-[#E5E5E5] overflow-hidden w-full max-w-[600px]">
                                <button 
                                    className={`flex-1 py-[15px] transition-colors text-center text-[16px] font-[500] ${
                                        galleryTab === 'images' 
                                            ? 'bg-[#F2F2F2]' 
                                            : 'bg-white hover:bg-gray-200'
                                    }`}
                                    onClick={() => setGalleryTab('images')}
                                >
                                    Images
                                </button>
                                <button 
                                    className={`flex-1 py-[15px] transition-colors text-center text-[16px] font-[500] ${
                                        galleryTab === 'video' 
                                            ? 'bg-[#F2F2F2]' 
                                            : 'bg-white hover:bg-gray-200'
                                    }`}
                                    onClick={() => setGalleryTab('video')}
                                >
                                    Video
                                </button>
                            </div>
                        </div>
                        
                        {/* Images Tab Content */}
                        {galleryTab === 'images' && club.gallery.images?.length > 0 ? (
                            <div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                    {club.gallery.images.slice(0, galleryImagesDisplayCount).map((img: string, i: number) => (
                                        <div key={i} className="relative aspect-video rounded-[16px] overflow-hidden">
                                            <Image 
                                                src={img} 
                                                alt={`Gallery image ${i + 1}`} 
                                                fill
                                                className="object-cover hover:scale-110 transform transition-all duration-300"
                                            />
                                        </div>
                                    ))}
                                </div>
                                {club.gallery.images.length > galleryImagesDisplayCount && (
                                    <div className="flex justify-center mt-6">
                                        <button 
                                            onClick={() => setGalleryImagesDisplayCount(prev => prev + 8)}
                                            className="border border-[#21212133] rounded-[16px] w-[173px] h-[56px] font-[500] text-[16px] text-[#212121] hover:bg-gray-200"
                                        >
                                            Load More
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : galleryTab === 'images' ? (
                            <p className="text-center ">No images available</p>
                        ) : null}
                        
                        {/* Videos Tab Content */}
                        {galleryTab === 'video' && club.gallery.videos?.length > 0 ? (
                            <div>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                    {club.gallery.videos.slice(0, galleryVideosDisplayCount).map((video: string, i: number) => (
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
                                                        // Set the current time to 0.5 seconds to get a good thumbnail frame
                                                        const videoElement = e.target as HTMLVideoElement;
                                                        videoElement.currentTime = 0.5;
                                                    }}
                                                    onError={(e) => {
                                                        console.error(`Error loading video thumbnail ${i}:`, e);
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
                                    ))}
                                </div>
                                {club.gallery.videos.length > galleryVideosDisplayCount && (
                                    <div className="flex justify-center mt-6">
                                        <button 
                                            onClick={() => setGalleryVideosDisplayCount(prev => prev + 6)}
                                            className="border border-[#21212133] rounded-[16px] w-[173px] h-[56px] font-[500] text-[16px] text-[#212121] hover:bg-gray-200"
                                        >
                                            Load More
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : galleryTab === 'video' ? (
                            <p className="text-center">No videos available</p>
                        ) : null}
                    </div>
                ) : (
                    <div>
                        <h4 className="font-[600] text-[1.2vw] w-[12.552vw] h-[1.5vw]">Gallery</h4>
                        <p className="text-gray-600 text-[0.95vw] font-[500]">No gallery content available</p>
                    </div>
                )}
                {/* Forms */}
                {club.forms && club.forms.length > 0 ? (
                    <div>
                        <h4 className="font-[600] text-[1.2vw] w-[12.552vw] h-[1.5vw] mb-4">Forms & Documents</h4>
                        <div className="bg-white rounded-[0.625vw] overflow-hidden border border-[#CDCECE]">
                            <div className="space-y-2 p-4">
                                {club.forms.map((form: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                        <div className="flex items-center space-x-3">
                                            <div className="text-blue-500">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                                    <polyline points="14 2 14 8 20 8"></polyline>
                                                    <line x1="16" y1="13" x2="8" y2="13"></line>
                                                    <line x1="16" y1="17" x2="8" y2="17"></line>
                                                    <polyline points="10 9 9 9 8 9"></polyline>
                                                </svg>
                                            </div>
                                            <span className="text-[0.8vw] font-[500] text-gray-600 truncate max-w-[250px]">{form.fileName}</span>
                                        </div>
                                        <a 
                                            href={form.fileData} 
                                            download={form.fileName}
                                            className="text-blue-600 text-[0.938vw] hover:text-blue-800"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            Download
                                        </a>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div>
                        <h4 className="font-[600] text-[1.2vw] w-[12.552vw] h-[1.5vw] mb-2">Forms & Documents</h4>
                        <p className="text-gray-600 text-[0.95vw] font-[500]">No forms or documents available</p>
                    </div>
                )}
                {/* Drivers */}
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="font-[600] text-[1.2vw] w-[15vw]">Drivers</h4>
                        
                    </div>
                    
                    {club.drivers?.length > 0 ? (
                        <div className="bg-white rounded-[0.625vw] overflow-hidden border border-[#CDCECE]">
                            <table className="w-full">
                                <thead className="bg-black text-white">
                                    <tr>
                                        <th className="p-4 text-left text-[0.938vw] font-[500]">Image</th>
                                        <th className="p-4 text-left text-[0.938vw] font-[500]">Name</th>
                                        <th className="p-4 text-left text-[0.938vw] font-[500]">NZFSS RR</th>
                                        <th className="p-4 text-left text-[0.938vw] font-[500]">IFSS RR</th>
                                        <th className="p-4 text-left text-[0.938vw] font-[500]">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {club.drivers.map((driver: any, i: number) => (
                                        <tr key={i} className="border-b border-[#CDCECE]">
                                            <td className="p-4">
                                                <div className="relative w-[2.5vw] h-[2.5vw] rounded-full overflow-hidden">
                                                    {driver.image ? (
                                                        <Image 
                                                            src={driver.image} 
                                                            alt={driver.name} 
                                                            width={40}
                                                            height={40}
                                                            className="object-cover w-full h-full rounded-full"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                                            <User className="w-4 h-4 text-gray-400" />
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4 text-[0.938vw] font-[500] text-gray-600">{driver.name || 'N/A'}</td>
                                            <td className="p-4 text-[0.938vw] font-[500] text-gray-600">{driver.nzfssRR || 'N/A'}</td>
                                            <td className="p-4 text-[0.938vw] font-[500] text-gray-600">{driver.ipssRR || 'N/A'}</td>
                                            <td className="p-4">
                                                <div className="flex gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                          e.preventDefault();
                                                          e.stopPropagation();
                                                          setIsEditingDriver(true);
                                                          setEditingDriverIndex(i);
                                                          setDriverName(driver.name || "");
                                                          setNzfssRR(driver.nzfssRR || "");
                                                          setIpssRR(driver.ipssRR || "");
                                                          setDriverImagePreview(driver.image || "");
                                                          setIsModalOpen(true);
                                                        }}
                                                        className="p-1 rounded hover:bg-gray-200 cursor-pointer"
                                                      >
                                                        <Pencil className="w-4 h-4 text-[#323232]" />
                                                      </button>
                                                      <button
                                                        type="button"
                                                        onClick={(e) => {
                                                          e.preventDefault();
                                                          e.stopPropagation();
                                                          // Create a new array without the deleted driver
                                                          const updatedDrivers = drivers.filter((_, index) => index !== i);
                                                          setDrivers(updatedDrivers);
                                                          
                                                          toast({
                                                              title: "Success",
                                                              description: "Driver removed successfully",
                                                          });
                                                        }}
                                                        className="p-1 rounded hover:bg-gray-200 cursor-pointer"
                                                      >
                                                        <Trash2 className="w-4 h-4 text-[#323232]" />
                                                      </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="bg-white rounded-[0.625vw] overflow-hidden border border-[#CDCECE] p-4">
                            <p>No drivers added yet. Click "Add New" to add drivers.</p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // Update handleGalleryVideoUpload to use numbered names
    const handleGalleryVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        
        // Check if the total number of videos would exceed the limit
        const totalVideosAfterUpload = galleryVideos.length + files.length;
        if (totalVideosAfterUpload > MAX_TOTAL_VIDEOS) {
            toast({
                title: "Error",
                description: `You can upload a maximum of ${MAX_TOTAL_VIDEOS} videos in total. You currently have ${galleryVideos.length} and are trying to add ${files.length} more.`,
                variant: "destructive",
            });
            return;
        }
        
        // Check if batch size is too large
        if (files.length > MAX_BATCH_VIDEOS) {
            toast({
                title: "Error",
                description: `You can upload a maximum of ${MAX_BATCH_VIDEOS} videos at once. Please select fewer videos.`,
                variant: "destructive",
            });
            return;
        }
        
        // Filter valid files
        const validFiles = files.filter(file => {
            // Check file type
            if (!file.type.startsWith('video/')) {
                toast({
                    title: "Error",
                    description: `File ${file.name} is not a valid video type`,
                    variant: "destructive",
                });
                return false;
            }
            
            // Check file size
            if (file.size > MAX_VIDEO_SIZE) {
                toast({
                    title: "Error",
                    description: `Video ${file.name} is too large. Maximum size is ${MAX_VIDEO_SIZE / (1024 * 1024)}MB.`,
                    variant: "destructive",
                });
                return false;
            }
            
            console.log(`Video file selected: ${file.name}, size: ${(file.size / (1024 * 1024)).toFixed(2)} MB, type: ${file.type}`);
            return true;
        });
        
        if (validFiles.length === 0) return;
        
        // Process the valid files
        const newVideos: VideoItem[] = [...galleryVideos];
        const newPreviews: string[] = [...galleryVideoPreviews];
        
        validFiles.forEach(async (file) => {
            try {
                // Create object URL for preview
                const objectUrl = URL.createObjectURL(file);
                
                // Add the file directly without additional properties
                newVideos.push(file);
                newPreviews.push(objectUrl);
            } catch (error) {
                console.error("Error processing video:", error);
                toast({
                    title: "Error",
                    description: `Failed to process video: ${file.name}`,
                    variant: "destructive",
                });
            }
        });
        
        setGalleryVideos(newVideos);
        setGalleryVideoPreviews(newPreviews);
        
        // Clear the input to allow re-upload of the same files
        if (e.target) e.target.value = '';
    };

    // Update handleGalleryImageUpload to handle multiple image uploads without limit
    const handleGalleryImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        
        // Check if the total number of images would exceed the limit
        const totalImagesAfterUpload = galleryImages.length + files.length;
        if (totalImagesAfterUpload > MAX_TOTAL_IMAGES) {
            toast({
                title: "Error",
                description: `You can upload a maximum of ${MAX_TOTAL_IMAGES} images in total. You currently have ${galleryImages.length} and are trying to add ${files.length} more.`,
                variant: "destructive",
            });
            return;
        }
        
        // Filter valid files based on type and size
        const validFiles = files.filter(file => {
            // Check file type
            if (!file.type.startsWith('image/')) {
                toast({
                    title: "Error",
                    description: `File ${file.name} is not a valid image type`,
                    variant: "destructive",
                });
                return false;
            }
            
            // Check file size
            if (file.size > MAX_IMAGE_SIZE) {
                toast({
                    title: "Error",
                    description: `Image ${file.name} is too large. Maximum size is ${MAX_IMAGE_SIZE / (1024 * 1024)}MB.`,
                    variant: "destructive",
                });
                return false;
            }
            
            return true;
        });
        
        if (validFiles.length === 0) return;
        
        // Process valid files in smaller batches to avoid timeouts
        const processBatch = (batch: File[], startIndex: number) => {
            const newPreviews: string[] = [...galleryImagePreviews];
            const newImages: File[] = [...galleryImages];
            
            let processed = 0;
            
            batch.forEach((file, index) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    newPreviews.push(reader.result as string);
                    newImages.push(file);
                    processed++;
                    
                    // Update state when all in this batch are processed
                    if (processed === batch.length) {
                        setGalleryImagePreviews(newPreviews);
                        setGalleryImages(newImages);
                        
                        // Show success message
                        toast({
                            title: "Success",
                            description: `Batch ${startIndex+1}: ${batch.length} image(s) processed successfully.`,
                        });
                    }
                };
                reader.readAsDataURL(file);
            });
        };
        
        // Process files in batches of 70 to avoid timeout issues
        const BATCH_SIZE = 70;
        for (let i = 0; i < validFiles.length; i += BATCH_SIZE) {
            const batch = validFiles.slice(i, i + BATCH_SIZE);
            processBatch(batch, i / BATCH_SIZE);
        }
        
        // Clear the input to allow re-upload of the same files
        if (e.target) e.target.value = '';
    };

    // Add a useEffect to log drivers changes
    useEffect(() => {
        console.log("Drivers state updated:", drivers);
    }, [drivers]);

    // Add this function before the ManageClub component
    const convertUrlsToLinks = (text: string): string => {
        if (!text) return "";
        
        try {
            // First clean up any malformed HTML links in the text
            let cleanedText = text;
            
            // Remove target="_blank" rel="noopener noreferrer" from links
            cleanedText = cleanedText.replace(/target="_blank"\s*rel="noopener\s*noreferrer"/g, '');
            
            // Fix any double quoted links like ""target="_blank"..."
            cleanedText = cleanedText.replace(/""\s*target/g, '"target');
            
            // Handle URLs that are not properly wrapped in anchor tags
            const urlRegex = /(https?:\/\/[^\s<]+)|(www\.[^\s<]+)|([a-zA-Z0-9][a-zA-Z0-9-]*\.[a-zA-Z]{2,}\/[^\s<]*)/g;
            
            cleanedText = cleanedText.replace(urlRegex, (url) => {
                // Skip if already part of an HTML link
                const prevChar = cleanedText.charAt(cleanedText.indexOf(url) - 1);
                if (prevChar === '"' || prevChar === '\'') {
                    return url;
                }
                
                // Add https:// prefix if needed
                let fullUrl = url;
                if (url.startsWith('www.')) {
                    fullUrl = `https://${url}`;
                } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
                    fullUrl = `https://${url}`;
                }
                
                return `<a href="${fullUrl}">${url}</a>`;
            });
            
            return cleanedText;
        } catch (e) {
            console.error('Error in convertUrlsToLinks:', e);
            return text; // Return original text if there's an error
        }
    };

    // Add a type guard function to check if an item is an existing video
    function isExistingVideo(video: VideoItem): video is { 
        isExistingVideo: boolean; 
        url: string; 
        name: string; 
        originalName: string; 
        size: number; 
        type: string; 
    } {
        return 'isExistingVideo' in video && video.isExistingVideo === true;
    }

    // Add video handling functions
    const handleVideoClick = (videoUrl: string) => {
        setSelectedVideo(videoUrl);
    };

    const handleCloseVideo = () => {
        setSelectedVideo(null);
    };

    // Add this function to generate a poster image URL from a video URL
    const getVideoPosterUrl = (videoUrl: string): string => {
        // Check if the video is stored in a common video platform like YouTube or Vimeo
        if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
            // Extract YouTube video ID
            const youtubeRegex = /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
            const match = videoUrl.match(youtubeRegex);
            const videoId = match ? match[1] : null;
            if (videoId) {
                return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
            }
        }
        
        // For other videos, we'll rely on the video element's natural poster behavior
        return '';
    };

    // Add this function to get the total pages for gallery navigation
    const getTotalGalleryImagePages = () => {
        const totalImages = galleryImagePreviews.length;
        return Math.ceil(totalImages / 8); // 8 images per page
    };

    // Function to render the gallery section
    const renderGallerySection = () => {
        // Calculate current page info for images
        const totalImagePages = getTotalGalleryImagePages();
        // Start with page 0, not based on display count
        const currentImagePage = Math.floor(galleryImagesDisplayCount / 8) - 1 >= 0 
            ? Math.floor(galleryImagesDisplayCount / 8) - 1 
            : 0;
        
        return (
            <div>
                <h4 className="font-[600] text-[1.2vw] w-full text-center mb-8">See Us In Action</h4>
                
                {/* Tab Navigation */}
                <div className="w-full flex justify-center mb-6">
                    <div className="flex rounded-[15px] border border-[#E5E5E5] overflow-hidden w-full max-w-[600px]">
                        <button 
                            className={`flex-1 py-[15px] transition-colors text-center text-[16px] font-[500] ${galleryTab === 'images' ? 'bg-[#F2F2F2]' : 'bg-white hover:bg-gray-200'}`}
                            onClick={() => setGalleryTab('images')}
                        >
                            Images
                        </button>
                        <button 
                            className={`flex-1 py-[15px] transition-colors text-center text-[16px] font-[500] ${galleryTab === 'video' ? 'bg-[#F2F2F2]' : 'bg-white hover:bg-gray-200'}`}
                            onClick={() => setGalleryTab('video')}
                        >
                            Video
                        </button>
                    </div>
                </div>
                
                {/* Images Tab Content */}
                {galleryTab === 'images' && galleryImagePreviews.length > 0 ? (
                    <div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {galleryImagePreviews
                                .slice(currentImagePage * 8, (currentImagePage + 1) * 8)
                                .map((img, i) => (
                                    <div key={i} className="relative aspect-video rounded-[16px] overflow-hidden">
                                        <Image 
                                            src={img} 
                                            alt={`Gallery image ${currentImagePage * 8 + i + 1}`} 
                                            fill
                                            className="object-cover hover:scale-110 transform transition-all duration-300"
                                        />
                                    </div>
                                ))}
                        </div>
                        
                        {/* Navigation Controls */}
                        {totalImagePages > 1 && (
                            <div className="flex justify-center items-center gap-x-[8px] mt-6">
                                <button 
                                    onClick={() => {
                                        if (currentImagePage > 0) {
                                            setGalleryImagesDisplayCount((currentImagePage) * 8);
                                        }
                                    }}
                                    className="w-[32px] h-[32px] flex items-center justify-center"
                                    disabled={currentImagePage === 0}
                                >
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M15 18L9 12L15 6" stroke={currentImagePage === 0 ? "#D9D9D9" : "black"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </button>
                                
                                {[...Array(totalImagePages)].map((_, index) => (
                                    <div
                                        key={index}
                                        className={`w-[8px] h-[8px] rounded-full cursor-pointer ${
                                            currentImagePage === index ? 'bg-black' : 'bg-[#D9D9D9]'
                                        }`}
                                        onClick={() => setGalleryImagesDisplayCount((index + 1) * 8)}
                                    ></div>
                                ))}
                                
                                <button 
                                    onClick={() => {
                                        if (currentImagePage < totalImagePages - 1) {
                                            setGalleryImagesDisplayCount((currentImagePage + 2) * 8);
                                        }
                                    }}
                                    className="w-[32px] h-[32px] flex items-center justify-center"
                                    disabled={currentImagePage >= totalImagePages - 1}
                                >
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M9 6L15 12L9 18" stroke={currentImagePage >= totalImagePages - 1 ? "#D9D9D9" : "black"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </button>
                            </div>
                        )}
                    </div>
                ) : galleryTab === 'images' ? (
                    <p className="text-center text-gray-600 text-[0.95vw] font-[500]">No images available</p>
                ) : null}
                
                {/* Videos Tab Content */}
                {galleryTab === 'video' && galleryVideoPreviews.length > 0 ? (
                    <div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                            {galleryVideoPreviews.slice(0, galleryVideosDisplayCount).map((videoUrl, i) => (
                                <div key={i} className="relative aspect-video rounded-[16px] overflow-hidden cursor-pointer group" onClick={() => handleVideoClick(videoUrl)}>
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
                                            src={videoUrl}
                                            poster={getVideoPosterUrl(videoUrl)}
                                            muted
                                            preload="metadata"
                                            onLoadedMetadata={(e) => {
                                                // Set the current time to 0.5 seconds to get a good thumbnail frame
                                                const videoElement = e.target as HTMLVideoElement;
                                                videoElement.currentTime = 0.5;
                                            }}
                                        ></video>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {galleryVideoPreviews.length > galleryVideosDisplayCount && (
                            <div className="flex justify-center mt-6">
                                <button 
                                    onClick={() => setGalleryVideosDisplayCount(prev => prev + 6)}
                                    className="border border-[#21212133] rounded-[16px] w-[173px] h-[56px] font-[500] text-[16px] text-[#212121] hover:bg-gray-200"
                                >
                                    Load More
                                </button>
                            </div>
                        )}
                    </div>
                ) : galleryTab === 'video' ? (
                    <p className="text-center">No videos available</p>
                ) : null}
                
                {/* Video Lightbox */}
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
    };

    // Add useEffect to handle display count based on edit mode
    useEffect(() => {
        setGalleryImagesDisplayCount(isEditing ? 15 : 8);
    }, [isEditing]);

    const handleFormFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        
        // Accept PDF and common document formats
        const acceptedTypes = [
            "application/pdf", 
            "application/msword", 
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        ];
        
        const validFiles = files.filter(file => {
            if (!acceptedTypes.includes(file.type)) {
                toast({
                    title: "Error",
                    description: `File "${file.name}" is not a valid document format. Please upload PDF or Office documents.`,
                    variant: "destructive",
                });
                return false;
            }
            
            // Maximum file size 20MB for documents
            const MAX_DOC_SIZE = 20 * 1024 * 1024;
            if (file.size > MAX_DOC_SIZE) {
                toast({
                    title: "Error",
                    description: `Document "${file.name}" is too large. Maximum size is 20MB.`,
                    variant: "destructive",
                });
                return false;
            }
            
            return true;
        });
        
        if (validFiles.length > 0) {
            // Update state with the valid files
            setFormFiles(prev => [...prev, ...validFiles]);
            setFormFileNames(prev => [...prev, ...validFiles.map(file => file.name)]);
            
            toast({
                title: "Success",
                description: `${validFiles.length} form document${validFiles.length > 1 ? "s" : ""} added successfully.`,
            });
        }
        
        // Reset the input so the same file can be selected again if needed
        if (e.target) {
            e.target.value = "";
        }
    };

    const handleRemoveFormFile = (index: number) => {
        setFormFiles(prev => {
            const updated = [...prev];
            updated.splice(index, 1);
            return updated;
        });
        
        setFormFileNames(prev => {
            const updated = [...prev];
            updated.splice(index, 1);
            return updated;
        });
    };
    
    const processBatch = (batch: File[], startIndex: number) => {
        // ... existing code ...
    };

    const [isEditingDriver, setIsEditingDriver] = useState(false);
    const [editingDriverIndex, setEditingDriverIndex] = useState<number | null>(null);

    return (
        <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <TopHeader placeholder="Search clubs..." />
                <div className="flex-1 overflow-y-auto p-4">
                    <div className="container mx-auto border border-gray-200 rounded-lg">
                        <div className="flex flex-col gap-[2vw] bg-gray-50 p-[1.5vw] rounded-lg">
                            {/* Show loading spinner while fetching data */}
                            {clubDetailsLoading && (
                                <div className="flex flex-col items-center justify-center py-16">
                                    <Spinner />
                                    <p className="mt-4 text-[1vw] font-[500] text-gray-600">Loading club details...</p>
                                </div>
                            )}

                            {/* Show content only after loading is complete */}
                            {!clubDetailsLoading && (
                                <>
                                    <div className="flex justify-between items-center">
                                        <h1 className="text-[1.8vw] font-bold">Club Detail</h1>
                                        {hasClubData && !isEditing && (
                                            <button
                                                onClick={() => handleEdit(clubDetailsData.getCurrentUserClubDetails)}
                                                className="px-[1.5vw] py-[0.8vw] bg-white text-black text-[0.95vw] border border-gray-300 rounded-lg hover:bg-gray-200"
                                            >
                                                Edit Details
                                            </button>
                                        )}
                                        {isEditing && (
                                            <button
                                                onClick={handleCancelEdit}
                                                className="px-[1.5vw] py-[0.8vw] text-red-600 border border-[#CDCECE] rounded-lg hover:bg-gray-200"
                                            >
                                                Cancel Edit
                                            </button>
                                        )}
                                    </div>
                                    <p className="font-[500] text-[#4F4F4F] text-[0.95vw] -mt-[1.5vw]">This is the entry page for your club's details and public information.</p>
                                    
                                    {/* Display current club details */}
                                    {hasClubData && !isEditing && (
                                        <div className="bg-white p-[1.5vw] rounded-[0.625vw] -mt-[0.5vw] border border-[#CDCECE]">
                                            {renderClubDetails(clubDetailsData.getCurrentUserClubDetails)}
                                        </div>
                                    )}

                                    {/* Show form for new club or editing */}
                                    {(isEditing || !hasClubData) && (
                                <div className="bg-white p-[1.5vw] rounded-[0.625vw] mb-[1vw] border border-[#CDCECE]">
                                    <h2 className="text-[1.5vw] font-semibold mb-[1.5vw]">{hasClubData ? "Edit Club Details" : "Create Club Details"}</h2>
                                    <form 
                                      onSubmit={(e) => {
                                        e.preventDefault();
                                        handleSaveDetails();
                                      }} 
                                      className="space-y-[2vw]"
                                    >
                                        <div className="space-y-[1.5vw]">
                                            {/* Upload Club Logo */}
                                            <div>
                                                <label className="block mb-[0.8vw] font-[600] text-[0.95vw]">Upload Club Logo</label>
                                                <div 
                                                    className="border-2 border-gray-300 w-[10vw] h-[6vw] rounded-[20px] text-center cursor-pointer mb-2"
                                                    onClick={() => fileInputRefs.clubLogo.current?.click()}
                                                >
                                                    {clubLogoPreview ? (
                                                        <div className="relative w-full h-full">
                                                            <Image 
                                                                src={clubLogoPreview} 
                                                                alt="Club logo preview" 
                                                                fill
                                                                className="object-cover rounded-[16px]"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="flex justify-center items-center h-full">
                                                            <span className="text-2xl">+</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <button 
                                                    type="button"
                                                    className="border border-[#CDCECE] text-[#343535] text-[0.938vw] w-[5vw] rounded-[0.833vw] font-[500] p-2"
                                                    onClick={() => fileInputRefs.clubLogo.current?.click()}
                                                >
                                                    Upload
                                                </button>
                                                <p className="mt-2 text-[0.729vw] font-[600] text-[#696A6A]">*Must be PNG, JPG, SVG or PDF</p>
                                                <input
                                                    type="file"
                                                    ref={fileInputRefs.clubLogo}
                                                    className="hidden"
                                                    accept="image/png,image/jpeg,image/svg+xml,application/pdf"
                                                    onChange={(e) => handleFileChange(e, setClubLogo, setClubLogoPreview)}
                                                />
                                            </div>

                                            {/* Club Name */}
                                            <div>
                                                <label className="block mb-2 font-[600] text-[0.938vw]">Club name</label>
                                                <input 
                                                    type="text" 
                                                    className="w-full p-3 border rounded-lg border-[#CDCECE]"
                                                    value={clubName || (user?.name || "")}
                                                    onChange={(e) => setClubName(e.target.value)}
                                                />
                                                <p className="mt-1 text-[0.625vw] text-[#696A6A]">*Enter your club name</p>
                                            </div>

                                            {/* Short Description */}
                                            <div>
                                                <label className="block mb-2 font-[600] text-[0.938vw]">Short Description</label>
                                                <RichTextEditor 
                                                    content={description}
                                                    onChange={(value) => {
                                                        // Convert URLs to links before setting the content
                                                        const processedValue = convertUrlsToLinks(value);
                                                        setDescription(processedValue);
                                                    }}
                                                    placeholder=""
                                                />
                                            </div>

                                            {/* Form Files Upload */}
                                            <div>
                                                <label className="block mb-2 font-[600] text-[0.938vw]">Upload Forms </label>
                                                <button 
                                                    type="button"
                                                    className="flex items-center gap-2 border border-[#CDCECE] px-4 py-2 rounded-lg"
                                                    onClick={() => fileInputRefs.formFiles.current?.click()}
                                                >
                                                    <span>↑</span> Upload Forms
                                                </button>
                                                <p className="mt-2 text-[0.729vw] font-[600] text-[#696A6A]">*Must be PDF or Office document format. Maximum size: 20MB per file</p>
                                                <input
                                                    type="file"
                                                    ref={fileInputRefs.formFiles}
                                                    className="hidden"
                                                    accept=".pdf,.doc,.docx,.xls,.xlsx"
                                                    multiple
                                                    onChange={handleFormFiles}
                                                />
                                                
                                                {/* Form files list */}
                                                {formFileNames.length > 0 && (
                                                    <div className="mt-4">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <p className="text-sm font-medium">Uploaded Forms:</p>
                                                            <p className="text-sm text-gray-500">{formFileNames.length} documents</p>
                                                        </div>
                                                        <div className="space-y-2 max-h-[200px] overflow-y-auto">
                                                            {formFileNames.map((fileName, i) => (
                                                                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="text-blue-500">
                                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                                                                <polyline points="14 2 14 8 20 8"></polyline>
                                                                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                                                                <line x1="16" y1="17" x2="8" y2="17"></line>
                                                                                <polyline points="10 9 9 9 8 9"></polyline>
                                                                            </svg>
                                                                        </div>
                                                                        <span className="text-sm truncate max-w-[250px]">{fileName}</span>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => handleRemoveFormFile(i)}
                                                                        className="text-red-500 hover:text-red-700"
                                                                    >
                                                                        ×
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Cover Image */}
                                            <div>
                                                <label className="block mb-2 font-[600] text-[0.938vw]">Upload Cover Image</label>
                                                <button 
                                                    type="button"
                                                    className="flex items-center gap-2 border border-[#CDCECE] px-4 py-2 rounded-lg"
                                                    onClick={() => fileInputRefs.coverImage.current?.click()}
                                                >
                                                    <span>↑</span> Upload
                                                </button>
                                                <p className="mt-2 text-[0.729vw] font-[600] text-[#696A6A]">*Must be PNG or JPG. The cover should be 16:9 ratio</p>
                                                <input
                                                    type="file"
                                                    ref={fileInputRefs.coverImage}
                                                    className="hidden"
                                                    accept="image/png,image/jpeg"
                                                    onChange={(e) => handleFileChange(e, setCoverImage, setCoverImagePreview)}
                                                />
                                                {coverImagePreview && (
                                                    <div className="mt-4 relative w-full h-[9vw] group">
                                                        <Image 
                                                            src={coverImagePreview} 
                                                            alt="Cover preview" 
                                                            fill
                                                            className="object-cover rounded-lg"
                                                        />
                                                        <button
                                                            onClick={() => {
                                                                setCoverImage(null);
                                                                setCoverImagePreview("");
                                                            }}
                                                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                                        >
                                                            ×
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Statistics */}
                                            <div>
                                                <label className="block mb-4 font-[600] text-[0.938vw]">Statistics</label>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    {statisticsData.map((stat, index) => (
                                                        <div key={index} className="space-y-4 border border-[#CDCECE] p-4 rounded-lg">
                                                            <input 
                                                                type="text" 
                                                                className="w-full p-3 border rounded-lg border-[#CDCECE]"
                                                                placeholder="Statistics Name"
                                                                value={stat.name}
                                                                onChange={(e) => {
                                                                    const newStats = [...statisticsData];
                                                                    newStats[index] = { ...stat, name: e.target.value };
                                                                    setStatisticsData(newStats);
                                                                }}
                                                            />
                                                            
                                                            {!stat.isCustomIcon ? (
                                                                <div>
                                                                    <label className="block mb-2 text-sm font-medium">Select Icon</label>
                                                                    <div className="grid grid-cols-4 gap-2">
                                                                        {iconOptions.map((option) => (
                                                                            <div 
                                                                                key={option.name}
                                                                                className={`flex items-center justify-center p-3 border rounded-lg cursor-pointer hover:bg-gray-200 ${
                                                                                    stat.icon === option.name ? 'bg-gray-100 border-blue-500' : 'border-gray-300'
                                                                                }`}
                                                                                onClick={() => {
                                                                                    const newStats = [...statisticsData];
                                                                                    newStats[index] = { 
                                                                                        ...stat, 
                                                                                        icon: option.name,
                                                                                        isCustomIcon: false 
                                                                                    };
                                                                                    setStatisticsData(newStats);
                                                                                }}
                                                                            >
                                                                                {option.component}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="mb-4">
                                                                    <label className="block mb-2 text-sm font-medium">Custom Icon</label>
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="w-12 h-12 border rounded-lg flex items-center justify-center">
                                                                            {renderIcon(stat.icon, true)}
                                                                        </div>
                                                                        <button
                                                                            type="button"
                                                                            className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-200"
                                                                            onClick={() => {
                                                                                const newStats = [...statisticsData];
                                                                                newStats[index] = { 
                                                                                    ...stat, 
                                                                                    icon: '',
                                                                                    isCustomIcon: false 
                                                                                };
                                                                                setStatisticsData(newStats);
                                                                            }}
                                                                        >
                                                                            Remove
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            )}
                                                            
                                                            <div>
                                                                <p className="mb-2 text-[0.729vw] font-[600] text-[#696A6A]">Or (Upload your icon)</p>
                                                                <div 
                                                                    className="border-2 border-dashed border-gray-300 p-4 text-center rounded-lg cursor-pointer"
                                                                    onClick={() => fileInputRefs.statisticsIcons[index].current?.click()}
                                                                >
                                                                    <span className="text-2xl">+</span>
                                                                </div>
                                                                <input
                                                                    type="file"
                                                                    ref={fileInputRefs.statisticsIcons[index]}
                                                                    className="hidden"
                                                                    accept="image/png,image/jpeg,image/svg+xml"
                                                                    onChange={(e) => handleStatisticsIconUpload(index, e)}
                                                                />
                                                                <p className="mt-2 text-[0.729vw] font-[600] text-[#696A6A]">*Must be PNG and Vector. The size maximum size should be 56x56 px</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Who We Are */}
                                            <div>
                                                <label className="block mb-4 font-[600] text-[0.938vw]">Who We Are</label>
                                                <div className="mb-6 space-y-4">
                                                    <p className="text-[0.729vw] font-[600] text-[#696A6A]">* Max character should be around 1000</p>
                                                    
                                                    {/* Description textarea */}
                                                    <div>
                                                        <label className="block mb-2 text-[0.833vw] font-[500]">Description</label>
                                                        <RichTextEditor
                                                            content={whoWeAreData.description}
                                                            onChange={(value) => {
                                                                // Convert URLs to links before setting the content
                                                                const processedValue = convertUrlsToLinks(value);
                                                                setWhoWeAreData({ ...whoWeAreData, description: processedValue });
                                                            }}
                                                            placeholder=""
                                                        />
                                                    </div>
                                                    
                                                    {/* Image upload area */}
                                                    <div 
                                                        className="border-2 border-dashed border-gray-300 p-4 text-center rounded-lg cursor-pointer"
                                                        onClick={() => fileInputRefs.whoWeAreImages.current?.click()}
                                                    >
                                                        <span className="text-2xl">+</span>
                                                        <p className="mt-2 text-[0.729vw] font-[600] text-[#696A6A]">* Upload maximum 3 images. Format should be PNG or JPG</p>
                                                        <p className="mt-1 text-[0.625vw] text-[#696A6A]">*Maximum file size: 10MB</p>
                                                    </div>
                                                    <input
                                                        type="file"
                                                        ref={fileInputRefs.whoWeAreImages}
                                                        className="hidden"
                                                        accept="image/png,image/jpeg"
                                                        multiple
                                                        onChange={handleWhoWeAreImages}
                                                    />
                                                    
                                                    {/* Image previews */}
                                                    {whoWeAreImagesPreview.length > 0 && (
                                                        <div className="mt-4">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <p className="text-sm font-medium">Uploaded Images:</p>
                                                                <p className="text-sm text-gray-500">{whoWeAreImagesPreview.length}/3 images</p>
                                                            </div>
                                                            <div className="flex flex-wrap gap-2">
                                                                {whoWeAreImagesPreview.map((preview, i) => (
                                                                    <div key={i} className="relative w-24 h-24 border rounded-lg overflow-hidden group">
                                                                        <Image 
                                                                            src={preview} 
                                                                            alt={`Preview ${i + 1}`} 
                                                                            fill
                                                                            className="object-cover"
                                                                        />
                                                                        <button
                                                                            onClick={() => handleRemoveWhoWeAreImage(i)}
                                                                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                                                        >
                                                                            ×
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Our Services */}
                                            <div>
                                                <label className="block mb-4 font-[600] text-[0.938vw]">Our Services</label>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                    {servicesData.map((service, index) => (
                                                        <div key={index} className="space-y-4">
                                                            {/* Service image upload */}
                                                            <div 
                                                                className="border-2 border-dashed border-gray-300 p-4 text-center rounded-lg cursor-pointer relative h-32 group"
                                                                onClick={() => fileInputRefs.serviceImages[index].current?.click()}
                                                            >
                                                                {serviceImagePreviews[index] ? (
                                                                    <div className="relative w-full h-full">
                                                                        <Image 
                                                                            src={serviceImagePreviews[index]} 
                                                                            alt={`Service ${index + 1}`} 
                                                                            fill
                                                                            className="object-cover rounded-lg"
                                                                        />
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setServiceImagePreviews(prev => {
                                                                                    const newPreviews = [...prev];
                                                                                    newPreviews[index] = "";
                                                                                    return newPreviews;
                                                                                });
                                                                                setServicesData(prev => {
                                                                                    const newServices = [...prev];
                                                                                    newServices[index] = { ...newServices[index], image: "" };
                                                                                    return newServices;
                                                                                });
                                                                            }}
                                                                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                                                        >
                                                                            ×
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <>
                                                                        <span className="text-2xl">+</span>
                                                                        <p className="mt-2 text-[0.729vw] font-[600] text-[#696A6A]">*Must be PNG or JPG</p>
                                                                        <p className="mt-1 text-[0.625vw] text-[#696A6A]">*Maximum file size: 10MB</p>
                                                                    </>
                                                                )}
                                                            </div>
                                                            <input
                                                                type="file"
                                                                ref={fileInputRefs.serviceImages[index]}
                                                                className="hidden"
                                                                accept="image/png,image/jpeg"
                                                                onChange={(e) => handleServiceImage(index, e)}
                                                            />
                                                            
                                                            {/* Service name input */}
                                                            <input 
                                                                type="text" 
                                                                className="w-full p-3 border rounded-lg border-[#CDCECE]"
                                                                placeholder="Enter service name"
                                                                value={service.name}
                                                                onChange={(e) => {
                                                                    const newServices = [...servicesData];
                                                                    newServices[index] = { ...service, name: e.target.value };
                                                                    setServicesData(newServices);
                                                                }}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Gallery */}
                                            <div>
                                                <label className="block mb-4 font-[600] text-[0.938vw]">See us in Action (Gallery)</label>
                                                <div className="grid grid-cols-2 gap-6">
                                                    <div>
                                                        <p className="mb-2 font-[500]">Images</p>
                                                        <div 
                                                            className="border-2 border-dashed border-gray-300 p-4 text-center rounded-lg cursor-pointer"
                                                            onClick={() => fileInputRefs.galleryImages.current?.click()}
                                                        >
                                                            <span className="text-2xl">+</span>
                                                            <p className="mt-2 text-[0.729vw] font-[600] text-[#696A6A]">Upload your images</p>
                                                            <p className="mt-1 text-[0.625vw] text-[#696A6A]">*Maximum file size: {MAX_IMAGE_SIZE / (1024 * 1024)}MB per image</p>
                                                            <p className="mt-1 text-[0.625vw] text-[#696A6A]">*Maximum total: {MAX_TOTAL_IMAGES} images</p>
                                                            <p className="mt-1 text-[0.625vw] text-[#696A6A]">*Large batches processed automatically in smaller groups</p>
                                                        </div>
                                                        <input
                                                            type="file"
                                                            ref={fileInputRefs.galleryImages}
                                                            className="hidden"
                                                            accept="image/png,image/jpeg"
                                                            multiple
                                                            onChange={handleGalleryImageUpload}
                                                        />
                                                        
                                                        {/* Image previews */}
                                                        {galleryImagePreviews.length > 0 && (
                                                            <div className="mt-4">
                                                                <p className="mb-2 text-sm font-medium">Uploaded Images ({galleryImagePreviews.length}/{MAX_TOTAL_IMAGES}):</p>
                                                                <div className="grid grid-cols-5 gap-2">
                                                                    {galleryImagePreviews.slice(0, galleryImagesDisplayCount).map((preview, i) => (
                                                                        <div key={i} className="relative aspect-square border rounded-lg overflow-hidden group">
                                                                            <Image 
                                                                                src={preview} 
                                                                                alt={`Gallery image ${i + 1}`} 
                                                                                fill
                                                                                className="object-cover"
                                                                            />
                                                                            <button
                                                                                onClick={() => {
                                                                                    setGalleryImages(prev => prev.filter((_, index) => index !== i));
                                                                                    setGalleryImagePreviews(prev => prev.filter((_, index) => index !== i));
                                                                                }}
                                                                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                                                            >
                                                                                ×
                                                                            </button>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                                {galleryImagePreviews.length > galleryImagesDisplayCount && (
                                                                    <div className="flex justify-center mt-4">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setGalleryImagesDisplayCount(prev => prev + (isEditing ? 15 : 8))}
                                                                            className="px-4 py-2 bg-white border border-[#CDCECE] hover:bg-gray-200 rounded-lg transition-colors"
                                                                        >
                                                                            Load More Images
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="mb-2 font-[500]">Videos</p>
                                                        <div 
                                                            className="border-2 border-dashed border-gray-300 p-4 text-center rounded-lg cursor-pointer"
                                                            onClick={() => fileInputRefs.galleryVideos.current?.click()}
                                                        >
                                                            <span className="text-2xl">+</span>
                                                            <p className="mt-2 text-[0.729vw] font-[600] text-[#696A6A]">Upload your videos</p>
                                                            <p className="mt-1 text-[0.625vw] text-[#696A6A]">*Maximum file size: {MAX_VIDEO_SIZE / (1024 * 1024)}MB per video</p>
                                                            <p className="mt-1 text-[0.625vw] text-[#696A6A]">*Maximum batch upload: {MAX_BATCH_VIDEOS} videos</p>
                                                            <p className="mt-1 text-[0.625vw] text-[#696A6A]">*Maximum total: {MAX_TOTAL_VIDEOS} videos</p>
                                                        </div>
                                                        <input
                                                            type="file"
                                                            ref={fileInputRefs.galleryVideos}
                                                            className="hidden"
                                                            accept="video/*"
                                                            multiple
                                                            onChange={handleGalleryVideoUpload}
                                                        />
                                                        
                                                        {/* Video previews */}
                                                        {galleryVideoPreviews.length > 0 && (
                                                            <div className="mt-4">
                                                                <p className="mb-2 text-sm font-medium">Selected Videos ({galleryVideoPreviews.length}/{MAX_TOTAL_VIDEOS}):</p>
                                                                <div className="grid grid-cols-3 gap-4">
                                                                    {galleryVideoPreviews.slice(0, galleryVideosDisplayCount).map((videoUrl, i) => (
                                                                        <div key={i} className="border rounded-lg overflow-hidden relative group">
                                                                            <video 
                                                                                controls 
                                                                                className="w-full h-auto max-h-[150px]"
                                                                                src={videoUrl}
                                                                            >
                                                                                Your browser does not support the video tag.
                                                                            </video>
                                                                            <button
                                                                                onClick={() => {
                                                                                    setGalleryVideos(prev => prev.filter((_, index) => index !== i));
                                                                                    setGalleryVideoPreviews(prev => prev.filter((_, index) => index !== i));
                                                                                }}
                                                                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                                                            >
                                                                                ×
                                                                            </button>
                                                                            <div className="p-2 bg-gray-50">
                                                                                {isExistingVideo(galleryVideos[i]) ? (
                                                                                    <>
                                                                                        <p className="text-sm">
                                                                                            {galleryVideos[i].originalName || galleryVideos[i].name}
                                                                                        </p>
                                                                                        <p className="text-xs text-green-600 mt-1">
                                                                                            This video is already uploaded. No need to re-upload.
                                                                                        </p>
                                                                                    </>
                                                                                ) : (
                                                                                    <>
                                                                                        <p className="text-sm">
                                                                                            {(galleryVideos[i] as VideoItem).originalName || (galleryVideos[i] as File).name}
                                                                                            <span className="ml-2 text-xs text-gray-500">
                                                                                                {galleryVideos[i] instanceof File ? `${(galleryVideos[i].size / (1024 * 1024)).toFixed(2)} MB` : ""}
                                                                                            </span>
                                                                                        </p>
                                                                                        <p className="text-xs text-green-600 mt-1">
                                                                                            Ready to upload. Click "Save Detail" to complete the upload.
                                                                                        </p>
                                                                                    </>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                                {galleryVideoPreviews.length > galleryVideosDisplayCount && (
                                                                    <div className="flex justify-center mt-4">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setGalleryVideosDisplayCount(prev => prev + 6)}
                                                                            className="px-4 py-2 bg-white border border-[#CDCECE] hover:bg-gray-200 rounded-lg transition-colors"
                                                                        >
                                                                            Load More Videos
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Location / Where You Can Find Us */}
                                            <h4 className="font-[600] text-[1.2vw] mb-2">Where You Can Find Us</h4>
                                            <div className="space-y-4">
                                              {/* Location Description */}
                                              <div>
                                                <label className="block mb-2 font-[600] text-[0.938vw]">Description</label>
                                                <RichTextEditor
                                                  content={locationDescription}
                                                  onChange={value => {
                                                    const processedValue = convertUrlsToLinks(value);
                                                    setLocationDescription(processedValue);
                                                  }}
                                                  placeholder="Club Description"
                                                />
                                              </div>
                                              {/* Location Address */}
                                              <div>
                                                <label className="block mb-2 font-[600] text-[0.938vw]">Address</label>
                                                <input
                                                  type="text"
                                                  className="w-full p-3 border rounded-lg border-[#CDCECE]"
                                                  placeholder="Enter address"
                                                  value={locationAddress}
                                                  onChange={e => setLocationAddress(e.target.value)}
                                                />
                                              </div>
                                              {/* Location Image Upload */}
                                              <div>
                                                <label className="block mb-2 font-[600] text-[0.938vw]">Location Image</label>
                                                <div
                                                  className="border-2 border-dashed border-gray-300 p-4 text-center rounded-lg cursor-pointer relative h-48 group mb-2"
                                                  onClick={() => fileInputRefs.locationImage.current?.click()}
                                                >
                                                  {locationImagePreview ? (
                                                    <div className="relative w-full h-full">
                                                      <Image
                                                        src={locationImagePreview}
                                                        alt="Location preview"
                                                        fill
                                                        className="object-cover rounded-lg"
                                                      />
                                                      <button
                                                        onClick={e => {
                                                          e.stopPropagation();
                                                          setLocationImage(null);
                                                          setLocationImagePreview("");
                                                        }}
                                                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                                      >
                                                        ×
                                                      </button>
                                                    </div>
                                                  ) : (
                                                    <>
                                                      <span className="text-2xl">+</span>
                                                      <p className="mt-2 text-[0.729vw] font-[600] text-[#696A6A]">Upload location image</p>
                                                      <p className="mt-1 text-[0.625vw] text-[#696A6A]">*Must be PNG or JPG</p>
                                                      <p className="mt-1 text-[0.625vw] text-[#696A6A]">*Maximum file size: 10MB</p>
                                                    </>
                                                  )}
                                                </div>
                                                <button 
                                                    type="button"
                                                    className="border border-[#CDCECE] text-[#343535] text-[0.938vw] w-[5vw] rounded-[0.833vw] font-[500] p-2"
                                                    onClick={() => fileInputRefs.locationImage.current?.click()}
                                                >
                                                    Upload
                                                </button>
                                                <input
                                                  type="file"
                                                  ref={fileInputRefs.locationImage}
                                                  className="hidden"
                                                  accept="image/png,image/jpeg"
                                                  onChange={e => handleFileChange(e, setLocationImage, setLocationImagePreview)}
                                                />
                                              </div>
                                            </div>

                                            {/* Drivers */}
                                            <div>
                                              <div className="flex justify-between items-center mb-4">
                                                <h4 className="font-[600] text-[1.2vw] w-[15vw]">Drivers</h4>
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    setIsModalOpen(true);
                                                    setIsEditingDriver(false);
                                                    setEditingDriverIndex(null);
                                                    setDriverName("");
                                                    setNzfssRR("");
                                                    setIpssRR("");
                                                    setDriverImage(null);
                                                    setDriverImagePreview("");
                                                  }}
                                                  className="px-4 py-2 bg-white border border-[#CDCECE] text-black hover:bg-gray-200 rounded-lg"
                                                >
                                                  Add New Driver
                                                </button>
                                              </div>
                                              {drivers.length > 0 ? (
                                                <div className="bg-white rounded-[0.625vw] overflow-hidden border border-[#CDCECE]">
                                                  <table className="w-full">
                                                    <thead className="bg-black text-white">
                                                      <tr>
                                                        <th className="p-4 text-left text-[0.938vw] font-[500]">Image</th>
                                                        <th className="p-4 text-left text-[0.938vw] font-[500]">Name</th>
                                                        <th className="p-4 text-left text-[0.938vw] font-[500]">NZFSS RR</th>
                                                        <th className="p-4 text-left text-[0.938vw] font-[500]">IFSS RR</th>
                                                        <th className="p-4 text-left text-[0.938vw] font-[500]">Action</th>
                                                      </tr>
                                                    </thead>
                                                    <tbody>
                                                      {drivers.map((driver, i) => (
                                                        <tr key={i} className="border-b border-[#CDCECE]">
                                                          <td className="p-4">
                                                            <div className="relative w-[2.5vw] h-[2.5vw] rounded-full overflow-hidden">
                                                              {driver.image ? (
                                                                <Image
                                                                  src={driver.image}
                                                                  alt={driver.name}
                                                                  width={40}
                                                                  height={40}
                                                                  className="object-cover w-full h-full rounded-full"
                                                                />
                                                              ) : (
                                                                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                                                  <User className="w-4 h-4 text-gray-400" />
                                                                </div>
                                                              )}
                                                            </div>
                                                          </td>
                                                          <td className="p-4 text-[0.938vw]">{driver.name || 'N/A'}</td>
                                                          <td className="p-4 text-[0.938vw]">{driver.nzfssRR || 'N/A'}</td>
                                                          <td className="p-4 text-[0.938vw]">{driver.ipssRR || 'N/A'}</td>
                                                          <td className="p-4">
                                                            <div className="flex gap-2">
                                                              <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                  e.preventDefault();
                                                                  e.stopPropagation();
                                                                  setIsEditingDriver(true);
                                                                  setEditingDriverIndex(i);
                                                                  setDriverName(driver.name || "");
                                                                  setNzfssRR(driver.nzfssRR || "");
                                                                  setIpssRR(driver.ipssRR || "");
                                                                  setDriverImagePreview(driver.image || "");
                                                                  setIsModalOpen(true);
                                                                }}
                                                                className="p-1 rounded hover:bg-gray-200 cursor-pointer"
                                                              >
                                                                <Pencil className="w-4 h-4 text-[#323232]" />
                                                              </button>
                                                              <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                  e.preventDefault();
                                                                  e.stopPropagation();
                                                                  // Create a new array without the deleted driver
                                                                  const updatedDrivers = drivers.filter((_, index) => index !== i);
                                                                  setDrivers(updatedDrivers);
                                                                  
                                                                  toast({
                                                                      title: "Success",
                                                                      description: "Driver removed successfully",
                                                                  });
                                                                }}
                                                                className="p-1 rounded hover:bg-gray-200 cursor-pointer"
                                                              >
                                                                <Trash2 className="w-4 h-4 text-[#323232]" />
                                                              </button>
                                                            </div>
                                                          </td>
                                                        </tr>
                                                      ))}
                                                    </tbody>
                                                  </table>
                                                </div>
                                              ) : (
                                                <div className="bg-white rounded-[0.625vw] overflow-hidden border border-[#CDCECE] p-4">
                                                  <p>No drivers added yet. Click "Add New" to add drivers.</p>
                                                </div>
                                              )}
                                            </div>
                                        </div>

                                        {/* Save Button with loading spinner */}
                                        <div className="pt-6">
                                            <button 
                                                type="submit"
                                                className="bg-white border border-[#CDCECE] text-black hover:bg-black text-[0.938vw] hover:text-white px-6 py-2 rounded-lg flex items-center justify-center min-w-[120px]"
                                                disabled={createLoading || updateLoading}
                                            >
                                                {(createLoading || updateLoading) ? (
                                                    <>
                                                        <Spinner />
                                                        Saving...
                                                    </>
                                                ) : (
                                                    "Save Detail"
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-[400px]">
                        <div className="flex justify-between items-center mb-2">
                            <h2 className="block text-[#000000] font-[600] text-[1.458vw]">{isEditingDriver ? "Edit Driver" : "Add a New Driver"}</h2>
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-500 text-[2vw] hover:text-gray-700"
                            >
                                ×
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div className="flex flex-col items-start mb-4">
                                <div 
                                    className="w-24 h-24 bg-gray-100 bg-white border border-[#0000001A] rounded-full flex items-center justify-center mb-2 cursor-pointer"
                                    onClick={() => fileInputRefs.driverImage.current?.click()}
                                >
                                    {driverImagePreview ? (
                                        <Image 
                                            src={driverImagePreview} 
                                            alt="Driver preview" 
                                            width={96}
                                            height={96}
                                            className="rounded-full object-cover w-full h-full"
                                        />
                                    ) : (
                                        <User size={40} className="text-gray-400" />
                                    )}
                                </div>
                                <p className="mt-2 text-[0.729vw] font-[600] text-[#696A6A]">* Recommended photo ratio: 1:1 (square)</p>
                                <input
                                    type="file"
                                    ref={fileInputRefs.driverImage}
                                    className="hidden"
                                    accept="image/png,image/jpeg"
                                    onChange={(e) => handleFileChange(e, setDriverImage, setDriverImagePreview)}
                                />
                                <button 
                                    className="border border-[#CDCECE] text-[#343535] text-[0.938vw] w-[5vw] rounded-[0.833vw] font-[500] p-2"
                                    onClick={() => fileInputRefs.driverImage.current?.click()}
                                >
                                    Upload
                                </button>
                            </div>

                            <div>
                                <label className="block text-[#000000] font-[600] text-[0.938vw]">Driver Name</label>
                                <input 
                                    type="text"
                                    className="w-full p-2 border rounded-lg bg-white p-2 rounded-[0.625vw] border-[#CDCECE]"
                                    placeholder="Enter driver name"
                                    value={driverName}
                                    onChange={(e) => setDriverName(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-[#000000] font-[600] text-[0.938vw]">NZFSS RR</label>
                                <input 
                                    type="text"
                                    className="w-full p-2 border rounded-lg bg-white p-2 rounded-[0.625vw] border-[#CDCECE]"
                                    placeholder="Enter NZFSS RR"
                                    value={nzfssRR}
                                    onChange={(e) => setNzfssRR(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-[#000000] font-[600] text-[0.938vw]">IFSS Registration</label>
                                <input 
                                    type="text"
                                    className="w-full p-2 border rounded-lg bg-white p-2 rounded-[0.625vw] border-[#CDCECE]"
                                    placeholder="Enter IFSS Registration"
                                    value={ipssRR}
                                    onChange={(e) => setIpssRR(e.target.value)}
                                />
                            </div>

                            <div className="flex gap-2 pt-4">
                                <button 
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-4 py-2 border rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="button"
                                    onClick={async () => {
                                        if (!driverName?.trim()) {
                                            toast({
                                                title: "Error",
                                                description: "Driver name is required",
                                                variant: "destructive",
                                            });
                                            return;
                                        }

                                        try {
                                            let driverImageBase64 = driverImagePreview;
                                            if (driverImage) {
                                                try {
                                                    driverImageBase64 = await convertFileToBase64(driverImage);
                                                } catch (error) {
                                                    toast({ 
                                                        title: "Error", 
                                                        description: "Error processing driver image.", 
                                                        variant: "destructive" 
                                                    });
                                                    return;
                                                }
                                            }

                                            const driverData = {
                                                name: driverName.trim(),
                                                image: driverImageBase64 || "",
                                                nzfssRR: nzfssRR?.trim() || "",
                                                ipssRR: ipssRR?.trim() || ""
                                            };

                                            // Create a new array to ensure state update triggers re-render
                                            const updatedDrivers = [...drivers];
                                            
                                            if (isEditingDriver && editingDriverIndex !== null) {
                                                // Update existing driver
                                                updatedDrivers[editingDriverIndex] = driverData;
                                            } else {
                                                // Add new driver
                                                updatedDrivers.push(driverData);
                                            }

                                            // Update state with new array
                                            setDrivers(updatedDrivers);

                                            // Reset form state
                                            setIsModalOpen(false);
                                            setIsEditingDriver(false);
                                            setEditingDriverIndex(null);
                                            setDriverName("");
                                            setNzfssRR("");
                                            setIpssRR("");
                                            setDriverImage(null);
                                            setDriverImagePreview("");

                                            // Show success message
                                            toast({
                                                title: "Success",
                                                description: isEditingDriver ? "Driver updated successfully" : "Driver added successfully",
                                            });
                                        } catch (error) {
                                            console.error("Error updating driver:", error);
                                            toast({
                                                title: "Error",
                                                description: "Failed to update driver. Please try again.",
                                                variant: "destructive",
                                            });
                                        }
                                    }}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    {isEditingDriver ? "Save Changes" : "Add Driver"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ManageClub;
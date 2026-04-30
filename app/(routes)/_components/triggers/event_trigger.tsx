import { date_icon, loadingAnimate, pdf, plus, trash, trashDis } from "@/assets";
import { DatePicker } from "@/components/date_picker";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GET_ALL_CLUBS } from "@/graphql/query/clubs";
import { useToast } from "@/hooks/use-toast";
import { CreateEventCalendarInput, useEvent } from "@/service/eventService";
import { getBase64 } from "@/utils/upload";
import { useQuery, useApolloClient, gql } from "@apollo/client";
import { LoaderCircle, Trash, Trash2 } from "lucide-react";
import Image from "next/image";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { Club } from "@/redux/features/club-slice";
import { usePathname } from "next/navigation";
import { notification } from "@/assets";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { useEvent as useEventContext } from "@/context/event_context";
import { CalendarIcon, Upload, X } from "lucide-react";

const GET_CURRENT_USER = gql`
  query GetCurrentUser {
    getCurrentUser {
      _id
      name
      email
      role
    }
  }
`;

// Image resizing utility function
const resizeAndCompressImage = (file: File, maxWidth = 3000, maxHeight = 3000, quality = 0.9): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      if (!event.target?.result) {
        reject(new Error("Failed to read file"));
        return;
      }
      
      // Create image element with proper typing
      const img = document.createElement('img');
      img.src = event.target.result as string;
      
      img.onload = () => {
        // Create a canvas to resize the image
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        
        // Calculate new dimensions while maintaining aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round(height * (maxWidth / width));
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round(width * (maxHeight / height));
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw resized image to canvas
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to data URL with compression for JPEG
        const isJpeg = file.type.includes("jpeg") || file.type.includes("jpg");
        const outputType = isJpeg ? "image/jpeg" : file.type;
        
        // Adjust quality based on file size - larger files get better quality
        let outputQuality = quality;
        if (file.size < 2 * 1024 * 1024) { // Less than 2MB
          outputQuality = 0.9;
        } else if (file.size < 5 * 1024 * 1024) { // Less than 5MB
          outputQuality = 0.92;
        } else { // 5MB or larger
          outputQuality = 0.95;
        }
        
        const dataUrl = canvas.toDataURL(outputType, outputQuality);
        resolve(dataUrl);
      };
      
      img.onerror = () => {
        reject(new Error("Failed to load image"));
      };
    };
    
    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };
  });
};

interface EventTriggerProps {
  onClose: (value: boolean) => void;
  open: boolean;
}

const EventTrigger = ({ onClose, open}: EventTriggerProps) => {
  const client = useApolloClient();
  // const [isOpen, setIsOpen] = useState(open);

  const [selectedFileName, setSelectedFileName] = useState<string>();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [eventDocsFileBase64, setEventDocsBase64] = useState<string>();

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [photoFileBase64, setPhotoBase64] = useState<string>();
  const [link, setLink] = useState<string>("");
  const [uploadComplete, setUploadComplete] = useState(false);
  const [uploadLogoComplete, setUploadLogoComplete] = useState(false);
  const [imagePhotoSizeLimit, setImagePhotoSizeLimit] = useState(false);
  const [imageSizeLimit, setImageSizeLimit] = useState(false);
  const [selectedClub, setSelectedClub] = useState<string | undefined>();
  const [selectedClubName, setSelectedClubName] = useState<
    string | undefined
  >();
  const [preferredDate, setPreferredDate] = useState<Date>();
  const [alternativeDate, setAlternativeDate] = useState<Date>();
  const [region, setRegion] = useState<string>();
  const [type, setType] = useState<string>();
  const [eventName, setEventName] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const pathName = usePathname();
  const { data, refetch: refetchClubs } = useQuery(GET_ALL_CLUBS, {
    fetchPolicy: "no-cache" // Completely bypass cache
  });
  const { data: currentClub, refetch: refetchCurrentUser } = useQuery(GET_CURRENT_USER, {
    fetchPolicy: "no-cache" // Completely bypass cache
  });

  // Add state to track if we need to reload
  const [needsReload, setNeedsReload] = useState(false);

  // Add validation states
  const [errors, setErrors] = useState<{
    eventName?: string;
    photo?: string;
    preferredDate?: string;
    alternativeDate?: string;
    region?: string;
    type?: string;
    formEntry?: string;
  }>({});

  // Add useEffect to handle dialog open/close and force reload if needed
  useEffect(() => {
    if (open) {
      // Reset form
      resetForm();
      
      // Check if club data is stale by comparing with localStorage
      const lastClubId = localStorage.getItem("currentClubId");
      const currentClubId = currentClub?.getCurrentUser?._id;
      
      if (lastClubId !== currentClubId) {
        // Club has changed, force a window reload
        window.location.reload();
      } else {
        // Just refetch data
        Promise.all([
          refetchCurrentUser(),
          refetchClubs()
        ]).catch(error => {
          console.error("Error refreshing data:", error);
          toast({
            variant: "destructive",
            description: "Error refreshing club data"
          });
        });
      }
    }
  }, [open, currentClub?.getCurrentUser?._id]);

  // Update localStorage when club changes
  useEffect(() => {
    if (currentClub?.getCurrentUser?._id) {
      localStorage.setItem("currentClubId", currentClub.getCurrentUser._id);
    }
  }, [currentClub?.getCurrentUser?._id]);

  const formattedPreferredDate = preferredDate
    ? format(preferredDate, "yyyy-MM-dd")
    : undefined;
  const formattedAlternativeDate = alternativeDate
    ? format(alternativeDate, "yyyy-MM-dd")
    : undefined;

  const { toast } = useToast();
  const { addEvent, error } = useEvent();

  const handleClickPhoto = () => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    // Support all image formats, especially JPG/JPEG
    fileInput.accept = "image/jpeg,image/jpg,image/png,image/gif,image/webp,image/bmp,image/*";

    fileInput.addEventListener("change", (e: Event) => handleImageSelect(e));
    fileInput.click();
  };

  const handleClubChange = (value: string) => {
    setSelectedClub(value);
    // Find the selected club by ID and get its name
    const selectedClub = data?.getAllClubs.find(
      (club: Club) => club._id === value
    );
    if (selectedClub) {
      setSelectedClubName(selectedClub.name); // Store the club's name
    }
  };

  const handleRegionChange = (value: string) => {
    setRegion(value);
  };
  const handleTypeChange = (value: string) => {
    setType(value);
  };

  const handleImageSelect = (e: Event) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file) {
      console.log(`Processing image: ${file.name}, type: ${file.type}, size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
      
      const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB in bytes
      if (file.size > MAX_FILE_SIZE) {
        setUploadError(`Image size exceeds the maximum limit of 50MB. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
        toast({
          variant: "destructive",
          description: `Image size exceeds the maximum limit of 50MB. Please select a smaller image or compress it.`,
        });
        return;
      }
      
      setImagePhotoSizeLimit(false);
      setUploadError(null);
      setUploadLogoComplete(false);
      setIsUploading(true);

      // Only resize extremely large images (30MB+) or JPEG images over 20MB
      const isExtremelyLarge = file.size > 30 * 1024 * 1024; // > 30MB
      const isLargeJpeg = (file.type.includes("jpeg") || file.type.includes("jpg")) && file.size > 20 * 1024 * 1024;
      
      if (isExtremelyLarge || isLargeJpeg) {
        // Only use resizing for extremely large images
        console.log("Image is very large, applying compression and resizing");
        resizeAndCompressImage(file)
          .then(resizedDataUrl => {
            setPhotoBase64(resizedDataUrl);
            setSelectedImage(URL.createObjectURL(file)); // Keep original for preview
            setUploadLogoComplete(true);
            setIsUploading(false);
            toast({
              description: "Photo uploaded successfully",
            });
          })
          .catch(error => {
            console.error("Error processing image:", error);
            setIsUploading(false);
            setUploadError("Failed to process image. Please try a different image.");
            toast({
              variant: "destructive",
              description: "Failed to process image. Please try a different image.",
            });
          });
      } else {
        // For most images, use direct FileReader approach without resizing
        const reader = new FileReader();
        
        reader.onloadend = () => {
          setIsUploading(false);
          if (reader.result) {
            try {
              // Store the base64 string directly without processing
              setPhotoBase64(reader.result as string);
              // Create object URL for preview
              setSelectedImage(URL.createObjectURL(file));
              setUploadLogoComplete(true);
              toast({
                description: "Photo uploaded successfully",
              });
            } catch (error) {
              console.error("Error processing image:", error);
              setUploadError("Failed to process image. Please try a different image.");
              toast({
                variant: "destructive",
                description: "Failed to process image. Please try a different image.",
              });
            }
          } else {
            setUploadError("Failed to upload photo. Please try again with a smaller image or different format.");
            toast({
              variant: "destructive",
              description: "Failed to upload photo. Please try again with a smaller image or different format.",
            });
          }
        };
        
        reader.onerror = () => {
          setIsUploading(false);
          setUploadError("Failed to read image file. Please try again.");
          toast({
            variant: "destructive",
            description: "Failed to read image file. Please try again.",
          });
        };
        
        // Read the image file as a data URL (base64)
        reader.readAsDataURL(file);
      }
    }
  };

  const handleDeletePhoto = () => {
    setSelectedImage(null); // Reset the image selection
    setUploadLogoComplete(false); // Reset upload completion
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleDocUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const { files } = e.target;
    if (files && files[0]) {
      const file = files[0];
      console.log(`Processing document: ${file.name}, type: ${file.type}, size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
      
      // Set maximum file size to 10MB
      const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
      if (file.size > MAX_FILE_SIZE) {
        setUploadError(`Document size exceeds the maximum limit of 10MB. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
        toast({
          variant: "destructive",
          description: "File size exceeds the maximum limit of 10MB. Please select a smaller file.",
        });
        return;
      }
      
      // Store the file name
      setSelectedFileName(file.name);
      setImageSizeLimit(false);
      setUploadError(null);
      setUploadComplete(false);
      setIsUploading(true);

      // Direct file to base64 conversion using FileReader
      const reader = new FileReader();
      
      reader.onloadend = () => {
        setIsUploading(false);
        if (reader.result) {
          try {
            // Store the base64 string
            setEventDocsBase64(reader.result as string);
            setUploadComplete(true);
            toast({
              description: "Document uploaded successfully",
            });
          } catch (error) {
            console.error("Error processing document:", error);
            setUploadError("Failed to process document. Please try a different file.");
            toast({
              variant: "destructive",
              description: "Failed to process document. Please try a different file.",
            });
          }
        } else {
          setUploadError("Failed to upload document. Please try again with a smaller file or different format.");
          toast({
            variant: "destructive",
            description: "Failed to upload document. Please try again with a smaller file or different format.",
          });
        }
      };
      
      reader.onerror = () => {
        setIsUploading(false);
        setUploadError("Failed to read document file. Please try again.");
        toast({
          variant: "destructive",
          description: "Failed to read document file. Please try again.",
        });
      };
      
      // Read the document file as a data URL (base64)
      reader.readAsDataURL(file);
    }
  };

  const handleDelete = () => {
    // Clear the Base64 data and the file name
    setEventDocsBase64("");
    setPhotoBase64("");
    setSelectedFileName("");
    setUploadComplete(false);

    // Manually trigger file input again by clicking it after deletion
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Add validation function
  const validateForm = () => {
    const newErrors: typeof errors = {};
    const errorMessages: string[] = [];
    
    if (!eventName.trim()) {
      newErrors.eventName = "Event name is required";
      errorMessages.push("Event name is required");
    }
    
    // Photo is now optional - removed validation
    
    if (!preferredDate) {
      newErrors.preferredDate = "Preferred date is required";
      errorMessages.push("Preferred date is required");
    }
    
    if (!region) {
      newErrors.region = "Region is required";
      errorMessages.push("Region is required");
    }
    
    if (!type) {
      newErrors.type = "Event type is required";
      errorMessages.push("Event type is required");
    }
    
    // Check if dates are the same
    if (preferredDate && alternativeDate) {
      const prefDate = format(preferredDate, "yyyy-MM-dd");
      const altDate = format(alternativeDate, "yyyy-MM-dd");
      
      if (prefDate === altDate) {
        newErrors.alternativeDate = "Alternative date cannot be the same as preferred date";
        errorMessages.push("Alternative date cannot be the same as preferred date");
      }
    }
    
    setErrors(newErrors);

    // If there are errors, show them in a toast
    if (errorMessages.length > 0) {
      toast({
        variant: "destructive",
        description: errorMessages.join('\n'),
      });
      return false;
    }
    
    return true;
  };

  const resetForm = () => {
    setEventName("");
    setSelectedFileName("");
    setEventDocsBase64("");
    setPhotoBase64("");
    setUploadComplete(false);
    setUploadLogoComplete(false);
    setSelectedImage(null);
    setLink("");
    setSelectedClub(undefined);
    setSelectedClubName(undefined);
    setPreferredDate(undefined);
    setAlternativeDate(undefined);
    setRegion(undefined);
    setType(undefined);
    setErrors({}); // Reset errors

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form before submission
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);

    try {
      // Create a base object with required fields
      const eventData: any = {
        alternativeDate: formattedAlternativeDate || "",
        preferredDate: formattedPreferredDate || "",
        club: pathName === "/events" ? currentClub?.getCurrentUser?.name || "" : selectedClubName || "",
        eventName: eventName || "",
        photo: photoFileBase64 || "", // Photo is now optional
        type: type === "Sanctioned" ? "Sanctioned" : type || "",
        region: region || "",
        clubId: pathName === "/events" ? currentClub?.getCurrentUser?._id || "" : selectedClub || "",
        eventDate: formattedPreferredDate || "",
        date: false,
        public: false,
        isSubmitted: pathName === "/events" ? false : true,
        status: type === "Sanctioned" ? "Approve" : "Pending",
        result: false,
        NZFSSSanctioning: type === "Sanctioned" ? true : false,
      };
      
      // Log fields to verify values
      console.log("Event type:", type);
      console.log("Setting NZFSSSanctioning to:", eventData.NZFSSSanctioning);

      // Only add entryForm and fileName if a file was uploaded
      if (eventDocsFileBase64 && selectedFileName) {
        eventData.entryForm = eventDocsFileBase64;
        eventData.fileName = selectedFileName;
      } 
      // Only add website if a link was provided
      else if (link) {
        eventData.website = link;
      }

      const { data } = await addEvent(eventData);

      if (!data) {
        toast({
          variant: "destructive",
          description: "Failed to add event. Please try again.",
        });
        return;
      }

      // Reset form state on success
      resetForm();
      onClose(false);
      
      toast({
        description: "Event added successfully!",
      });

    } catch (error) {
      let errorMessage = "Failed to add event. ";
      
      // Add more specific error handling if possible
      if (error instanceof Error) {
        errorMessage += error.message;
      } else {
        errorMessage += "Please check your input and try again.";
      }
      
      toast({
        variant: "destructive",
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Set the loader to be visible when value1 or value2 changes
    setShowLoader(true);

    // Hide the loader after 3 seconds (3000 milliseconds)
    const timer = setTimeout(() => {
      setShowLoader(false);
    }, 3000);

    // Cleanup the timer when the component unmounts or values change
    return () => clearTimeout(timer);
  }, [pathName]);

  return (
    <div>
      <Dialog open={open} onOpenChange={(isOpen) => {
        onClose(isOpen);
        if (!isOpen) {
          resetForm();
        }
      }}>
        
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Add a New Event</DialogTitle>
            <DialogDescription>
              Please enter the new Event information
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit}>
            <div className=" flex flex-col  gap-4 py-4">
              <div className=" flex flex-col gap-y-2 gap-4">
                <Label
                  htmlFor="name"
                  className="text-left font-[600] text-[16px] 3xl:text-[18px]"
                >
                  Event Name
                </Label>
                <Input
                  type="text"
                  id="name"
                  placeholder="Enter Name "
                  className={`bg-white py-[20.5px] px-[16px] outline-none rounded-[12px] ${
                    errors.eventName ? "border-red-500" : ""
                  }`}
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                />
              </div>

              <div className=" flex flex-col gap-y-2 gap-4">
                <Label
                  htmlFor="amended_date"
                  className="text-left font-[600] text-[16px] 3xl:text-[18px]"
                >
                  Upload Photo (Optional)
                  <span className="text-[12px] leading-[16.8px] font-[400]">
                    (JPG, JPEG, PNG and other image formats supported, max 50MB)
                  </span>
                </Label>
                {uploadError && (
                  <p className="text-red-500 text-sm">{uploadError}</p>
                )}
                {!uploadLogoComplete && (
                  <div
                    onClick={handleClickPhoto}
                    className="cursor-pointer flex flex-col items-center justify-center w-full rounded-[12px] border border-[#C6CED6] border-dashed h-[80px] 3xl:h-[90px]"
                  >
                    {isUploading ? (
                      <div className="flex flex-col items-center">
                        <LoaderCircle className="animate-spin h-6 w-6 mb-2" />
                        <p className="text-sm text-gray-500">Uploading...</p>
                      </div>
                    ) : (
                      <>
                        <Image width={64} height={44} src={plus} alt="plus icon" />
                        <p className="text-sm text-gray-500 mt-2">Click to upload an image (max 50MB)</p>
                      </>
                    )}
                  </div>
                )}

                {uploadLogoComplete && (
                  <div className="">
                    {selectedImage && (
                      <div className="flex gap-x-[11.14px]">
                        <Image
                          src={selectedImage}
                          alt="Selected"
                          className="w-[81px] h-[52px] rounded-[8px] object-cover"
                          width={81}
                          height={52}
                        />

                        <Image
                          onClick={handleDeletePhoto}
                          src={trashDis}
                          alt="trash icon"
                          className="cursor-pointer"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-6 gap-x-[25px]">
                <div className="col-span-3">
                  <div className="flex flex-col gap-y-[12px]">
                    <Label
                      htmlFor=""
                      className="text-left font-[600] text-[16px] 3xl:text-[18px]"
                    >
                      Enter Club
                    </Label>
                    <Input
                      type="text"
                      value={currentClub?.getCurrentUser?.name || ""}
                      className="bg-white py-[20.5px] px-[16px] outline-none rounded-[12px]"
                      readOnly
                    />
                  </div>
                </div>

                <div className="col-span-3 grid grid-cols-2 gap-x-[15px]">
                  <div className="flex flex-col gap-y-[12px]">
                    <Label
                      htmlFor=""
                      className="text-left font-[600] text-[16px] 3xl:text-[18px]"
                    >
                      Preferred Date
                    </Label>

                    <div className="relative">
                      <DatePicker date={preferredDate} setDate={setPreferredDate} />
                      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 pointer-events-none z-10">
                        <Image src={date_icon} alt="calendar" width={20} height={20} />
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-y-[12px]">
                    <Label
                      htmlFor=""
                      className="text-left font-[600] text-[16px] 3xl:text-[18px]"
                    >
                      Alternative Date
                    </Label>

                    <div className="relative">
                      <DatePicker date={alternativeDate} setDate={setAlternativeDate} />
                      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 pointer-events-none z-10">
                        <Image src={date_icon} alt="calendar" width={20} height={20} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-x-[25px] w-full">
                <div className="w-full flex flex-col gap-y-[12px]">
                  <Label
                    htmlFor=""
                    className="text-left font-[600] text-[16px] 3xl:text-[18px]"
                  >
                    Select Region
                  </Label>
                  <Select value={region} onValueChange={handleRegionChange}>
                    <SelectTrigger className={`w-full py-[20.5px] px-[16px] outline-none bg-white ${
                      errors.region ? "border-red-500" : ""
                    }`}>
                      <SelectValue
                        placeholder="Select region"
                        className="text-[#696A6A]"
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Regions</SelectLabel>
                        <SelectItem value="North">North</SelectItem>
                        <SelectItem value="South">South</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-full flex flex-col gap-y-[12px]">
                  <Label
                    htmlFor=""
                    className="text-left font-[600] text-[16px] 3xl:text-[18px]"
                  >
                    Type
                  </Label>
                  <Select value={type} onValueChange={handleTypeChange}>
                    <SelectTrigger className={`w-full py-[20.5px] px-[16px] outline-none bg-white ${
                      errors.type ? "border-red-500" : ""
                    }`}>
                      <SelectValue
                        placeholder="Select type"
                        className="text-[#696A6A]"
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Types</SelectLabel>
                        <SelectItem value="sanctioning applied">
                          sanctioning applied
                        </SelectItem>
                        <SelectItem value="unsanctioned">
                          unsanctioned
                        </SelectItem>
                        <SelectItem value="Sanctioned">
                          Sanctioned
                        </SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className=" flex flex-col gap-y-2 gap-4">
                <Label
                  htmlFor="amended_date"
                  className="text-left font-[600] text-[16px] 3xl:text-[18px]"
                >
                  Upload entry form
                  <span className="text-[12px] leading-[16.8px] font-[400]">
                    (PDF and other document formats, max 10MB)
                  </span>
                </Label>

                {!uploadComplete && (
                  <div
                    onClick={handleClick}
                    className="cursor-pointer flex flex-col items-center justify-center w-full rounded-[12px] border border-[#C6CED6] border-dashed h-[80px] 3xl:h-[90px]"
                  >
                    {isUploading ? (
                      <div className="flex flex-col items-center">
                        <LoaderCircle className="animate-spin h-6 w-6 mb-2" />
                        <p className="text-sm text-gray-500">Uploading...</p>
                      </div>
                    ) : (
                      <>
                        <Image width={64} height={44} src={plus} alt="plus icon" />
                        <p className="text-sm text-gray-500 mt-2">Click to upload a document (max 10MB)</p>
                      </>
                    )}
                  </div>
                )}

                {uploadComplete && (
                  <div className="w-full border-dashed border-2 h-[64px] rounded-[12px] flex flex-col relative py-[4.5px]">
                    <Image
                      src={pdf}
                      alt="pdf icon"
                      className="absolute left-[14.4px] top-5"
                    />
                    <div className="flex flex-col gap-y-[4px] px-[56px]">
                      <p className="font-[600] text-[1rem] leading-[20.8px]">
                        {selectedFileName}
                      </p>
                      <p className="font-[500] text-[12px] leading-[14.4px]">
                        Completed
                      </p>
                    </div>
                    <Image
                      onClick={handleDelete}
                      src={trash}
                      alt="trash icon"
                      className="absolute right-[14.4px] top-5"
                    />
                  </div>
                )}

                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: "none" }} // Hide the file input element
                  onChange={handleDocUpload} // Handle file selection
                />
              </div>

              <div className=" flex flex-col gap-y-2 gap-4">
                <Label
                  htmlFor="name"
                  className="text-left font-[600] text-[16px] 3xl:text-[18px]"
                >
                  Paste form link
                </Label>
                <Input
                  type="text"
                  id="link"
                  placeholder="Enter link "
                  className="bg-white h-[42px] 3xl:h-[52px] px-[16px] outline-none rounded-[12px]"
                  onChange={(e) => setLink(e.target.value)}
                  value={link}
                />
              </div>
            </div>

            <DialogFooter>
              <div className="flex justify-between items-center w-full gap-x-4">
                <Button
                  size={"lg"}
                  variant="outline"
                  className="instant-anim w-full h-[56px] font-[600] text-[18px] rounded-[16px]"
                  type="button"
                  onClick={() => onClose(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  className="instant-anim w-full h-[56px] font-[600] text-[18px] rounded-[16px]"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "Adding..." : "Add"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EventTrigger;

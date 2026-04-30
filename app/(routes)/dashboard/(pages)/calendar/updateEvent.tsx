import { date_icon, pdf, plus, trash, trashDis } from "@/assets";
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
import { useQuery } from "@apollo/client";
import { Trash, Trash2 } from "lucide-react";
import Image from "next/image";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { Club } from "@/redux/features/club-slice";
import { usePathname } from "next/navigation";
import { CURRENT_USER } from "@/graphql/query/users";

interface UpdateEventTriggerProps {
    open: boolean;
    onClose: () => void;
    event: any;
  }
const UpdateEvent = ({ open, onClose, event }: UpdateEventTriggerProps) => {
  const [selectedFileName, setSelectedFileName] = useState<string | undefined>();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [eventDocsFileBase64, setEventDocsBase64] = useState<string | undefined>();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [photoFileBase64, setPhotoBase64] = useState<string | undefined>();
  const [photoDeleted, setPhotoDeleted] = useState<boolean>(false);
  const [link, setLink] = useState<string>("");
  const [uploadComplete, setUploadComplete] = useState<boolean>(false);
  const [uploadLogoComplete, setUploadLogoComplete] = useState<boolean>(false);
  const [isProcessingNewImage, setIsProcessingNewImage] = useState<boolean>(false);
  const [imagePhotoSizeLimit, setImagePhotoSizeLimit] = useState(false);
  const [imageSizeLimit, setImageSizeLimit] = useState(false);
  const [selectedClub, setSelectedClub] = useState<string | undefined>();
  const [selectedClubName, setSelectedClubName] = useState<string | undefined>();
  const [preferredDate, setPreferredDate] = useState<Date>(new Date());
  const [alternativeDate, setAlternativeDate] = useState<Date>(new Date());
  const [region, setRegion] = useState<string>("");
  const [type, setType] = useState<string>("");
  const [eventName, setEventName] = useState<string>("");

  const pathName = usePathname();
  const { data } = useQuery(GET_ALL_CLUBS);
  const { data: currentClub } = useQuery(CURRENT_USER);

  // Helper function to check if image URL is from AWS S3
  const isAwsS3Url = (url: string): boolean => {
    if (!url || typeof url !== 'string') return false;
    
    // Check for AWS S3 URL patterns
    const s3Patterns = [
      /^https:\/\/.*\.s3\..*\.amazonaws\.com\//,
      /^https:\/\/s3\..*\.amazonaws\.com\//,
      /^https:\/\/.*\.s3\.amazonaws\.com\//,
    ];
    
    return s3Patterns.some(pattern => pattern.test(url));
  };

  // Initialize form data when component mounts or event changes
  useEffect(() => {
    if (event) {
      setEventName(event.eventName || "");
      setSelectedClub(event.clubId || "");
      setSelectedClubName(event.club || "");
      setRegion(event.region || "");
      setType(event.type || "");
      setLink(event.website || "");
      
      // Handle dates
      if (event.preferredDate) {
        setPreferredDate(new Date(event.preferredDate));
      }
      if (event.alternativeDate) {
        setAlternativeDate(new Date(event.alternativeDate));
      }

      // Handle PDF file
      if (event.entryForm) {
        setEventDocsBase64(event.entryForm);
        setSelectedFileName(event.fileName || "file.pdf");
        setUploadComplete(true);
      } else {
        setEventDocsBase64(undefined);
        setSelectedFileName(undefined);
        setUploadComplete(false);
      }

      // Handle photo - only show if it's from AWS S3 and not explicitly deleted
      if (event.photo && isAwsS3Url(event.photo) && !photoDeleted) {
        setSelectedImage(event.photo);
        setPhotoBase64(undefined);
        setUploadLogoComplete(true);
      } else if (!photoDeleted) {
        // Only reset image state if photo wasn't explicitly deleted
        setSelectedImage(null);
        setPhotoBase64(undefined);
        setUploadLogoComplete(false);
      }
    }
  }, [event, photoDeleted]);

  const formattedPreferredDate = preferredDate
    ? format(preferredDate, "yyyy-MM-dd")
    : undefined;
  const formattedAlternativeDate = alternativeDate
    ? format(alternativeDate, "yyyy-MM-dd")
    : undefined;

  const { toast } = useToast();
  const { updateEvent, loading, error } = useEvent();

  const handleClickPhoto = () => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";

    // Cast the onchange handler as an event listener
    fileInput.addEventListener("change", (e: Event) => handleImageSelect(e));

    fileInput.click();
  };

  const handleClubChange = (value: string) => {
    setSelectedClub(value);
    // Find the selected club by ID and get its name
    const selectedClub = data?.getAllClubs.find((club: Club) => club._id === value);
    if (selectedClub) {
      setSelectedClubName(selectedClub.name);  // Store the club's name
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
      const maxSize = 10 * 1024 * 1024; // 10MB
      const fileSize = file.size;

      if (fileSize && fileSize > maxSize) {
        setImagePhotoSizeLimit(true);
        toast({
          variant: "destructive",
          description: "Image size exceeds 10MB limit",
        });
        return;
      }
      setImagePhotoSizeLimit(false);

      // Clear all previous image state first
      setIsProcessingNewImage(true);
      setSelectedImage(null);
      setPhotoBase64(undefined);
      setUploadLogoComplete(false);
      setPhotoDeleted(false); // Reset deletion state when new image is selected

      // Ensure proper base64 format with data prefix for images
      const fileReader = new FileReader();
      fileReader.onload = () => {
        const result = fileReader.result as string;
        // Store the full base64 string with data prefix
        setPhotoBase64(result);
        setSelectedImage(result);
        setUploadLogoComplete(true);
        setIsProcessingNewImage(false);
      };
      fileReader.onerror = () => {
        setIsProcessingNewImage(false);
        toast({
          variant: "destructive",
          description: "Error reading image file",
        });
      };
      fileReader.readAsDataURL(file);
    }
  };

  const handleDeletePhoto = () => {
    // Clear all image-related state immediately
    setSelectedImage(null);
    setPhotoBase64(undefined);
    setUploadLogoComplete(false);
    setImagePhotoSizeLimit(false);
    setPhotoDeleted(true); // Mark that user wants to delete the existing photo
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleDocUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const { files } = e.target;
    if (files && files[0]) {
      const file = files[0];
      const maxSize = 10000 * 1024;
      const fileSize = file.size;

      setSelectedFileName(file.name);

      if (fileSize && fileSize > maxSize) {
        setImageSizeLimit(true);
        toast({
          variant: "destructive",
          description: "File size exceeds 10MB limit",
        });
        return;
      }
      setImageSizeLimit(false);
      setUploadComplete(false);

      // Ensure proper base64 format with data prefix for documents
      const fileReader = new FileReader();
      fileReader.onload = () => {
        const result = fileReader.result as string;
        // Store the full base64 string with data prefix
        setEventDocsBase64(result);
        setUploadComplete(true);
      };
      fileReader.readAsDataURL(file);
    }
  };

  const handleDelete = () => {
    // Clear the Base64 data and the file name
    setEventDocsBase64(undefined);
    setSelectedFileName(undefined);
    setUploadComplete(false);

    // Manually trigger file input again by clicking it after deletion
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const resetForm = () => {
    setEventName("");
    setSelectedFileName(undefined);
    setEventDocsBase64(undefined);
    setPhotoBase64(undefined);
    setPhotoDeleted(false);
    setUploadComplete(false);
    setUploadLogoComplete(false);
    setSelectedImage(null);
    setLink("");
    setSelectedClub(undefined);
    setSelectedClubName(undefined);
    setPreferredDate(new Date());
    setAlternativeDate(new Date());
    setRegion('');
    setType("");
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Create a wrapper function that only calls setPreferredDate if a valid Date is provided.
  const handlePreferredDateChange = (date?: Date): void => {
    if (date !== undefined) {
      setPreferredDate(date);
    }
  };

  // Wrapper function that only updates state if a valid Date is provided.
  const handleAlternativeDateChange = (date?: Date): void => {
    if (date !== undefined) {
      setAlternativeDate(date);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Create event data object with all fields to ensure complete update
    const updatedEventData: any = {
      eventName: eventName,
      club: selectedClubName,
      clubId: selectedClub,
      region: region,
      type: type,
      website: link,
      preferredDate: formattedPreferredDate,
      alternativeDate: formattedAlternativeDate,
      // Static data from existing event
      eventDate: event.eventDate,
      date: event.date,
      public: event.public,
      result: event.result,
    };

    // Conditionally include file data only if present (to avoid overwriting with undefined)
    if (eventDocsFileBase64) {
      // Ensure the base64 string has the proper prefix
      updatedEventData.entryForm = eventDocsFileBase64.startsWith('data:') 
        ? eventDocsFileBase64 
        : `data:application/pdf;base64,${eventDocsFileBase64}`;
    }
    
    if (selectedFileName) {
      updatedEventData.fileName = selectedFileName;
    }
    
    // Handle photo updates - ALWAYS include photo field to ensure proper server handling
    if (photoFileBase64) {
      // New photo was uploaded - ensure the base64 string has the proper prefix
      updatedEventData.photo = photoFileBase64.startsWith('data:') 
        ? photoFileBase64 
        : `data:image/jpeg;base64,${photoFileBase64}`;
    } else if (photoDeleted || (event.photo && !isAwsS3Url(event.photo))) {
      // If user deleted the photo OR if existing photo is not from AWS S3 (old MongoDB data), 
      // explicitly set it to null to remove it
      updatedEventData.photo = null;
    }
    // Don't include photo field at all if no changes - let server preserve existing value

    // Handle status and sanctioning based on type
    if (type === 'Sanctioned') {
      updatedEventData.status = 'Approve';
      updatedEventData.NZFSSSanctioning = true;
      updatedEventData.type = 'Sanctioned';
    } else if (type === 'sanctioning applied') {
      // Only change status if the type has actually changed
      if (event.type !== 'sanctioning applied') {
        updatedEventData.status = 'Approve';
      } else {
        // Preserve original status
        updatedEventData.status = event.status;
      }
      // Always preserve original sanctioning value
      updatedEventData.NZFSSSanctioning = event.NZFSSSanctioning;
    } else if (type === 'Unsanctioned') {
      // Only change status if the type has actually changed
      if (event.type !== 'Unsanctioned') {
        updatedEventData.status = 'Pending';
      } else {
        // Preserve original status
        updatedEventData.status = event.status;
      }
      // Always preserve original sanctioning value
      updatedEventData.NZFSSSanctioning = event.NZFSSSanctioning;
    } else {
      // If type is not changed or is empty, preserve existing values
      updatedEventData.status = event.status;
      updatedEventData.NZFSSSanctioning = event.NZFSSSanctioning;
    }

    // Update type based on NZFSSSanctioning status
    if (updatedEventData.NZFSSSanctioning === true) {
      updatedEventData.type = 'Sanctioned';
    }

    try {
      const { data } = await updateEvent(event._id, updatedEventData);
      toast({
        description: "Event updated successfully",
      });
      resetForm();
      onClose();
    } catch (error) {
      console.error('Update error:', error);
      toast({
        variant: "destructive",
        description: "Error updating Event: " + (error instanceof Error ? error.message : 'Unknown error'),
      });
    }
  };

  return (
    <div>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogTrigger>
          
        </DialogTrigger>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Update Event</DialogTitle>
            <DialogDescription>
              Update event information
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit}>
            <div className="flex flex-col gap-4 py-4">
              <div className="flex flex-col gap-y-2 gap-4">
                <Label
                  htmlFor="name"
                  className="text-left font-[600] text-[16px] 3xl:text-[18px]"
                >
                  Event Name
                </Label>
                <Input
                  type="text"
                  id="name"
                  placeholder="Enter Name"
                  className="bg-white py-[20.5px] px-[16px] outline-none rounded-[12px]"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-y-2 gap-4">
                <Label
                  htmlFor="photo"
                  className="text-left font-[600] text-[16px] 3xl:text-[18px]"
                >
                  Upload Photo{" "}
                  <span className="text-[12px] leading-[16.8px] font-[400]">
                    (Note: The image dimension should be 3:1 ratio)
                  </span>
                </Label>
                {!uploadLogoComplete && (
                  <div
                    onClick={handleClickPhoto}
                    className="cursor-pointer flex items-center justify-center w-full rounded-[12px] border border-[#C6CED6] border-dashed h-[42px] 3xl:h-[52px]"
                  >
                    <Image width={64} height={44} src={plus} alt="plus icon" />
                  </div>
                )}

                {uploadLogoComplete && selectedImage && !photoDeleted && (
                  <div className="">
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
                  </div>
                )}
              </div>

              <div className="grid grid-cols-4 gap-x-[25px]">
                <div className="col-span-2">
                  <div className="flex flex-col gap-y-[12px]">
                    <Label
                      htmlFor="club"
                      className="text-left font-[600] text-[16px] 3xl:text-[18px]"
                    >
                      Enter Club
                    </Label>
                    <Select
                      value={selectedClub}
                      onValueChange={handleClubChange}
                      disabled={pathName === "/events"}
                    >
                      <SelectTrigger className="w-full py-[20.5px] px-[16px] outline-none bg-white">
                        <SelectValue
                          placeholder={`${
                            pathName === "/events"
                              ? currentClub?.currentUser?.name
                              : "Select club"
                          }`}
                          className="text-[#696A6A]"
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Clubs</SelectLabel>
                          {/* Conditionally render clubs based on pathname */}
                          {pathName === "/events" ? (
                            // Use currentClub (single club data)
                            currentClub?.currentUser ? (
                              <SelectItem
                                key={currentClub.currentUser._id}
                                value={currentClub.currentUser._id}
                              >
                                {currentClub.currentUser?.name}
                              </SelectItem>
                            ) : null
                          ) : (
                            // Use data (list of clubs)
                            data?.getAllClubs?.map(
                              (club: { _id: string; name: string }) => (
                                <SelectItem key={club._id} value={club._id}>
                                  {club.name}
                                </SelectItem>
                              )
                            )
                          )}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex flex-col gap-y-[12px]">
                  <Label
                    htmlFor="preferredDate"
                    className="text-left font-[600] text-[16px] 3xl:text-[18px]"
                  >
                    Preferred Date
                  </Label>
                  <DatePicker date={preferredDate} setDate={handlePreferredDateChange} />
                </div>
                <div className="flex flex-col gap-y-[12px]">
                  <Label
                    htmlFor="alternativeDate"
                    className="text-left font-[600] text-[16px] 3xl:text-[18px]"
                  >
                    Alternative Date
                  </Label>
                  <DatePicker date={alternativeDate} setDate={handleAlternativeDateChange} />
                </div>
              </div>

              <div className="flex gap-x-[25px] w-full">
                <div className="w-full flex flex-col gap-y-[12px]">
                  <Label
                    htmlFor="region"
                    className="text-left font-[600] text-[16px] 3xl:text-[18px]"
                  >
                    Select Region
                  </Label>
                  <Select value={region} onValueChange={handleRegionChange}>
                    <SelectTrigger className="w-full py-[20.5px] px-[16px] outline-none bg-white">
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
                    htmlFor="type"
                    className="text-left font-[600] text-[16px] 3xl:text-[18px]"
                  >
                    Type
                  </Label>
                  <Select value={type} onValueChange={handleTypeChange}>
                    <SelectTrigger className="w-full py-[20.5px] px-[16px] outline-none bg-white">
                      <SelectValue
                        placeholder="Select type"
                        className="text-[#696A6A]"
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Types</SelectLabel>
                        <SelectItem value="sanctioning applied">
                          Sanctioning applied
                        </SelectItem>
                        <SelectItem value="Unsanctioned">
                          Unsanctioned
                        </SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-col gap-y-2 gap-4">
                <Label
                  htmlFor="entryForm"
                  className="text-left font-[600] text-[16px] 3xl:text-[18px]"
                >
                  Upload entry form
                </Label>

                {!uploadComplete && (
                  <div
                    onClick={handleClick}
                    className="cursor-pointer flex items-center justify-center w-full rounded-[12px] border border-[#C6CED6] border-dashed h-[42px] 3xl:h-[52px]"
                  >
                    <Image width={64} height={44} src={plus} alt="plus icon" />
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
                  style={{ display: "none" }}
                  accept=".pdf,.doc,.docx"
                  onChange={handleDocUpload}
                />
              </div>

              <div className="flex flex-col gap-y-2 gap-4">
                <Label
                  htmlFor="link"
                  className="text-left font-[600] text-[16px] 3xl:text-[18px]"
                >
                  Paste form link
                </Label>
                <Input
                  type="text"
                  id="link"
                  placeholder="Enter link"
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
                  className="w-full h-[56px] font-[600] border hover:border-gray-400 text-[18px] rounded-[16px]"
                  type="button"
                  onClick={() => onClose()}
                >
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  className="w-full h-[56px] font-[600] border hover:bg-black hover:text-white text-[18px] rounded-[16px]"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "Updating..." : "Update"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UpdateEvent;

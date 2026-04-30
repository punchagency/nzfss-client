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
import { useUser } from "@/context/user_context";

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

interface ClubTriggerProps {
  btn: string;
}
const CalenderTrigger = ({ btn }: ClubTriggerProps) => {
  const [open, setOpen] = useState(false);
  const client = useApolloClient();
  const { user } = useUser();

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
  const [errors, setErrors] = useState<Record<string, string>>({});

  const pathName = usePathname();
  const { data, refetch } = useQuery(GET_ALL_CLUBS);
  const { data: currentClub, refetch: refetchCurrentClub } = useQuery(GET_CURRENT_USER);

  // Clear cache and refetch data when user changes
  useEffect(() => {
    if (user) {
      // Clear Apollo cache for relevant queries
      client.cache.evict({ fieldName: "getAllClubs" });
      client.cache.evict({ fieldName: "currentUser" });
      client.cache.gc();

      // Refetch data
      refetch();
      refetchCurrentClub();
    }
  }, [user, client, refetch, refetchCurrentClub]);

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
    fileInput.accept = "image/*";

    // Cast the onchange handler as an event listener
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
    const input = e.target as HTMLInputElement; // Cast event target to HTMLInputElement
    const file = input.files?.[0];

    if (file) {
      const maxSize = 5000 * 1024; // 500KB size limit
      const fileSize = file.size;

      if (fileSize && fileSize > maxSize) {
        setImagePhotoSizeLimit(true); // File size exceeds limit
        return;
      }
      setImagePhotoSizeLimit(false); // Reset size error if file is valid

      setUploadLogoComplete(false); // Reset the upload completion

      // Convert to Base64 and set the image URL
      getBase64(file, (result) => {
        setPhotoBase64(result as string); // Store Base64 string
        setSelectedImage(URL.createObjectURL(file)); // Display the image URL
        setUploadLogoComplete(true); // Mark upload as complete
      });
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
      const maxSize = 10 * 1024 * 1024; // 10MB size limit
      const fileSize = file.size;

      // Store the file name
      setSelectedFileName(file.name);

      if (fileSize && fileSize > maxSize) {
        setImageSizeLimit(true); // File size exceeds limit
        toast({
          variant: "destructive",
          description: "Max file size can be 10MB",
        });
        return;
      }
      setImageSizeLimit(false);

      setUploadComplete(false);

      getBase64(file, (result) => {
        setEventDocsBase64(result as string); // Store Base64 string
        setUploadComplete(true);
      });
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

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const validateForm = () => {
    const newErrors: typeof errors = {};
    const errorMessages: string[] = [];
    
    if (!eventName.trim()) {
      newErrors.eventName = "Event name is required";
      errorMessages.push("Event name is required");
    }
    
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

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form before submission
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);

    try {
      const { data } = await addEvent({
        alternativeDate: formattedAlternativeDate,
        preferredDate: formattedPreferredDate,
        club: pathName === "/events" ? currentClub?.getCurrentUser?.name : selectedClubName,
        entryForm: eventDocsFileBase64,
        eventName,
        fileName: selectedFileName,
        photo: photoFileBase64 || "", // Handle case when photo is not provided
        type,
        region,
        clubId: pathName === "/events" ? currentClub?.getCurrentUser?._id : selectedClub,
        website: link,
        eventDate: formattedPreferredDate,
        date: false,
        public: false,
        isSubmitted: pathName === "/events" ? false : true,
        status: "Pending",
        result: false,
        NZFSSSanctioning: type === "sanctioning applied" ? true : false,
      });

      if (!data) {
        toast({
          variant: "destructive",
          description: "Failed to add event. Please try again.",
        });
        return;
      }

      // Reset form state on success
      resetForm();
      setOpen(false);
      
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
        setOpen(isOpen);
        if (!isOpen) {
          resetForm();
        }
      }}>
        <DialogTrigger>
          
          <div className=" flex gap-x-[5.5px] items-center">
          {/* <div className={`${pathName.startsWith("/events/") && showLoader ? "" : "border"} flex gap-x-2  rounded-[16px] py-2 px-3 text-[0.7rem]  lg:text-[0.8rem] 2xl:text-[1rem] 3xl:text-[18px] font-[600]`}>
            <span>{btn}</span>
          </div> */}

          {pathName.startsWith("/events/") && showLoader && (
              <div className=" instant-anim flex gap-x-2 border border-[#00000033] py-2 px-2 rounded-[16px] font-[500] text-[#000000] text-[0.95vw]">
                <span>{btn}</span>
              </div>
            )}

          {pathName === "/events" && (
              <div className="instant-anim border border-[#00000033] py-2 px-2 rounded-[16px] font-[500] text-[#000000] text-[0.95vw]">
                <span>{btn}</span>
              </div>
            )}

          {(pathName === "/calendar" || pathName === "/dashboard/calendar") && (
              <div className="instant-anim flex gap-x-2 border border-[#00000033] py-2 px-2 rounded-[16px] font-[500] text-[#000000] text-[0.95vw]">
                <span>{btn}</span>
              </div>
            )}

          {
            pathName.startsWith("/events/") && showLoader && (
              <LoaderCircle className="w-[32px] h-[32px] text-gray-500 animate-spin"/>
            )
          }
          
          </div>
          
        </DialogTrigger>
        <DialogContent>
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
                  Upload Photo (Optional){" "}
                  <span className="text-[12px] leading-[16.8px] font-[400]">
                    (Note : The image dimension should be 3:1 ratio)
                  </span>
                </Label>
                {!uploadLogoComplete && (
                  <div
                    onClick={handleClickPhoto}
                    className=" cursor-pointer flex items-center justify-center w-full rounded-[12px] border border-[#C6CED6] border-dashed h-[42px] 3xl:h-[52px]"
                  >
                    <Image width={64} height={44} src={plus} alt="plus icon" />
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

              <div className="grid grid-cols-4 gap-x-[25px]">
                <div className="col-span-2">
                  <div className="flex flex-col gap-y-[12px]">
                    <Label
                      htmlFor=""
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
                              ? currentClub?.getCurrentUser?.name
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
                            currentClub?.getCurrentUser ? (
                              <SelectItem
                                key={currentClub.getCurrentUser._id}
                                value={currentClub.getCurrentUser._id}
                              >
                                {currentClub.getCurrentUser?.name}
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

                <div className="flex flex-col gap-y-[12px] ">
                  <Label
                    htmlFor=""
                    className="text-left font-[600] text-[16px] 3xl:text-[18px]"
                  >
                    Preferred Date
                  </Label>

                  <DatePicker date={preferredDate} setDate={setPreferredDate} />
                </div>
                <div className="flex flex-col gap-y-[12px]">
                  <Label
                    htmlFor=""
                    className="text-left font-[600] text-[16px] 3xl:text-[18px]"
                  >
                    Alternative Date
                  </Label>

                  <DatePicker
                    date={alternativeDate}
                    setDate={setAlternativeDate}
                  />
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
                    <SelectTrigger className="w-full py-[20.5px] px-[16px]  outline-none bg-white">
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
                    <SelectTrigger className="w-full py-[20.5px] px-[16px]  outline-none bg-white">
                      <SelectValue
                        placeholder="Select type"
                        className="text-[#696A6A]"
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Types</SelectLabel>
                        <SelectItem value="sanctioning applied">
                          Sanctioning Applied
                        </SelectItem>
                        <SelectItem value="unsanctioned">
                          Unsanctioned
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
                </Label>

                {!uploadComplete && (
                  <div
                    onClick={handleClick}
                    className=" cursor-pointer flex items-center justify-center w-full rounded-[12px] border border-[#C6CED6] border-dashed h-[42px] 3xl:h-[52px]"
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
                  className="instant-anim w-full h-[56px] font-[600] border hover:border-gray-400 text-[18px] rounded-[16px]"
                  type="button"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  className="instant-anim w-full h-[56px] font-[600] border hover:bg-black hover:text-white text-[18px] rounded-[16px]"
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

export default CalenderTrigger;

"use client"
import React, { useState, useEffect } from "react"
import Link from "next/link"
import { gql, useMutation, useQuery } from "@apollo/client";
import { GET_ALL_CLUBS } from "@/graphql/query/clubs";
import { toast, Toaster } from "sonner"
import { useRouter } from "next/navigation"
import { CLUB_ABBREVIATIONS } from "@/utils/clubAbbreviations"

// Define the IDog interface if not already defined
interface IDog {
  petName: string;
  isDeceased: boolean;
  nzfssNumber?: string;
  pedigreeName?: string;
  breed?: string;
  dateOfBirth?: string;
  nzkcRegistration?: string;
  nzkcOwner?: string;
}

interface Club {
  _id: string;
  name: string;
}



const CREATE_FORM_MUTATION = gql`
  mutation CreateForm($input: CreateFormInput!) {
    createForm(input: $input) {
      _id
      formType
      formName
      applicantName
      surname
      firstName
      address
      club
      dateOfBirth
      phone
      email
      guardianDetails
      nzfssRegistrationNumber
      affiliationFrom
      affiliationTo
      dogs {
        petName
        isDeceased
        nzfssNumber
        pedigreeName
        breed
        dateOfBirth
        nzkcRegistration
        nzkcOwner
      }
      showProfileConsent
      status
    }
  }
`;

const FormPage = () => {
  const router = useRouter()
  const [formType, setFormType] = useState<"new" | "renewal" | "change">("new")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [nzfssRegistrationNumber, setNzfssRegistrationNumber] = useState("")
  const [nzfssNumberError, setNzfssNumberError] = useState("")
  const [dogs, setDogs] = useState<IDog[]>([{
    petName: "",
    isDeceased: false,
    nzfssNumber: "",
    pedigreeName: "",
    breed: "",
    dateOfBirth: "",
    nzkcRegistration: "",
    nzkcOwner: "",
  }])
  const [createForm] = useMutation(CREATE_FORM_MUTATION);
  const [isOpen, setIsOpen] = useState(false);
  const [isDeceasedOpen, setIsDeceasedOpen] = useState<{ [key: number]: boolean }>({});
  const [isClubDropdownOpen, setIsClubDropdownOpen] = useState(false);
  const [selectedClub, setSelectedClub] = useState<string>("");
  const [selectedClubName, setSelectedClubName] = useState<string>("");
  const [isAffiliationFromDropdownOpen, setIsAffiliationFromDropdownOpen] = useState(false);
  const [selectedAffiliationFrom, setSelectedAffiliationFrom] = useState<string>("");
  const [selectedAffiliationFromName, setSelectedAffiliationFromName] = useState<string>("");
  const [isAffiliationToDropdownOpen, setIsAffiliationToDropdownOpen] = useState(false);
  const [selectedAffiliationTo, setSelectedAffiliationTo] = useState<string>("");
  const [selectedAffiliationToName, setSelectedAffiliationToName] = useState<string>("");
  const { data: clubsData, loading: clubsLoading } = useQuery(GET_ALL_CLUBS);

  // Dynamic year for the form title
  const currentYear = new Date().getFullYear();

  // Function to do minimal formatting during typing (less intrusive)
  const formatNzfssNumberLive = (value: string): string => {
    if (!value) return "";
    
    // Only do basic cleanup: remove spaces and convert to uppercase
    // Don't auto-correct separators while typing to avoid interfering with user input
    return value.replace(/\s+/g, '').toUpperCase();
  };

  // Function to do full formatting when user finishes typing (on blur)
  const formatNzfssNumberComplete = (value: string): string => {
    if (!value) return "";
    
    // Remove any spaces and convert to uppercase
    let cleaned = value.replace(/\s+/g, '').toUpperCase();
    
    // Handle different separator patterns - replace common mistakes with '/'
    cleaned = cleaned.replace(/[-_|\\;:.,]/g, '/');
    
    // Remove multiple slashes and replace with single slash
    cleaned = cleaned.replace(/\/+/g, '/');
    
    // Remove slash from beginning or end if the string is longer than just the slash
    if (cleaned.length > 1) {
      cleaned = cleaned.replace(/^\/|\/$/g, '');
    }
    
    return cleaned;
  };

  // Function to validate NZFSS registration number format
  const validateNzfssNumber = (value: string): { isValid: boolean; message: string } => {
    if (!value) return { isValid: true, message: "" };
    
    // Use the complete formatting for validation
    const formatted = formatNzfssNumberComplete(value);
    
    // Check if it matches the expected pattern: LETTERS/NUMBERS
    const pattern = /^[A-Z]+\/[0-9]+$/;
    
    if (!pattern.test(formatted)) {
      return {
        isValid: false,
        message: "Format should be CLUB_CODE/NUMBER (e.g., RR/098, ASDC/123)"
      };
    }
    
    const [clubCode, number] = formatted.split('/');
    
    // Check if club code exists in our abbreviations
    const validCodes = Object.values(CLUB_ABBREVIATIONS);
    const isValidClubCode = validCodes.includes(clubCode) || 
                           validCodes.some(code => code.startsWith(clubCode)) ||
                           clubCode === 'RR'; // Common abbreviation for Ridge Runners
    
    if (!isValidClubCode) {
      return {
        isValid: false,
        message: `Club code "${clubCode}" not recognized. Common codes: RR, ASDC, CSDC, GNSHC, etc.`
      };
    }
    
    // Check if number part has reasonable length (typically 3 digits)
    if (number.length < 1 || number.length > 5) {
      return {
        isValid: false,
        message: "Registration number should be 1-5 digits"
      };
    }
    
    return { isValid: true, message: "" };
  };

  // Handle NZFSS number change with minimal formatting during typing
  const handleNzfssNumberChange = (value: string) => {
    const formatted = formatNzfssNumberLive(value);
    setNzfssRegistrationNumber(formatted);
    
    // Only validate if there's a reasonable amount of content
    if (formatted.length > 2) {
      const validation = validateNzfssNumber(formatted);
      setNzfssNumberError(validation.isValid ? "" : validation.message);
    } else {
      setNzfssNumberError(""); // Clear errors while typing
    }
  };

  // Handle blur event to apply complete formatting
  const handleNzfssNumberBlur = () => {
    if (nzfssRegistrationNumber) {
      const completeFormatted = formatNzfssNumberComplete(nzfssRegistrationNumber);
      setNzfssRegistrationNumber(completeFormatted);
      
      const validation = validateNzfssNumber(completeFormatted);
      setNzfssNumberError(validation.isValid ? "" : validation.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const formElement = e.target as HTMLFormElement;
      const formData = new FormData(formElement);
      
      const surname = formData.get("surname") as string || "";
      const firstName = formData.get("firstName") as string || "";
      const renewalName = formData.get("renewalName") as string || "";
      
      // For renewal forms, use the renewal name as the applicant name
      let applicantName = "";
      if (formType === "renewal") {
        applicantName = renewalName.trim();
      } else {
        applicantName = `${firstName} ${surname}`.trim();
      }
      
      // Ensure we have a valid applicant name
      if (!applicantName) {
        toast.error("Please enter your name before submitting the form.");
        setIsSubmitting(false);
        return;
      }
      
      // Get form name based on type
      const getFormName = () => {
        switch (formType) {
          case "renewal":
            return "Musher Registration Renewal Form";
          case "change":
            return "Musher Registration Change Form";
          default:
            return "New Musher Registration Form";
        }
      };

      const input = {
        formType,
        formName: getFormName(),
        applicantName,
        surname: surname || "",
        firstName: firstName || "",
        address: formData.get("address") as string || "",
        club: selectedClub || "",
        dateOfBirth: formData.get("dateOfBirth") as string || "",
        phone: formData.get("phone") as string || "",
        email: formData.get("email") as string || "",
        guardianDetails: formData.get("guardianDetails") as string || "",
        nzfssRegistrationNumber: nzfssRegistrationNumber || "",
        // Add change of affiliation fields for change form type
        affiliationFrom: selectedAffiliationFrom || "",
        affiliationTo: selectedAffiliationTo || "",
        dogs: dogs.map(dog => ({
          petName: dog.petName || "",
          isDeceased: !!dog.isDeceased,
          nzfssNumber: dog.nzfssNumber || "",
          pedigreeName: dog.pedigreeName || "",
          breed: dog.breed || "",
          dateOfBirth: dog.dateOfBirth || "",
          nzkcRegistration: dog.nzkcRegistration || "",
          nzkcOwner: dog.nzkcOwner || ""
        })),
        showProfileConsent: formData.get("profileConsent") === "on",
        status: "pending"
      };

      console.log("Submitting form with data:", input);
      console.log("Form data details:", {
        formType,
        surname: formData.get("surname"),
        firstName: formData.get("firstName"),
        renewalName: formData.get("renewalName"),
        applicantName,
        email: formData.get("email"),
        phone: formData.get("phone"),
        address: formData.get("address"),
        selectedClub,
        dogsCount: dogs.length,
        firstDog: dogs[0]
      });

      const { data } = await createForm({
        variables: { input }
      });

      console.log("Form submitted successfully:", data);
      
      toast.success("Form submitted successfully!", {
        duration: 3000,
      });
      
      // Wait for 3 seconds before navigating
      setTimeout(() => {
        router.push("/form");
      }, 3000);
      
    } catch (error) {
      console.error("Form submission error:", error);
      
      // Show more specific error message if available
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Failed to submit form. Please try again.";
      
      toast.error(errorMessage, {
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add dog to the form
  const addDog = () => {
    setDogs([...dogs, { 
      petName: "", 
      isDeceased: false, 
      nzfssNumber: "", 
      pedigreeName: "", 
      breed: "", 
      dateOfBirth: "", 
      nzkcRegistration: "", 
      nzkcOwner: "" 
    }])
  }

  // Update dog information with proper handling of undefined values
  const updateDog = (index: number, field: keyof IDog, value: string | boolean) => {
    const updatedDogs = [...dogs]
    updatedDogs[index] = { 
      ...updatedDogs[index], 
      [field]: value === undefined ? "" : value 
    }
    setDogs(updatedDogs)
  }

  // Render dog form section for each dog
  const renderDogSection = (dog: IDog, index: number) => {
    return (
      <div key={index} className="space-y-6 border rounded-lg p-6">
        <h3 className="font-[600] text-lg">Dog {index + 1}</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block mb-2 font-[600] text-lg">NZFSS Registration Number if Applicable</label>
            <input
              type="text"
              name={`dog-${index}-nzfssNumber`}
              placeholder="Enter Text"
              value={dog.nzfssNumber || ""}
              onChange={(e) => updateDog(index, "nzfssNumber", e.target.value)}
              className="w-full p-3 border rounded-lg placeholder-gray-400 placeholder:text-[16px] focus:outline-none focus:border-black transition-colors"
            />
          </div>
          <div>
            <label className="block mb-2 font-[600] text-lg">Pedigree Name of Dog if Applicable</label>
            <input
              type="text"
              name={`dog-${index}-pedigreeName`}
              placeholder="Enter Text"
              value={dog.pedigreeName || ""}
              onChange={(e) => updateDog(index, "pedigreeName", e.target.value)}
              className="w-full p-3 border rounded-lg placeholder-gray-400 placeholder:text-[16px] focus:outline-none focus:border-black transition-colors"
            />
          </div>
          <div>
            <label className="block mb-2 font-[600] text-lg">Pet Name of Dog</label>
            <input
              type="text"
              name={`dog-${index}-petName`}
              placeholder="Enter Text"
              value={dog.petName || ""}
              onChange={(e) => updateDog(index, "petName", e.target.value)}
              className="w-full p-3 border rounded-lg placeholder-gray-400 placeholder:text-[16px] focus:outline-none focus:border-black transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block mb-2 font-[600] text-lg">Breed if Known</label>
            <input
              type="text"
              name={`dog-${index}-breed`}
              placeholder="Enter Text"
              value={dog.breed || ""}
              onChange={(e) => updateDog(index, "breed", e.target.value)}
              className="w-full p-3 border rounded-lg placeholder-gray-400 placeholder:text-[16px] focus:outline-none focus:border-black transition-colors"
            />
          </div>
          <div>
            <label className="block mb-2 font-[600] text-lg">Date of Birth</label>
            <input
              type="date"
              name={`dog-${index}-dateOfBirth`}
              value={dog.dateOfBirth || ""}
              onChange={(e) => updateDog(index, "dateOfBirth", e.target.value)}
              className="w-full p-3 border rounded-lg placeholder-gray-400 placeholder:text-[16px] focus:outline-none focus:border-black transition-colors"
            />
          </div>
          <div>
            <label className="block mb-2 font-[600] text-lg">If Deceased</label>
            <div className="relative w-full">
              <button
                type="button"
                className="w-full h-12 px-4 text-left bg-white border border-gray-200 rounded-lg
                text-gray-700 cursor-pointer hover:border-gray-300 focus:outline-none focus:border-black
                transition-all duration-200 text-base flex items-center justify-between"
                onClick={() => setIsDeceasedOpen(prev => ({ ...prev, [index]: !prev[index] }))}
              >
                {dog.isDeceased ? "Yes" : "No"}
                <svg 
                  className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${isDeceasedOpen[index] ? 'rotate-180' : ''}`}
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 20 20" 
                  fill="currentColor" 
                  aria-hidden="true"
                >
                  <path 
                    fillRule="evenodd" 
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" 
                    clipRule="evenodd" 
                  />
                </svg>
              </button>
              
              {isDeceasedOpen[index] && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-2">
                  <div 
                    className="mx-2 py-2 hover:bg-[#f4f4fa] cursor-pointer px-4 transition-colors duration-200 rounded-md"
                    onClick={() => {
                      updateDog(index, "isDeceased", false);
                      setIsDeceasedOpen(prev => ({ ...prev, [index]: false }));
                    }}
                  >
                    No
                  </div>
                  <div className="my-1 mx-2 border-t border-gray-100" />
                  <div 
                    className="mx-2 py-2 hover:bg-[#f4f4fa] cursor-pointer px-4 transition-colors duration-200 rounded-md"
                    onClick={() => {
                      updateDog(index, "isDeceased", true);
                      setIsDeceasedOpen(prev => ({ ...prev, [index]: false }));
                    }}
                  >
                    Yes
                  </div>
                </div>
              )}
            </div>
          </div>
          <div>
            <label className="block mb-2 font-[600] text-lg">NZKC Registration</label>
            <input
              type="text"
              name={`dog-${index}-nzkcRegistration`}
              value={dog.nzkcRegistration || ""}
              placeholder="Enter Text"
              onChange={(e) => updateDog(index, "nzkcRegistration", e.target.value)}
              className="w-full p-3 border rounded-lg placeholder-gray-400 placeholder:text-[16px] focus:outline-none focus:border-black transition-colors"
            />
          </div>
          <div>
            <label className="block mb-2 font-[600] text-lg">NZKC Registered Owner</label>
            <input
              type="text"
              name={`dog-${index}-nzkcOwner`}
              placeholder="Enter Text"
              value={dog.nzkcOwner || ""}
              onChange={(e) => updateDog(index, "nzkcOwner", e.target.value)}
              className="w-full p-3 border rounded-lg placeholder-gray-400 placeholder:text-[16px] focus:outline-none focus:border-black transition-colors"
            />
          </div>
        </div>
      </div>
    )
  }

  // Add click outside listener to close dropdown
  useEffect(() => {
    const closeDropdown = (e: MouseEvent) => {
      if (isOpen && !(e.target as Element).closest('.relative')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('click', closeDropdown);
    return () => document.removeEventListener('click', closeDropdown);
  }, [isOpen]);

  // Add click outside listener for deceased dropdowns
  useEffect(() => {
    const closeDropdowns = (e: MouseEvent) => {
      if (Object.values(isDeceasedOpen).some(isOpen => isOpen) && 
          !(e.target as Element).closest('.relative')) {
        setIsDeceasedOpen({});
      }
    };

    document.addEventListener('click', closeDropdowns);
    return () => document.removeEventListener('click', closeDropdowns);
  }, [isDeceasedOpen]);

  // Add click outside listener for club dropdown
  useEffect(() => {
    const closeDropdown = (e: MouseEvent) => {
      if (isClubDropdownOpen && !(e.target as Element).closest('.club-dropdown')) {
        setIsClubDropdownOpen(false);
      }
    };

    document.addEventListener('click', closeDropdown);
    return () => document.removeEventListener('click', closeDropdown);
  }, [isClubDropdownOpen]);

  // Add click outside listener for affiliation dropdowns
  useEffect(() => {
    const closeDropdowns = (e: MouseEvent) => {
      if (isAffiliationFromDropdownOpen && !(e.target as Element).closest('.affiliation-from-dropdown')) {
        setIsAffiliationFromDropdownOpen(false);
      }
      if (isAffiliationToDropdownOpen && !(e.target as Element).closest('.affiliation-to-dropdown')) {
        setIsAffiliationToDropdownOpen(false);
      }
    };

    document.addEventListener('click', closeDropdowns);
    return () => document.removeEventListener('click', closeDropdowns);
  }, [isAffiliationFromDropdownOpen, isAffiliationToDropdownOpen]);

  // Render different form content based on form type
  const renderFormContent = () => {
    switch (formType) {
      case "renewal":
        return (
          <div>
            {/* Personal Details Section */}
            <div className="space-y-6 border rounded-lg p-6">
              <div className="bg-[#ECECEF] -mx-6 -mt-6 p-4 mb-6 rounded-t-lg">
                <h3 className="font-[600] text-lg">Annual Renewal (No Changes)</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 font-[600] text-lg">Annual Renewal Name</label>
                  <input
                    type="text"
                    name="renewalName"
                    placeholder="Enter your full name"
                    required
                    className="w-full p-3 border rounded-lg placeholder-gray-400 focus:outline-none focus:border-black transition-colors"
                  />
                </div>
                <div>
                  <label className="block mb-2 font-[600] text-lg">NZFSS Registration Number</label>
                  <input
                    type="text"
                    name="nzfssRegistrationNumber"
                    placeholder="e.g., RR/098 or ASDC/123"
                    value={nzfssRegistrationNumber}
                    onChange={(e) => handleNzfssNumberChange(e.target.value)}
                    onBlur={handleNzfssNumberBlur}
                    className="w-full p-3 border rounded-lg placeholder-gray-400 focus:outline-none focus:border-black transition-colors"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Format: CLUB_CODE/NUMBER (e.g., RR/098, ASDC/123)
                  </p>
                  {nzfssNumberError && (
                    <p className="text-sm text-red-500 mt-1">{nzfssNumberError}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block mb-2 font-[600] text-lg">Club</label>
                <div className="relative w-full club-dropdown">
                  <button
                    type="button"
                    className="w-full h-12 px-4 text-left bg-white border border-gray-200 rounded-lg
                    text-gray-700 cursor-pointer hover:border-gray-300 focus:outline-none focus:border-black
                    transition-all duration-200 text-base flex items-center justify-between"
                    onClick={() => setIsClubDropdownOpen(!isClubDropdownOpen)}
                  >
                    {selectedClubName || "Select your club"}
                    <svg 
                      className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${isClubDropdownOpen ? 'rotate-180' : ''}`}
                      xmlns="http://www.w3.org/2000/svg" 
                      viewBox="0 0 20 20" 
                      fill="currentColor" 
                      aria-hidden="true"
                    >
                      <path 
                        fillRule="evenodd" 
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" 
                        clipRule="evenodd" 
                      />
                    </svg>
                  </button>
                  
                  {isClubDropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-2 max-h-60 overflow-auto">
                      {clubsLoading ? (
                        <div className="px-4 py-2 text-gray-500">Loading clubs...</div>
                      ) : clubsData?.getAllClubs?.length ? (
                        clubsData.getAllClubs.map((club: Club) => (
                          <div 
                            key={club._id}
                            className="mx-2 py-2 hover:bg-[#f4f4fa] cursor-pointer px-4 transition-colors duration-200 rounded-md"
                            onClick={() => {
                              setSelectedClub(club._id);
                              setSelectedClubName(club.name);
                              setIsClubDropdownOpen(false);
                            }}
                          >
                            {club.name}
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-2 text-gray-500">No clubs available</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case "change":
        return (
          <div>
            {/* Personal Details Section */}
            <div className="space-y-6 border rounded-lg p-6">
              <div className="bg-[#ECECEF] -mx-6 -mt-6 p-4 mb-6 rounded-t-lg">
                <h3 className="font-[600] text-lg">Change of Registration</h3>
                <p className="text-sm text-gray-600 mt-2">
                  Both your current club and your new club must approve before the transfer completes.
                  NZFSS registration numbers stay the same.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 font-[600] text-lg">Surname</label>
                  <input
                    type="text"
                    name="surname"
                    placeholder="Enter Text"
                    className="w-full p-3 border rounded-lg placeholder-gray-400 focus:outline-none focus:border-black transition-colors"
                  />
                </div>
                <div>
                  <label className="block mb-2 font-[600] text-lg">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    placeholder="First Name"
                    className="w-full p-3 border rounded-lg placeholder-gray-400 focus:outline-none focus:border-black transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block mb-2 font-[600] text-lg">Address</label>
                  <input
                    type="text"
                    name="address"
                    placeholder="Enter Text"
                    className="w-full p-3 border rounded-lg placeholder-gray-400 focus:outline-none focus:border-black transition-colors"
                  />
                </div>
                <div>
                  <label className="block mb-2 font-[600] text-lg">NZFSS Registration Number</label>
                  <input
                    type="text"
                    name="nzfssRegistrationNumber"
                    placeholder="e.g., RR/098 or ASDC/123"
                    value={nzfssRegistrationNumber}
                    onChange={(e) => handleNzfssNumberChange(e.target.value)}
                    onBlur={handleNzfssNumberBlur}
                    className="w-full p-3 border rounded-lg placeholder-gray-400 focus:outline-none focus:border-black transition-colors"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Format: CLUB_CODE/NUMBER (e.g., RR/098, ASDC/123)
                  </p>
                  {nzfssNumberError && (
                    <p className="text-sm text-red-500 mt-1">{nzfssNumberError}</p>
                  )}
                </div>
                <div>
                  <label className="block mb-2 font-[600] text-lg">Club</label>
                  <div className="relative w-full club-dropdown">
                    <button
                      type="button"
                      className="w-full h-12 px-4 text-left bg-white border border-gray-200 rounded-lg
                      text-gray-700 cursor-pointer hover:border-gray-300 focus:outline-none focus:border-black
                      transition-all duration-200 text-base flex items-center justify-between"
                      onClick={() => setIsClubDropdownOpen(!isClubDropdownOpen)}
                    >
                      {selectedClubName || "Select your club"}
                      <svg 
                        className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${isClubDropdownOpen ? 'rotate-180' : ''}`}
                        xmlns="http://www.w3.org/2000/svg" 
                        viewBox="0 0 20 20" 
                        fill="currentColor" 
                        aria-hidden="true"
                      >
                        <path 
                          fillRule="evenodd" 
                          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" 
                          clipRule="evenodd" 
                        />
                      </svg>
                    </button>
                    
                    {isClubDropdownOpen && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-2 max-h-60 overflow-auto">
                        {clubsLoading ? (
                          <div className="px-4 py-2 text-gray-500">Loading clubs...</div>
                        ) : clubsData?.getAllClubs?.length ? (
                          clubsData.getAllClubs.map((club: Club) => (
                            <div 
                              key={club._id}
                              className="mx-2 py-2 hover:bg-[#f4f4fa] cursor-pointer px-4 transition-colors duration-200 rounded-md"
                              onClick={() => {
                                setSelectedClub(club._id);
                                setSelectedClubName(club.name);
                                setIsClubDropdownOpen(false);
                              }}
                            >
                              {club.name}
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-2 text-gray-500">No clubs available</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block mb-2 font-[600] text-lg">Date of Birth</label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    className="w-full p-3 border rounded-lg placeholder-gray-400 focus:outline-none focus:border-black transition-colors"
                  />
                </div>
                <div>
                  <label className="block mb-2 font-[600] text-lg">Phone</label>
                  <input
                    type="text"
                    name="phone"
                    placeholder="Enter Text"
                    className="w-full p-3 border rounded-lg placeholder-gray-400 focus:outline-none focus:border-black transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 font-[600] text-lg">Email</label>
                  <input
                    type="text"
                    name="email"
                    placeholder="Enter Text"
                    className="w-full p-3 border rounded-lg placeholder-gray-400 focus:outline-none focus:border-black transition-colors"
                  />
                </div>
                <div>
                  <label className="block mb-2 font-[600] text-lg">Guardian if JUNIOR APPLICANT (Full Name and Contact)</label>
                  <input
                    type="text"
                    name="guardianDetails"
                    placeholder="Enter guardian details if applicable"
                    className="w-full p-3 border rounded-lg placeholder-gray-400 focus:outline-none focus:border-black transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 font-[600] text-lg">Change of Affiliation From</label>
                  <div className="relative w-full affiliation-from-dropdown">
                    <button
                      type="button"
                      className="w-full h-12 px-4 text-left bg-white border border-gray-200 rounded-lg
                      text-gray-700 cursor-pointer hover:border-gray-300 focus:outline-none focus:border-black
                      transition-all duration-200 text-base flex items-center justify-between"
                      onClick={() => setIsAffiliationFromDropdownOpen(!isAffiliationFromDropdownOpen)}
                    >
                      {selectedAffiliationFromName || "Select previous club"}
                      <svg 
                        className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${isAffiliationFromDropdownOpen ? 'rotate-180' : ''}`}
                        xmlns="http://www.w3.org/2000/svg" 
                        viewBox="0 0 20 20" 
                        fill="currentColor" 
                        aria-hidden="true"
                      >
                        <path 
                          fillRule="evenodd" 
                          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" 
                          clipRule="evenodd" 
                        />
                      </svg>
                    </button>
                    
                    {isAffiliationFromDropdownOpen && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-2 max-h-60 overflow-auto">
                        {clubsLoading ? (
                          <div className="px-4 py-2 text-gray-500">Loading clubs...</div>
                        ) : clubsData?.getAllClubs?.length ? (
                          clubsData.getAllClubs.map((club: Club) => (
                            <div 
                              key={club._id}
                              className="mx-2 py-2 hover:bg-[#f4f4fa] cursor-pointer px-4 transition-colors duration-200 rounded-md"
                              onClick={() => {
                                setSelectedAffiliationFrom(club._id);
                                setSelectedAffiliationFromName(club.name);
                                setIsAffiliationFromDropdownOpen(false);
                              }}
                            >
                              {club.name}
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-2 text-gray-500">No clubs available</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block mb-2 font-[600] text-lg">Change of Affiliation To</label>
                  <div className="relative w-full affiliation-to-dropdown">
                    <button
                      type="button"
                      className="w-full h-12 px-4 text-left bg-white border border-gray-200 rounded-lg
                      text-gray-700 cursor-pointer hover:border-gray-300 focus:outline-none focus:border-black
                      transition-all duration-200 text-base flex items-center justify-between"
                      onClick={() => setIsAffiliationToDropdownOpen(!isAffiliationToDropdownOpen)}
                    >
                      {selectedAffiliationToName || "Select new club"}
                      <svg 
                        className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${isAffiliationToDropdownOpen ? 'rotate-180' : ''}`}
                        xmlns="http://www.w3.org/2000/svg" 
                        viewBox="0 0 20 20" 
                        fill="currentColor" 
                        aria-hidden="true"
                      >
                        <path 
                          fillRule="evenodd" 
                          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" 
                          clipRule="evenodd" 
                        />
                      </svg>
                    </button>
                    
                    {isAffiliationToDropdownOpen && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-2 max-h-60 overflow-auto">
                        {clubsLoading ? (
                          <div className="px-4 py-2 text-gray-500">Loading clubs...</div>
                        ) : clubsData?.getAllClubs?.length ? (
                          clubsData.getAllClubs.map((club: Club) => (
                            <div 
                              key={club._id}
                              className="mx-2 py-2 hover:bg-[#f4f4fa] cursor-pointer px-4 transition-colors duration-200 rounded-md"
                              onClick={() => {
                                setSelectedAffiliationTo(club._id);
                                setSelectedAffiliationToName(club.name);
                                setIsAffiliationToDropdownOpen(false);
                              }}
                            >
                              {club.name}
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-2 text-gray-500">No clubs available</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Dogs Section */}
            {dogs.map((dog, index) => renderDogSection(dog, index))}
            <button
              type="button"
              onClick={addDog}
              className="w-[14.792vw] border border-gray-300 p-3 mt-4  rounded-[0.833vw] font-[500] text-gray-700 hover:bg-black hover:text-white"
            >
              + ADD DOG
            </button>
          </div>
        );

      default:
        return (
          <div>
            {/* Personal Details Section */}
            <div className="space-y-6 border rounded-lg p-6">
              <div className="bg-[#ECECEF] -mx-6 -mt-6 p-4 mb-6 rounded-t-lg flex flex-col md:flex-row md:justify-between items-start md:items-center">
                <h3 className="font-[600] text-lg">Only fill out if you are a NEW MUSHER or if your details changed</h3>
                <p className="text-sm text-gray-600 mt-2 md:mt-0">*Junior is defined under 17teen by the 1st of May</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 font-[600] text-lg">Surname</label>
                  <input
                    type="text"
                    name="surname"
                    placeholder="Enter Text"
                    className="w-full p-3 border rounded-[0.833vw] placeholder-gray-400 focus:outline-none focus:border-black transition-colors"
                  />
                </div>
                <div>
                  <label className="block mb-2 font-[600] text-lg">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    placeholder="First Name"
                    className="w-full p-3 border  rounded-[0.833vw] placeholder-gray-400 focus:outline-none focus:border-black transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block mb-2 font-[600] text-lg">Address</label>
                  <input
                    type="text"
                    name="address"
                    placeholder="Enter Text"
                    className="w-full p-3 border  rounded-[0.833vw]  placeholder-gray-400 focus:outline-none focus:border-black transition-colors"
                  />
                </div>
                <div>
                  <label className="block mb-2 font-[600] text-lg">NZFSS Registration Number</label>
                  <input
                    type="text"
                    name="nzfssRegistrationNumber"
                    placeholder="e.g., RR/098 or ASDC/123"
                    value={nzfssRegistrationNumber}
                    onChange={(e) => handleNzfssNumberChange(e.target.value)}
                    onBlur={handleNzfssNumberBlur}
                    className="w-full p-3 border rounded-[0.833vw] placeholder-gray-400 focus:outline-none focus:border-black transition-colors"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Format: CLUB_CODE/NUMBER (e.g., RR/098, ASDC/123)
                  </p>
                  {nzfssNumberError && (
                    <p className="text-sm text-red-500 mt-1">{nzfssNumberError}</p>
                  )}
                </div>
                <div>
                  <label className="block mb-2 font-[600] text-lg">Club</label>
                  <div className="relative w-full club-dropdown">
                    <button
                      type="button"
                      className="w-full h-12 px-4 text-left bg-white border border-gray-200 rounded-lg
                      text-gray-700 cursor-pointer hover:border-gray-300 focus:outline-none focus:border-black
                      transition-all duration-200 text-base flex items-center justify-between"
                      onClick={() => setIsClubDropdownOpen(!isClubDropdownOpen)}
                    >
                      {selectedClubName || "Select your club"}
                      <svg 
                        className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${isClubDropdownOpen ? 'rotate-180' : ''}`}
                        xmlns="http://www.w3.org/2000/svg" 
                        viewBox="0 0 20 20" 
                        fill="currentColor" 
                        aria-hidden="true"
                      >
                        <path 
                          fillRule="evenodd" 
                          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" 
                          clipRule="evenodd" 
                        />
                      </svg>
                    </button>
                    
                    {isClubDropdownOpen && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-2 max-h-60 overflow-auto">
                        {clubsLoading ? (
                          <div className="px-4 py-2 text-gray-500">Loading clubs...</div>
                        ) : clubsData?.getAllClubs?.length ? (
                          clubsData.getAllClubs.map((club: Club) => (
                            <div 
                              key={club._id}
                              className="mx-2 py-2 hover:bg-[#f4f4fa] cursor-pointer px-4 transition-colors duration-200 rounded-md"
                              onClick={() => {
                                setSelectedClub(club._id);
                                setSelectedClubName(club.name);
                                setIsClubDropdownOpen(false);
                              }}
                            >
                              {club.name}
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-2 text-gray-500">No clubs available</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block mb-2 font-[600] text-lg">Date of Birth</label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    className="w-full p-3 border rounded-[0.833vw] placeholder-gray-400 focus:outline-none focus:border-black transition-colors"
                  />
                </div>
                <div>
                  <label className="block mb-2 font-[600] text-lg">Phone</label>
                  <input
                    type="text"
                    name="phone"
                    placeholder="Enter Text"
                    className="w-full p-3 border rounded-[0.833vw] placeholder-gray-400 focus:outline-none focus:border-black transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 font-[600] text-lg">Email</label>
                  <input
                    type="text"
                    name="email"
                    placeholder="Enter Text"
                    className="w-full p-3 border rounded-[0.833vw] placeholder-gray-400 focus:outline-none focus:border-black transition-colors"
                  />
                </div>
                <div>
                  <label className="block mb-2 font-[600] text-lg">Guardian if JUNIOR APPLICANT (Full Name and Contact)</label>
                  <input
                    type="text"
                    name="guardianDetails"
                    placeholder="Enter guardian details if applicable"
                    className="w-full p-3 border  rounded-[0.833vw] placeholder-gray-400 focus:outline-none focus:border-black transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Dogs Section */}
            {dogs.map((dog, index) => renderDogSection(dog, index))}
            <button
              type="button"
              onClick={addDog}
              className="w-[14.792vw] border border-gray-300 p-3 mt-4 text-[#212121] rounded-[0.833vw] font-[500] text-gray-700 hover:bg-black hover:text-white"
            >
              + ADD DOG
            </button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen w-full bg-white">
      <Toaster richColors position="top-center" />
      {/* Main container with max-width and padding */}
      <div className="w-full max-w-[1600px] mx-auto px-4 md:px-8 py-8">
        {/* Back button container */}
        <div className="mb-8 ">
          <Link 
            href="/form"
            className="flex items-center gap-2 text-gray-600 border hover:bg-black hover:text-white border-[#21212133] ml-16 rounded-lg hover:text-gray-800 w-32 h-10 md:w-28"
          >
            <span className=" font-[600] hover:bg-black hover:text-white ml-2 text-sm">←</span>
            <span className=" font-[600] hover:bg-black hover:text-white text-sm">Go Back</span>
          </Link>
        </div>

        {/* Form Content */}
        <div className="space-y-8 max-w-[1400px] mx-auto">
          {/* Title */}
          <h1 className="text-[4.375vw]  font-[700] tracking-tight leading-tight">
            {`Musher/Dog Registration Form ${currentYear}`}
          </h1>
          
          {/* Description */}
          <p className="text-base md:text-lg lg:text-xl font-[500] text-[#000000] leading-relaxed max-w-[1200px]">
            Please use this form if you are a <strong>MUSHER</strong> and like to register with the NZFSS and the National driver and dog point program. This form is also applicable for ANNUAL RENEWAL and ANY CHANGES that may occur during the race season.
          </p>

          {/* Instructions Box */}
          <div className="bg-gray-50 p-4 md:p-6 lg:p-8 rounded-lg border border-[#00000033]">
            <h2 className="font-[700] text-lg md:text-xl lg:text-2xl mb-4">Instructions to use:</h2>
            <ul className="space-y-2 py-2 font-[500] text-sm md:text-base lg:text-lg">
              <li>• Please make sure the form is filled out correctly and legibly as applicable and tick all relevant boxes.</li>
              <li>• The dog registration can only go on one application.</li>
              <li>• Please register every dog you wish to collect award points.</li>
              <li>• Please pay any fee to the club you are signing up with. Please note any deceased dog on the dog registration page box DEAD/DECEASED.</li>
              <li>• If you have any questions, please contact your club representative.</li>
            </ul> 
          </div>

          {/* Fees Table */}
          <div className="bg-gray-50 rounded-lg border border-[#00000033] overflow-hidden">
            <div className="grid grid-cols-2">
              <div className="bg-[#ECECEF] p-4 md:p-6 text-base md:text-lg lg:text-xl font-semibold">Fees</div>
              <div className="bg-[#ECECEF] p-4 md:p-6 flex justify-end text-base md:text-lg lg:text-xl font-semibold">
                Payable with your club
              </div>
              
              <div className="p-4 md:p-6 font-[500] text-sm md:text-base lg:text-lg">
                Annual Musher Renewal/New Application
              </div>
              <div className="p-4 md:p-6 flex justify-end font-[500] text-sm md:text-base lg:text-lg">
                $23.50
              </div>
                
              <div className="p-4 md:p-6 font-[500] text-sm md:text-base lg:text-lg">
                Junior Musher Registration
              </div>
              <div className="p-4 md:p-6 flex justify-end font-[500] text-sm md:text-base lg:text-lg">
                Free
              </div>
              
              <div className="p-4 md:p-6 font-[500] text-sm md:text-base lg:text-lg">
                Change of Registration
              </div>
              <div className="p-4 md:p-6 flex justify-end font-[500] text-sm md:text-base lg:text-lg">
                $5.00
              </div>
            </div>
          </div>

          {/* Form Type Selection */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <label className="font-[600] text-lg md:text-xl lg:text-2xl">Please choose your form type</label>
            <div className="relative w-full md:w-[400px]">
              <button
                type="button"
                className="w-full h-12 px-4 text-left bg-white border border-gray-200 rounded-lg
                text-gray-700 cursor-pointer hover:border-gray-300 focus:outline-none focus:border-black
                transition-all duration-200 text-base flex items-center justify-between"
                onClick={() => setIsOpen(!isOpen)}
              >
                {formType === "new" ? "New Musher registration" : 
                 formType === "renewal" ? "Renewal" : 
                 "Change of Registration"}
                <svg 
                  className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 20 20" 
                  fill="currentColor" 
                  aria-hidden="true"
                >
                  <path 
                    fillRule="evenodd" 
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" 
                    clipRule="evenodd" 
                  />
                </svg>
              </button>
              
              {isOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-2">
                  <div 
                    className="mx-2 py-2 hover:bg-[#f4f4fa] cursor-pointer px-4 transition-colors duration-200 rounded-md"
                    onClick={() => {
                      setFormType("new");
                      setIsOpen(false);
                    }}
                  >
                    New Musher registration
                  </div>
                  <div className="my-1 mx-2  border-gray-100" />
                  <div 
                    className="mx-2 py-2 hover:bg-[#f4f4fa] cursor-pointer px-4 transition-colors duration-200 rounded-md"
                    onClick={() => {
                      setFormType("renewal");
                      setIsOpen(false);
                    }}
                  >
                    Renewal
                  </div>
                  <div className="my-1 mx-2 border-gray-100" />
                  <div 
                    className="mx-2 py-2 hover:bg-[#f4f4fa] cursor-pointer px-4 transition-colors duration-200 rounded-md"
                    onClick={() => {
                      setFormType("change");
                      setIsOpen(false);
                    }}
                  >
                    Change of Registration
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {renderFormContent()}
            
            {/* Consent and Submit Section */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-2">
                <input 
                  type="checkbox" 
                  id="profileConsent"
                  name="profileConsent"
                  className="h-[25px] w-[15px] rounded-[1vw]" 
                />
                <label htmlFor="profileConsent" className="flex flex-col">
                  <span className="font-[500]">I agree to have my profile shown on the club page</span>
                  <span className="text-sm text-[#838484]">
                    By agreeing to this, you consent to the use of your information for display on the website
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors disabled:bg-gray-400 min-w-[200px]"
              >
                {isSubmitting ? "Submitting..." : "Submit Form"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default FormPage
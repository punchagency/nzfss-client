"use client";

import { DataTable, Dogs } from "@/components/data-table";
import { InputOTPDemo } from "@/components/otp";
import SelectComponent from "@/components/selectComponent";
import { StartTimeInput } from "@/components/start-time";
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
import { CREATE_RESULT } from "@/graphql/mutation/addResult";
import { CREATE_MUSHER } from "@/graphql/mutation/musher";
import { GET_ALL_DOGS } from "@/graphql/query/dogs";
import { useMutation, useQuery } from "@apollo/client";
import { Minus, Plus, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { gql } from "@apollo/client";
import { toast } from "sonner";
import { useToast } from "@/hooks/use-toast";
import { DatePicker } from "@/components/date_picker";
import { CURRENT_USER } from "@/graphql/query/users";

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

// GraphQL query to get all mushers with their dogs
const GET_ALL_MUSHERS = gql`
  query GetMushers {
    getMushers {
      id
      name
      registrationNo
      kennelRegistrationNo
      club
      dogs {
        dogId
        _id
        name
        pedigreeName
        nzkcNo
        nzfssNo
        dateOfBirth
        breed
        deceased
      }
    }
  }
`;

// Alternative mock data in case GraphQL fails
const MOCK_MUSHERS = [
  {
    id: "mock-1",
    name: "John Handler",
    registrationNo: "REG123",
    kennelRegistrationNo: "KEN123",
    club: "Sample Club",
    dogs: [
      {
        _id: "dog-1",
        name: "Max",
        pedigreeName: "Maximum Speed",
        nzkcNo: "NZKC123",
        nzfssNo: "NZFSS123",
        dateOfBirth: "2019-05-15",
        breed: "Husky",
        deceased: false,
        musherName: "John Handler"
      },
      {
        _id: "dog-2",
        name: "Luna",
        pedigreeName: "Midnight Luna",
        nzkcNo: "NZKC124",
        nzfssNo: "NZFSS124",
        dateOfBirth: "2020-03-22",
        breed: "Malamute",
        deceased: false,
        musherName: "John Handler"
      }
    ]
  },
  {
    id: "mock-2",
    name: "Sarah Smith",
    registrationNo: "REG456",
    kennelRegistrationNo: "KEN456",
    club: "Sample Club",
    dogs: [
      {
        _id: "dog-3",
        name: "Rocky",
        pedigreeName: "Rock Solid",
        nzkcNo: "NZKC125",
        nzfssNo: "NZFSS125",
        dateOfBirth: "2018-11-10",
        breed: "Husky",
        deceased: false,
        musherName: "Sarah Smith"
      }
    ]
  }
];

interface Dog {
  driverName: string;
}

interface Musher {
  id: string;
  name: string;
  registrationNo: string;
  kennelRegistrationNo: string;
  club: string;
  dogs: MusherDog[];
}

interface MusherDog {
  dogId?: string;
  _id: string;
  name: string;
  pedigreeName: string;
  nzkcNo: string;
  nzfssNo: string;
  dateOfBirth: string | null; // Allow null for optional DOB
  breed: string;
  deceased: boolean;
  musherName?: string; // Add optional musher name for display purposes
}

interface Props {
  dogDriversName: string[]; 
}

interface Entrant {
  driver: string;
  raceFormat: string | null;
  class: string | null;
  customClass: string | null;
  dogs: Dogs[];
  raceType: string | null;
  raceTime: string | null;
  heat?: string | null;
  temperature?: string | null;
  distance?: string | null;
  heatsData?: HeatDataForBackend[]; // Add heatsData field
  dogWeight?: string | null; // Add dog weight field
  weightPulled?: string | null; // Add weight pulled field
}

// Add interface for temperature and distance data
interface HeatData {
  heat: string;
  temperature: string;
  distance: string;
  class: string; // Add class field to associate heats with specific classes
}

// Define interfaces for query results
interface AllMushersResult {
  getMushers: Musher[];
}

// Add new interface for temporary musher data
interface TempMusherData {
  driver: string;
  dogs: Dogs[];
  raceType: string | null;
  raceTime: string | null;
  temperature: string | null;
  distance: string | null;
  heat?: string | null;
  dogWeight?: string | null; // Add dog weight field
  weightPulled?: string | null; // Add weight pulled field
}

// Add a new interface for heat data that will be sent to the backend
interface HeatDataForBackend {
  heat: string;
  temperature: string;
  distance: string;
  class: string;
}

// Add this function after the resetFullFormState function or before the return statement
const formatRaceTime = (timeString: string | null): string => {
  // If there's no time string at all, just return empty string - don't add zeros
  if (!timeString || timeString.trim() === "") return "";
  
  // Only format when there are actual digits
  const cleanTime = timeString.replace(/[^0-9]/g, "");
  
  // Check if we have digits to work with
  if (cleanTime.length > 0) {
    // Pad the string to at least 8 characters
    const paddedTime = cleanTime.padStart(8, '0');
    
    // Extract hours, minutes, seconds and milliseconds
    const hours = paddedTime.substring(0, 2);
    const minutes = paddedTime.substring(2, 4);
    const seconds = paddedTime.substring(4, 6);
    const ms = paddedTime.substring(6, 8);
    
    return `${hours}:${minutes}:${seconds}.${ms}`;
  }
  
  // Return empty string if no digits
  return "";
};

  // Helper function to validate temperature input (max 13, 1 decimal place)
  const validateTemperatureInput = (value: string): string => {
    // Remove any non-numeric characters except decimal point
    let cleaned = value.replace(/[^0-9.]/g, '');
    
    // Ensure only one decimal point
    const decimalCount = (cleaned.match(/\./g) || []).length;
    if (decimalCount > 1) {
      const firstDecimalIndex = cleaned.indexOf('.');
      cleaned = cleaned.substring(0, firstDecimalIndex + 1) + cleaned.substring(firstDecimalIndex + 1).replace(/\./g, '');
    }
    
    // Limit to 1 decimal place
    if (cleaned.includes('.')) {
      const parts = cleaned.split('.');
      if (parts[1] && parts[1].length > 1) {
        cleaned = parts[0] + '.' + parts[1].substring(0, 1);
      }
    }
    
    // Check if the value exceeds 13
    const numValue = parseFloat(cleaned);
    if (!isNaN(numValue) && numValue > 13) {
      return '13';
    }
    
    return cleaned;
  };

  // Helper function to validate distance input (2 decimal places)
  const validateDistanceInput = (value: string): string => {
    // Remove any non-numeric characters except decimal point
    let cleaned = value.replace(/[^0-9.]/g, '');
    
    // Ensure only one decimal point
    const decimalCount = (cleaned.match(/\./g) || []).length;
    if (decimalCount > 1) {
      const firstDecimalIndex = cleaned.indexOf('.');
      cleaned = cleaned.substring(0, firstDecimalIndex + 1) + cleaned.substring(firstDecimalIndex + 1).replace(/\./g, '');
    }
    
    // Limit to 2 decimal places
    if (cleaned.includes('.')) {
      const parts = cleaned.split('.');
      if (parts[1] && parts[1].length > 2) {
        cleaned = parts[0] + '.' + parts[1].substring(0, 2);
      }
    }
    
    return cleaned;
  };

  // Helper function to clean registration numbers by removing dog names
  const cleanRegistrationNumber = (registration: string | null | undefined, dogName?: string): string => {
    if (!registration) return "";
    
    // If dog name is provided and the registration ends with the dog name, remove it
    if (dogName && registration.toLowerCase().endsWith(dogName.toLowerCase())) {
      // Remove the dog name from the end, also remove any trailing slash or separator
      const cleaned = registration.substring(0, registration.length - dogName.length);
      return cleaned.replace(/[\/\-_\s]+$/, ""); // Remove trailing separators
    }
    
    // If no dog name provided, try to detect and remove common patterns
    // Look for patterns like "ASD/032/DOGNAME" and keep only "ASD/032"
    const parts = registration.split('/');
    if (parts.length >= 3) {
      // If we have 3 or more parts, assume the last part might be the dog name
      // Keep all parts except the last one
      return parts.slice(0, -1).join('/');
    }
    
    return registration;
  };

// Helper function to get the display name for dogs (pedigree name if available, otherwise regular name)
const getDogDisplayName = (dog: { name: string; pedigreeName?: string } | Dogs): string => {
  // For Dogs interface, check if pedigreeName exists and is not empty
  if ('pedigreeName' in dog && dog.pedigreeName && dog.pedigreeName.trim() !== '') {
    return dog.pedigreeName;
  }
  
  // For MusherDog interface, check if pedigreeName exists and is not empty
  if ('pedigreeName' in dog && dog.pedigreeName && dog.pedigreeName.trim() !== '') {
    return dog.pedigreeName;
  }
  
  // Fall back to regular name
  return dog.name || '';
};

const AddNewResult = ({ eventId }: { eventId: string }) => {
  const { data } = useQuery(GET_ALL_DOGS);
  
  // Modified query for current user with better error handling
  const { data: userData, loading: userDataLoading, error: userDataError } = useQuery(GET_CURRENT_USER, {
    fetchPolicy: "network-only", // Ensure we get fresh data
    onError: (error) => console.error("Error fetching user data:", error)
  });
  
  // Extract user role safely
  const currentUser = userData?.getCurrentUser;
  const isAdmin = currentUser?.role === "ADMIN";
  
  // Always query all mushers regardless of user role
  const { 
    data: musherData, 
    loading: musherLoading,
    error: musherError
  } = useQuery(GET_ALL_MUSHERS, { 
    skip: !currentUser,
    fetchPolicy: "network-only",
    onCompleted: (data) => {
      console.log("Musher query completed with data:", data);
      if (data?.getMushers?.length > 0) {
        console.log("Setting all mushers from data:", data.getMushers.length);
        setClubMushers(data.getMushers);
      }
    },
    onError: (error) => console.error("Musher query error:", error)
  });
  
  const [createEntrant, { loading, error }] = useMutation(CREATE_RESULT);
  const [createMusher] = useMutation(CREATE_MUSHER);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [selectedRaceFormat, setSelectedRaceFormat] = useState<string | null>(
    null
  );
  const [selectedRadio, setSelectedRadio] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [showClassInput, setShowClassInput] = useState<boolean>(false);
  const [customClass, setCustomClass] = useState<string>("");

  const [showInput, setShowInput] = useState<boolean>(false);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  const [dogName, setDogName] = useState("");
  const [registration, setRegistration] = useState("");
  const [dob, setDob] = useState("");
  const [dogDobDate, setDogDobDate] = useState<Date | undefined>(undefined);
  const [breed, setBreed] = useState("");

  const [isDisabled, setIsDisabled] = useState(false);
  const [buttonText, setButtonText] = useState("Add");
  const [isFormValid, setIsFormValid] = useState(false);

  const [isDropdownDisabled, setIsDropdownDisabled] = useState(false);
  const [addClassButtonText, setAddClassButtonText] = useState("Add Class");

  const [driverName, setDriverName] = useState("");
  const [filteredDrivers, setFilteredDrivers] = useState<string[]>([]);
  const [clubMushers, setClubMushers] = useState<Musher[]>([]);
  const [selectedMusher, setSelectedMusher] = useState<Musher | null>(null);
  const [availableDogs, setAvailableDogs] = useState<MusherDog[]>([]);

  const [raceTime, setRaceTime] = useState<string | null>(null);
  const {toast} = useToast();
  const [toggleTable, setToggleTable] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Dogs[]>([]);
  const [manualDogInput, setManualDogInput] = useState<Dogs[]>([]);
  const [entrants, setEntrants] = useState<Entrant[]>([]);

  // Heat management
  const [selectedHeat, setSelectedHeat] = useState<string>("Heat 1");
  const [heatsMap, setHeatsMap] = useState<Record<string, string[]>>({}); // Map of classes to their heats
  const [heatEnabled, setHeatEnabled] = useState<boolean>(false);
  
  // Temperature and distance management
  const [temperature, setTemperature] = useState("");
  const [distance, setDistance] = useState("");
  const [isTempDistanceSubmitted, setIsTempDistanceSubmitted] = useState(false);
  const [isTempDistanceReadOnly, setIsTempDistanceReadOnly] = useState(false);
  const [heatDataList, setHeatDataList] = useState<HeatData[]>([]);
  const [currentHeatData, setCurrentHeatData] = useState<HeatData | null>(null);

  // Implement edit entrant function
  const [editingEntrant, setEditingEntrant] = useState<Entrant | null>(null);
  const [editEntrantIndex, setEditEntrantIndex] = useState<number | null>(null);

  // Add new state for temporary musher data
  const [tempMusherData, setTempMusherData] = useState<TempMusherData[]>([]);

  // Add a new state for dialog-specific heat selection
  const [dialogSelectedHeat, setDialogSelectedHeat] = useState<string>("Heat 1");

  // Add new states for other dogs section
  const [otherDogsSearch, setOtherDogsSearch] = useState<string>("");
  const [otherDogsDisplayCount, setOtherDogsDisplayCount] = useState<number>(10);
  const [allOtherDogs, setAllOtherDogs] = useState<MusherDog[]>([]);

  const selectedRowsWithoutId = selectedRows.map(({ id, ...rest }) => rest);

  const startWithEvents = pathname.startsWith("/events/");

  const speed = [
    "Bikejoring",
    "Canicross",
    "Single-Dog Scooter",
    "Two-Dog Scooter",
    "2-Dog Rig",
    "3-Dog Rig",
    "4-Dog Rig",
    "6-Dog Rig",
    "8-Dog Rig",
    "Add Custom Class",
  ];

  const freight = [
    "Single-Dog Scooter",
    "Two-Dog Scooter",
    "2-Dog Rig",
    "3-Dog Rig",
    "4-Dog Rig",
    "6-Dog Rig",
    "8-Dog Rig",
    "Open Class Rig",
    "Add Custom Class",
  ];
  const snow = [
    "Skijoring",
    "2-Dog Rig",
    "3-Dog Rig",
    "4-Dog Rig",
    "6-Dog Rig",
    "8-Dog Rig",
    "Open Class Rig",
    "Add Custom Class",
  ];
  const weightPull = [
    "27kg (60 Pound) Class",
    "36kg (80 Pound) Class", 
    "50kg (110 Pounds) Class",
    "Unlimited Class",
  ];

  let selectedClassType: string[] = [];

  if (selectedRadio === "speed") {
    selectedClassType = speed;
  } else if (selectedRadio === "freight") {
    selectedClassType = freight;
  } else if (selectedRadio === "snow") {
    selectedClassType = snow;
  } else if (selectedRadio === "weight pull") {
    selectedClassType = weightPull;
  }

  useEffect(() => {
    // Validate form - only require dog name, DOB is optional
    setIsFormValid(dogName !== "");
  }, [dogName]);

  // Update the useEffect for setting mushers data
  useEffect(() => {
    if (!currentUser) return;
    
    console.log("Current user:", currentUser);
    console.log("Is admin:", isAdmin);
    
    // Set mushers data regardless of role
    if (musherData) {
      if (musherData.getMushers) {
        console.log("Using musher data:", musherData.getMushers.length, "mushers");
        setClubMushers(musherData.getMushers);
      } else {
        console.warn("Musher data exists but getMushers is empty or undefined");
      }
    }
    
    // Check if we should use mock data
    const noMusherData = !musherLoading && !musherData?.getMushers;
    
    // Only use mock data if queries have completed but returned no data
    if (noMusherData) {
      console.warn("No real musher data available, using mock data");
      setClubMushers(MOCK_MUSHERS);
    }
    
  }, [currentUser, isAdmin, musherData, musherLoading]);

  // Add data dump for debugging
  useEffect(() => {
    if (musherData) {
      console.log("Musher data structure:", JSON.stringify(musherData, null, 2));
    }
  }, [musherData]);

  // Debug logs
  useEffect(() => {
    if (userData) {
      console.log("Current user data:", userData.getCurrentUser);
    }
    if (userDataError) {
      console.error("User data error:", userDataError);
    }
  }, [userData, userDataError]);

  // Effect to update available dogs when a musher is selected
  useEffect(() => {
    if (selectedMusher) {
      setAvailableDogs(selectedMusher.dogs || []);
      
      // Only update driver name if we're not in edit mode
      // This prevents overwriting the name in edit mode
      if (!editingEntrant) {
        setDriverName(selectedMusher.name);
      }
    } else {
      setAvailableDogs([]);
    }
  }, [selectedMusher, editingEntrant]);

  // Effect to handle date selection for dog DOB
  useEffect(() => {
    if (dogDobDate) {
      // Format date to keep the exact day the user selected without timezone offset issues
      // Using getUTCFullYear/Month/Date ensures we don't lose a day due to timezone conversion
      const year = dogDobDate.getFullYear();
      const month = (dogDobDate.getMonth() + 1).toString().padStart(2, '0'); // Months are 0-indexed
      const day = dogDobDate.getDate().toString().padStart(2, '0');
      
      const formattedDate = `${year}-${month}-${day}`;
      console.log(`Selected date: ${dogDobDate}, formatted as: ${formattedDate}`);
      setDob(formattedDate);
    }
  }, [dogDobDate]);

  // Effect to handle immediate display of selected musher's name after typing
  useEffect(() => {
    // Clear filtered drivers when driver name is cleared
    if (!driverName) {
      setFilteredDrivers([]);
      setSelectedMusher(null);
    }
  }, [driverName]);

  const handleAddClick = () => {
    if (buttonText === "Add") {
      if (!isFormValid) return;

      const newDog: Dogs = {
        id: Math.random().toString(36).substr(2, 9),
        name: dogName,
        pedigreeName: "", // Empty for manually added dogs
        NZFSSRegistration: registration,
        dob: dob,
        breed: breed,
      };

      setSelectedRows((prevSelectedRows) => [...prevSelectedRows, newDog]);
      setManualDogInput((prevManualDogInput) => [
        ...prevManualDogInput,
        newDog,
      ]);

      // Completely reset all dog form fields
      setDogName("");
      setRegistration("");
      setDob("");
      setBreed("");
      // Clear the date picker state as well
      setDogDobDate(undefined);
      setIsDisabled(false);
      setShowInput(true);
      
      // Add a small timeout to ensure state is fully updated
      setTimeout(() => {
        // This ensures the date picker is completely reset
        const dateInputs = document.querySelectorAll('input[type="date"]');
        dateInputs.forEach(input => {
          if (input instanceof HTMLInputElement) {
            input.value = '';
          }
        });
      }, 10);
    }
  };

  // const isFormValid = dogName &&  dob && breed;

  const handleSelectChange = (value: string) => {
    setSelectedRaceFormat(value);
    
    // If format is "Heated", prepare to show heats for the current class
    if (value === "Heated") {
      // Enable heat selection
      setHeatEnabled(true);
      
      // Get the current class key
      const classKey = getCurrentClassKey();
      if (classKey && heatDataList.length > 0) {
        // Filter heat data for this class
        const classHeatData = heatDataList.filter(data => data.class === classKey);
        
        if (classHeatData.length > 0) {
          // Get all heat names for this class
          const existingHeatNames = classHeatData.map(data => data.heat);
          
          // Make sure heatsMap has this class's heats
          if (!heatsMap[classKey] || existingHeatNames.some(heat => !heatsMap[classKey].includes(heat))) {
            setHeatsMap(prev => ({
              ...prev,
              [classKey]: [...new Set([...(prev[classKey] || []), ...existingHeatNames])]
            }));
          }
          
          // Set the selected heat to the first one with data
          const firstHeat = existingHeatNames[0];
          setSelectedHeat(firstHeat);
          
          // Get the data for this heat
          const firstHeatData = classHeatData.find(data => data.heat === firstHeat);
          if (firstHeatData) {
            setTemperature(firstHeatData.temperature);
            setDistance(firstHeatData.distance);
            setCurrentHeatData(firstHeatData);
            setIsTempDistanceSubmitted(true);
          }
        } else {
          // No heats for this class yet, initialize with Heat 1
          setHeatsMap(prev => ({
            ...prev,
            [classKey]: ["Heat 1"]
          }));
          setSelectedHeat("Heat 1");
        }
      }
    }
  };

  // Modify handleRadioChange to immediately select Single-Dog Scooter for weight pull and make it non-editable
  const handleRadioChange = (value: string) => {
    setSelectedRadio(value);
    
    // Reset the class dropdown whenever a new radio is selected
    setSelectedClass(null);
    setShowClassInput(false);
    setIsDropdownDisabled(false);
    setCustomClass("");
    
    // Make sure the class dropdown gets populated with the correct options
    if (value === "speed") {
      console.log("Setting class type to speed options:", speed);
      selectedClassType = speed;
    } else if (value === "freight") {
      console.log("Setting class type to freight options:", freight);
      selectedClassType = freight;
    } else if (value === "snow") {
      console.log("Setting class type to snow options:", snow);
      selectedClassType = snow;
    } else if (value === "weight pull") {
      console.log("Setting class type to weight pull options:", weightPull);
      selectedClassType = weightPull;
      
      // Set distance to 10 meters for weight pull (but don't prevent temperature editing)
      setDistance("10");
      setIsTempDistanceSubmitted(true);
    }
  };

  const handleClassChange = (value: string) => {
    // When "Add custom class" is selected, show custom input but still set selectedClass
    if (value.toLowerCase() === "add custom class") {
      setSelectedClass(value); // Set the actual value instead of "add custom class" string
      setShowClassInput(true);
      setIsDropdownDisabled(true);
      setAddClassButtonText("Clear Class");
    } else {
      // For normal class selections
      setSelectedClass(value);
      setShowClassInput(false);
    }
    
    // When class changes, need to reset heat selection for the new class
    if (selectedRaceFormat === "Heated") {
      // Get the new class key after this change
      const newClassKey = selectedRadio + ":" + (value.toLowerCase() === "add custom class" ? customClass : value);
      
      // Save the previous class key to log
      const prevClassKey = getCurrentClassKey();
      console.log(`Class changed from ${prevClassKey} to ${newClassKey}`);
      
      // If we have heats for this class, select the first one
      if (heatsMap[newClassKey] && heatsMap[newClassKey].length > 0) {
        console.log(`Found existing heats for ${newClassKey}:`, heatsMap[newClassKey]);
        setSelectedHeat(heatsMap[newClassKey][0]);
        setDialogSelectedHeat(heatsMap[newClassKey][0]);
        
        // Find heat data for this heat and class
        const heatData = heatDataList.find(data => 
          data.heat === heatsMap[newClassKey][0] && data.class === newClassKey
        );
        
        if (heatData) {
          console.log(`Found heat data for ${heatsMap[newClassKey][0]} in class ${newClassKey}:`, heatData);
          setTemperature(heatData.temperature);
          setDistance(heatData.distance);
          setCurrentHeatData(heatData);
          setIsTempDistanceSubmitted(true);
        } else {
          // No data for this heat yet
          setTemperature("");
          setDistance("");
          setCurrentHeatData(null);
          setIsTempDistanceSubmitted(false);
        }
      } else {
        // No heats for this class yet, initialize with Heat 1
        console.log(`No heats found for ${newClassKey}, initializing with Heat 1`);
        setHeatsMap(prev => ({
          ...prev,
          [newClassKey]: ["Heat 1"]
        }));
        setSelectedHeat("Heat 1");
        setDialogSelectedHeat("Heat 1");
        setTemperature("");
        setDistance("");
        setCurrentHeatData(null);
        setIsTempDistanceSubmitted(false);
      }
    }
  };

  const handleCustomClassChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomClass(e.target.value);
  };

  const handleRadioChangeStatus = (value: string) => {
    console.log("Race type selected:", value);
    setSelectedStatus(value);
    
    // If changing away from "started", clear the race time
    if (value !== "started") {
      setRaceTime("");
    }
    // Important: Don't set a default race time when "started" is selected
    // Let the user manually enter the time
  };

  const handleAddClassClick = () => {
    // Toggle between showing dropdown and showing input
    setShowClassInput(!showClassInput);
    
    if (!showClassInput) {
      // Switching to custom input
      setIsDropdownDisabled(true);
      setAddClassButtonText("Clear Class");
    } else {
      // Switching back to dropdown
      setIsDropdownDisabled(false);
      setAddClassButtonText("Add Class");
      setCustomClass("");
      // Don't reset selectedClass when toggling back - allow users to keep their selection
    }
  };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setDriverName(inputValue);
    
    // Clear selected musher when input changes significantly
    if (selectedMusher && !selectedMusher.name.toLowerCase().includes(inputValue.toLowerCase())) {
      setSelectedMusher(null);
    }
    
    try {
      // Filter mushers that match the input value (case insensitive)
      if (inputValue.trim() ) {
        const lowercaseInput = inputValue.toLowerCase();
        console.log("clubMushers", clubMushers);
        
        // Use a Set to track unique names and prevent duplicates
        const uniqueNames = new Set<string>();
        const filtered = clubMushers
          .filter(musher => 
            musher && musher.name && 
            musher.name.toLowerCase().includes(lowercaseInput)
          )
          .filter(musher => {
            // Only include each name once (case-insensitive)
            const lowerName = musher.name.toLowerCase();
            if (uniqueNames.has(lowerName)) {
              return false;
            }
            uniqueNames.add(lowerName);
            return true;
          })
          .map(musher => musher.name);
          
        console.log(`Found ${filtered.length} mushers matching '${inputValue}'`);
        setFilteredDrivers(filtered);
      } else {
        setFilteredDrivers([]);
      }
    } catch (err) {
      console.error("Error filtering drivers:", err);
      setFilteredDrivers([]);
    }
  };

   // Modify the handleDriverSelect function to prevent duplicates
   const handleDriverSelect = (name: string) => {
    console.log(`Selected driver: ${name}`);
    
    // If the name is already selected, don't do anything
    if (driverName === name) {
      console.log(`Driver ${name} already selected, not changing selection`);
      setFilteredDrivers([]);
      return;
    }
    
    // Find the selected musher in the clubMushers array - using case-insensitive comparison
    const found = clubMushers.find(musher => 
      musher.name.toLowerCase() === name.toLowerCase()
    );
    
    if (found) {
      console.log(`Found musher data:`, found);
      console.log(`Musher has ${found.dogs?.length || 0} dogs`);
      setSelectedMusher(found);
      setDriverName(found.name); // Use the exact name from data
      setFilteredDrivers([]);
    } else {
      console.log(`No matching musher found for ${name}`);
      setDriverName(name);
      setSelectedMusher(null);
      setFilteredDrivers([]);
    }
  };

  // Add new function to handle dog selection from club musher's dogs
  const handleMusherDogSelect = (dog: MusherDog) => {
    const stableDogId = dog.dogId || dog._id;
    const uniqueId = `${stableDogId}-${selectedMusher?.name || ''}`;
    
    // Check if dog is already selected using the unique identifier
    const isSelected = selectedRows.some(selected => 
      selected.id === uniqueId
    );
    
    if (isSelected) {
      // Remove dog from selection
      setSelectedRows(selectedRows.filter(selected => 
        selected.id !== uniqueId
      ));
    } else {
      // Add dog to selection
      const formattedDog: Dogs = {
        id: uniqueId,
        dogId: stableDogId,
        name: dog.name || "",
        pedigreeName: dog.pedigreeName || "",
        NZFSSRegistration: cleanRegistrationNumber(dog.nzfssNo, dog.name) || "",
        dob: dog.dateOfBirth || "",
        breed: dog.breed || ""
      };
      setSelectedRows([...selectedRows, formattedDog]);
    }
  };

  // Add a function to handle dog selection for legacy data
  const handleDogSelect = (dog: any) => {
    // Create a unique identifier for legacy dogs
    const uniqueId = `legacy-${dog.name}-${dog.NZFSSRegistration}-${dog.breed}`;
    
    // Check if dog is already selected
    const isSelected = selectedRows.some(selected => 
      selected.id === uniqueId
    );
    
    if (isSelected) {
      // Remove dog from selection
      setSelectedRows(selectedRows.filter(selected => 
        selected.id !== uniqueId
      ));
    } else {
      // Add dog to selection
      const formattedDog: Dogs = {
        id: uniqueId,
        name: dog.name || "",
        pedigreeName: dog.pedigreeName || "",
        NZFSSRegistration: dog.NZFSSRegistration || "",
        dob: dog.dob || "",
        breed: dog.breed || ""
      };
      setSelectedRows([...selectedRows, formattedDog]);
    }
  };

  // Modify the temperature and distance submission handler
  const handleTempDistanceSubmit = () => {
    const classKey = getCurrentClassKey();
    if (!classKey) {
      toast({
        title: "Please select both race format and class",
        description: "Both race format and class are required",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }
    
    if (isTempDistanceReadOnly) {
      // If in read-only mode, switch to edit mode
      setIsTempDistanceReadOnly(false);
      setHeatEnabled(false);
    } else {
      // Validate temperature and distance
      if (!temperature.trim() || !distance.trim()) {
        toast({
          title: "Please enter both temperature and distance",
          description: "Both temperature and distance are required",
          variant: "destructive",
          duration: 3000,
        });
        return;
      }

      // If not submitted, save the values and switch to read-only state
      setIsTempDistanceSubmitted(true);
      setIsTempDistanceReadOnly(true);
      
      // For non-heated races, just set the values
      if (selectedRaceFormat !== "Heated") {
        setCurrentHeatData({
          heat: "Heat 1",
          temperature: temperature,
          distance: distance,
          class: classKey
        });
      } else {
        // Enable heat selection if race format is "Heated"
        setHeatEnabled(true);
        
        // Add the current heat data
        const newHeatData: HeatData = {
          heat: selectedHeat,
          temperature: temperature,
          distance: distance,
          class: classKey
        };
        
        // Check if this heat already has data for this class
        const existingIndex = heatDataList.findIndex(data => 
          data.heat === selectedHeat && data.class === classKey
        );
        
        let updatedHeatDataList;
        
        if (existingIndex >= 0) {
          // Update existing heat data
          updatedHeatDataList = [...heatDataList];
          updatedHeatDataList[existingIndex] = newHeatData;
          setHeatDataList(updatedHeatDataList);
        } else {
          // Add new heat data
          updatedHeatDataList = [...heatDataList, newHeatData];
          setHeatDataList(updatedHeatDataList);
        }
        
        // Set as current heat data
        setCurrentHeatData(newHeatData);
      }
    }
  };

  // Add function to add a new heat with temperature and distance
  const handleAddNewHeatData = () => {
    // Reset submission state to allow new data entry
    setIsTempDistanceSubmitted(false);
    
    // Create a new heat name
    const newHeatNumber = heatsMap[selectedRaceFormat || ""]?.length + 1 || 1;
    const newHeat = `Heat ${newHeatNumber}`;
    
    // Add the new heat to the list
    setHeatsMap(prev => ({ ...prev, [selectedRaceFormat || ""]: [...(prev[selectedRaceFormat || ""] || []), newHeat] }));
    setSelectedHeat(newHeat);
    
    // Clear temperature and distance for new entry
    setTemperature("");
    setDistance("");
  };

  // Function to select existing heat data
  const handleSelectHeatData = (heat: string) => {
    const classKey = getCurrentClassKey();
    if (!classKey) return;
    
    const heatData = heatDataList.find(data => 
      data.heat === heat && data.class === classKey
    );
    
    if (heatData) {
      // Load the saved temperature and distance
      setTemperature(heatData.temperature);
      setDistance(heatData.distance);
      setCurrentHeatData(heatData);
      
      // If we're in edit mode, show the values as submitted
      if (!isTempDistanceSubmitted) {
        setIsTempDistanceSubmitted(true);
      }
    } else {
      // If this heat doesn't have data yet, clear the fields
      setTemperature("");
      setDistance("");
      setCurrentHeatData(null);
      
      // Also return to input mode
      setIsTempDistanceSubmitted(false);
    }
  };

  // Heat selection handler
  const handleHeatChange = (value: string) => {
    console.log(`Heat changed to: ${value} for class: ${getCurrentClassKey()}`);
    // First update the selected heat
    setSelectedHeat(value);
    setDialogSelectedHeat(value);
    
    // Then load the heat data
    handleSelectHeatData(value);
  };

  // Modify handleDialogHeatChange to log more information
  const handleDialogHeatChange = (heat: string) => {
    const classKey = getCurrentClassKey();
    console.log(`Dialog heat changed to: ${heat} for class: ${classKey}`);
    
    setDialogSelectedHeat(heat);
    
    // Update the heat data display in the dialog
    const heatData = heatDataList.find(data => 
      data.heat === heat && 
      data.class === classKey
    );
    
    if (heatData) {
      // Heat has data, we'll use this for the entrant
      console.log(`Found heat data for dialog:`, heatData);
      
      // Always update temperature and distance for dialog heat changes
      // This ensures the global state reflects the currently selected heat
      setTemperature(heatData.temperature);
      setDistance(heatData.distance);
      setCurrentHeatData(heatData);
    } else {
      console.log(`No heat data found for ${heat} in class ${classKey}`);
      
      // If this heat doesn't have data yet, clear the values
      setTemperature("");
      setDistance("");
      setCurrentHeatData(null);
    }
  };

  // When the dialog opens, initialize dialogSelectedHeat to the currently selected heat
  useEffect(() => {
    if (open) {
      setDialogSelectedHeat(selectedHeat);
      // Also load the temperature/distance values for the selected heat
      if (selectedRaceFormat === "Heated") {
        handleDialogHeatChange(selectedHeat);
      }
    }
  }, [open, selectedHeat]);

  // Add effect to restore heat data when race format or class changes
  useEffect(() => {
    // Only proceed if race format is "Heated" and selectedClass is set
    if (selectedRaceFormat === "Heated" && selectedClass && selectedRadio) {
      // Calculate classKey directly to avoid function calls that might cause dependency issues
      let classKey = "";
      
      // Use the custom class if "Add Custom Class" is selected (case-insensitive check)
      if (selectedClass.toLowerCase() === "add custom class" || 
          selectedClass === "Add Custom Class" ||
          showClassInput) {
        if (customClass) {
          classKey = `${selectedRadio}:${customClass}`;
        } else {
          return; // Don't proceed if custom class is not set
        }
      } else {
        // Otherwise use the selected class
        classKey = `${selectedRadio}:${selectedClass}`;
      }
      
      if (!classKey) return;
      
      // Enable heat selection UI for heated races
      setHeatEnabled(true);
      
      // Initialize heats for this class if not already done
      if (!heatsMap[classKey] || heatsMap[classKey].length === 0) {
        setHeatsMap(prev => ({
          ...prev,
          [classKey]: ["Heat 1"]
        }));
        setSelectedHeat("Heat 1");
      }
    } else if (selectedRaceFormat !== "Heated") {
      // Disable heat selection for non-heated races
      setHeatEnabled(false);
    }
  }, [selectedRaceFormat, selectedRadio, selectedClass, customClass, showClassInput]);

  // Handle edit entrant
  const handleEditEntrant = (entrant: Entrant, index: number) => {
    // Check if we're already in edit mode for this entrant
    if (editingEntrant && editEntrantIndex === index) {
      // If we're already editing this entrant, open the dialog
      setOpen(true);
      return;
    }
    
    // First reset the form to ensure clean state before populating
    resetDialogState();
    
    // Then save the editing state
    setEditingEntrant(entrant);
    setEditEntrantIndex(index);
    
    // Populate form with entrant data
    setDriverName(entrant.driver);
    
    // Set race format - need to set this first as it affects other UI elements
    setSelectedRaceFormat(entrant.raceFormat);
    
    // Set class type (e.g., speed, freight, etc.)
    setSelectedRadio(entrant.class);
    
    // Handle the specific class selection
    if (entrant.customClass) {
      // Check if this is a custom class or a standard class
      if (entrant.class === "add custom class") {
        setSelectedClass("add custom class");
        setCustomClass(entrant.customClass);
        setShowClassInput(true);
        setIsDropdownDisabled(true);
        setAddClassButtonText("Clear Class");
      } else {
        // If it's not marked as a custom class but has a customClass value,
        // it should be a standard class selection
        setSelectedClass(entrant.customClass);
        setShowClassInput(false);
      }
    } else {
      // Just a standard class with no customClass
      setSelectedClass(entrant.class);
      setShowClassInput(false);
      setIsDropdownDisabled(false);
    }
    
    // Find matching musher in clubMushers for this driver
    const matchingMusher = clubMushers.find(
      musher => musher.name.toLowerCase() === entrant.driver.toLowerCase()
    );
    
    if (matchingMusher) {
      console.log("Found matching musher for edit:", matchingMusher.name);
      setSelectedMusher(matchingMusher);
    } else {
      console.log("No matching musher found for edit:", entrant.driver);
      setSelectedMusher(null);
    }
    
    // Handle dogs
    setSelectedRows(entrant.dogs);
    
    // Handle race status and time
    setSelectedStatus(entrant.raceType);
    
    if (entrant.class === "weight pull" && entrant.raceType === "started") {
      // Set weight pull values for editing
      console.log("Setting weight pull values for edit:", entrant.dogWeight, entrant.weightPulled);
      setDogWeight(entrant.dogWeight || "");
      setWeightPulled(entrant.weightPulled || "");
    } else if (entrant.raceType === "started" && entrant.raceTime) {
      // Set race time for editing
      console.log("Setting race time for edit:", entrant.raceTime);
      setRaceTime(entrant.raceTime.replace(/[^0-9]/g, "")); // Remove non-numeric characters
    }
    
    // Handle heat data for heated races
    if (entrant.raceFormat === "Heated" && entrant.heat) {
      // Get the class key based on entrant data
      const classKey = `${entrant.class}:${entrant.customClass || entrant.class}`;
      
      // Make sure the heat exists in our heatsMap for this class
      const heatValue = entrant.heat; // Create a local string variable
      if (!heatsMap[classKey] || !heatsMap[classKey].includes(heatValue)) {
        // Add this heat to the class's heats
        setHeatsMap(prev => ({
          ...prev,
          [classKey]: [...(prev[classKey] || []), heatValue]
        }));
      }
      
      setSelectedHeat(heatValue);
      setDialogSelectedHeat(heatValue);
      
      // Set temperature and distance
      if (entrant.temperature && entrant.distance) {
        // Update heat data list with this heat's data
        const existingIndex = heatDataList.findIndex(data => 
          data.heat === heatValue && data.class === classKey
        );
        
        const newHeatData = {
          heat: heatValue,
          temperature: entrant.temperature,
          distance: entrant.distance,
          class: classKey
        };
        
        if (existingIndex >= 0) {
          // Update existing heat data
          const updatedList = [...heatDataList];
          updatedList[existingIndex] = newHeatData;
          setHeatDataList(updatedList);
        } else {
          // Add new heat data
          setHeatDataList(prevList => [...prevList, newHeatData]);
        }
        
        setCurrentHeatData(newHeatData);
        setTemperature(entrant.temperature);
        setDistance(entrant.distance);
        setIsTempDistanceSubmitted(true);
        setHeatEnabled(true);
      }
    } else {
      // For non-heated races
      if (entrant.temperature) {
        setTemperature(entrant.temperature);
      }
      
      if (entrant.distance) {
        setDistance(entrant.distance);
      }
      
      // If we have temp and distance, mark as submitted
      if (entrant.temperature && entrant.distance) {
        setIsTempDistanceSubmitted(true);
      }
    }
    
    // Show a notification to the user that data is loaded and ready for editing
    toast({
      title: "Ready to edit",
      description: `Click the edit button again to open the form and edit ${entrant.driver}'s data`,
      variant: "default",
      duration: 3000,
    });
  };

  // Modify onSubmit to ensure it uses dialog-selected heat and class-specific data
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Ensure this is here to prevent default form submission

    // Check if the musher exists
    const musherExists = clubMushers.some(
      musher => musher.name.toLowerCase().trim() === driverName.toLowerCase().trim()
    );

    // If the musher doesn't exist, create one
    if (!musherExists && !editingEntrant) {
      try {
        console.log(`Creating new musher from form: ${driverName}`);
        
        // Extract dogs for the new musher
        const dogData = selectedRows.length > 0 
          ? selectedRows.map(dog => ({
              name: dog.name || "",
              nzfssNo: dog.NZFSSRegistration || "",
              dateOfBirth: dog.dob || null, // Use null instead of empty string for optional DOB
              breed: dog.breed || "",
              pedigreeName: dog.pedigreeName || "", // Use actual pedigree name from Dogs object
              nzkcNo: "", // Required by MusherDog type
              deceased: false
            }))
          : manualDogInput.map(dog => ({
              name: dog.name || "",
              nzfssNo: dog.NZFSSRegistration || "",
              dateOfBirth: dog.dob || null, // Use null instead of empty string for optional DOB
              breed: dog.breed || "",
              pedigreeName: dog.pedigreeName || "", // Use actual pedigree name from Dogs object
              nzkcNo: "", // Required by MusherDog type
              deceased: false
            }));
        
        // Create the musher
        const musherInput = {
          name: driverName,
          registrationNo: "", // Can be empty initially
          kennelRegistrationNo: "", // Can be empty initially
          clubId: "default", // Required field
          dogs: dogData
        };
        
        const musherResult = await createMusher({
          variables: {
            input: musherInput,
          },
        });
        
        console.log("Musher created from form:", musherResult);
        
        // Add to local state if successful
        if (musherResult?.data?.createMusher) {
          const newMusher: Musher = {
            id: musherResult.data.createMusher.id,
            name: driverName,
            registrationNo: "",
            kennelRegistrationNo: "",
            club: "",
            dogs: dogData.map(dog => ({
              _id: Math.random().toString(36).substr(2, 9), // Temporary ID
              name: dog.name,
              pedigreeName: dog.pedigreeName,
              nzkcNo: dog.nzkcNo,
              nzfssNo: dog.nzfssNo,
              dateOfBirth: dog.dateOfBirth,
              breed: dog.breed,
              deceased: dog.deceased
            }))
          };
          
          // Check if this musher is already in the list to prevent duplicates
          const alreadyExists = clubMushers.some(musher => 
            musher.id === newMusher.id || 
            musher.name.toLowerCase().trim() === newMusher.name.toLowerCase().trim()
          );
          
          if (!alreadyExists) {
            setClubMushers([...clubMushers, newMusher]);
          } else {
            console.log(`Musher ${newMusher.name} already exists in the list, not adding again`);
          }
        }
      } catch (error) {
        console.error("Error creating musher from form:", error);
        toast({
          title: "Error creating musher",
          description: "Could not create musher, but will continue with adding the entrant.",
          variant: "destructive",
          duration: 3000,
        });
      }
    }

    // Otherwise, validate as before (for adding a new entrant)
    if (loading) return;

    if (!driverName.trim()) {
      toast({
        title: "Please enter a driver name",
        description: "Please enter a driver name",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    if (!selectedRaceFormat) {
      toast({
        title: "Please select a race format",
        description: "Please select a race format",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    if (!selectedRadio) {
      toast({
        title: "Please select a class type (Speed, Freight, Snow, Weight pull)",
        description: "Please select a class type (Speed, Freight, Snow, Weight pull)",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    if (!selectedClass && !customClass) {
      toast({
        title: "Please select a specific class",
        description: "Please select a specific class",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    // If "Add custom class" is selected but no custom class is entered
    if (selectedClass === "Add Custom Class" && !customClass) {
      toast({
        title: "Please enter a custom class name",
        description: "You selected 'Add Custom Class' but didn't enter a custom class name",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    const classKey = getCurrentClassKey();
    console.log(`Submitting form for class key: ${classKey}`);

    if (selectedRaceFormat === "Heated") {
      console.log(`Looking for heat data for heat: ${dialogSelectedHeat} and class: ${classKey}`);
      const heatData = heatDataList.find(data => 
        data.heat === dialogSelectedHeat && 
        data.class === classKey
      );
      
      if (!heatData) {
        console.log("No heat data found");
        toast({
          title: "Please configure temperature and distance for this heat",
          description: "Temperature and distance are required for each heat",
          variant: "destructive",
          duration: 3000,
        });
        return;
      }
      console.log(`Found heat data:`, heatData);
    } else if (!temperature || !distance) {
      toast({
        title: "Please enter temperature and distance",
        description: "Temperature and distance are required",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    if (!selectedStatus) {
      toast({
        title: "Please select a race type",
        description: "Please select a race type",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    // Special validation for weight pull class
    if (selectedRadio === "weight pull" && selectedStatus === "started") {
      if (!raceTime || raceTime.trim() === "") {
        toast({
          title: "Please enter a race time",
          description: "Race time is required for weight pull class",
          variant: "destructive",
          duration: 3000,
        });
        return;
      }
      
      if (!dogWeight) {
        toast({
          title: "Please enter dog weight",
          description: "Dog weight is required for weight pull class",
          variant: "destructive",
          duration: 3000,
        });
        return;
      }
      
      if (!weightPulled) {
        toast({
          title: "Please enter weight pulled",
          description: "Weight pulled is required for weight pull class",
          variant: "destructive",
          duration: 3000,
        });
        return;
      }
    } else if (selectedStatus === "started" && (!raceTime || raceTime.trim() === "")) {
      toast({
        title: "Please enter a race time",
        description: "Please enter a race time for the race",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    const allDogs = selectedRows.length > 0 ? selectedRows : [...manualDogInput];

    if (allDogs.length === 0) {
      toast({
        title: "Please select at least one dog",
        description: "Please select at least one dog",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    // Only check for duplicates when adding a new entrant, not when editing
    // Weight pull allows multiple entries per driver (each dog competes individually)
    // Other race types only allow one entry per driver per class (dogs work as a team)
    if (!editingEntrant && selectedRadio !== "weight pull") {
      const isDuplicate = entrants.some((entrant: Entrant) => {
        if (selectedRaceFormat === "Heated") {
          return entrant.driver === driverName && 
                 entrant.class === selectedRadio && 
                 entrant.customClass === (selectedClass === "add custom class" ? customClass : selectedClass) &&
                 entrant.heat === dialogSelectedHeat;
        } else {
          return entrant.driver === driverName && 
                 entrant.class === selectedRadio &&
                 entrant.customClass === (selectedClass === "add custom class" ? customClass : selectedClass);
        }
      });
      
      if (isDuplicate) {
        const message = selectedRaceFormat === "Heated" 
          ? `Driver already exists in ${dialogSelectedHeat} for this class`
          : "Driver already exists for this class";
        toast({
          title: message,
          description: message,
          variant: "destructive",
          duration: 3000,
        });
        return;
      }
    }

    // Get the correct heat, temperature and distance
    const selectedHeatForEntrant = selectedRaceFormat === "Heated" ? dialogSelectedHeat : null;
    console.log(`Selected heat for entrant: ${selectedHeatForEntrant}`);
    
    // Get the heat data for the selected heat and class
    const heatData = selectedRaceFormat === "Heated" 
      ? heatDataList.find(data => 
          data.heat === selectedHeatForEntrant && 
          data.class === classKey
        )
      : null;
    
    console.log(`Heat data found: ${Boolean(heatData)}`);
    if (heatData) {
      console.log(`Heat data details:`, heatData);
    }
    console.log(`Available heat data list:`, heatDataList);
    console.log(`Looking for heat: ${selectedHeatForEntrant}, class: ${classKey}`);
    
    // Get temperature and distance from the selected heat data
    let currentTemp, currentDist;
    
    if (selectedRaceFormat === "Heated") {
      // For heated races, always use heat-specific data
      if (!heatData) {
        console.error(`No heat data found for heat: ${selectedHeatForEntrant}, class: ${classKey}`);
        toast({
          title: "Heat data not found",
          description: `No temperature/distance data found for ${selectedHeatForEntrant}. Please configure heat data first.`,
          variant: "destructive",
          duration: 3000,
        });
        return;
      }
      currentTemp = heatData.temperature;
      currentDist = heatData.distance;
      console.log(`Using heat-specific data - Heat: ${selectedHeatForEntrant}, Temp: ${currentTemp}, Dist: ${currentDist}`);
    } else {
      // For non-heated races, use global temperature/distance
      currentTemp = temperature;
      currentDist = distance;
      console.log(`Using global data - Temp: ${currentTemp}, Dist: ${currentDist}`);
    }
    
    console.log(`Final values - Temperature: ${currentTemp}, Distance: ${currentDist}`);
    
    // Format temperature and distance without unnecessary decimal places
    const formattedTemp = currentTemp ? String(parseFloat(currentTemp)) : null;
    const formattedDist = currentDist ? String(parseFloat(currentDist)) : null;
    
    if (formattedTemp && parseFloat(formattedTemp) > 13) {
      toast({
        title: "Temperature too high",
        description: "Temperature should not be above 13 degrees",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }
    
    if (formattedDist && parseFloat(formattedDist) < 3 && selectedRadio !== "weight pull") {
      toast({
        title: "Distance too short",
        description: "The minimum distance should be 3 or 5 km",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    // Construct heatsData for the new entrant
    const heatsDataForEntrant: HeatDataForBackend[] = [];
    
    if (selectedRaceFormat === "Heated" && heatData) {
      // For heated races, use the specific heat data
      heatsDataForEntrant.push({
        heat: selectedHeatForEntrant || 'Heat 1',
        temperature: heatData.temperature,
        distance: heatData.distance,
        class: `${selectedRadio}${showClassInput || selectedClass?.toLowerCase() === "add custom class" ? `:${customClass}` : selectedClass ? `:${selectedClass}` : ''}`
      });
    } else {
      // For single races, create a single heat entry
      heatsDataForEntrant.push({
        heat: 'Heat 1',
        temperature: formattedTemp || '',
        distance: formattedDist || '',
        class: `${selectedRadio}${showClassInput || selectedClass?.toLowerCase() === "add custom class" ? `:${customClass}` : selectedClass ? `:${selectedClass}` : ''}`
      });
    }

    const newEntrant: Entrant = {
      driver: driverName,
      raceFormat: selectedRaceFormat,
      class: selectedRadio,
      customClass: showClassInput || selectedClass?.toLowerCase() === "add custom class" ? customClass : selectedClass,
      dogs: allDogs,
      raceType: selectedStatus,
      raceTime: selectedStatus === "started" ? formatRaceTime(raceTime) : null,
      heat: selectedRaceFormat === "Heated" ? selectedHeatForEntrant : null,
      temperature: formattedTemp,
      distance: formattedDist,
      dogWeight: selectedRadio === "weight pull" && selectedStatus === "started" ? dogWeight : null,
      weightPulled: selectedRadio === "weight pull" && selectedStatus === "started" ? weightPulled : null,
      heatsData: heatsDataForEntrant
    };

    // Debug logs for race time
    if (selectedStatus === "started") {
      if (selectedRadio === "weight pull") {
        console.log("Weight pull values - Race time:", formatRaceTime(raceTime), "Dog weight:", dogWeight, "Weight pulled:", weightPulled);
      } else {
        console.log("Input race time:", raceTime);
        console.log("Formatted race time:", formatRaceTime(raceTime));
        console.log("Saved entrant race time:", newEntrant.raceTime);
      }
    }

    console.log("Adding new entrant:", newEntrant);

    if (editingEntrant && editEntrantIndex !== null) {
      const updatedEntrants = [...entrants];
      updatedEntrants[editEntrantIndex] = newEntrant;
      setEntrants(updatedEntrants);
      console.log("Updated entrant at index:", editEntrantIndex);
      
      toast({
        title: "Musher updated",
        description: "The musher has been updated in the entrants list.",
        variant: "default",
        duration: 3000,
      });
    } else {
      setEntrants(prev => [...prev, newEntrant]);
      console.log("Added new entrant");
      
      toast({
        title: "Musher added to entrants",
        description: "The musher has been added to the entrants list.",
        variant: "default",
        duration: 3000,
      });
    }
    
    // Reset full form state instead of just dialog fields and close dialog
    setOpen(false);
    resetFullFormState(true); // Pass true to force complete reset
  };

  const filteredDogs = driverName && data?.getAllDogs
    ? data.getAllDogs.filter((dog: any) => 
        dog.driverName?.toLowerCase() === driverName.toLowerCase()
      )
    : [];

  const handleDeleteClick = (id: string | undefined) => {
    if (!id) return;
    setManualDogInput((prevManualDogInput) =>
      prevManualDogInput.filter((dog) => dog.id !== id)
    );
    setSelectedRows((prevSelectedRows) =>
      prevSelectedRows.filter((dog) => dog.id !== id)
    );
  };

  const handleBackToEvents = () => {
    // Check if we came from the calendar dashboard
    const searchParams = new URLSearchParams(window.location.search);
    const fromCalendar = searchParams.get('from') === 'calendar';
    
    if (fromCalendar) {
      router.push("/events?tab=1");
    } else {
      router.push("/dashboard/calendar?tab=2");
    }
  };

  useEffect(() => {
    if (!open) {
      // Only reset dialog-specific state when dialog closes
      console.log("Dialog closed - resetting only dialog state");
      resetDialogState();
    }
  }, [open]);

  // Add function to handle heat removal
  const handleRemoveHeat = (heatToRemove: string) => {
    const classKey = getCurrentClassKey();
    if (!classKey) return;
    
    // Get the heats for this class
    const currentHeats = heatsMap[classKey] || ["Heat 1"];
    
    // Don't allow removing the last heat
    if (currentHeats.length <= 1) {
      toast({
        title: "Cannot remove heat",
        description: "You need at least one heat for this race",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }
    
    // Remove the heat from heats array for this class
    const updatedHeats = currentHeats.filter(heat => heat !== heatToRemove);
    const updatedHeatsMap = {
      ...heatsMap,
      [classKey]: updatedHeats
    };
    setHeatsMap(updatedHeatsMap);
    
    // Remove any heat data associated with this heat and class
    const updatedHeatDataList = heatDataList.filter(data => 
      !(data.heat === heatToRemove && data.class === classKey)
    );
    setHeatDataList(updatedHeatDataList);
    
    // If we removed the currently selected heat, select the first available heat
    if (selectedHeat === heatToRemove && updatedHeats.length > 0) {
      setSelectedHeat(updatedHeats[0]);
      
      // Update temperature and distance fields with the new selected heat's data
      const newSelectedHeatData = updatedHeatDataList.find(data => 
        data.heat === updatedHeats[0] && data.class === classKey
      );
      
      if (newSelectedHeatData) {
        setTemperature(newSelectedHeatData.temperature);
        setDistance(newSelectedHeatData.distance);
        setCurrentHeatData(newSelectedHeatData);
        setIsTempDistanceSubmitted(true);
      } else {
        setTemperature("");
        setDistance("");
        setCurrentHeatData(null);
        setIsTempDistanceSubmitted(false);
      }
    }
  };

  // Modify handleTempSave to include dog weight and weight pulled for weight pull class
  const handleTempSave = async () => {
    if (!driverName) {
      toast({
        title: "Please enter a driver name",
        description: "Please enter a driver name",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    if (!selectedStatus) {
      toast({
        title: "Please select a race type",
        description: "Please select a race type",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    // Special validation for weight pull
    if (selectedRadio === "weight pull" && selectedStatus === "started") {
      if (!raceTime || raceTime.trim() === "") {
        toast({
          title: "Please enter a race time",
          description: "Race time is required for weight pull class",
          variant: "destructive",
          duration: 3000,
        });
        return;
      }
      
      if (!dogWeight) {
        toast({
          title: "Please enter dog weight",
          description: "Dog weight is required for weight pull class",
          variant: "destructive",
          duration: 3000,
        });
        return;
      }
      
      if (!weightPulled) {
        toast({
          title: "Please enter weight pulled",
          description: "Weight pulled is required for weight pull class",
          variant: "destructive",
          duration: 3000,
        });
        return;
      }
    } else if (selectedStatus === "started" && (!raceTime || raceTime.trim() === "")) {
      toast({
        title: "Please enter a race time",
        description: "Please enter a race time for the race",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }
    
    const allDogs = selectedRows.length > 0 ? selectedRows : [...manualDogInput];
    
    if (allDogs.length === 0) {
      toast({
        title: "Please select at least one dog",
        description: "Please select at least one dog",
        variant: "destructive",
      });
      return;
    }
    
    // Check if musher exists
    const musherExists = clubMushers.some(
      musher => musher.name.toLowerCase().trim() === driverName.toLowerCase().trim()
    );
    
    // If the musher doesn't exist, create a new one
    if (!musherExists) {
      try {
        console.log(`Creating new musher: ${driverName}`);
        
        // Extract dogs for the new musher
        const dogData = selectedRows.length > 0 
          ? selectedRows.map(dog => ({
              name: dog.name || "",
              nzfssNo: dog.NZFSSRegistration || "",
              dateOfBirth: dog.dob || null, // Use null instead of empty string for optional DOB
              breed: dog.breed || "",
              pedigreeName: dog.pedigreeName || "", // Use actual pedigree name from Dogs object
              nzkcNo: "", // Required by MusherDog type
              deceased: false
            }))
          : manualDogInput.map(dog => ({
              name: dog.name || "",
              nzfssNo: dog.NZFSSRegistration || "",
              dateOfBirth: dog.dob || null, // Use null instead of empty string for optional DOB
              breed: dog.breed || "",
              pedigreeName: dog.pedigreeName || "", // Use actual pedigree name from Dogs object
              nzkcNo: "", // Required by MusherDog type
              deceased: false
            }));
        
        // Create the musher
        const musherInput = {
          name: driverName,
          registrationNo: "", // Can be empty initially
          kennelRegistrationNo: "", // Can be empty initially
          clubId: "default", // Required field
          dogs: dogData
        };
        
        const musherResult = await createMusher({
          variables: {
            input: musherInput,
          },
        });
        
        console.log("Musher created:", musherResult);
        
        // Add the new musher to clubMushers for immediate use
        if (musherResult?.data?.createMusher) {
          const newMusher: Musher = {
            id: musherResult.data.createMusher.id,
            name: driverName,
            registrationNo: "",
            kennelRegistrationNo: "",
            club: "",
            dogs: dogData.map(dog => ({
              _id: Math.random().toString(36).substr(2, 9), // Temporary ID
              name: dog.name,
              pedigreeName: dog.pedigreeName,
              nzkcNo: dog.nzkcNo,
              nzfssNo: dog.nzfssNo,
              dateOfBirth: dog.dateOfBirth,
              breed: dog.breed,
              deceased: dog.deceased
            }))
          };
          
          // Check if this musher is already in the list to prevent duplicates
          const alreadyExists = clubMushers.some(musher => 
            musher.id === newMusher.id || 
            musher.name.toLowerCase().trim() === newMusher.name.toLowerCase().trim()
          );
          
          if (!alreadyExists) {
            setClubMushers([...clubMushers, newMusher]);
            setSelectedMusher(newMusher);
          } else {
            console.log(`Musher ${newMusher.name} already exists in the list, not adding again`);
            // Find the existing musher and select it
            const existingMusher = clubMushers.find(musher => 
              musher.name.toLowerCase().trim() === newMusher.name.toLowerCase().trim()
            );
            if (existingMusher) {
              setSelectedMusher(existingMusher);
            }
          }
          
          toast({
            title: "New musher created",
            description: `Musher "${driverName}" has been created with ${dogData.length} dog(s)`,
            variant: "default",
            duration: 3000,
          });
        }
      } catch (error) {
        console.error("Error creating musher:", error);
        toast({
          title: "Error creating musher",
          description: "Could not create musher, but will continue with adding the entrant.",
          variant: "destructive",
          duration: 3000,
        });
      }
    }
    
    // Only check for duplicates when adding a new entrant, not when editing
    // Weight pull allows multiple entries per driver (each dog competes individually)
    // Other race types only allow one entry per driver per class (dogs work as a team)
    if (!editingEntrant && selectedRadio !== "weight pull") {
      const isDuplicate = entrants.some((entrant: Entrant) => {
        if (selectedRaceFormat === "Heated") {
          return entrant.driver === driverName && 
                 entrant.class === selectedRadio && 
                 entrant.customClass === (selectedClass === "add custom class" ? customClass : selectedClass) &&
                 entrant.heat === dialogSelectedHeat;
        } else {
          return entrant.driver === driverName && 
                 entrant.class === selectedRadio &&
                 entrant.customClass === (selectedClass === "add custom class" ? customClass : selectedClass);
        }
      });
      
      if (isDuplicate) {
        const message = selectedRaceFormat === "Heated" 
          ? `Driver already exists in ${dialogSelectedHeat} for this class`
          : "Driver already exists for this class";
        toast({
          title: message,
          description: message,
          variant: "destructive",
        });
        return;
      }
    }
    
    // Get the correct heat data
    const classKey = getCurrentClassKey();
    console.log(`Dialog selected heat: ${dialogSelectedHeat}, Class key: ${classKey}`);
    
    // Get heat, temperature and distance data
    const currentTemp = selectedRaceFormat === "Heated" 
      ? heatDataList.find(data => data.heat === dialogSelectedHeat && data.class === classKey)?.temperature || temperature
      : temperature;
      
    const currentDist = selectedRaceFormat === "Heated"
      ? heatDataList.find(data => data.heat === dialogSelectedHeat && data.class === classKey)?.distance || distance
      : distance;
      
    // Format temperature and distance without unnecessary decimal places
    const formattedTemp = currentTemp ? String(parseFloat(currentTemp)) : null;
    const formattedDist = currentDist ? String(parseFloat(currentDist)) : null;
    
    // Validate temperature and distance
    if (formattedTemp && parseFloat(formattedTemp) > 13) {
      toast({
        title: "Temperature too high",
        description: "Temperature should not be above 13 degrees",
        variant: "destructive",
      });
      return;
    }
    
    if (formattedDist && parseFloat(formattedDist) < 3 && selectedRadio !== "weight pull") {
      toast({
        title: "Distance too short",
        description: "The minimum distance should be 3 or 5 km",
        variant: "destructive",
      });
      return;
    }
    
    // Debug logs for race time
    if (selectedStatus === "started") {
      console.log("handleSaveMusher - Input race time:", raceTime);
      console.log("handleSaveMusher - Formatted race time:", formatRaceTime(raceTime));
    }
    
    // Extract all heat data for this class
    const classHeats = heatDataList.filter(data => data.class === classKey);
    
    // Format the heat data
    const allHeatsData = classHeats.map(heat => ({
      heat: heat.heat,
      temperature: heat.temperature,
      distance: heat.distance,
      class: heat.class
    }));
    
    // Create new entrant object
    const newEntrant: Entrant = {
      driver: driverName,
      raceFormat: selectedRaceFormat,
      class: selectedRadio,
      customClass: showClassInput || selectedClass?.toLowerCase() === "add custom class" ? customClass : selectedClass,
      dogs: allDogs,
      raceType: selectedStatus,
      raceTime: selectedStatus === "started" ? formatRaceTime(raceTime) : null,
      heat: selectedRaceFormat === "Heated" ? dialogSelectedHeat : null,
      temperature: formattedTemp,
      distance: formattedDist,
      heatsData: allHeatsData, // Add all heats data to entrant
      dogWeight: selectedRadio === "weight pull" && selectedStatus === "started" ? dogWeight : null,
      weightPulled: selectedRadio === "weight pull" && selectedStatus === "started" ? weightPulled : null
    };
    
    console.log("New entrant:", newEntrant);
    
    // Update entrants array
    if (editingEntrant && editEntrantIndex !== null) {
      const updatedEntrants = [...entrants];
      updatedEntrants[editEntrantIndex] = newEntrant;
      setEntrants(updatedEntrants);
      console.log("Updated entrant at index:", editEntrantIndex);
    } else {
      setEntrants(prev => [...prev, newEntrant]);
      console.log("Added new entrant");
    }
    
    // Show success message
    toast({
      title: "Musher added to entrants",
      description: `Musher added to ${selectedRaceFormat === "Heated" ? dialogSelectedHeat : "race"}`,
      variant: "default",
      duration: 3000,
    });
    
    // Reset form fields and editing state including dog weight and weight pulled
    setDriverName("");
    setSelectedRows([]);
    setManualDogInput([]);
    setDogName("");
    setRegistration("");
    setDob("");
    setBreed("");
    setDogDobDate(undefined);
    setShowInput(false);
    setSelectedStatus(""); // Explicitly reset race type selection
    setRaceTime(""); // Reset race time
    setDogWeight(""); // Reset dog weight
    setWeightPulled(""); // Reset weight pulled
    setSelectedMusher(null);
    setEditingEntrant(null);
    setEditEntrantIndex(null);
  };

  // Add useEffect to properly reset the race time field when selectedStatus changes
  useEffect(() => {
    if (selectedStatus !== "started") {
      setRaceTime("");
    }
  }, [selectedStatus]);

  // Add a getter for current class key
  const getCurrentClassKey = (): string => {
    if (!selectedRadio || !selectedClass) return "";
    
    // Use the custom class if "Add Custom Class" is selected (case-insensitive check)
    if (selectedClass.toLowerCase() === "add custom class" || 
        selectedClass === "Add Custom Class" ||
        showClassInput) {
      if (customClass) {
        return `${selectedRadio}:${customClass}`;
      }
    }
    
    // Otherwise use the selected class
    return `${selectedRadio}:${selectedClass}`;
  };

  // Add getter for class-specific heats
  const getHeatsForCurrentClass = (): string[] => {
    const classKey = getCurrentClassKey();
    if (!classKey) return ["Heat 1"];
    
    return heatsMap[classKey] || ["Heat 1"];
  };

  // Add helper to get heat data for current class
  const getHeatDataForCurrentClass = (): HeatData[] => {
    const classKey = getCurrentClassKey();
    if (!classKey) return [];
    
    return heatDataList.filter(data => data.class === classKey);
  };

  // Improve handleAddHeat function
  const handleAddHeat = () => {
    const classKey = getCurrentClassKey();
    if (!classKey) {
      console.log("Cannot add heat: No class selected");
      toast({
        title: "Cannot add heat",
        description: "Please select a class first",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }
    
    console.log(`Adding new heat for class: ${classKey}`);
    
    // Get the heats for this class
    const currentHeats = [...(heatsMap[classKey] || ["Heat 1"])];
    const newHeatNumber = currentHeats.length + 1;
    const newHeat = `Heat ${newHeatNumber}`;
    
    console.log(`Current heats for ${classKey}:`, currentHeats);
    console.log(`Adding new heat: ${newHeat}`);
    
    // Update the heats map for this class
    const updatedHeatsMap = {
      ...heatsMap,
      [classKey]: [...currentHeats, newHeat]
    };
    setHeatsMap(updatedHeatsMap);
    setSelectedHeat(newHeat);
    setDialogSelectedHeat(newHeat);
    
    // Create a new heat data for this heat
    const newHeatData: HeatData = {
      heat: newHeat,
      temperature: "",
      distance: "",
      class: classKey
    };
    
    // Add this heat data to the list
    setHeatDataList(prevList => [...prevList, newHeatData]);
    
    // Reset temperature and distance for new entry
    setTemperature("");
    setDistance("");
    setCurrentHeatData(newHeatData);
    setIsTempDistanceSubmitted(false);
    
    toast({
      title: "New heat added",
      description: `Added ${newHeat} for ${classKey}`,
      variant: "default",
      duration: 3000,
    });
  };

  // Modify resetDialogState function to perform a more basic reset of just dialog fields
  const resetDialogState = () => {
    // Reset dialog form fields only including dog weight and weight pulled
    setDriverName("");
    setSelectedRows([]);
    setManualDogInput([]);
    setDogName("");
    setRegistration("");
    setDob("");
    setBreed("");
    setDogDobDate(undefined);
    setShowInput(false);
    setSelectedStatus(null); // Explicitly set to null
    setRaceTime("");
    setDogWeight("");
    setWeightPulled("");
    setIsDisabled(false);
    setButtonText("Add");
    
    // Reset editing state
    setEditingEntrant(null);
    setEditEntrantIndex(null);
    
    // Reset other dogs state
    resetOtherDogsState();
  };

  // Modify resetFullFormState to always reset all form-related state
  const resetFullFormState = (forceCompleteReset = false) => {
    // Always reset dialog state first
    resetDialogState();
    
    // Always perform a complete reset of other form state
    setSelectedRaceFormat(null);
    setSelectedRadio(null);
    setSelectedClass(null);
    setCustomClass("");
    setShowClassInput(false);
    setIsDropdownDisabled(false);
    setAddClassButtonText("Add Class");
    setSelectedHeat("Heat 1");
    setTemperature("");
    setDistance("");
    setIsTempDistanceSubmitted(false);
    setIsTempDistanceReadOnly(false);
    setSelectedStatus("");
    setHeatEnabled(false);
    
    // Only reset these if forceCompleteReset is true
    if (forceCompleteReset) {
      // Reset heat-related state completely for a fresh start
      setHeatsMap({});
      setHeatDataList([]);
      setCurrentHeatData(null);
      setTempMusherData([]); // Clear temporary musher data
      setDialogSelectedHeat("Heat 1");
    }
  };

  const [dogWeight, setDogWeight] = useState<string>("");
  const [weightPulled, setWeightPulled] = useState<string>("");

  // Add new useEffect to populate all other dogs when clubMushers changes
  useEffect(() => {
    if (clubMushers.length > 0) {
      // Get all dogs from all mushers except the selected one
      const otherMushers = selectedMusher 
        ? clubMushers.filter(musher => musher.id !== selectedMusher.id)
        : clubMushers;
      
      const allDogs = otherMushers.flatMap(musher => 
        musher.dogs.map(dog => ({
          ...dog,
          musherName: musher.name // Add musher name for display
        }))
      );
      
      setAllOtherDogs(allDogs);
    }
  }, [clubMushers, selectedMusher]);

  // Filter other dogs based on search
  const filteredOtherDogs = allOtherDogs.filter(dog => {
    if (!otherDogsSearch.trim()) return true;
    
    const searchTerm = otherDogsSearch.toLowerCase();
    return (
      dog.name.toLowerCase().includes(searchTerm) ||
      dog.breed.toLowerCase().includes(searchTerm) ||
      (dog.nzfssNo && dog.nzfssNo.toLowerCase().includes(searchTerm)) ||
      (dog.musherName && dog.musherName.toLowerCase().includes(searchTerm))
    );
  });

  // Get the dogs to display (with pagination)
  const displayedOtherDogs = filteredOtherDogs.slice(0, otherDogsDisplayCount);

  // Add new function to handle other dog selection
  const handleOtherDogSelect = (dog: MusherDog) => {
    // Create a unique identifier using dog's original ID and musher name
    const uniqueId = `${dog._id}-${dog.musherName || ''}`;
    
    // Check if dog is already selected using the unique identifier
    const isSelected = selectedRows.some(selected => 
      selected.id === uniqueId
    );
    
    if (isSelected) {
      // Remove dog from selection
      setSelectedRows(selectedRows.filter(selected => 
        selected.id !== uniqueId
      ));
    } else {
      // Add dog to selection
      const formattedDog: Dogs = {
        id: uniqueId, // Use the unique identifier
        name: dog.name || "",
        pedigreeName: dog.pedigreeName || "",
        NZFSSRegistration: cleanRegistrationNumber(dog.nzfssNo, dog.name) || "",
        dob: dog.dateOfBirth || "",
        breed: dog.breed || ""
      };
      setSelectedRows([...selectedRows, formattedDog]);
    }
  };

  // Reset other dogs search when dialog opens/closes
  const resetOtherDogsState = () => {
    setOtherDogsSearch("");
    setOtherDogsDisplayCount(10);
  };

  // Add placeholder functions that were removed
  const handleSaveMusher = async () => {
    console.log("handleSaveMusher called - validating form and adding entrant");
    
    // Validate required fields
    if (!driverName.trim()) {
      toast({
        title: "Please enter a driver name",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }
    
    if (!selectedRaceFormat) {
      toast({
        title: "Please select a race format",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }
    
    if (!selectedRadio) {
      toast({
        title: "Please select a class type",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }
    
    if (!selectedClass && !customClass) {
      toast({
        title: "Please select a specific class",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }
    
    if (!selectedStatus) {
      toast({
        title: "Please select a race type",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }
    
    // Special validation for weight pull class
    if (selectedRadio === "weight pull" && selectedStatus === "started") {
      if (!raceTime || raceTime.trim() === "") {
        toast({
          title: "Please enter a race time",
          description: "Race time is required for weight pull class",
          variant: "destructive",
          duration: 3000,
        });
        return;
      }
      
      if (!dogWeight) {
        toast({
          title: "Please enter dog weight",
          description: "Dog weight is required for weight pull class",
          variant: "destructive",
          duration: 3000,
        });
        return;
      }
      
      if (!weightPulled) {
        toast({
          title: "Please enter weight pulled",
          description: "Weight pulled is required for weight pull class",
          variant: "destructive",
          duration: 3000,
        });
        return;
      }
    } else if (selectedStatus === "started" && (!raceTime || raceTime.trim() === "")) {
      toast({
        title: "Please enter a race time",
        description: "Please enter a race time for the race",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }
    
    const allDogs = selectedRows.length > 0 ? selectedRows : [...manualDogInput];
    
    if (allDogs.length === 0) {
      toast({
        title: "Please select at least one dog",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    // For weight pull, always create separate entries for each dog
    // For other race types, check for existing driver to update or create single entry
    let existingEntrantIndex = -1;
    const classValue = showClassInput || selectedClass?.toLowerCase() === "add custom class" ? customClass : selectedClass;
    
    if (selectedRadio !== "weight pull") {
      // For non-weight pull races, find existing driver to update
      existingEntrantIndex = entrants.findIndex(entrant => 
        entrant.driver.toLowerCase() === driverName.toLowerCase() &&
        entrant.class === selectedRadio &&
        entrant.customClass === classValue
      );
    }

    if (selectedRadio === "weight pull") {
      // For weight pull, create separate entries for each dog
      const newEntrants = allDogs.map(dog => ({
        driver: driverName,
        raceFormat: selectedRaceFormat,
        class: selectedRadio,
        customClass: classValue,
        dogs: [dog], // Single dog per entry for weight pull
        raceType: selectedStatus,
        raceTime: selectedStatus === "started" ? formatRaceTime(raceTime) : null,
        heat: selectedRaceFormat === "Heated" ? dialogSelectedHeat : null,
        temperature: temperature,
        distance: distance,
        dogWeight: selectedStatus === "started" ? dogWeight : null,
        weightPulled: selectedStatus === "started" ? weightPulled : null
      }));

      console.log(`Adding ${newEntrants.length} separate weight pull entries for each dog:`, newEntrants);
      
      // Add all weight pull entries
      setEntrants(prev => [...prev, ...newEntrants]);
      
      // Show success message indicating multiple entries
      toast({
        title: "Weight pull entries added",
        description: `${newEntrants.length} separate entries added for driver "${driverName}" (one per dog)`,
        variant: "default",
        duration: 3000,
      });
    } else if (existingEntrantIndex >= 0) {
      // Update existing entrant for non-weight pull races
      const updatedEntrant = {
        driver: driverName,
        raceFormat: selectedRaceFormat,
        class: selectedRadio,
        customClass: classValue,
        dogs: allDogs, // All dogs together for non-weight pull
        raceType: selectedStatus,
        raceTime: selectedStatus === "started" ? formatRaceTime(raceTime) : null,
        heat: selectedRaceFormat === "Heated" ? dialogSelectedHeat : null,
        temperature: temperature,
        distance: distance,
        dogWeight: null, // Not applicable for non-weight pull
        weightPulled: null // Not applicable for non-weight pull
      };

      console.log("Updating existing entrant:", updatedEntrant);
      
      setEntrants(prev => {
        const updated = [...prev];
        updated[existingEntrantIndex] = updatedEntrant;
        return updated;
      });
      
      toast({
        title: "Entrant updated",
        description: `Driver "${driverName}" entry has been updated`,
        variant: "default",
        duration: 3000,
      });
    } else {
      // Create new entrant for non-weight pull races
      const newEntrant = {
        driver: driverName,
        raceFormat: selectedRaceFormat,
        class: selectedRadio,
        customClass: classValue,
        dogs: allDogs, // All dogs together for non-weight pull
        raceType: selectedStatus,
        raceTime: selectedStatus === "started" ? formatRaceTime(raceTime) : null,
        heat: selectedRaceFormat === "Heated" ? dialogSelectedHeat : null,
        temperature: temperature,
        distance: distance,
        dogWeight: null, // Not applicable for non-weight pull
        weightPulled: null // Not applicable for non-weight pull
      };
      
      console.log("Adding new entrant:", newEntrant);
      
      // Update entrants array
      setEntrants(prev => [...prev, newEntrant]);
      
      // Show success message
      toast({
        title: "Musher added to entrants",
        description: `Musher "${driverName}" has been added to the entrants list.`,
        variant: "default",
        duration: 3000,
      });
    }
    
    // Reset form fields
    setDriverName("");
    setSelectedRows([]);
    setManualDogInput([]);
    setSelectedStatus("");
    setRaceTime("");
    setDogWeight("");
    setWeightPulled("");
    setSelectedMusher(null);
  };

  const handleSaveResults = async () => {
    console.log("handleSaveResults called - saving all entrants to database");
    
    if (entrants.length === 0) {
      toast({
        title: "No entrants to save",
        description: "Please add at least one entrant before saving results",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    if (loading) {
      console.log("Already loading, skipping save");
      return;
    }

    try {
      console.log(`Saving ${entrants.length} entrants to event ${eventId}`);
      
      // Process each entrant and save to database
      for (const entrant of entrants) {
        console.log("Processing entrant:", entrant);
        
        // Prepare the data for the mutation
        const resultData = {
          eventId: eventId,
          name: entrant.driver, // GraphQL expects 'name' not 'driver'
          raceFormat: entrant.raceFormat,
          class: entrant.class,
          customClass: entrant.customClass,
          associatedDog: entrant.dogs.map(dog => ({
            dogId: dog.dogId || undefined,
            driverName: entrant.driver,
            name: getDogDisplayName(dog),
            NZFSSRegistration: dog.NZFSSRegistration,
            dob: dog.dob,
            breed: dog.breed
          })),
          raceType: entrant.raceType,
          raceTime: entrant.raceTime,
          heat: entrant.heat,
          temperature: entrant.temperature || null, // Keep as string
          distance: entrant.distance || null, // Keep as string
          dogWeight: entrant.dogWeight || null, // Keep as string
          weightPulled: entrant.weightPulled || null, // Keep as string
          // Add heatsData to ensure it's saved with the entrant
          heatsData: entrant.heatsData || [{
            heat: entrant.heat || 'Heat 1',
            temperature: entrant.temperature || '',
            distance: entrant.distance || '',
            class: `${entrant.class}${entrant.customClass ? `:${entrant.customClass}` : ''}`
          }]
        };

        console.log("Saving result data:", resultData);

        // Save to database using the GraphQL mutation
        const result = await createEntrant({
          variables: {
            input: resultData,
          },
        });

        console.log("Result saved successfully:", result);
      }

      // Show success message
      toast({
        title: "Results saved successfully!",
        description: `Successfully saved ${entrants.length} entrant(s) to the event`,
        variant: "default",
        duration: 3000,
      });

      // Clear the entrants list after successful save
      setEntrants([]);
      
      // Reset all form state
      resetFullFormState(true);
      
      // Navigate back to events
      setTimeout(() => {
        const searchParams = new URLSearchParams(window.location.search);
        const fromCalendar = searchParams.get('from') === 'calendar';
        
        if (fromCalendar) {
          router.push("/events?tab=1");
        } else {
          router.push("/dashboard/calendar?tab=2");
        }
      }, 1500);

    } catch (error) {
      console.error("Error saving results:", error);
      toast({
        title: "Error saving results",
        description: "There was an error saving the results. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  // Utility to compare two dog arrays (order-agnostic) by name & registration
  function areDogsSame(dogsA: Dogs[], dogsB: Dogs[]): boolean {
    if (dogsA.length !== dogsB.length) return false;
    const key = (d: Dogs) => `${d.name.toLowerCase()}|${(d.NZFSSRegistration || '').toLowerCase()}`;
    const setA = dogsA.map(key).sort().join(',');
    const setB = dogsB.map(key).sort().join(',');
    return setA === setB;
  }

  return (
    <div>
      <div className="px-6 ">
        <div className="border rounded-b-[24px] overflow-hidden">
          <div className="relative overflow-x-auto">
            <div className="bg-[#F3F3F3] p-4 flex items-center">
              <button 
                onClick={handleBackToEvents}
                className="flex items-center text-[#2A72DF] font-[600]"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
                  <path d="M19 12H5" stroke="#2A72DF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 19L5 12L12 5" stroke="#2A72DF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Back to Events
              </button>
            </div>
            <div
              className={`overflow-y-auto ${
                startWithEvents
                  ? "max-h-[calc(70vh-55px)] h-[calc(70vh-55px)] xl:h-[calc(75vh-55px)] xl:max-h-[calc(75vh-55px)] 2xl:max-h-[calc(70vh-55px)] 2xl:h-[calc(70vh-55px)] 2.5xl:h-[calc(80vh-55px)] 2.5xl:max-h-[calc(80vh-55px)] 3xl:h-[calc(82vh-55px)] 3xl:max-h-[calc(82vh-55px)]"
                  : "max-h-[70vh] h-[70vh] xl:h-[75vh] xl:max-h-[75vh]  2xl:max-h-[70vh] 2xl:h-[70vh] 2.5xl:h-[80vh] 2.5xl:max-h-[80vh] 3xl:h-[82vh] 3xl:max-h-[82vh] "
              } bg-[#F3F3F3]`}
            >
              <div className="w-full h-[135px] grid grid-cols-3 ">
                <div className="py-[16px] px-[16px] flex flex-col gap-y-[15px] border-b-[1px]">
                  <h3 className="font-[600] text-[1.13rem] leading-[21.6px]">
                    Select race format
                  </h3>
                  <p className="font-[600] text-[1rem] leading-[19.2px] text-[#696A6A]">
                    Select the appropriate race format
                  </p>
                </div>
                <div className="py-[16px] pl-[76px] col-span-2  border-b-[1px] w-full h-full flex justify-start items-center">
                  <div className="w-[448px]">
                    <SelectComponent
                      key={`race-format-${selectedRaceFormat || 'empty'}`}
                      placeholder="Select race format"
                      items={["Single", "Heated"]}
                      onChange={handleSelectChange}
                      value={selectedRaceFormat || undefined}
                      disabled={isTempDistanceSubmitted && selectedRaceFormat === "Heated" && heatDataList.length > 0}
                    />
                    {/* Debug info - remove this later */}
                  </div>
                </div>
              </div>

              <div className="w-full h-[135px] grid grid-cols-3 ">
                {selectedRaceFormat && (
                  <div className="py-[16px] px-[16px] flex flex-col gap-y-[15px] border-b-[1px]">
                    <h3 className="font-[600] text-[1.13rem] leading-[21.6px]">
                      Select class
                    </h3>
                    <div>
                      <RadioGroup
                        className="flex gap-x-[15px] items-center"
                        onValueChange={handleRadioChange}
                        value={selectedRadio || ""}
                      >
                        <div className="flex items-center space-x-2 ">
                          <RadioGroupItem value="speed" />
                          <Label className="text-[16px] font-[600] text-[#000000]">
                            Speed
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 ">
                          <RadioGroupItem value="freight" />
                          <Label className="text-[16px] font-[600] text-[#000000]">
                            Freight
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 ">
                          <RadioGroupItem value="snow" />
                          <Label className="text-[16px] font-[600] text-[#000000]">
                            Snow
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 ">
                          <RadioGroupItem value="weight pull" />
                          <Label className="text-[16px] font-[600] text-[#000000]">
                            Weight pull
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                )}

                {selectedRadio && (
                  <div className="py-[16px] pl-[76px] col-span-2  border-b-[1px] w-full h-full flex justify-start items-center">
                    <div className="w-[448px]">
                      {!showClassInput && (
                        <SelectComponent
                          key={`class-${selectedRadio || 'empty'}-${selectedClass || 'empty'}`}
                          placeholder="Please Select a class"
                          items={selectedClassType}
                          onChange={handleClassChange}
                          disabled={isDropdownDisabled}
                          value={selectedClass || undefined}
                        />
                      )}

                      {showClassInput && (
                        <input
                          type="text"
                          placeholder="Enter custom class"
                          value={customClass}
                          onChange={handleCustomClassChange}
                          className="p-[8px] rounded-[12px] border w-full h-[52px] outline-none"
                        />
                      )}
                    </div>
                    <div className="flex items-center">
                      <div className="h-[56px] w-[56px] border flex items-center justify-center rounded-[16px] ml-4">
                        <button
                          onClick={handleAddClassClick}
                          className="flex items-center justify-center text-[18px] font-[600] text-[#212121]"
                          disabled={false}
                        >
                          {showClassInput ? <X size={20} /> : <Plus size={20} />}
                        </button>
                      </div>

                      {selectedRaceFormat === "Heated" && selectedClass && (
                        <>
                          <div className="ml-[20px] w-[180px] relative">
                            <SelectComponent
                              key={`heat-${getCurrentClassKey()}-${selectedHeat}`}
                              placeholder="Select Heat"
                              items={getHeatsForCurrentClass()}
                              onChange={handleHeatChange}
                              value={selectedHeat}
                              disabled={false}
                            />
                            {/* Add "Currently Selected" indicator */}
                            {selectedHeat && selectedHeat !== "Heat 1" && (
                              <div className="absolute right-0 top-0 transform translate-y-[-100%] text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                                Currently Selected
                              </div>
                            )}
                          </div>
                          <div className="ml-[10px] h-[56px] w-[56px] border flex items-center justify-center rounded-[16px]">
                            <button
                              onClick={handleAddHeat}
                              className="flex items-center justify-center text-[18px] font-[600] text-[#212121] cursor-pointer"
                            >
                              <Plus size={20} />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {selectedClass && (
                <>
                  <div className="w-full py-[16px] border-b-[1px] bg-[#F3F3F3]">
                    <div className="flex flex-col">
                      {selectedRaceFormat !== "Heated" ? (
                        <div className="flex">
                          <div className="w-[370px] px-[16px]">
                            <h3 className="font-[600] text-[1.13rem] leading-[21.6px] mb-3">
                              Enter Temperature <span className="text-sm font-normal text-gray-500">(Should not be above 13 Degree)</span>
                            </h3>
                            <Input
                              placeholder="Enter Temperature" 
                              value={temperature}
                              onChange={(e) => setTemperature(validateTemperatureInput(e.target.value))}
                              className="bg-white"
                              disabled={isTempDistanceReadOnly}
                            />
                          </div>
                          
                          <div className="w-[370px] px-[16px]">
                            <h3 className="font-[600] text-[1.13rem] leading-[21.6px] mb-3">
                              Enter Distance <span className="text-sm font-normal text-gray-500">
                                {selectedRadio === "weight pull" ? "(Fixed at 10 meters for weight pull class)" : "(The minimum distance should be 3 or 5 km)"}
                              </span>
                            </h3>
                            <Input
                              placeholder="Enter Distance"
                              value={distance}
                              onChange={(e) => setDistance(validateDistanceInput(e.target.value))}
                              className="bg-white"
                              disabled={isTempDistanceReadOnly || selectedRadio === "weight pull"}
                            />
                          </div>
                          
                          <div className="flex items-end mb-[2px]">
                            <Button 
                              onClick={handleTempDistanceSubmit}
                              variant="outline" 
                              className="ml-2 px-4 h-[36px] flex items-center justify-center bg-white rounded-md"
                              disabled={false}
                            >
                              <span className="font-[600]">{isTempDistanceReadOnly ? "Edit" : "+ Add"}</span>
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="px-[16px]">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="font-[600] text-[1.13rem] leading-[21.6px]">
                              Enter Temperature and Distance for {selectedRaceFormat}
                            </h3>
                          </div>
                          
                          <div className="space-y-6 mt-2">
                            {/* Display only heats for the current class */}
                            {getCurrentClassKey() && getHeatsForCurrentClass().map((heat) => {
                              const classKey = getCurrentClassKey();
                              const heatData = heatDataList.find(data => 
                                data.heat === heat && data.class === classKey
                              ) || {
                                heat: heat,
                                temperature: "",
                                distance: "",
                                class: classKey
                              };
                              
                              // Check if this heat data is submitted
                              const isHeatDataSubmitted = Boolean(
                                heatDataList.find(data => 
                                  data.heat === heat && 
                                  data.class === classKey && 
                                  data.temperature && 
                                  data.distance
                                )
                              );
                              
                              return (
                                <div key={heat} className="p-4 border rounded-md relative bg-white">
                                  {heat === selectedHeat && (
                                    <div className="absolute right-2 top-2 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                                      Currently Selected
                                    </div>
                                  )}
                                  
                                  <div className="flex justify-between items-center mb-3">
                                    <h4 className="font-medium text-lg">{heat}</h4>
                                    
                                    {/* Add button to select this heat */}
                                    {heat !== selectedHeat && (
                                      <Button 
                                        onClick={() => setSelectedHeat(heat)}
                                        variant="outline" 
                                        size="sm"
                                        className="h-[30px] text-xs bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
                                      >
                                        Select Heat
                                      </Button>
                                    )}
                                  </div>
                                  
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium block mb-1">
                                    Temperature <span className="text-xs text-gray-500">(Should not be above 13 Degree)</span>
                                  </label>
                                  <Input
                                    placeholder="Enter Temperature"
                                        value={heatData.temperature}
                                    onChange={(e) => {
                                      const validatedTemp = validateTemperatureInput(e.target.value);
                                      const updatedList = [...heatDataList];
                                          const existingIndex = updatedList.findIndex(data => 
                                            data.heat === heat && data.class === classKey
                                          );
                                      
                                      if (existingIndex >= 0) {
                                        updatedList[existingIndex] = {
                                          ...updatedList[existingIndex],
                                          temperature: validatedTemp
                                        };
                                      } else {
                                        updatedList.push({
                                              heat: heat,
                                          temperature: validatedTemp,
                                          distance: "",
                                          class: classKey
                                        });
                                      }
                                      
                                      setHeatDataList(updatedList);
                                          
                                          // Also update current values if this is the selected heat
                                          if (heat === selectedHeat) {
                                      setTemperature(validatedTemp);
                                            setCurrentHeatData({
                                              ...heatData,
                                              temperature: validatedTemp
                                            });
                                          }
                                    }}
                                        className="bg-white"
                                        // All heats are always editable
                                        disabled={isHeatDataSubmitted && heat !== selectedHeat}
                                  />
                                </div>
                                
                                <div>
                                  <label className="text-sm font-medium block mb-1">
                                    Distance <span className="text-xs text-gray-500">(The minimum distance should be 3 or 5 km)</span>
                                  </label>
                                  <Input
                                    placeholder="Enter Distance"
                                        value={heatData.distance}
                                    onChange={(e) => {
                                      const validatedDist = validateDistanceInput(e.target.value);
                                      const updatedList = [...heatDataList];
                                          const existingIndex = updatedList.findIndex(data => 
                                            data.heat === heat && data.class === classKey
                                          );
                                      
                                      if (existingIndex >= 0) {
                                        updatedList[existingIndex] = {
                                          ...updatedList[existingIndex],
                                          distance: validatedDist
                                        };
                                      } else {
                                        updatedList.push({
                                              heat: heat,
                                          temperature: "",
                                          distance: validatedDist,
                                          class: classKey
                                        });
                                      }
                                      
                                      setHeatDataList(updatedList);
                                          
                                          // Also update current values if this is the selected heat
                                          if (heat === selectedHeat) {
                                      setDistance(validatedDist);
                                            setCurrentHeatData({
                                              ...heatData,
                                              distance: validatedDist
                                            });
                                          }
                                    }}
                                        className="bg-white"
                                        // All heats are always editable
                                        disabled={isHeatDataSubmitted && heat !== selectedHeat}
                                  />
                                </div>
                              </div>
                              
                              <div className="mt-4 flex justify-end">
                                    {/* Edit/Add button for ALL heats, not just selected */}
                                <Button 
                                      onClick={() => {
                                        if (heat !== selectedHeat) {
                                          // If not the selected heat, first make it the selected heat
                                          setSelectedHeat(heat);
                                          
                                          // Load its data
                                          const heatData = heatDataList.find(data => 
                                            data.heat === heat && data.class === classKey
                                          );
                                          if (heatData) {
                                            setTemperature(heatData.temperature);
                                            setDistance(heatData.distance);
                                            setCurrentHeatData(heatData);
                                            
                                            // If data exists and is complete, set as submitted
                                            if (heatData.temperature && heatData.distance) {
                                              setIsTempDistanceSubmitted(true);
                                            } else {
                                              setIsTempDistanceSubmitted(false);
                                            }
                                          } else {
                                            setTemperature("");
                                            setDistance("");
                                            setCurrentHeatData(null);
                                            setIsTempDistanceSubmitted(false);
                                          }
                                        } else {
                                          // If already selected heat, toggle edit/add
                                          handleTempDistanceSubmit();
                                        }
                                      }}
                                  variant="outline" 
                                  className="px-4 h-[36px] flex items-center justify-center bg-white rounded-md"
                                >
                                      <span className="font-[600]">
                                        {heat === selectedHeat
                                          ? (isTempDistanceSubmitted ? "Edit" : "+ Add")
                                          : (isHeatDataSubmitted ? "Edit" : "+ Add")}
                                      </span>
                                </Button>
                                    
                                    {getHeatsForCurrentClass().length > 1 && (
                                      <Button 
                                        onClick={() => handleRemoveHeat(heat)}
                                        variant="outline" 
                                        className="ml-2 px-4 h-[36px] flex items-center justify-center border-red-200 text-red-600 hover:bg-red-50 rounded-md"
                                      >
                                        <Minus size={16} className="mr-1" /> Remove
                                      </Button>
                                    )}
                              </div>
                            </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {selectedRaceFormat && (
                <>
                  <div className="w-full h-[135px] grid grid-cols-3 ">
                    <div className="py-[16px] px-[16px] flex flex-col gap-y-[15px] border-b-[1px]">
                      <h3 className="font-[600] text-[1.13rem] leading-[21.6px]">
                        Enter entrants detail
                      </h3>

                      <p className="font-[600] text-[1rem] leading-[19.2px] text-[#696A6A]">
                        Add a new entrant
                      </p>
                    </div>
                    <div className="py-[16px] pl-[76px] col-span-2  border-b-[1px] w-full h-full flex justify-start items-center">
                      <Dialog open={open} onOpenChange={(openState) => {
                        // When opening the dialog, always reset form state
                        if (openState) {
                          // Explicitly reset driver name and all associated data
                          setDriverName("");
                          setSelectedMusher(null);
                          setSelectedRows([]);
                          setManualDogInput([]);
                          setEditingEntrant(null);
                          setEditEntrantIndex(null);
                          setFilteredDrivers([]);
                          // Full reset of form state for a clean start
                          resetDialogState();
                        }
                        
                        setOpen(openState);
                        if (!openState) {
                          // Reset dialog-specific state when closing
                          resetDialogState();
                        }
                      }}>
                        <DialogTrigger>
                          <div className="w-[171px] h-[56px] border rounded-[16px] text-center text-[18px] font-[600] leading-[25.2px] flex items-center justify-center">
                            <span>+ Add Entrants</span>
                          </div>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add entrants</DialogTitle>
                            <DialogDescription>
                              {selectedRaceFormat === "Heated" ? `Add a new Driver to ${dialogSelectedHeat}` : "Add a new Driver"}
                            </DialogDescription>
                          </DialogHeader>

                          <form
                            onSubmit={onSubmit}
                            className="max-h-[650px] h-full overflow-y-auto overflow-x-hidden"
                          >
                            {/* Display current heat info if in heated mode */}
                            {selectedRaceFormat === "Heated" && (
                              <div className="mb-4">
                                <div className="flex flex-col space-y-4">
                                  {/* Show heat selection for this class */}
                                  <div className="grid grid-cols-1 gap-4">
                                    <div>
                                      <Label className="font-medium block mb-2">
                                        Select Heat for this Entrant:
                                        <span className="ml-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                          Class: {getCurrentClassKey()}
                                        </span>
                                      </Label>
                                      <SelectComponent
                                        key={`dialog-heat-${getCurrentClassKey()}-${dialogSelectedHeat}`}
                                        placeholder="Select Heat"
                                        items={getHeatsForCurrentClass()}
                                        onChange={(heat) => {
                                          setDialogSelectedHeat(heat);
                                          handleDialogHeatChange(heat);
                                        }}
                                        value={dialogSelectedHeat}
                                        disabled={false}
                                      />
                                      <div className="mt-1 text-xs text-gray-500">
                                        Available heats for this class: {getHeatsForCurrentClass().join(", ")}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Match the form styling exactly */}
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="font-medium block mb-1">
                                        Temperature
                                      </label>
                                      <div className="p-2 rounded-[12px] border h-[52px] flex items-center">
                                        {heatDataList.find(data => 
                                          data.heat === dialogSelectedHeat && 
                                          data.class === getCurrentClassKey()
                                        )?.temperature || "-"}°C
                                      </div>
                                    </div>
                                    <div>
                                      <label className="font-medium block mb-1">
                                        Distance
                                      </label>
                                      <div className="p-2 rounded-[12px] border h-[52px] flex items-center">
                                        {heatDataList.find(data => 
                                          data.heat === dialogSelectedHeat && 
                                          data.class === getCurrentClassKey()
                                        )?.distance || "-"}km
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            <div className="flex flex-col gap-4 py-4 w-full ">
                              <div className="flex items-center justify-between">
                                <Label>Enter driver name</Label>
                                {musherLoading && (
                                  <span className="text-sm text-muted-foreground animate-pulse">
                                    Loading mushers...
                                  </span>
                                )}
                              </div>

                              <div className="relative">
                                <Input
                                  placeholder="Type to search for mushers"
                                  value={driverName}
                                  onChange={handleInputChange}
                                  autoComplete="off"
                                  className={`${filteredDrivers.length > 0 ? 'rounded-b-none' : ''}`}
                                />
                                
                                {filteredDrivers.length > 0 && (
                                  <ul className="w-full border border-t-0 bg-white max-h-[200px] overflow-y-auto rounded-b-md shadow-sm z-10 absolute">
                                    {filteredDrivers.map((driver, index) => {
                                      const isExisting = clubMushers.some(musher => 
                                        musher.name.toLowerCase() === driver.toLowerCase()
                                      );
                                      return (
                                        <li
                                          key={index}
                                          onClick={() => handleDriverSelect(driver)} 
                                          className={`hover:bg-gray-200 p-3 cursor-pointer transition-colors border-t first:border-t-0 flex items-center justify-between ${
                                            isExisting ? 'bg-blue-50' : ''
                                          }`}
                                        >
                                          <span>{driver}</span>
                                          {isExisting && 
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                                              <path d="M20 6L9 17l-5-5"></path>
                                            </svg>
                                          }
                                        </li>
                                      );
                                    })}
                                  </ul>
                                )}
                              </div>

                              {driverName && filteredDrivers.length === 0 && !selectedMusher && clubMushers.length > 0 && (
                                <div className="text-sm text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
                                  No matching mushers found. You can still add dogs manually below.
                                </div>
                              )}
                              
                              <div>
                                {driverName && selectedMusher && (
                                  <div className="border rounded-[12px] overflow-hidden mt-4">
                                    <div className="bg-[#F6F6F6] p-4 flex justify-between items-center">
                                      <p className="text-[16px] font-[600]">
                                        {selectedMusher.dogs.length} Dogs associated with "{driverName}"
                                      </p>
                                      <p className="text-[14px] text-[#696A6A]">
                                        {selectedRows.length} dogs selected
                                      </p>
                                    </div>
                                    <div className="p-4">
                                      <table className="w-full">
                                        <thead className="border-b">
                                          <tr>
                                            <th className="text-left p-2 font-[600] w-[40px]">Select</th>
                                            <th className="text-left p-2 font-[600]">Name</th>
                                            <th className="text-left p-2 font-[600]">Registration</th>
                                            <th className="text-left p-2 font-[600]">DOB</th>
                                            <th className="text-left p-2 font-[600]">Breed</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {selectedMusher.dogs.length > 0 ? (
                                            selectedMusher.dogs.map((dog, index) => {
                                              // Create the same unique identifier as used in handleMusherDogSelect
                                              const uniqueId = `${dog._id}-${selectedMusher?.name || ''}`;
                                              const isSelected = selectedRows.some(selected => 
                                                selected.id === uniqueId
                                              );
                                              
                                              return (
                                                <tr key={index} className={index !== selectedMusher.dogs.length - 1 ? "border-b" : ""}>
                                                  <td className="p-2">
                                                    <input 
                                                      type="checkbox" 
                                                      checked={isSelected}
                                                      onChange={() => handleMusherDogSelect(dog)}
                                                      className="h-4 w-4 rounded border-gray-300"
                                                    />
                                                  </td>
                                                  <td className="p-2">{getDogDisplayName(dog)}</td>
                                                  <td className="p-2">{cleanRegistrationNumber(dog.nzfssNo, dog.name)}</td>
                                                  <td className="p-2">{dog.dateOfBirth}</td>
                                                  <td className="p-2">{dog.breed}</td>
                                                </tr>
                                              );
                                            })
                                          ) : (
                                            <tr>
                                              <td colSpan={5} className="p-4 text-center text-muted-foreground">
                                                This musher has no registered dogs. Add dogs using the form below.
                                              </td>
                                            </tr>
                                          )}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                )}
                                
                                {/* Divider and Other Dogs Section */}
                                {driverName && allOtherDogs.length > 0 && (
                                  <>
                                    {/* Divider */}
                                    <div className="flex items-center my-6">
                                      <div className="flex-1 border-t border-gray-300"></div>
                                      <div className="px-4 text-sm font-medium text-gray-500">OR</div>
                                      <div className="flex-1 border-t border-gray-300"></div>
                                    </div>
                                    
                                    {/* Other Dogs Available Section */}
                                    <div className="border rounded-[12px] overflow-hidden">
                                      <div className="bg-[#F6F6F6] p-4">
                                        <div className="flex justify-between items-center mb-3">
                                          <p className="text-[16px] font-[600]">
                                            Other Dogs Available ({filteredOtherDogs.length} total)
                                          </p>
                                          <p className="text-[14px] text-[#696A6A]">
                                            {selectedRows.length} dogs selected overall
                                          </p>
                                        </div>
                                        
                                        {/* Search Input */}
                                        <div className="relative">
                                          <Input
                                            placeholder="Search by dog name, breed, registration, or owner..."
                                            value={otherDogsSearch}
                                            onChange={(e) => setOtherDogsSearch(e.target.value)}
                                            className="bg-white pl-10"
                                          />
                                          <svg 
                                            className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" 
                                            fill="none" 
                                            stroke="currentColor" 
                                            viewBox="0 0 24 24"
                                          >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                          </svg>
                                        </div>
                                      </div>
                                      
                                      <div className="p-4 max-h-[400px] overflow-y-auto">
                                        {displayedOtherDogs.length > 0 ? (
                                          <table className="w-full">
                                            <thead className="border-b sticky top-0 bg-white">
                                              <tr>
                                                <th className="text-left p-2 font-[600] w-[40px]">Select</th>
                                                <th className="text-left p-2 font-[600]">Name</th>
                                                <th className="text-left p-2 font-[600]">Owner</th>
                                                <th className="text-left p-2 font-[600]">Registration</th>
                                                <th className="text-left p-2 font-[600]">DOB</th>
                                                <th className="text-left p-2 font-[600]">Breed</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {displayedOtherDogs.map((dog, index) => {
                                                // Create the same unique identifier as used in handleOtherDogSelect
                                                const uniqueId = `${dog._id}-${dog.musherName || ''}`;
                                                const isSelected = selectedRows.some(selected => 
                                                  selected.id === uniqueId
                                                );
                                                
                                                return (
                                                  <tr key={`${dog._id}-${index}`} className={index !== displayedOtherDogs.length - 1 ? "border-b" : ""}>
                                                    <td className="p-2">
                                                      <input 
                                                        type="checkbox" 
                                                        checked={isSelected}
                                                        onChange={() => handleOtherDogSelect(dog)}
                                                        className="h-4 w-4 rounded border-gray-300"
                                                      />
                                                    </td>
                                                    <td className="p-2 font-medium">{getDogDisplayName(dog)}</td>
                                                    <td className="p-2 text-sm text-gray-600">{dog.musherName}</td>
                                                    <td className="p-2">{cleanRegistrationNumber(dog.nzfssNo, dog.name) || "-"}</td>
                                                    <td className="p-2">{dog.dateOfBirth || "-"}</td>
                                                    <td className="p-2">{dog.breed}</td>
                                                  </tr>
                                                );
                                              })}
                                            </tbody>
                                          </table>
                                        ) : (
                                          <div className="text-center py-8 text-gray-500">
                                            {otherDogsSearch.trim() ? "No dogs found matching your search." : "No other dogs available."}
                                          </div>
                                        )}
                                        
                                        {/* Load More Button */}
                                        {filteredOtherDogs.length > otherDogsDisplayCount && (
                                          <div className="flex justify-center mt-4">
                                            <Button
                                              variant="outline"
                                              type="button"
                                              onClick={() => setOtherDogsDisplayCount(prev => prev + 10)}
                                              className="px-6 py-2"
                                            >
                                              Load More ({filteredOtherDogs.length - otherDogsDisplayCount} remaining)
                                            </Button>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </>
                                )}
                                
                                {driverName && !selectedMusher && (
                                  <div className="border rounded-[12px] overflow-hidden mt-4">
                                    <div className="bg-[#F6F6F6] p-4">
                                      <p className="text-[16px] font-[600] text-center">
                                        No dogs found for "{driverName}"
                                      </p>
                                      <p className="text-[14px] text-[#696A6A] text-center mt-2">
                                        Please add dogs using the form below
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                                  
                            <div
                              className="flex flex-col gap-4 py-2 w-full justify-start cursor-pointer"
                            >
                              <button
                                type="button"
                                onClick={() => setShowInput(!showInput)}
                                className="text-[#2A72DF] text-[18px] font-[600] cursor-pointer border-none bg-transparent flex items-center"
                              >
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-1">
                                  <path d="M8 3.33334V12.6667" stroke="#2A72DF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  <path d="M3.33331 8H12.6666" stroke="#2A72DF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                {showInput ? "Hide Dogs" : " Add Dogs"}
                              </button>
                            </div>

                            <div className="w-full h-auto rounded-t-[12px] border border-[#E6E6E6] overflow-hidden">
                              {manualDogInput.map((dog, index) => (
                                <React.Fragment key={index}>
                                  {index > 0 && (
                                    <div className="w-full h-[2px] bg-gray-200"></div>
                                  )}
                                  <div
                                    className="w-full grid grid-cols-5 h-[40px] border border-[#E6E6E6] text-[14px] font-[500] text-[#696A6A]"
                                  >
                                    <div className="flex w-full items-center justify-center h-full border-r">
                                      <input
                                        className="w-full h-full pl-2 p-1 outline-none"
                                        placeholder="Dog Name"
                                        value={getDogDisplayName(dog)}
                                        disabled
                                        style={{
                                          backgroundColor: isDisabled
                                            ? "#CDCECE"
                                            : "transparent",
                                        }}
                                      />
                                    </div>
                                    <div className="flex w-full items-center justify-center h-full border-[#E6E6E6] border-r">
                                      <input
                                        className="w-full h-full pl-2 p-1 outline-none"
                                        placeholder="NZFSS Registration"
                                        value={dog.NZFSSRegistration}
                                        disabled
                                        style={{
                                          backgroundColor: isDisabled
                                            ? "#CDCECE"
                                            : "transparent",
                                        }}
                                      />
                                    </div>
                                    <div className="flex w-full items-center justify-center h-full border-[#E6E6E6] border-r">
                                      <input
                                        className="w-full h-full pl-2 p-1 outline-none"
                                        placeholder="Date of Birth"
                                        value={dog.dob || ""}
                                        disabled
                                        style={{
                                          backgroundColor: isDisabled
                                            ? "#CDCECE"
                                            : "transparent",
                                        }}
                                      />
                                    </div>
                                    <div className="flex w-full items-center justify-center h-full border-[#E6E6E6] border-r">
                                      <input
                                        className="w-full h-full pl-2 p-1 outline-none"
                                        placeholder="Breed"
                                        value={dog.breed}
                                        disabled
                                        style={{
                                          backgroundColor: isDisabled
                                            ? "#CDCECE"
                                            : "transparent",
                                        }}
                                      />
                                    </div>

                                    <div className="flex w-full items-center justify-center">
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteClick(dog.id)}
                                        className="w-full h-full text-red-600 hover:bg-red-50"
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  </div>
                                </React.Fragment>
                              ))}

                              {showInput && (
                                <div className=" w-full grid grid-cols-5 h-[40px]  text-[14px] font-[500] text-[#696A6A]">
                                  <div className="flex w-full items-center justify-center h-full border-r border-[#E6E6E6]">
                                    <input
                                      className="w-full h-full pl-2 p-1 outline-none"
                                      placeholder="Dog Name"
                                      value={dogName}
                                      onChange={(e) => setDogName(e.target.value)}
                                    />
                                  </div>
                                  <div className="flex w-full items-center justify-center  h-full border-[#E6E6E6] border-r">
                                    <input
                                      className="w-full h-full pl-2  p-1 outline-none"
                                      placeholder="NZFSS Registration"
                                      value={registration}
                                      onChange={(e) =>
                                        setRegistration(e.target.value)
                                      }
                                    />
                                  </div>
                                  <div className="flex w-full items-center justify-center h-full border-[#E6E6E6] border-r">
                                    <div className="w-full h-full [&_button]:rounded-none [&_button]:border-none">
                                      <DatePicker
                                        date={dogDobDate}
                                        setDate={setDogDobDate}
                                      />
                                    </div>
                                  </div>
                                  <div className="flex w-full items-center justify-center  h-full border-[#E6E6E6] border-r">
                                    <input
                                      className="w-full h-full pl-2 p-1 outline-none"
                                      placeholder="Breed"
                                      value={breed}
                                      onChange={(e) => setBreed(e.target.value)}
                                    />
                                  </div>
                                  <div className="flex w-full items-center justify-center">
                                    <button
                                      type="button"
                                      onClick={handleAddClick}
                                      disabled={
                                        !isFormValid && buttonText === "Add"
                                      }
                                      className={`${
                                        !isFormValid && buttonText === "Add"
                                          ? "text-gray-400 cursor-not-allowed"
                                          : "text-green-600 hover:bg-green-50"
                                      } w-full h-full`}
                                    >
                                      {buttonText}
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="w-full  mb-[32px] ">
                              <div className="py-[16px]  flex flex-col gap-y-[15px]">
                                <h3 className="font-[600] text-[1.13rem] leading-[21.6px]">
                                  Select race type
                                </h3>

                                <div>
                                  <RadioGroup
                                    className="flex gap-x-[25px] items-center"
                                    onValueChange={handleRadioChangeStatus}
                                    name="raceType"
                                    value={selectedStatus || ""}
                                  >
                                    <div className="flex items-center space-x-2 ">
                                      <RadioGroupItem id="race-type-started" value="started" />
                                      <Label htmlFor="race-type-started" className="text-[16px] font-[600] text-[#000000]">
                                        Started
                                      </Label>
                                    </div>
                                    <div className="flex items-center space-x-2 ">
                                      <RadioGroupItem id="race-type-not-start" value="did not start" />
                                      <Label htmlFor="race-type-not-start" className="text-[16px] font-[600] text-[#000000]">
                                        Did not start
                                      </Label>
                                    </div>
                                    <div className="flex items-center space-x-2 ">
                                      <RadioGroupItem id="race-type-not-finished" value="did not finish" />
                                      <Label htmlFor="race-type-not-finished" className="text-[16px] font-[600] text-[#000000]">
                                        Did not finish
                                      </Label>
                                    </div>
                                    <div className="flex items-center space-x-2 ">
                                      <RadioGroupItem id="race-type-disqualified" value="disqualified" />
                                      <Label htmlFor="race-type-disqualified" className="text-[16px] font-[600] text-[#000000]">
                                        Disqualified
                                      </Label>
                                    </div>
                                  </RadioGroup>
                                </div>

                                {selectedStatus === "started" && (
                                  <div className="pl-[2px] ">
                                    {selectedRadio === "weight pull" ? (
                                      <div className="space-y-4 mt-2">
                                        {/* Race Time Input for Weight Pull */}
                                        <div>
                                          <Label className="font-medium block mb-2">
                                            Race Time
                                          </Label>
                                          <StartTimeInput 
                                            onChange={(value) => {
                                              console.log("StartTimeInput onChange called with value:", value);
                                              setRaceTime(value);
                                            }} 
                                            previousValue={raceTime ? raceTime : undefined}
                                          />
                                        </div>
                                        
                                        {/* Dog Weight and Weight Pulled */}
                                        <div className="grid grid-cols-2 gap-4">
                                          <div>
                                            <Label className="font-medium block mb-2">
                                              Dog Weight (kg)
                                            </Label>
                                            <Input
                                              placeholder="Enter dog weight"
                                              value={dogWeight}
                                              onChange={(e) => setDogWeight(e.target.value)}
                                              className="bg-white"
                                            />
                                          </div>
                                          <div>
                                            <Label className="font-medium block mb-2">
                                              Weight Pulled (kg)
                                            </Label>
                                            <Input
                                              placeholder="Enter weight pulled"
                                              value={weightPulled}
                                              onChange={(e) => setWeightPulled(e.target.value)}
                                              className="bg-white"
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    ) : (
                                      <StartTimeInput 
                                        onChange={(value) => {
                                          console.log("StartTimeInput onChange called with value:", value);
                                          setRaceTime(value);
                                        }} 
                                        previousValue={raceTime ? raceTime : undefined}
                                      />
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            <DialogFooter>
                              <div className="flex justify-between items-center w-full gap-x-4">
                                <Button
                                  size={"lg"}
                                  variant="outline"
                                  className="w-full h-[56px] font-[500] text-[18px] rounded-[16px]"
                                  type="button"
                                  onClick={() => {
                                    // Only reset dialog-specific state
                                    resetDialogState();
                                    setOpen(false);
                                  }}
                                >
                                  Cancel
                                </Button>
                                
                                {editingEntrant !== null ? (
                                  // Only show Save Edit in edit mode
                                  <Button
                                    variant="outline"
                                    className="w-full h-[56px] font-[500] text-[18px] rounded-[16px]"
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleSaveMusher();
                                      // Reset all form fields and close the dialog
                                      resetDialogState();
                                      resetFullFormState();
                                      setOpen(false);
                                    }}
                                  >
                                    Save Edit
                                  </Button>
                                ) : (
                                  // Show both Save Musher and Save & Close in non-edit mode
                                  <>
                                    <Button
                                      variant="outline"
                                      className="w-full h-[56px] font-[500] text-[18px] rounded-[16px]"
                                      type="button"
                                      onClick={(e) => {
                                        e.preventDefault(); // Prevent any form submission
                                        e.stopPropagation(); // Stop event propagation
                                        console.log("Save Musher button clicked");
                                        handleSaveMusher();
                                      }}
                                    >
                                      Save Musher
                                    </Button>
                                    <Button
                                      variant="outline"
                                      className="w-full h-[56px] font-[500] text-[18px] rounded-[16px]"
                                      type="submit"
                                      disabled={false}
                                    >
                                      Save & Close
                                    </Button>
                                  </>
                                )}
                              </div>
                            </DialogFooter>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </>
              )}
              
              {/* Display entrants list - always visible if there are entrants */}
              {entrants.length > 0 && (
                <div className="w-full mt-8">
                  <div className="py-[16px] px-[16px]">
                    <h3 className="font-[600] text-[1.13rem] leading-[21.6px] mb-4">
                      Added Entrants
                    </h3>

                    <div className="border rounded-[12px] overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-[#F6F6F6]">
                          <tr>
                            <th className="text-left p-4 font-[600]">Driver</th>
                            <th className="text-left p-4 font-[600]">NZFSS Registration No.</th>
                            <th className="text-left p-4 font-[600]">Class</th>
                            <th className="text-left p-4 font-[600]">Dog associated</th>
                          
                            <th className="text-left p-4 font-[600]">Temp (°C)</th>
                            <th className="text-left p-4 font-[600]">Distance (km)</th>
                            <th className="text-left p-4 font-[600]">
                              {entrants.some(e => e.class === "weight pull") ? "Details" : "Race Time"}
                            </th>
                            <th className="text-left p-4 font-[600]">Race Status</th>
                            <th className="text-left p-4 font-[600]">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {entrants.map((entrant, index) => (
                            <tr key={index} className="border-t">
                              <td className="p-4">{entrant.driver}</td>
                              <td className="p-4">{entrant.dogs[0]?.NZFSSRegistration || ""}</td>
                              <td className="p-4">
                                {entrant.class === "add custom class" ? (
                                  <span className="font-medium">Custom: {entrant.customClass}</span>
                                ) : (
                                  entrant.customClass || entrant.class
                                )}
                              </td>
                              <td className="p-4">
                                {entrant.dogs.length > 0 
                                  ? entrant.dogs.map(dog => getDogDisplayName(dog)).join(", ") 
                                  : "No dogs"}
                                {entrant.dogs.length > 4 ? ` +${entrant.dogs.length - 4} More` : ""}
                              </td>
                           
                              <td className="p-4">{entrant.temperature || "-"}</td>
                              <td className="p-4">{entrant.distance || "-"}</td>
                              <td className="p-4">
                                {entrant.class === "weight pull" && entrant.raceType === "started" ? (
                                  <div className="flex flex-col">
                                    <div className="flex items-center space-x-2 mb-2">
                                      <span className="font-medium text-gray-700">Race Time:</span>
                                      <span className="font-bold text-purple-600">{entrant.raceTime || "-"}</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <span className="font-medium text-gray-700">Dog Weight:</span>
                                      <span className="font-bold text-blue-600">{entrant.dogWeight || "-"} kg</span>
                                    </div>
                                    <div className="flex items-center space-x-2 mt-1">
                                      <span className="font-medium text-gray-700">Weight Pulled:</span>
                                      <span className="font-bold text-green-600">{entrant.weightPulled || "-"} kg</span>
                                    </div>
                                  </div>
                                ) : (
                                  entrant.raceTime && entrant.raceType === "started" ? entrant.raceTime : "-"
                                )}
                              </td>
                              <td className="p-4">
                                <span className={`px-3 py-1 rounded-full ${
                                  entrant.raceType === "started" ? "bg-green-100 text-green-800" :
                                  entrant.raceType === "did not start" ? "bg-yellow-100 text-yellow-800" :
                                  entrant.raceType === "did not finish" ? "bg-orange-100 text-orange-800" :
                                  "bg-red-100 text-red-800"
                                }`}>
                                  {entrant.raceType ? entrant.raceType.charAt(0).toUpperCase() + entrant.raceType.slice(1) : "-"}
                                </span>
                              </td>
                              <td className="p-4">
                                <div className="flex space-x-2">
                                  <button 
                                    className="p-2 rounded-full hover:bg-gray-200"
                                    onClick={() => handleEditEntrant(entrant, index)}
                                  >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                      <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="#3F3F46" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                      <path d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.4374 22.1213 4.00001C22.1213 4.56262 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z" stroke="#3F3F46" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                  </button>
                                  <button 
                                    className="p-2 rounded-full hover:bg-gray-200"
                                    onClick={() => {
                                      setEntrants(prev => prev.filter((_, i) => i !== index));
                                    }}
                                  >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                      <path d="M3 6H5H21" stroke="#3F3F46" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                      <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="#3F3F46" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    <div className="flex justify-end mt-6 mb-4">
                      <Button 
                        className="bg-[#2A72DF] hover:bg-[#2A72DF]/90 text-white font-[600] text-[18px] px-8 py-2 h-[56px] rounded-[16px]"
                        onClick={() => {
                          if (editingEntrant !== null && editEntrantIndex !== null) {
                            // If in edit mode, reopen the edit dialog
                            handleEditEntrant(editingEntrant, editEntrantIndex);
                            setOpen(true);
                          } else {
                            // Otherwise save results as normal
                            handleSaveResults();
                          }
                        }}
                      >
                        {editingEntrant !== null ? "Save Edit" : "Save Result"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddNewResult;

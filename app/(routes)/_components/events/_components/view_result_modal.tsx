import React, { useState, useCallback, useEffect, useMemo, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { X } from "lucide-react";
import { MusherResultRows } from "@/app/(routes)/result/_components/musher-result-rows";
import { computeMusherRanks, musherKey } from "@/lib/race-result-grouping";
import {
  dedupeEntrantsForEdit,
  findDriverCardToUpdate,
  isHeatedFormat,
  isMongoId,
  isWeightPullClass,
  planDriverDeletions,
  planOrphanCleanup,
  resolveEntrantForUpdate,
} from "@/lib/result-edit-matching";
import {
  buildNewClassConditions,
  findCollidingDriverCards,
  resolveDogRegistration,
} from "@/lib/new-class-submission";
import { useRouter } from "next/navigation";
import { LogHistoryModal } from "./log_history_modal";
import { Label } from "@/components/ui/label";
import SelectComponent from "@/components/selectComponent";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StartTimeInput } from "@/components/start-time";
import { useMutation, useQuery } from "@apollo/client";
import { GET_ALL_DOGS } from "@/graphql/query/dogs";
import Link from "@tiptap/extension-link";
import {
  CREATE_ENTRANT,
  DELETE_ENTRANT,
  UPDATE_ENTRANT,
} from "@/graphql/mutation/addResult";
import { useToast } from "@/hooks/use-toast";
import { GET_MUSHERS } from "@/lib/graphql/musher";
import { GET_ALL_RESULTS, GET_RESULTS_BY_EVENT_ID } from "@/graphql/query/addResult";
import { v4 as uuidv4 } from 'uuid';

/**
 * ViewResultModal Component
 * 
 * This component allows viewing, adding, editing, and deleting race results.
 * 
 * Important Fields:
 * - raceTime: Stores the race completion time in format hh:mm:ss.ms
 *   When adding/editing a driver's raceTime, ensure it follows the correct format.
 *   The raceTime field is optional but should be included in all API calls.
 *   Format validation is handled by the formatRaceTime helper function.
 * 
 * API Integration Notes:
 * - The raceTime field must be included in all mutations (create/update)
 * - When displaying raceTime values from the API, handle null/undefined cases
 */

// Define proper types for the drivers
interface Driver {
  name: string;
  dogs: Dogs[];
  raceTime?: string | null;
  raceStatus: "Started" | "Did not start" | "Did not finish" | "Disqualified";
  dogWeight?: string;
  weightPulled?: string;
  // Indicates this entry was newly added in the UI and does not exist on the server yet
  isNew?: boolean;
  // Which heat this driver card represents. Heated races store one entrant
  // document per heat, so this is what tells two cards for the same musher
  // apart instead of one silently overwriting the other.
  heat?: string;
  // Persisted entrant document id — used so dog-team edits update the same
  // row instead of creating a duplicate Heat 1 when the dog set changes.
  _id?: string;
}

// Define proper types for the results
export interface Result {
  _id: string;
  class: string;
  name: string;
  customClass?: string;
  raceFormat?: string;
  raceType?: string;
  startTime?: string;
  raceTime?: string;
  drivers?: Driver[];
  userId?: string;
  eventId?: string;
  map?: any[];
  associatedDog?: any[];
  temperature?: string;
  distance?: string;
  heat?: string;
  heatsData?: HeatData[];
  dogWeight?: string; // Add dog weight field
  weightPulled?: string; // Add weight pulled field
}

// Add this interface near the top with other interfaces
interface Dogs {
  id: string;
  name: string;
  NZFSSRegistration?: string;
  dob: string;
  breed: string;
  driverName: string;
}

interface ViewResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventName: string;
  results: Result[];
  onResultsUpdate?: (results: Result[], isSubmitting?: boolean) => void;
}

interface UpdateEntrantInput {
  class: string;
  customClass?: string;
  raceFormat?: string;
  temperature?: string;
  distance?: string;
  startTime?: string;
  name: string;
  associatedDog: {
    name: string;
    NZFSSRegistration?: string;
    dob?: string;
    breed?: string;
    driverName: string;
  }[];
  raceTime?: string | null;
  raceType: string;
  heat: string;
  heatsData?: HeatData[];
  dogWeight?: string; // Add dog weight field
  weightPulled?: string; // Add weight pulled field
}

// Add interface for heat data
interface HeatData {
  heat: string;
  temperature: string;
  distance: string;
  class?: string;
  __typename?: string;
}

// Add a new component to safely render heat information with proper null checks
const HeatInfoDisplay = ({ result }: { result: Result }) => {
  if (!result || result.raceFormat !== "Heated" || !result.heatsData || !Array.isArray(result.heatsData) || result.heatsData.length === 0) {
    return null;
  }

  return (
    <div className="mb-4 p-3 bg-white rounded-lg border">
      <h4 className="font-medium mb-2">Heat Information</h4>
      <div className="grid grid-cols-3 gap-2 text-sm">
        <div className="font-semibold">Heat</div>
        <div className="font-semibold">Temperature</div>
        <div className="font-semibold">Distance</div>
        {result.heatsData.map(heat => (
          <React.Fragment key={heat.heat}>
            <div className={heat.heat === result.heat ? "font-medium" : ""}>
              {heat.heat}
              {heat.heat === result.heat && (
                <span className="ml-2 px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs">Current</span>
              )}
            </div>
            <div>{heat.temperature}</div>
            <div>{heat.distance}</div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export const ViewResultModal: React.FC<ViewResultModalProps> = ({
  isOpen,
  onClose,
  eventName,
  results,
  onResultsUpdate,
}) => {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedEntrantId, setSelectedEntrantId] = useState<string | null>(null);
  const [showLogHistory, setShowLogHistory] = useState(false);
  const [expandedResult, setExpandedResult] = useState<string | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showAddClassForm, setShowAddClassForm] = useState(false);
  const [selectedResult, setSelectedResult] = useState<Result | null>(null);
  const [selectedRadio, setSelectedRadio] = useState<string | null>(null);
  const [raceType, setRaceType] = useState<string | null>(null);
  const [customClass, setCustomClass] = useState<string | null>(null);
  const [editedDrivers, setEditedDrivers] = useState<any[]>([]);
  const [originalEditedDrivers, setOriginalEditedDrivers] = useState<any[]>([]);
  const [originalResults, setOriginalResults] = useState<Result[]>([]);
  const [editedTemperature, setEditedTemperature] = useState<string>("");
  const [editedDistance, setEditedDistance] = useState<string>("");
  const [editedStartTime, setEditedStartTime] = useState<string>("00:00:00.00");
  const [showAddDriverModal, setShowAddDriverModal] = useState(false);
  const [driverName, setDriverName] = useState("");
  const [filteredDrivers, setFilteredDrivers] = useState<string[]>([]);
  const [selectedRows, setSelectedRows] = useState<Dogs[]>([]);
  const [showInput, setShowInput] = useState(false);
  const [dogName, setDogName] = useState("");
  const [registration, setRegistration] = useState("");
  const [dob, setDob] = useState("");
  const [breed, setBreed] = useState("");
  const [raceFormat, setRaceFormat] = useState("");
  const [manualDriverMode, setManualDriverMode] = useState(false);
  const [customDogs, setCustomDogs] = useState<Dogs[]>([]);
  const [tempDogName, setTempDogName] = useState("");
  const [tempRegistration, setTempRegistration] = useState("");
  const [tempDob, setTempDob] = useState("");
  const [tempBreed, setTempBreed] = useState("");
  const [showClassInput, setShowClassInput] = useState<boolean>(false);
  const [isDropdownDisabled, setIsDropdownDisabled] = useState<boolean>(false);
  const [addClassButtonText, setAddClassButtonText] = useState<string>("Add Class");
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [selectedRaceStatus, setSelectedRaceStatus] = useState<string>("Started");
  const [heats, setHeats] = useState<HeatData[]>([{ heat: 'Heat 1', temperature: '', distance: '' }]);
  const [selectedHeat, setSelectedHeat] = useState('Heat 1');
  // When "Add Dog" opens the driver modal for an existing card, remember which
  // card so confirm merges into it instead of creating a duplicate.
  const [editingDriverIndex, setEditingDriverIndex] = useState<number | null>(null);
  
  // Keep track of the current race time values
  const [timeInputState, setTimeInputState] = useState({
    hours: "",
    minutes: "",
    seconds: "",
    ms: ""
  });
  
  // Add state for weight pull specific values
  const [dogWeight, setDogWeight] = useState<string>("");
  const [weightPulled, setWeightPulled] = useState<string>("");
  
  // Add the same for edited drivers (for the edit form)
  const [editedDriverWeights, setEditedDriverWeights] = useState<{ [driverIndex: number]: { dogWeight: string; weightPulled: string } }>({});

  // Add state for showing custom class input
  const [showCustomClassInput, setShowCustomClassInput] = useState<boolean>(false);

  // Add new states for other dogs section
  const [otherDogsSearch, setOtherDogsSearch] = useState<string>("");
  const [otherDogsDisplayCount, setOtherDogsDisplayCount] = useState<number>(10);
  const [allOtherDogs, setAllOtherDogs] = useState<any[]>([]);

  // Add refs for time inputs
  const hoursInputRef = useRef<HTMLInputElement>(null);
  const minutesInputRef = useRef<HTMLInputElement>(null);
  const secondsInputRef = useRef<HTMLInputElement>(null);
  const msInputRef = useRef<HTMLInputElement>(null);

  // Add refs for edit form time inputs
  const editTimeInputRefs = useRef<{
    [key: number]: {
      hours: React.RefObject<HTMLInputElement>;
      minutes: React.RefObject<HTMLInputElement>;
      seconds: React.RefObject<HTMLInputElement>;
      ms: React.RefObject<HTMLInputElement>;
    };
  }>({});

  // Initialize refs for edit form time inputs when drivers change
  useEffect(() => {
    editedDrivers.forEach((_, index) => {
      if (!editTimeInputRefs.current[index]) {
        editTimeInputRefs.current[index] = {
          hours: React.createRef<HTMLInputElement>(),
          minutes: React.createRef<HTMLInputElement>(),
          seconds: React.createRef<HTMLInputElement>(),
          ms: React.createRef<HTMLInputElement>()
        };
      }
    });
  }, [editedDrivers]);

  // Updated to always fetch all mushers regardless of user or club
  const { data, loading } = useQuery<{ getMushers: any[] }>(GET_MUSHERS, {
    variables: {},
    skip: false,
  });

  // Initialize race format when selected result changes
  useEffect(() => {
    if (selectedResult) {
      // Default missing raceFormat to Single — never "" or every heat collapses to Heat 1
      setRaceFormat(selectedResult.raceFormat || "Single");
    }
  }, [selectedResult]);

  // Add effect to handle race format changes
  useEffect(() => {
    if (selectedResult) {
      if (raceFormat === 'Heated') {
        // If switching to heated format, initialize heats if not already set
        if (heats.length === 0) {
          console.log("Initializing heats when switching to Heated format");
          setHeats([
            {
              heat: 'Heat 1',
              temperature: editedTemperature || selectedResult.temperature || "",
              distance: editedDistance || selectedResult.distance || ""
            }
          ]);
          setSelectedHeat('Heat 1');
        }
      }
    }
  }, [raceFormat, selectedResult, heats.length, editedTemperature, editedDistance]);

  // Add class type options
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
    "Add Custom Class"
  ];

  // Get the appropriate class options based on selected radio
  const getClassOptions = (classType: string | null) => {
    switch (classType?.toLowerCase()) {
      case "speed":
        return speed;
      case "freight":
        return freight;
      case "snow":
        return snow;
      case "weight pull":
        return weightPull;
      default:
        return [];
    }
  };

  // Handler for radio change
  const handleRadioChange = (value: string) => {
    setSelectedRadio(value);
    setRaceType(value.toLowerCase() === "weight pull" ? "weight pull" : "speed");
    if (value.toLowerCase() === "weight pull") {
      setEditedDistance("10 metres");
      setSelectedClass("Single-Dog Scooter");
      if (showCustomClassInput) setShowCustomClassInput(false);
    } else {
      setSelectedClass(null);
      setEditedDistance("");
    }
  };

  // Computed selected class type based on radio selection
  const selectedClassType = useMemo(() => {
    return getClassOptions(selectedRadio);
  }, [selectedRadio]);

  // Handle Dialog open/close with safer approach
  const handleCloseModal = useCallback(() => {
    onClose();
  }, [onClose]);

  // Add this debugging function to help troubleshoot the heat data
  const debugResultHeats = (result: Result) => {
    console.log(`Result ${result.name} (${result.class}-${result.customClass || ''}):`);
    console.log(`- raceFormat: ${result.raceFormat}`);
    console.log(`- heat: ${result.heat || 'Not specified'}`);
    console.log(`- heatsData: ${result.heatsData ? JSON.stringify(result.heatsData) : 'None'}`);
    
    if (result.heatsData && Array.isArray(result.heatsData)) {
      return true;
    }
    return false;
  };

  // Update the handleOpenEditForm function to better handle heats data
  const handleOpenEditForm = (result: Result) => {
    console.log("Opening edit form for:", result);
    
    // Set the selected result to edit
    setSelectedResult(result);
    
    // Set initial values from the result
    setCustomClass(result.customClass || "");
    setEditedTemperature(result.temperature || "");
    setEditedDistance(result.distance || "");
    setEditedStartTime(result.startTime || "00:00:00.00");
    setRaceFormat(result.raceFormat || "Single");
    
    // Set both selectedRadio and raceType based on the result's class
    const classType = result.class?.toLowerCase() || "";
    setSelectedRadio(classType);
    
    // Determine race type based on the class
    const isWeightPull = result.class?.toLowerCase().includes("weight pull") || 
                        result.customClass?.toLowerCase().includes("weight pull");
    setRaceType(isWeightPull ? "weight pull" : "speed");
    
    // Handle custom class display
    if (result.customClass) {
      setShowCustomClassInput(true);
    } else {
      setShowCustomClassInput(false);
    }
    
    // Each heat is stored as its own entrant document, so the clicked result
    // only ever carries its own single heat. A heat belongs to the class, not
    // to one musher, so merge the heats from every entrant of this class in
    // this event — matching on the musher too would hide Heat 1 whenever the
    // clicked row happens to be a musher who only ran Heat 2.
    const siblingResults = results.filter(r =>
      r.class === result.class &&
      (r.customClass || "") === (result.customClass || "") &&
      r.eventId === result.eventId
    );

    const mergedHeatsMap = new Map<string, { heat: string; temperature: string; distance: string; class: string }>();
    const rememberHeat = (heat: string, temperature?: string, distance?: string) => {
      const existing = mergedHeatsMap.get(heat);
      mergedHeatsMap.set(heat, {
        heat,
        // Never let a row that was saved without temperature/distance blank out
        // values another row already supplied for the same heat.
        temperature: temperature || existing?.temperature || "",
        distance: distance || existing?.distance || "",
        class: result.class || ""
      });
    };

    for (const sibling of siblingResults) {
      if (sibling.heatsData && Array.isArray(sibling.heatsData)) {
        for (const heat of sibling.heatsData) {
          if (heat.heat) {
            rememberHeat(heat.heat, heat.temperature, heat.distance);
          }
        }
      }
      // The row's own heat counts even when its heatsData is missing or stale.
      if (sibling.heat) {
        rememberHeat(sibling.heat, sibling.temperature, sibling.distance);
      }
    }

    if (mergedHeatsMap.size > 0) {
      const mergedHeats = Array.from(mergedHeatsMap.values()).sort((a, b) =>
        a.heat.localeCompare(b.heat, undefined, { numeric: true })
      );
      setHeats(mergedHeats);
      setSelectedHeat(result.heat || mergedHeats[0].heat);
    } else {
      // Set default heat if none exists
      setHeats([{
        heat: 'Heat 1',
        temperature: '',
        distance: '',
        class: result.class || ""
      }]);
      setSelectedHeat('Heat 1');
    }
    
    // Show the edit form
    setShowEditForm(true);
    
    // Log state for debugging
    console.log("Edit form opened with state:", {
      resultId: result._id,
      class: result.class,
      customClass: result.customClass,
      drivers: result.drivers
    });
  };

  // Add this inside your component
  const [updateEntrant, { loading: updateLoading }] = useMutation(
    UPDATE_ENTRANT,
    {
      onCompleted: (data) => {
        console.log("onCompleted update entrant invoked", data);
        if (data.updateEntrantDetails) {
          // Force refresh of the results data
          const refreshQuery = async () => {
            try {
              // Refetch the query to get the latest data
              await refetchResults();
              
              // Update local storage with the fresh data from the server
              if (selectedResult?.eventId) {
                const eventResultsKey = `eventResults_${selectedResult.eventId}`;
                
                // First try to get the event results from localStorage
                const storedResultsData = localStorage.getItem(eventResultsKey);
                let storedResults = storedResultsData ? JSON.parse(storedResultsData) : [];
                
                // Find and update the specific result
                const updatedIndex = storedResults.findIndex((stored: Result) => 
                  stored.name === data.updateEntrantDetails.name && 
                  stored.class === data.updateEntrantDetails.class &&
                  (stored.customClass || "") === (data.updateEntrantDetails.customClass || "")
                );
                
                if (updatedIndex !== -1) {
                  // Update existing result
                  storedResults[updatedIndex] = {
                    ...storedResults[updatedIndex],
                    class: data.updateEntrantDetails.class,
                    customClass: data.updateEntrantDetails.customClass,
                    raceFormat: data.updateEntrantDetails.raceFormat,
                    raceType: data.updateEntrantDetails.raceType,
                    raceTime: data.updateEntrantDetails.raceTime,
                    temperature: data.updateEntrantDetails.temperature,
                    distance: data.updateEntrantDetails.distance,
                    associatedDog: data.updateEntrantDetails.associatedDog
                  };
                } else {
                  // Add as new result if not found
                  storedResults.push({
                    ...data.updateEntrantDetails,
                    _id: uuidv4(), // Generate a temporary ID if not available
                    eventId: selectedResult.eventId
                  });
                }
                
                // Save updated results back to localStorage
                localStorage.setItem(eventResultsKey, JSON.stringify(storedResults));
                console.log("Updated localStorage with latest data:", data.updateEntrantDetails.name);
                
                // Force a UI update by updating results if onResultsUpdate is available
                if (onResultsUpdate) {
                  // Get latest results that match the current view
                  const latestResults = storedResults.filter((result: Result) => 
                    result.eventId === selectedResult.eventId
                  );
                  onResultsUpdate(latestResults);
                }
              }
            } catch (error) {
              console.error("Error refreshing results:", error);
            }
          };
          
          // Execute the refresh
          refreshQuery();
        }
        
        toast({
          title: "Result updated successfully",
          description: "Result updated successfully",
          variant: "default",
        });
        handleCloseEditForm();
      },
      onError: (error) => {
        console.log("onError update entrant invoked", error);
        toast({
          title: "Error updating result",
          description: `Error updating result: ${error.message}`,
          variant: "destructive",
        });
      },
      context: {
        headers: {
          authorization: localStorage.getItem("token") ? `Bearer ${localStorage.getItem("token")}` : "",
        },
      },
      refetchQueries: [{ query: GET_ALL_RESULTS }],
    }
  );
  
  // Every result shown here belongs to one event.
  const modalEventId = useMemo(
    () => results.find((r) => r.eventId)?.eventId || "",
    [results]
  );

  // Refetch this event's entrants after saving. This used to ask for
  // GET_ALL_RESULTS, which answers under getAllEntrants — so every caller's
  // check for getEntrantsByEventId was false and the refresh silently did
  // nothing, leaving the modal showing optimistic state the server had not
  // agreed to.
  const { refetch: refetchResults } = useQuery(GET_RESULTS_BY_EVENT_ID, {
    variables: { eventId: modalEventId },
    skip: true, // Skip initial fetch, we'll call refetch manually
    fetchPolicy: "network-only" // Always get fresh data from the server
  });

  const [createEntrant, { loading: createLoading }] = useMutation(
    CREATE_ENTRANT,
    {
      onCompleted: (data) => {
        console.log("onCompleted create entrant invoked", data);
        toast({
          title: data.createEntrant._id ? "Entrant updated successfully" : "Entrant created successfully",
          description: data.createEntrant._id ? "Existing entrant's race status has been updated" : "New entrant has been created",
          variant: "default",
        });
        handleCloseEditForm();
      },
      onError: (error) => {
        console.log("onError create entrant invoked", error);
        toast({
          title: "Error creating entrant",
          description: `Error creating entrant: ${error.message}`,
          variant: "destructive",
        });
      },
      context: {
        headers: {
          authorization: localStorage.getItem("token") ? `Bearer ${localStorage.getItem("token")}` : "",
        },
      },
      refetchQueries: [{ query: GET_ALL_RESULTS }],
    }
  );

  // Update the effect to handle dog objects when initializing editedDrivers
  useEffect(() => {
    // A new class starts with no drivers. selectedResult still points at the
    // class opened before it, so without this guard a refetch would refill the
    // Add New Class form with the previous class's drivers.
    if (selectedResult && !showAddClassForm) {
      // Only initialize if editedDrivers is empty
      if (editedDrivers.length === 0) {
        // Filter results to only include those matching the selected class and customClass
        const matchingResults = results.filter(
          (r) =>
            r.class === selectedResult.class &&
            (r.customClass || "") === (selectedResult.customClass || "")
        );

        console.log("Matching results for driver setup:", matchingResults);

        // Collapse legacy duplicate rows (same musher + heat) created by the
        // old dog-set matching bug. Prefer the fullest dog team.
        const isWeightPullClassFlag = isWeightPullClass(
          selectedResult.class,
          selectedResult.customClass
        );
        const isHeatedFlag = isHeatedFormat(
          selectedResult.raceFormat || raceFormat
        );

        const dedupedResults = dedupeEntrantsForEdit(
          matchingResults.map((r) => ({
            _id: r._id,
            name: r.name,
            class: r.class,
            customClass: r.customClass,
            heat: r.heat,
            raceFormat: r.raceFormat,
            associatedDog: Array.isArray(r.associatedDog)
              ? r.associatedDog.map((d) => ({
                  name: d.name || "",
                  NZFSSRegistration: d.NZFSSRegistration || "",
                }))
              : [],
          })),
          { isWeightPull: isWeightPullClassFlag, isHeated: isHeatedFlag }
        );

        const dedupedIds = new Set(dedupedResults.map((r) => r._id));
        const dedupedMatching = matchingResults.filter((r) =>
          dedupedIds.has(r._id)
        );

        // Add drivers from matching results
        const initialDrivers = dedupedMatching.map((result) => {
          // Convert associatedDog to Dogs array
          const dogObjects: Dogs[] = Array.isArray(result.associatedDog)
            ? result.associatedDog.map((dog) => ({
                id: dog.NZFSSRegistration || `dog-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                name: dog.name || "",
                NZFSSRegistration: dog.NZFSSRegistration || "",
                dob: dog.dob || "",
                breed: dog.breed || "",
                driverName: result.name
              }))
            : [];

          // Map the race status from the backend value to the UI option
          let raceStatus: Driver['raceStatus'] = "Started";
          
          if (result.raceType) {
            switch(result.raceType.toLowerCase()) {
              case "started":
                raceStatus = "Started";
                break;
              case "did not start":
                raceStatus = "Did not start";
                break;
              case "did not finish":
                raceStatus = "Did not finish";
                break;
              case "disqualified":
                raceStatus = "Disqualified";
                break;
              default:
                raceStatus = "Started";
            }
          }

          return {
            _id: result._id,
            name: result.name,
            dogs: dogObjects,
            raceTime: result.raceTime || null,
            raceStatus: raceStatus,
            dogWeight: (result as any).dogWeight || "",
            weightPulled: (result as any).weightPulled || "",
            heat: result.heat || 'Heat 1',
            isNew: false
          };
        });

        setEditedDrivers(initialDrivers);
        // Store original values for potential rollback
        setOriginalEditedDrivers(JSON.parse(JSON.stringify(initialDrivers)));
        setOriginalResults(JSON.parse(JSON.stringify(results)));
        
        // Initialize weight data for weight pull classes
        if (selectedResult.class?.toLowerCase() === "weight pull") {
          const weightData: { [key: number]: { dogWeight: string; weightPulled: string } } = {};
          initialDrivers.forEach((driver, index) => {
            weightData[index] = {
              dogWeight: driver.dogWeight || "",
              weightPulled: driver.weightPulled || ""
            };
          });
          setEditedDriverWeights(weightData);
        }
      }
    }
  }, [selectedResult, results, showAddClassForm]);

  const [deleteEntrant] = useMutation(DELETE_ENTRANT, {
    refetchQueries: [{ query: GET_ALL_RESULTS }],
  });

  // Find the uniqueResults computation and convert it to useMemo
  const uniqueResults = useMemo(() => {
    return Array.from(
      new Map(
        results.map((result) => [
          `${result.class}-${result.customClass || ""}`,
          result,
        ])
      ).values()
    );
  }, [results]);

  // Update the handleDelete function to update state locally first
  const handleDelete = async (classType: string, customClass: string) => {
    try {
      // Show confirmation dialog
      if (!confirm("Are you sure you want to delete these results?")) {
        return;
      }

      // Track deletion progress
      let successCount = 0;
      const eventId = results[0]?.eventId;
      
      // Create a copy of the results to update locally first
      const updatedResults = [...results].filter(
        result => !(result.class === classType && result.customClass === customClass)
      );

      // Update the local state first to provide immediate feedback
      if (onResultsUpdate) {
        onResultsUpdate(updatedResults);
      }

      // Process each result
      for (const result of results) {
        if (result.class === classType && result.customClass === customClass) {
          try {
            await deleteEntrant({
              variables: { entrantId: result._id },
              update: (cache) => {
                // Optionally update Apollo cache to remove the deleted item
                cache.modify({
                  fields: {
                    getEntrantsByEventId: (
                      existingEntrants = [],
                      { readField }
                    ) => {
                      return existingEntrants.filter(
                        (entrantRef: any) =>
                          readField("_id", entrantRef) !== result._id
                      );
                    },
                  },
                });
              },
              refetchQueries: [{ 
                query: GET_ALL_RESULTS,
                variables: { eventId } 
              }],
            });
            successCount++;
          } catch (err) {
            console.error(`Error deleting entrant ${result._id}:`, err);
          }
        }
      }

      // Show appropriate toast message
      if (successCount > 0) {
        toast({
          title: `Successfully deleted ${successCount} result(s)`,
          variant: "default",
        });
      } else {
        toast({
          title: "Failed to delete results",
          description: "No results were deleted",
          variant: "destructive",
        });
        
        // Revert the local state if the delete failed
        if (onResultsUpdate) {
          onResultsUpdate(results);
        }
      }
    } catch (error) {
      console.error("Error in handleDelete:", error);
      toast({
        title: "An error occurred while deleting results",
        description: "An error occurred while deleting results",
        variant: "destructive",
      });
      
      // Revert the local state if an error occurred
      if (onResultsUpdate) {
        onResultsUpdate(results);
      }
    }
  };

  // Reset state when closing the edit form
  // Leaving the Add New Class form has to drop its drivers. They belong to a
  // class that may never have been saved, and anything left behind would be
  // picked up by the next class opened for editing.
  const handleCloseAddClassForm = () => {
    setShowAddClassForm(false);
    setEditedDrivers([]);
    setOriginalEditedDrivers([]);
    setEditingDriverIndex(null);
    setHeats([{ heat: "Heat 1", temperature: "", distance: "" }]);
    setSelectedHeat("Heat 1");
  };

  const handleCloseEditForm = () => {
    setShowEditForm(false);
    setSelectedResult(null);
    setEditedDrivers([]);
    setCustomClass("");
    setEditedTemperature("");
    setEditedDistance("");
    setEditedStartTime("00:00:00.00");
    setRaceFormat("");
  };

  // Memoize filteredDrivers computation to prevent unnecessary re-renders
  useEffect(() => {
    if (!driverName || !data?.getMushers) {
      setFilteredDrivers([]);
      return;
    }
    console.log("editedDrivers", editedDrivers);

    const uniqueDrivers = Array.from(
      new Set(
        data.getMushers
          .map((dog) => dog.name)
          .filter(
            (name) =>
              name && name.toLowerCase().includes(driverName.toLowerCase())
          )
      )
    );

    setFilteredDrivers(uniqueDrivers);
  }, [driverName, data]);

  // Memoize handlers to prevent recreation on each render
  const handleDriverSelect = useCallback((name: string) => {
    setDriverName(name);
    setFilteredDrivers([]); // Clear filtered drivers after selection
  }, []);

  // Add a function to add a new dog to a driver
  const handleAddDogToDriver = (driverIndex: number) => {
    const driver = editedDrivers[driverIndex];
    setEditingDriverIndex(driverIndex);
    setDriverName(driver.name);
    setSelectedRows(driver.dogs);
    if (raceFormat === 'Heated') {
      setSelectedHeat(driver.heat || 'Heat 1');
    }
    setShowAddDriverModal(true);
  };

  // Add this helper function after the isDriverAlreadyInClass function
  const isDogAlreadyAdded = (dog: Dogs, existingDogs: Dogs[]): boolean => {
    return existingDogs.some(existingDog => 
      existingDog.name.toLowerCase() === dog.name.toLowerCase() &&
      existingDog.NZFSSRegistration?.toLowerCase() === dog.NZFSSRegistration?.toLowerCase()
    );
  };

  // Helper to compare two dog arrays by name & registration
  function areDogsSame(dogsA: Dogs[], dogsB: Dogs[]): boolean {
    if (dogsA.length !== dogsB.length) return false;
    const key = (d: Dogs) => `${d.name.toLowerCase()}|${(d.NZFSSRegistration || '').toLowerCase()}`;
    const setA = dogsA.map(key).sort().join(',');
    const setB = dogsB.map(key).sort().join(',');
    return setA === setB;
  }

  // Simplify handleAddDriver to remove duplicate checks
  const handleAddDriver = () => {
    // Validation check
    if (!driverName.trim()) {
      toast({
        title: "Missing driver name",
        description: "Please enter a driver name",
        variant: "destructive",
      });
      return;
    }

    // Check if this is a weight pull event - use consistent detection
    const isWeightPull = isWeightPullClass(selectedRadio || raceType, customClass);
    const isHeated = isHeatedFormat(raceFormat);
    
    // For weight pull, always create separate entries for each dog.
    // For other race types, update the card we opened "Add Dog" on, or the
    // existing card for this musher (+ heat). Match by identity — not by the
    // exact dog set — otherwise adding a dog creates a duplicate Heat 1 row.
    const existingDriverIndex = findDriverCardToUpdate(editedDrivers, {
      driverName,
      selectedHeat,
      isHeated,
      isWeightPull,
      editingDriverIndex,
    });
    
    if (existingDriverIndex !== -1) {
      // Update existing driver (only for non-weight pull races)
      const newDogsToAdd = [...selectedRows, ...customDogs];

      if (newDogsToAdd.length === 0) {
        toast({
          title: "No dogs selected",
          description: "Please select at least one dog to add",
          variant: "destructive",
        });
        return;
      }

      // Update existing driver's dogs by replacing them
      setEditedDrivers(prevDrivers => {
        const newDrivers = [...prevDrivers];
        const currentDriver = newDrivers[existingDriverIndex];
        
        newDrivers[existingDriverIndex] = {
          ...currentDriver,
          dogs: newDogsToAdd.map(dog => ({
            id: dog.id || uuidv4(),
            name: dog.name,
            NZFSSRegistration: dog.NZFSSRegistration || "",
            dob: dog.dob || "",
            breed: dog.breed || "",
            driverName: driverName
          }))
        };
        return newDrivers;
      });

      toast({
        title: "Team updated",
        description: "Dog team updated. Click Submit to save all changes.",
        variant: "default",
      });
    } else {
      // Create new driver entry (for weight pull or new drivers in other races)
      if (selectedRows.length === 0 && customDogs.length === 0) {
        toast({
          title: "No dogs selected",
          description: "Please select at least one dog",
          variant: "destructive",
        });
        return;
      }

      // Format the race time from the timeInputState
      let formattedRaceTime = "00:00:00.00";
      if (selectedRaceStatus === "Started") {
        const hours = timeInputState.hours.padStart(2, '0');
        const minutes = timeInputState.minutes.padStart(2, '0');
        const seconds = timeInputState.seconds.padStart(2, '0');
        const ms = timeInputState.ms.padStart(2, '0');
        
        formattedRaceTime = `${hours}:${minutes}:${seconds}.${ms}`;
      }

      // Create a new driver entry
      const newDriver: any = {
        name: driverName,
        dogs: [...selectedRows, ...customDogs].map(dog => ({
          id: dog.id || uuidv4(),
          name: dog.name,
          NZFSSRegistration: dog.NZFSSRegistration || "",
          dob: dog.dob || "",
          breed: dog.breed || "",
          driverName: driverName
        })),
        raceStatus: selectedRaceStatus as "Started" | "Did not start" | "Did not finish" | "Disqualified",
        raceTime: selectedRaceStatus === "Started" ? formattedRaceTime : null,
        heat: raceFormat === 'Heated' ? selectedHeat : 'Heat 1',
        isNew: true
      };
      
      // Add weight pull specific data if applicable
      if (isWeightPull && selectedRaceStatus === "Started") {
        newDriver.dogWeight = dogWeight;
        newDriver.weightPulled = weightPulled;
      }

      console.log(`Adding new driver entry with race status: ${selectedRaceStatus}, race time: ${newDriver.raceTime}`);

      // Add the new driver to the list
      setEditedDrivers(prevDrivers => [...prevDrivers, newDriver]);
      
      // Show success message
      const message = isWeightPull 
        ? "Driver entry added for weight pull. Each dog will compete individually with separate timings and weight data."
        : "Driver added to the form. Click Submit to save all changes.";
        
      toast({
        title: "Driver added",
        description: message,
        variant: "default",
      });
    }

    // Reset form
    setEditingDriverIndex(null);
    setDriverName("");
    setSelectedRows([]);
    setCustomDogs([]);
    setTempDogName("");
    setTempRegistration("");
    setTempDob("");
    setTempBreed("");
    setTimeInputState({
      hours: "",
      minutes: "",
      seconds: "",
      ms: ""
    });
    setDogWeight("");
    setWeightPulled("");
    setShowAddDriverModal(false);
  };

  // Add a function to handle adding a custom dog
  const handleAddCustomDog = () => {
    if (!tempDogName.trim()) {
      toast({
        title: "Dog name is required",
        description: "Please enter a name for the dog",
        variant: "destructive",
      });
      return;
    }

    // Check for duplicate dog name
    if (customDogs.some(dog => dog.name.toLowerCase() === tempDogName.toLowerCase())) {
      toast({
        title: "Dog already added",
        description: "A dog with this name has already been added",
        variant: "destructive",
      });
      return;
    }

    const newDog: Dogs = {
      id: `custom-${Date.now()}`,
      name: tempDogName,
      NZFSSRegistration: tempRegistration || "",
      dob: tempDob || "2000-01-01", // Default date if not provided
      breed: tempBreed || "Unknown",
      driverName: driverName,
    };

    console.log("Adding custom dog:", newDog);
    setCustomDogs(prev => [...prev, newDog]);
    
    // Reset the form fields
    setTempDogName("");
    setTempRegistration("");
    setTempDob("");
    setTempBreed("");
  };

  // Add a function to remove a custom dog
  const handleRemoveCustomDog = (dogId: string) => {
    setCustomDogs(prev => prev.filter(dog => dog.id !== dogId));
  };

  const handleToggleAddDriverModal = useCallback((show: boolean) => {
    if (!show) {
      // Reset state when closing without saving
      setEditingDriverIndex(null);
      setDriverName("");
      setSelectedRows([]);
      setFilteredDrivers([]);
      setManualDriverMode(false);
      setCustomDogs([]);
      setTempDogName("");
      setTempRegistration("");
      setTempDob("");
      setTempBreed("");
      setDogWeight("");
      setWeightPulled("");
      // Reset other dogs state
      resetOtherDogsState();
    }
    setShowAddDriverModal(show);
  }, []);

  const handleLogHistory = (entrantId: string) => {
    setSelectedEntrantId(entrantId);
    setShowLogHistory(true);
  };

  // Update the handleEdit function to manage expanded state properly
  const handleEdit = (resultId: string) => {
    // Toggle expanded view when clicking edit
    setExpandedResult(expandedResult === resultId ? null : resultId);
    
    // If we're expanding a result, reset any previous form state
    if (expandedResult !== resultId) {
      setShowEditForm(false);
      setSelectedResult(null);
      setEditedDrivers([]);
    }
  };

  // Update the handleDriverChange function to properly isolate changes
  const handleDriverChange = (
  index: number,
  field: keyof Driver | string,
  value: string | Dogs[] | "Started" | "Did not start" | "Did not finish" | "Disqualified"
) => {
    setEditedDrivers(prevDrivers => {
      // Create a deep copy of the drivers array to avoid unintended side effects
      const newDrivers = prevDrivers.map(driver => ({
        ...driver, 
        dogs: driver.dogs.map((dog: Dogs) => ({
          ...dog,
          // Keep blank registrations blank (do not coerce to "Unknown")
          NZFSSRegistration: dog.NZFSSRegistration || '',
          breed: dog.breed || 'Unknown',
          dob: dog.dob || '2000-01-01'
        })),
        raceTime: driver.raceTime,
        raceStatus: driver.raceStatus,
        dogWeight: driver.dogWeight,
        weightPulled: driver.weightPulled
      }));
      
      if (field === "name") {
        // Handle name field specifically
        newDrivers[index] = {
          ...newDrivers[index],
          [field]: value as string
        };
      } else if (field === "dogs") {
        // Handle dogs field specifically
        newDrivers[index] = {
          ...newDrivers[index],
          [field]: (value as Dogs[]).map(dog => ({
            ...dog,
            NZFSSRegistration: dog.NZFSSRegistration || '',
            breed: dog.breed || 'Unknown',
            dob: dog.dob || '2000-01-01'
          }))
        };
      } else if (field === "raceStatus") {
        // Handle raceStatus field specifically
        const newStatus = value as "Started" | "Did not start" | "Did not finish" | "Disqualified";
        const currentDriver = newDrivers[index];
        
        // Only update race time if the status is changing from or to "Started"
        const wasStarted = currentDriver.raceStatus === "Started";
        const willBeStarted = newStatus === "Started";
        
        // Update ONLY this specific driver's status
        newDrivers[index] = {
          ...currentDriver,
          raceStatus: newStatus,
          // Preserve race time if it was "Started" and will be "Started"
          // Otherwise set to null for non-started statuses
          raceTime: (wasStarted && willBeStarted) 
            ? currentDriver.raceTime || "00:00:00.00"
            : willBeStarted 
              ? "00:00:00.00"
              : null
        };
        
        console.log(`Updated driver ${index} status to ${newStatus}, race time: ${newDrivers[index].raceTime}`);
        
        // If we're editing an expanded result, update the local state immediately
        if (selectedResult && expandedResult === selectedResult._id && selectedResult.drivers) {
          const updatedResultDrivers = [...selectedResult.drivers];
          if (updatedResultDrivers[index]) {
            updatedResultDrivers[index] = {
              ...updatedResultDrivers[index],
              raceStatus: newStatus,
              raceTime: (wasStarted && willBeStarted) 
                ? updatedResultDrivers[index].raceTime || "00:00:00.00" 
                : willBeStarted 
                  ? "00:00:00.00" 
                  : null
            };
            
            // Update the selectedResult to trigger UI refresh
            setSelectedResult({
              ...selectedResult,
              drivers: updatedResultDrivers
            });
            
            // Update the results array if possible
            if (onResultsUpdate && results) {
              const localUpdatedResults = results.map(result => {
                if (result._id === selectedResult._id) {
                  return {
                    ...result,
                    drivers: updatedResultDrivers
                  };
                }
                return result;
              });
              
              // Update without waiting for API response
              onResultsUpdate(localUpdatedResults, false);
            }
          }
        }
      } else if (field === "raceTime") {
        // Handle raceTime field specifically
        newDrivers[index] = {
          ...newDrivers[index],
          raceTime: value as string
        };
      } else if (field === "dogWeight") {
        // Handle dogWeight field specifically for weight pull
        newDrivers[index] = {
          ...newDrivers[index],
          dogWeight: value as string
        };
      } else if (field === "weightPulled") {
        // Handle weightPulled field specifically for weight pull
        newDrivers[index] = {
          ...newDrivers[index],
          weightPulled: value as string
        };
      }
      
      return newDrivers;
    });
  };

  // Fix the handleDogsChange function to handle the correct types
  const handleDogsChange = (index: number, dogString: string) => {
    const dogsArray = dogString.split(",").map((dog) => dog.trim());
    // Convert string array to Dogs array with required structure
    const dogsObjects: Dogs[] = dogsArray.map(dogName => ({
      id: `temp-${Date.now()}-${Math.random()}`,
      name: dogName,
      NZFSSRegistration: "",
      dob: "",
      breed: "",
      driverName: editedDrivers[index]?.name || ""
    }));
    handleDriverChange(index, "dogs", dogsObjects);
  };

  const handleRemoveDriver = (index: number) => {
    setEditedDrivers((prev) => prev.filter((_, i) => i !== index));
  };

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      setDriverName(inputValue);
    },
    []
  );

  const handleDogSelect = useCallback((dog: Dogs) => {
    setSelectedRows((prevRows) => {
      const isSelected = prevRows.some(
        (selected) =>
          selected.name === dog.name &&
          selected.NZFSSRegistration === dog.NZFSSRegistration
      );

      if (isSelected) {
        // Remove the dog if already selected
        return prevRows.filter(
          (selected) =>
            selected.name !== dog.name ||
            selected.NZFSSRegistration !== dog.NZFSSRegistration
        );
      } else {
        // Add the new dog
        return [...prevRows, dog];
      }
    });
  }, []);

  // Update the filteredDogs memo to handle undefined data safely
  const filteredDogs = useMemo(() => {
    if (manualDriverMode || !driverName || !data?.getMushers) return [];

    // Find the musher that matches the driver name
    const selectedMusher = data.getMushers.find(
      (musher) => musher.name.toLowerCase() === driverName.toLowerCase()
    );

    // Return the dogs if musher is found, otherwise empty array
    return selectedMusher
      ? selectedMusher.dogs.map((dog: any) => ({
          id: dog.nzfssNo || "",
          name: dog.name,
          NZFSSRegistration: dog.nzfssNo,
          dob: dog.dateOfBirth || "",
          breed: dog.breed || "",
          driverName: selectedMusher.name,
        }))
      : [];
  }, [driverName, data, manualDriverMode]);

  // Update the formatRaceTime function to handle empty strings better
  const formatRaceTime = (time: string | undefined): string | null => {
    if (!time || time.trim() === '') {
      console.log("Empty race time provided, returning null");
      return null;
    }
    
    // Basic validation for hh:mm:ss.ms format
    const timeRegex = /^([0-9]{1,2}):([0-5][0-9]):([0-5][0-9])\.([0-9]{1,2})$/;
    if (timeRegex.test(time)) {
      console.log("Valid race time format:", time);
      return time;
    }
    
    // Handle the case where the user entered 11:11:11:11 format (with colon instead of period)
    const colonFormatRegex = /^([0-9]{1,2}):([0-5][0-9]):([0-5][0-9]):([0-9]{1,2})$/;
    if (colonFormatRegex.test(time)) {
      // Convert the last colon to a period
      const correctedTime = time.replace(/^(\d+):(\d+):(\d+):(\d+)$/, "$1:$2:$3.$4");
      console.log("Converted race time format:", correctedTime);
      return correctedTime;
    }
    
    // If not in the correct format, try to format it
    const cleanTime = time.replace(/[^0-9:\.]/g, '');
    console.log("Cleaned race time:", cleanTime || null);
    return cleanTime || null;
  };

  // Update the validation function to handle dog objects
  const validateEntrantData = (driverData: any, isUpdate: boolean = false): { isValid: boolean; message: string } => {
    if (!driverData.name || driverData.name.trim() === '') {
      return { isValid: false, message: "Driver name cannot be empty" };
    }
    
    if (!driverData.class || driverData.class.trim() === '') {
      return { isValid: false, message: "Class type must be selected" };
    }
    
    if (!driverData.raceFormat || driverData.raceFormat.trim() === '') {
      return { isValid: false, message: "Race format must be specified" };
    }
    
    // Only check eventId for create operations, not updates
    if (!isUpdate && !driverData.eventId) {
      return { isValid: false, message: "Event ID is missing" };
    }
    
    // Verify each dog in associatedDog has the required fields
    if (!Array.isArray(driverData.associatedDog) || driverData.associatedDog.length === 0) {
      return { isValid: false, message: "Associated dogs are required" };
    }
    
    for (const dog of driverData.associatedDog) {
      // Use type assertion inside the loop
      const typedDog = dog as { name?: string; driverName?: string };
      if (!typedDog.name || !typedDog.driverName) {
        return { isValid: false, message: "Each dog must have a name and driverName" };
      }
    }
    
    // If raceTime is provided and not N/A, validate using our helper function
    if (driverData.raceTime && driverData.raceTime.toLowerCase() !== 'n/a') {
      // Our helper will return undefined for invalid formats
      const validatedRaceTime = prepareRaceTimeForSubmission(driverData.raceTime);
      if (driverData.raceTime && !validatedRaceTime) {
        return { isValid: false, message: "Race time must be in the format hh:mm:ss.ms" };
      }
    }
    
    return { isValid: true, message: "" };
  };

  // Add a helper function to safely prepare race time data
  const prepareRaceTimeForSubmission = (raceTime: string | null | undefined): string | undefined => {
    // If it's null, undefined, empty string, or N/A, return undefined to omit it from the request
    if (raceTime === null || raceTime === undefined || raceTime.trim() === '' || raceTime.toLowerCase() === 'n/a') {
      return undefined;
    }
    
    // Basic validation for hh:mm:ss.ms format
    const timeRegex = /^([0-9]{1,2}):([0-5][0-9]):([0-5][0-9])\.([0-9]{1,2})$/;
    if (timeRegex.test(raceTime)) {
      // It's a valid format, return as is
      return raceTime;
    }
    
    // If it's not in the expected format, return undefined to omit it
    console.warn("Invalid race time format. Omitting from request:", raceTime);
    return undefined;
  };

  // Modify the prepareTimeFieldForSubmission function to be more strict with startTime
  const prepareTimeFieldForSubmission = (timeField: string | null | undefined): string | undefined => {
    // If it's null or empty string or doesn't match a specific format, return undefined to omit it
    if (!timeField || timeField.trim() === '') {
      console.log("Time field is empty, omitting from request");
      return undefined;
    }
    
    console.log("Time field included in request:", timeField);
    return timeField;
  };

  // Update the sanitizeGraphQLInput function to properly handle dog data
  const sanitizeGraphQLInput = (input: Record<string, any>): Record<string, any> => {
    const sanitized: Record<string, any> = {};
    
    // Always preserve heat and heatsData for heated races
    if (input.raceFormat === 'Heated') {
      if (input.heat) {
        console.log("Explicitly preserving heat value in sanitizer:", input.heat);
        sanitized.heat = input.heat;
      }
      
      if (input.heatsData && Array.isArray(input.heatsData)) {
        sanitized.heatsData = input.heatsData;
        console.log("Preserving heatsData in sanitizer:", input.heatsData);
      }
    }
    
    for (const key in input) {
      const value = input[key];
      
      // Skip already processed heat fields and null values
      if ((key === 'heat' || key === 'heatsData') && input.raceFormat === 'Heated') continue;
      if (value === null || value === undefined) continue;
      
      // Special handling for associatedDog array to ensure required fields
      if (key === 'associatedDog' && Array.isArray(value)) {
        sanitized[key] = value.map((dog: { name?: string; NZFSSRegistration?: string; dob?: string; breed?: string; driverName?: string }) => ({
          name: dog.name || 'Unknown',
          // Keep blank registrations blank — coercing to "Unknown" made real
          // dogs look unregistered and broke dog-points lookup by reg number.
          NZFSSRegistration: dog.NZFSSRegistration || '',
          dob: dog.dob || '2000-01-01',
          breed: dog.breed || 'Unknown',
          driverName: dog.driverName || 'Unknown'
        }));
        continue;
      }
      
      // For string values, skip if empty (except startTime, temperature, distance, dogWeight, and weightPulled which are required)
      if (typeof value === 'string' && value.trim() === '' && 
          key !== 'startTime' && key !== 'temperature' && key !== 'distance' && 
          key !== 'dogWeight' && key !== 'weightPulled') continue;
      
      // For arrays, include if not empty
      if (Array.isArray(value) && value.length > 0) {
        sanitized[key] = value;
        continue;
      }
      
      // Include all other values
      sanitized[key] = value;
    }
    
    // Always include these fields with at least an empty string since they might be required
    sanitized.startTime = input.startTime || '';
    sanitized.temperature = input.temperature || '';
    sanitized.distance = input.distance || '';
    
    // Include weight pull fields if they exist in the input
    if (input.dogWeight !== undefined) {
      sanitized.dogWeight = input.dogWeight || '';
    }
    if (input.weightPulled !== undefined) {
      sanitized.weightPulled = input.weightPulled || '';
    }
    
    // Explicitly include raceFormat — never persist a blank string
    sanitized.raceFormat = input.raceFormat || 'Single';
    
    console.log("Sanitized input for GraphQL:", JSON.stringify(sanitized, null, 2));
    
    return sanitized;
  };

  // Update the debug function to use our sanitizer
  const debugLogMutation = (data: any, operation: string) => {
    // Sanitize the data to remove empty values and problematic fields
    const cleanData = sanitizeGraphQLInput(data);
    
    console.log(`[${operation}] Final mutation payload:`, JSON.stringify(cleanData, null, 2));
    return cleanData;
  };

  // Add a function to handle editing a dog
  const handleDogEdit = (driverIndex: number, dogIndex: number, field: keyof Dogs, value: string) => {
    // Use a callback to ensure we're working with the latest state
    setEditedDrivers(prevDrivers => {
      // Create a deep copy of the drivers array
      const newDrivers = prevDrivers.map(driver => ({
        ...driver,
        dogs: driver.dogs.map((dog: Dogs) => ({ ...dog }))
      }));

      // Update the specific dog's field
      if (newDrivers[driverIndex] && newDrivers[driverIndex].dogs[dogIndex]) {
        newDrivers[driverIndex].dogs[dogIndex] = {
          ...newDrivers[driverIndex].dogs[dogIndex],
          [field]: value
        };
      }

      // Update the original results to ensure persistence. A new class has no
      // saved rows yet, and selectedResult still points at the class opened
      // before it — writing there would edit a different class's dog team.
      if (!showAddClassForm && selectedResult) {
        const driverBeingEdited = newDrivers[driverIndex];
        const updatedResults = results.map(result => {
          const sameEntrant =
            (driverBeingEdited._id && result._id === driverBeingEdited._id) ||
            (!driverBeingEdited._id &&
              result.name === driverBeingEdited.name &&
              result.class === selectedResult.class &&
              (result.customClass || "") === (selectedResult.customClass || "") &&
              (raceFormat !== 'Heated' || (result.heat || 'Heat 1') === (driverBeingEdited.heat || 'Heat 1')));

          if (sameEntrant) {
            return {
              ...result,
              associatedDog: newDrivers[driverIndex].dogs.map((dog: Dogs) => ({
                name: dog.name,
                NZFSSRegistration: dog.NZFSSRegistration || undefined,
                dob: dog.dob || undefined,
                breed: dog.breed || undefined,
                driverName: newDrivers[driverIndex].name
              }))
            };
          }
          return result;
        });
        
        // Update localStorage if eventId exists
        if (selectedResult.eventId) {
          const eventResultsKey = `eventResults_${selectedResult.eventId}`;
          localStorage.setItem(eventResultsKey, JSON.stringify(updatedResults));
        }
      }

      return newDrivers;
    });
  };

  // Add a function to remove a dog from a driver
  const handleRemoveDogFromDriver = (driverIndex: number, dogIndex: number) => {
    setEditedDrivers(prevDrivers => {
      const newDrivers = [...prevDrivers];
      const updatedDogs = newDrivers[driverIndex].dogs.filter((_: Dogs, i: number) => i !== dogIndex);
      newDrivers[driverIndex] = {
        ...newDrivers[driverIndex],
        dogs: updatedDogs
      };

      // Update the original results to ensure persistence. A new class has no
      // saved rows yet, and selectedResult still points at the class opened
      // before it — writing there would edit a different class's dog team.
      if (!showAddClassForm && selectedResult) {
        const driverBeingEdited = newDrivers[driverIndex];
        const updatedResults = results.map(result => {
          const sameEntrant =
            (driverBeingEdited._id && result._id === driverBeingEdited._id) ||
            (!driverBeingEdited._id &&
              result.name === driverBeingEdited.name &&
              result.class === selectedResult.class &&
              (result.customClass || "") === (selectedResult.customClass || "") &&
              (raceFormat !== 'Heated' || (result.heat || 'Heat 1') === (driverBeingEdited.heat || 'Heat 1')));

          if (sameEntrant) {
            return {
              ...result,
              associatedDog: updatedDogs.map((dog: Dogs) => ({
                name: dog.name,
                NZFSSRegistration: dog.NZFSSRegistration || undefined,
                dob: dog.dob || undefined,
                breed: dog.breed || undefined,
                driverName: newDrivers[driverIndex].name
              }))
            };
          }
          return result;
        });
        
        // Update localStorage if eventId exists
        if (selectedResult.eventId) {
          const eventResultsKey = `eventResults_${selectedResult.eventId}`;
          localStorage.setItem(eventResultsKey, JSON.stringify(updatedResults));
        }
      }

      return newDrivers;
    });
  };

  // Add this function after the formatRaceTime function or before the render return statement
  // Format startTime to display as hh:mm:ss.ms
  const formatStartTime = (time: string | undefined | null): string => {
    if (!time || time.trim() === '' || time.toLowerCase() === 'n/a') {
      return "N/A";
    }
    
    // If it's already in hh:mm:ss.ms format, return as is
    const timeRegex = /^([0-9]{1,2}):([0-5][0-9]):([0-5][0-9])\.([0-9]{1,2})$/;
    if (timeRegex.test(time)) {
      return time;
    }
    
    // For "12121212" format, convert to "12:12:12.1" format
    // Extract hours, minutes, seconds and milliseconds
    const cleanTime = time.replace(/[^0-9]/g, '');
    if (cleanTime.length >= 6) {
      const hours = cleanTime.substring(0, 2);
      const minutes = cleanTime.substring(2, 4);
      const seconds = cleanTime.substring(4, 6);
      const ms = cleanTime.length > 6 ? cleanTime.substring(6, 7) : '0';
      
      return `${hours}:${minutes}:${seconds}.${ms}`;
    }
    
    // If we can't format it, return N/A
    return "N/A";
  };

  // Handler for class change selection
  const handleClassChange = (value: string) => {
    // If the user selects "Add custom class", switch to the custom class input
    if (value.toLowerCase() === "add custom class") {
      setSelectedClass("add custom class");
    } else {
      // Otherwise, set the selected class from the predefined options
      setSelectedClass(value);
    }
  };

  // Handler for custom class input change
  const handleCustomClassChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomClass(e.target.value);
  };

  // Handler for add class button
  const handleAddClassClick = () => {
    if (addClassButtonText === "Add Class") {
      setIsDropdownDisabled(true);
      setShowClassInput(true);
      setAddClassButtonText("Clear Class");
    } else {
      setIsDropdownDisabled(false);
      setAddClassButtonText("Add Class");
      setCustomClass("");
    }
  };

  // Function to validate time input values
  const validateTimeValue = (part: 'hours' | 'minutes' | 'seconds' | 'ms', value: string): boolean => {
    if (!value) return true; // Allow empty values
    
    const numValue = parseInt(value);
    
    switch (part) {
      case 'hours':
        return true; // Hours can be any value
      case 'minutes':
        return numValue <= 59; // Minutes: 0-59
      case 'seconds':
        return numValue <= 59; // Seconds: 0-59
      case 'ms':
        return numValue <= 99; // Milliseconds: 0-99
      default:
        return true;
    }
  };

  // Add a function to handle time input changes
  const handleTimeInputChange = (type: 'start' | 'race', part: 'hours' | 'minutes' | 'seconds' | 'ms', value: string) => {
    // Remove any non-numeric characters and limit to 2 digits
    let cleanValue = value.replace(/[^0-9]/g, '').slice(0, 2);
    
    // Validate the value before proceeding
    if (cleanValue && !validateTimeValue(part, cleanValue)) {
      return; // Reject invalid input
    }
    
    if (type === 'start') {
      const currentTime = editedStartTime || '00:00:00.00';
      const [time, ms] = currentTime.split('.');
      const [hours, minutes, seconds] = time.split(':');
      
      let newTime;
      if (part === 'ms') {
        newTime = `${hours}:${minutes}:${seconds}.${cleanValue.padStart(2, '0')}`;
      } else if (part === 'hours') {
        newTime = `${cleanValue.padStart(2, '0')}:${minutes}:${seconds}.${ms}`;
      } else if (part === 'minutes') {
        newTime = `${hours}:${cleanValue.padStart(2, '0')}:${seconds}.${ms}`;
      } else {
        newTime = `${hours}:${minutes}:${cleanValue.padStart(2, '0')}.${ms}`;
      }
      
      setEditedStartTime(newTime);
    } else {
      // For race time, always update with the new value (even if empty)
      setTimeInputState(prev => ({
        ...prev,
        [part]: cleanValue
      }));
    }
  };

console.log("editedDrivers", editedDrivers);
  // Add debug logging for editedDrivers changes
  useEffect(() => {
    console.log("editedDrivers updated:", editedDrivers);
  }, [editedDrivers]);

  // Add new useEffect to populate all other dogs when data changes
  useEffect(() => {
    if (data?.getMushers && data.getMushers.length > 0) {
      // Get all dogs from all mushers
      const allDogs = data.getMushers.flatMap((musher: any) => 
        musher.dogs.map((dog: any) => ({
          ...dog,
          musherName: musher.name // Add musher name for display
        }))
      );
      
      setAllOtherDogs(allDogs);
    }
  }, [data]);

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
  const handleOtherDogSelect = (dog: any) => {
    // Check if dog is already selected
    const isSelected = selectedRows.some(selected => 
      selected.name === dog.name && 
      selected.breed === dog.breed
    );
    
    if (isSelected) {
      // Remove dog from selection
      setSelectedRows(selectedRows.filter(selected => 
        !(selected.name === dog.name && selected.breed === dog.breed)
      ));
    } else {
      // Add dog to selection
      const formattedDog: Dogs = {
        id: Math.random().toString(36).substr(2, 9),
        name: dog.name || "",
        NZFSSRegistration: dog.nzfssNo || "",
        dob: dog.dateOfBirth || "",
        breed: dog.breed || "",
        driverName: driverName
      };
      setSelectedRows([...selectedRows, formattedDog]);
    }
  };

  // Reset other dogs search when dialog opens/closes
  const resetOtherDogsState = () => {
    setOtherDogsSearch("");
    setOtherDogsDisplayCount(10);
  };

  // Add new function to handle finding entrant by driver name and class
  const findEntrantByDriverAndClass = (driverName: string, classType: string, customClass: string | undefined): Result | undefined => {
    return results.find(result => 
      result.name === driverName && 
      result.class === classType && 
      (result.customClass || "") === (customClass || "") &&
      // Ensure the result has a valid MongoDB _id (24 characters hex string or MongoDB ObjectId)
      result._id && (typeof result._id === 'string' && /^[0-9a-fA-F]{24}$/.test(result._id))
    );
  };

  // Update handleSubmitEditForm function
  const handleSubmitEditForm = async (e: React.MouseEvent<HTMLButtonElement>): Promise<void> => {
    e.preventDefault();
    
    // Add early return if selectedResult is null
    if (!selectedResult) {
      toast({
        title: "Error",
        description: "No result selected for editing",
        variant: "destructive",
      });
      return;
    }
    
    // Prevent multiple submissions
    if (isSubmitting) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      toast({
        title: "Processing",
        description: "Saving all drivers and updates...",
        variant: "default",
      });
      
      // Track if we've made any changes that need to be reflected in the UI
      let hasUpdatedResults = false;
      let creationPromises = [];
      let updatePromises = [];
      let deletePromises = [];
      let orphanDeletePromises: Promise<any>[] = [];
      
      // Keep track of local updates for immediate UI feedback
      let localUpdatedResults = [...results];
      let deletedIds = [];

      // Add debug logging
      console.log("Submitting form with editedDrivers:", editedDrivers);
      console.log("Selected radio:", selectedRadio);

      // First, handle deletions by comparing original and edited drivers
      // Prefer matching by entrant _id so heat siblings and dog-set changes
      // do not delete (or spare) the wrong document.
      const isHeatedSubmit = isHeatedFormat(raceFormat);
      const isWeightPullSubmit = isWeightPullClass(
        selectedRadio || raceType || selectedResult.class,
        customClass || selectedResult.customClass
      );

      // Delete removed drivers — also any legacy duplicate rows that were
      // collapsed out of the edit form, so they cannot reappear on refetch.
      // Rows still owned by a card on the form are never swept up, or removing
      // one weight-pull entry would delete every entry for that musher.
      const classRowsForDelete = results.filter(
        (r) =>
          r.class === selectedResult.class &&
          (r.customClass || "") === (selectedResult.customClass || "")
      );

      const idsToDelete = planDriverDeletions(
        originalEditedDrivers.map((d) => ({ _id: d._id, name: d.name, heat: d.heat })),
        editedDrivers.map((d) => ({ _id: d._id, name: d.name, heat: d.heat })),
        classRowsForDelete.map((r) => ({
          _id: r._id,
          name: r.name,
          class: r.class,
          customClass: r.customClass,
          heat: r.heat,
          raceFormat: r.raceFormat,
        })),
        { isHeated: isHeatedSubmit, isWeightPull: isWeightPullSubmit }
      );

      console.log(`Processing ${editedDrivers.length} drivers (${idsToDelete.size} rows to delete)`);

      for (const entrantId of idsToDelete) {
        deletePromises.push(deleteEntrant({ variables: { entrantId } }));
        deletedIds.push(entrantId);
        hasUpdatedResults = true;
      }

      // Remove deleted entries from local results immediately
      if (deletedIds.length > 0) {
        localUpdatedResults = localUpdatedResults.filter(result => !deletedIds.includes(result._id));
      }

      // Wait for all deletion promises to complete
      if (deletePromises.length > 0) {
        console.log(`Deleting ${deletePromises.length} drivers...`);
        await Promise.all(deletePromises);
      }

      // Plan orphan cleanup once up-front so two cards for the same musher
      // cannot mutually delete each other mid-loop.
      const editRowsSnapshot = localUpdatedResults.map((r) => ({
        _id: r._id,
        name: r.name,
        class: r.class,
        customClass: r.customClass,
        heat: r.heat,
        raceFormat: r.raceFormat,
        associatedDog: Array.isArray(r.associatedDog)
          ? r.associatedDog.map((d) => ({
              name: d.name || "",
              NZFSSRegistration: d.NZFSSRegistration || "",
            }))
          : [],
      }));

      const { orphanIds: plannedOrphanIds } = planOrphanCleanup(
        editedDrivers.map((d) => ({
          _id: d._id,
          name: d.name,
          dogs: d.dogs.map((dog: Dogs) => ({
            name: dog.name,
            NZFSSRegistration: dog.NZFSSRegistration,
          })),
          heat: d.heat,
          isNew: d.isNew,
        })),
        editRowsSnapshot,
        {
          className: selectedResult.class,
          customClass: selectedResult.customClass || "",
          isHeated: isHeatedSubmit,
          isWeightPull: isWeightPullSubmit,
          selectedHeat,
        }
      );

      for (const orphanId of plannedOrphanIds) {
        orphanDeletePromises.push(
          deleteEntrant({ variables: { entrantId: orphanId } })
        );
        deletedIds.push(orphanId);
        hasUpdatedResults = true;
      }
      if (plannedOrphanIds.size > 0) {
        localUpdatedResults = localUpdatedResults.filter(
          (result) => !plannedOrphanIds.has(result._id)
        );
      }

      // Process each driver in the current editedDrivers list
      for (const driver of editedDrivers) {
        // Skip cards whose rows were planned as orphans (kept card wins)
        if (isMongoId(driver._id) && plannedOrphanIds.has(driver._id)) {
          continue;
        }

        let raceTypeValue = driver.raceStatus.toLowerCase();
        
        // Add debug logging for each driver
        console.log("Processing driver:", {
          name: driver.name,
          raceStatus: driver.raceStatus,
          raceTypeValue,
          raceTime: driver.raceTime,
          raceType: raceType,
          dogs: driver.dogs.map((dog: Dogs) => dog.name).join(", ")
        });

        // Rows saved by the older entry form recorded the literal word
        // "Unknown" whenever it could not find the dog, and an unregistered dog
        // scores nothing — so look the number up again and let a re-save repair
        // the row.
        const driverMusher = data?.getMushers?.find(
          (m) => m.name?.toLowerCase() === driver.name.toLowerCase()
        );

        const associatedDog = driver.dogs.map((dog: Dogs) => ({
          name: dog.name || 'Unknown',
          NZFSSRegistration: resolveDogRegistration(
            dog,
            driverMusher?.dogs?.find(
              (d: any) => d.name?.toLowerCase() === dog.name?.toLowerCase()
            )
          ),
          dob: dog.dob || '2000-01-01',
          breed: dog.breed || 'Unknown',
          driverName: driver.name
        }));

        const isWeightPull = isWeightPullSubmit;
        
        // Ensure heats data includes class information. editedTemperature /
        // editedDistance only mirror the heat currently open in the selector,
        // so they may only fill in for that heat — using them everywhere would
        // copy one heat's conditions onto every other heat.
        const updatedHeatsData = heats.map(heat => ({
          heat: heat.heat || "",
          temperature: heat.temperature || (heat.heat === selectedHeat ? editedTemperature : "") || "",
          distance: heat.distance || (heat.heat === selectedHeat ? editedDistance : "") || "",
          class: selectedResult.class
        }));

        // Always include heatsData for both heated and single races
        const finalHeatsData = isHeatedSubmit
          ? updatedHeatsData
          : [{
              heat: 'Heat 1',
              temperature: editedTemperature || "",
              distance: editedDistance || "",
              class: selectedResult.class
            }];

        // Each driver card belongs to one heat, so its row has to carry that
        // heat's temperature and distance rather than whichever heat the
        // selector happens to be showing.
        const driverHeat = isHeatedSubmit ? (driver.heat || selectedHeat) : 'Heat 1';
        const driverHeatData = finalHeatsData.find(h => h.heat === driverHeat);

        const input: any = {
          class: selectedResult.class,
          customClass: customClass || undefined,
          raceFormat: raceFormat || "Single",
          temperature: driverHeatData?.temperature || editedTemperature || undefined,
          distance: isWeightPull ? "10 metres" : driverHeatData?.distance || editedDistance || undefined,
          startTime: editedStartTime || undefined,
          name: driver.name,
          associatedDog,
          raceTime: driver.raceStatus === "Started" ? driver.raceTime : undefined,
          raceType: raceTypeValue,
          heat: driverHeat,
          heatsData: finalHeatsData
        };
        
        // Add weight pull specific data if applicable
        if (isWeightPull && driver.raceStatus === "Started") {
          input.dogWeight = driver.dogWeight || undefined;
          input.weightPulled = driver.weightPulled || undefined;
        }

        // Add debug logging for the input object
        console.log("Submitting input for driver:", {
          name: driver.name,
          input,
          isWeightPull
        });

        const resolved = resolveEntrantForUpdate(
          {
            _id: driver._id,
            name: driver.name,
            dogs: driver.dogs.map((dog: Dogs) => ({
              name: dog.name,
              NZFSSRegistration: dog.NZFSSRegistration,
            })),
            heat: driver.heat,
            isNew: driver.isNew,
          },
          editRowsSnapshot,
          {
            className: selectedResult.class,
            customClass: selectedResult.customClass || "",
            isHeated: isHeatedSubmit,
            isWeightPull,
            selectedHeat,
          }
        );

        const existingEntrant = resolved
          ? results.find((r) => r._id === resolved._id) ||
            localUpdatedResults.find((r) => r._id === resolved._id)
          : undefined;

        const driverId = isMongoId(driver._id) ? driver._id : undefined;

        // Decide whether to create or update based on isNew flag / known id
        if ((!driver.isNew || driverId) && existingEntrant && isMongoId(existingEntrant._id)) {
          // Update existing entrant
          console.log(`Updating existing driver: ${driver.name}`);
          
          const sanitizedInput = sanitizeGraphQLInput(input);
          
          const updatePromise = updateEntrant({
            variables: {
              entrantId: existingEntrant._id,
              input: sanitizedInput
            }
          }).then(response => {
            // Update local result immediately for UI feedbacks
            const updatedData = response.data?.updateEntrantDetails;
            if (updatedData) {
              // Find and update the result in our local copy
              const index = localUpdatedResults.findIndex(r => r._id === existingEntrant!._id);
              if (index !== -1) {
                localUpdatedResults[index] = {
                  ...localUpdatedResults[index],
                  ...updatedData
                };
              }
            }
            return response;
          });
          
          updatePromises.push(updatePromise);
          hasUpdatedResults = true;
        } else {
          // This is a new driver - create a new entrant
          const dogNames = driver.dogs.map((dog: Dogs) => dog.name).join(", ");
          console.log(`Creating new ${isWeightPull ? 'weight pull' : 'regular'} entrant: ${driver.name} with dogs [${dogNames}]`);
          
          const createInput = {
            ...input,
            eventId: selectedResult.eventId
          };
          
          const sanitizedCreateInput = sanitizeGraphQLInput(createInput);
          
          // Create the new entrant
          const createPromise = createEntrant({
            variables: {
              input: sanitizedCreateInput
            }
          }).then(response => {
            // Add new result to local results for immediate UI feedback
            if (response.data?.createEntrant) {
              const newEntrant = {
                ...response.data.createEntrant,
                class: selectedResult.class,
                customClass: customClass || "",
                associatedDog
              };
              localUpdatedResults.push(newEntrant);
              console.log(`Successfully created new entrant for ${driver.name}:`, newEntrant._id);
            }
            return response;
          });
          
          creationPromises.push(createPromise);
          hasUpdatedResults = true;
        }
      }

      // Update the UI with our local changes immediately for a responsive feel
      if (hasUpdatedResults && onResultsUpdate) {
        // Apply optimistic updates
        onResultsUpdate(localUpdatedResults, false);
        
        // Update localStorage too for persistence
        if (selectedResult.eventId) {
          const eventResultsKey = `eventResults_${selectedResult.eventId}`;
          localStorage.setItem(eventResultsKey, JSON.stringify(localUpdatedResults));
        }
      }

      // Wait for all update and creation promises to complete
      if (updatePromises.length > 0) {
        console.log(`Processing ${updatePromises.length} updates...`);
        await Promise.all(updatePromises);
      }
      
      if (creationPromises.length > 0) {
        console.log(`Processing ${creationPromises.length} new drivers...`);
        await Promise.all(creationPromises);
      }

      if (orphanDeletePromises.length > 0) {
        console.log(`Cleaning up ${orphanDeletePromises.length} orphaned duplicate entrants...`);
        await Promise.all(orphanDeletePromises);
      }

      // If we get here, all mutations were successful
      toast({
        title: "Success",
        description: `Updated ${editedDrivers.length} drivers successfully`,
        variant: "default",
      });

      // Reset state and close form
      setShowEditForm(false);
      setSelectedResult(null);
      
      // Refresh the results from server to make sure we're in sync
      if (hasUpdatedResults) {
        console.log("Refreshing results from server...");
        const { data: freshData } = await refetchResults();
        if (freshData?.getEntrantsByEventId && onResultsUpdate) {
          // The edit form has already closed itself; keep the results list open
          // so the saved rows can be checked without reopening the event.
          onResultsUpdate(freshData.getEntrantsByEventId, false);
          
          // Update localStorage with the fresh server data
          if (selectedResult.eventId) {
            const eventResultsKey = `eventResults_${selectedResult.eventId}`;
            localStorage.setItem(eventResultsKey, JSON.stringify(freshData.getEntrantsByEventId));
          }
        }
      }

    } catch (error) {
      console.error("Error updating results:", error);
      toast({
        title: "Error",
        description: "Failed to update results. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update the effect to initialize heats when raceFormat changes to consider existing data
  useEffect(() => {
    if (raceFormat === 'Heated' && selectedResult) {
      // Don't reinitialize if we already have heat data
      if (heats.length === 1 && !heats[0].temperature && !heats[0].distance) {
        // Initialize with the temperature and distance from the selected result
        setHeats([
          { 
            heat: 'Heat 1', 
            temperature: selectedResult.temperature || "", 
            distance: selectedResult.distance || "" 
          }
        ]);
        setSelectedHeat('Heat 1');
      }
    }
  }, [raceFormat, selectedResult]);

  // Heat management helpers
  function handleAddHeat() {
    // Number from the highest existing heat rather than the count, so removing
    // Heat 1 from [Heat 1, Heat 2] and adding again does not produce a second
    // "Heat 2" that then collides with the existing one.
    const nextHeatNumber = heats.reduce((highest, h) => {
      const parsed = parseInt(h.heat.replace(/\D/g, ""), 10);
      return Number.isNaN(parsed) ? highest : Math.max(highest, parsed);
    }, 0) + 1;
    const newHeat = `Heat ${nextHeatNumber}`;

    setHeats(prevHeats => [
      ...prevHeats,
      {
        heat: newHeat,
        temperature: "",
        distance: "",
        // A heat added while building a new class belongs to that class, not to
        // whichever class was open for editing before it.
        class: (showAddClassForm ? selectedRadio : selectedResult?.class) || ""
      }
    ]);
    setSelectedHeat(newHeat);
  }

  function handleRemoveHeat(heatToRemove: string) {
    if (heats.length <= 1) return;
    const updatedHeats = heats.filter(h => h.heat !== heatToRemove);
    setHeats(updatedHeats);
    if (selectedHeat === heatToRemove && updatedHeats.length > 0) setSelectedHeat(updatedHeats[0].heat);
  }

  // Update the handleHeatChange function to display corresponding values from heatsData
  function handleHeatChange(heat: string) {
    console.log(`Changing selected heat from ${selectedHeat} to ${heat}`);
    setSelectedHeat(heat);
    
    // When changing heat, update UI to show the corresponding temp and distance from heatsData
    const selectedHeatData = heats.find(h => h.heat === heat);
    if (selectedHeatData) {
      console.log(`Heat changed: ${heat}, temperature: ${selectedHeatData.temperature}, distance: ${selectedHeatData.distance}`);
      
      // Always update the temperature and distance fields to reflect the selected heat
      // This ensures the UI displays the correct values for the selected heat
      setEditedTemperature(selectedHeatData.temperature || "");
      setEditedDistance(selectedHeatData.distance || "");
      
      // Also update the selectedResult if we have one. Never while building a
      // new class — selectedResult is then still the class opened before it,
      // and its conditions would be rewritten by an unrelated class's heats.
      if (!showAddClassForm && selectedResult && onResultsUpdate && results) {
        // Update the main heat selection 
        const updatedResults = results.map(result => {
          if (result._id === selectedResult._id) {
            return {
              ...result,
              heat: heat,
              // Also update temperature and distance to match the selected heat
              temperature: selectedHeatData.temperature || result.temperature || "",
              distance: selectedHeatData.distance || result.distance || ""
            };
          }
          return result;
        });
        
        // Update local state without waiting for API
        onResultsUpdate(updatedResults, false);
      }
    }
  }

  function handleHeatFieldChange(heat: string, field: 'temperature' | 'distance', value: string) {
    // Update the heats array
    setHeats(prev => prev.map(h => h.heat === heat ? { ...h, [field]: value } : h));
    
    // If this is the currently selected heat, also update the edited values
    // so they're immediately reflected in the UI
    if (heat === selectedHeat) {
      if (field === 'temperature') {
        setEditedTemperature(value);
      } else if (field === 'distance') {
        setEditedDistance(value);
      }
    }
    
    // If we're editing a result with onResultsUpdate available, update the local
    // state. Skipped while building a new class, for the same reason as above.
    if (!showAddClassForm && selectedResult && onResultsUpdate && results) {
      // Update the result's heat data
      const updatedResults = results.map(result => {
        if (result._id === selectedResult._id) {
          // Create a copy of heatsData or initialize if it doesn't exist
          const updatedHeatsData = result.heatsData 
            ? [...result.heatsData] 
            : [];
          
          // Find and update the specific heat, or add it if it doesn't exist
          const heatIndex = updatedHeatsData.findIndex(h => h.heat === heat);
          if (heatIndex >= 0) {
            // Update existing heat
            updatedHeatsData[heatIndex] = {
              ...updatedHeatsData[heatIndex],
              [field]: value
            };
          } else {
            // Add new heat
            updatedHeatsData.push({
              heat,
              temperature: field === 'temperature' ? value : '',
              distance: field === 'distance' ? value : '',
              class: result.class
            });
          }
          
          // Return updated result with new heatsData
          return {
            ...result,
            heatsData: updatedHeatsData,
            heat: selectedHeat, // Also update the selected heat
            // If this is the current heat, also update the main temperature/distance
            ...(heat === selectedHeat ? {
              temperature: field === 'temperature' ? value : result.temperature,
              distance: field === 'distance' ? value : result.distance
            } : {})
          };
        }
        return result;
      });
      
      // Update without waiting for API response
      onResultsUpdate(updatedResults, false);
    }
  }

  // Held in refs so the refresh below runs when the modal opens and not on
  // every render of the parent — it hands results back up, and the parent
  // rebuilds both callbacks each render, which would otherwise loop.
  const refetchResultsRef = useRef(refetchResults);
  const onResultsUpdateRef = useRef(onResultsUpdate);
  useEffect(() => {
    refetchResultsRef.current = refetchResults;
    onResultsUpdateRef.current = onResultsUpdate;
  });

  // Ensure the modal properly refreshes data when opened
  useEffect(() => {
    if (isOpen && modalEventId) {
      // Refresh data when the modal opens
      const refreshData = async () => {
        try {
          const { data: refreshedData } = await refetchResultsRef.current();
          if (refreshedData && refreshedData.getEntrantsByEventId) {
            // Make sure we have the latest data
            onResultsUpdateRef.current?.(refreshedData.getEntrantsByEventId, false);
          }
        } catch (error) {
          console.error("Error refreshing data:", error);
        }
      };
      
      refreshData();
      
      // Reset expanded state when opening modal
      setExpandedResult(null);
    }
  }, [isOpen, modalEventId]);

  // Add this debugging log to track heats loaded from the API
  useEffect(() => {
    if (selectedResult?.heatsData) {
      console.log("Heats loaded from API:", selectedResult.heatsData);
    }
  }, [selectedResult]);

  // Event results key for localStorage
  const eventResultsKey = selectedResult?.eventId ? `eventResults_${selectedResult.eventId}` : '';

  return (
    <>
      <Dialog open={isOpen && !showEditForm && !showAddClassForm} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-[800px] p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
          <DialogHeader className="p-6 pb-4">
            <div className="flex justify-between items-center">
              <DialogTitle className="text-xl font-semibold">
                View Result
              </DialogTitle>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              View all of the result added for the race event.
            </p>
          </DialogHeader>

          <div className="px-6 pb-2">
            <div className="mb-6">
              <h3 className="text-sm font-medium mb-2">Event Name</h3>
              <div className="bg-gray-100 p-3 rounded-lg">{eventName}</div>
            </div>

            <div>
              <div className="mb-4 flex justify-between items-center">
                <h3 className="text-sm font-medium">Result Added</h3>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowAddClassForm(true);
                    setSelectedRadio("speed");
                    setCustomClass(""); // <-- reset to empty string
                    setShowCustomClassInput(false); // <-- reset to false
                    setEditedDrivers([]);
                    setOriginalEditedDrivers([]);
                    setEditedTemperature("");
                    setEditedDistance("");
                    setEditedStartTime("");
                    setRaceFormat("Single");
                    // Heats belong to the class being built. Without this reset
                    // the heats of a class edited earlier in the session leak in,
                    // and drivers get filed under a heat this class never had.
                    setHeats([{ heat: "Heat 1", temperature: "", distance: "" }]);
                    setSelectedHeat("Heat 1");
                    setEditingDriverIndex(null);
                  }}
                  className="flex items-center gap-2"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-4 h-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 4.5v15m7.5-7.5h-15"
                    />
                  </svg>
                  Add New Class
                </Button>
              </div>
              
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-black text-white">
                    <tr>
                      <th className="text-left py-3 px-4 w-[70%]">Class</th>
                      <th className="text-right py-3 px-4 w-[30%]">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {uniqueResults.map((result, index) => (
                      <React.Fragment key={result._id}>
                        <tr
                          className={
                            index % 2 === 0 ? "bg-white" : "bg-gray-50"
                          }
                        >
                          <td className="text-left py-3 px-4">
                            {result.class}
                            {result.customClass && ` - ${result.customClass}`}
                          </td>
                          <td className="text-right py-3 px-4">
                            <div className="flex justify-end gap-3">
                              <button
                                className="p-2 hover:bg-gray-200 rounded-lg border border-gray-200"
                                onClick={() => handleEdit(result._id)}
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  strokeWidth={1.5}
                                  stroke="currentColor"
                                  className="w-4 h-4"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                                  />
                                </svg>
                              </button>
                              <button
                                onClick={() =>
                                  handleDelete(
                                    result.class,
                                    result.customClass || ""
                                  )
                                }
                                className="p-2 hover:bg-gray-200 rounded-lg border border-gray-200 text-red-600"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  strokeWidth={1.5}
                                  stroke="currentColor"
                                  className="w-4 h-4"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                                  />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleLogHistory(result._id)}
                                className="p-2 hover:bg-gray-200 rounded-lg border border-gray-200 text-black"
                              >
                                Log History
                              </button>
                            </div>
                          </td>
                        </tr>
                        {expandedResult === result._id && (
                          <tr>
                            <td colSpan={2} className="px-4 py-2">
                              <div className="bg-gray-50 rounded-lg p-4">
                                <div className="flex justify-between items-center mb-4">
                                  <h3 className="font-semibold">
                                    Race Details
                                  </h3>
                                  <Button
                                    onClick={() => handleOpenEditForm(result)}
                                    variant="outline"
                                  >
                                    Edit Details
                                  </Button>
                                </div>
                                  
                                {/* Remove the HeatInfoDisplay component */}
                                {/* <HeatInfoDisplay result={result} /> */}
                                  
                                <table className="w-full">
                                  <thead>
                                    <tr>
                                      <th className="text-left py-2">Driver</th>
                                      <th className="text-left py-2">Dogs</th>
                                      <th className="text-left py-2 font-bold text-black">
                                        {result.class?.toLowerCase() === "weight pull" ? "Race Time & Weight Data" : "Race time"}
                                      </th>
                                      <th className="text-left py-2">Status</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {Array.isArray(results)
                                      ? (() => {
                                          const classDrivers = results.filter(
                                            (r) =>
                                              r.class === result.class &&
                                              (r.customClass || "") ===
                                                (result.customClass || "")
                                          );
                                          const ranks = computeMusherRanks(
                                            classDrivers.map((r) => ({
                                              name: r.name,
                                              raceTime: r.raceTime,
                                              raceType: r.raceType || "",
                                            }))
                                          );
                                          const classKey = `${result.class}-${result.customClass || ""}`;
                                          const rows = classDrivers.map((driver) => ({
                                            _id: driver._id,
                                            musherRank: ranks.get(musherKey(driver.name)) ?? 0,
                                            points: 0,
                                            dogPoints: [] as { NZFSSRegistration: string; points: number }[],
                                            entrant: {
                                              name: driver.name,
                                              raceTime: driver.raceTime,
                                              heat: driver.heat,
                                              raceType: driver.raceType || "",
                                              class: driver.class,
                                              customClass: driver.customClass || "",
                                              dogWeight: driver.dogWeight,
                                              weightPulled: driver.weightPulled,
                                              associatedDog: Array.isArray(driver.associatedDog)
                                                ? driver.associatedDog.map((dog) => ({
                                                    name: dog.name,
                                                    NZFSSRegistration: dog.NZFSSRegistration || "",
                                                  }))
                                                : [],
                                            },
                                          }));

                                          return (
                                            <MusherResultRows
                                              variant="admin"
                                              classKey={classKey}
                                              rows={rows}
                                              renderStatus={(group) => {
                                                const driver = classDrivers.find(
                                                  (d) => d._id === group.heats[0]?.entrantId
                                                );
                                                if (!driver) return null;
                                                return (
                                                  <span
                                                    className={`px-2 py-1 rounded-full text-xs ${
                                                      driver.raceType === "started"
                                                        ? "bg-green-100 text-green-800"
                                                        : driver.raceType === "disqualified"
                                                        ? "bg-red-100 text-red-800"
                                                        : driver.raceType === "did not finish"
                                                        ? "bg-orange-100 text-orange-800"
                                                        : "bg-yellow-100 text-yellow-800"
                                                    }`}
                                                  >
                                                    {driver.raceType === "started"
                                                      ? "Started"
                                                      : driver.raceType === "disqualified"
                                                      ? "Disqualified"
                                                      : driver.raceType === "did not finish"
                                                      ? "Did not finish"
                                                      : "Did not start"}
                                                  </span>
                                                );
                                              }}
                                            />
                                          );
                                        })()
                                      : null}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Form Dialog */}
      {showEditForm && selectedResult && (
        <Dialog open={showEditForm} onOpenChange={handleCloseEditForm}>
          <DialogContent className="max-w-[900px] p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
            <DialogHeader className="p-6 pb-4">
              <DialogTitle className="text-xl font-semibold">
                Edit Result
              </DialogTitle>
            </DialogHeader>

            <div className="px-6 pb-6">
              <form className="space-y-6">
                {/* Race Format */}
                <div>
                  <Label>Race Format</Label>
                  <SelectComponent
                    placeholder="Select race format"
                    items={["Single", "Heated"]}
                    onChange={(value: string) => setRaceFormat(value)}
                    value={raceFormat}
                  />
                </div>

               
                {/* <div>
                  <Label>Race Start Time</Label>
                  <StartTimeInput
                    onChange={(value: string) => setEditedStartTime(value)}
                    previousValue={editedStartTime}
                  />
                </div> */}

                {/* Temperature and Distance */}
                {raceFormat === 'Heated' ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center mb-2">
                      <Label className="font-semibold">Enter Temperature and Distance for each Heat</Label>
                      <Button type="button" onClick={handleAddHeat} variant="outline" className="px-4 h-[36px]">+ Add New Heat</Button>
                    </div>
                    <div className="flex gap-4 mb-2">
                      <SelectComponent
                        placeholder="Select Heat"
                        items={heats.map(h => h.heat)}
                        onChange={handleHeatChange}
                        value={selectedHeat}
                      />
                      {heats.length > 1 && (
                        <Button onClick={() => handleRemoveHeat(selectedHeat)} variant="ghost" className="text-red-500 mt-2 border border-gray-300">Remove</Button>
                      )}
                    </div>
                    
                    {heats.map((heat, idx) => (
                      <div key={heat.heat} className={`border rounded-md p-4 mb-2 ${selectedHeat === heat.heat ? 'bg-gray-50 border-blue-300' : 'hidden'}`}>
                        <div className="flex items-center mb-2 justify-between">
                          <h4 className="font-semibold">{heat.heat}</h4>
                          {selectedHeat === heat.heat && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Currently Selected</span>}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Temperature (Should not be above 13 Degree)</Label>
                            <Input
                              type="text"
                              placeholder="Enter temperature"
                              value={heat.temperature}
                              onChange={e => handleHeatFieldChange(heat.heat, 'temperature', e.target.value)}
                            />
                          </div>
                          <div>
                            <Label>Distance (The minimum distance should be 3 or 5 km)</Label>
                            <Input
                              type="text"
                              placeholder="Enter distance"
                              value={heat.distance}
                              onChange={e => handleHeatFieldChange(heat.heat, 'distance', e.target.value)}
                              disabled={selectedRadio?.toLowerCase() === "weight pull"}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Temperature (Should not be above 13 Degree)</Label>
                      <Input
                        type="text"
                        placeholder="Enter temperature"
                        value={editedTemperature}
                        onChange={e => setEditedTemperature(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Distance {selectedRadio?.toLowerCase() === "weight pull" ? "(Fixed at 10 metres for Weight Pull)" : "(The minimum distance should be 3 or 5 km)"}</Label>
                      <Input
                        type="text"
                        placeholder={selectedRadio?.toLowerCase() === "weight pull" ? "10 metres (fixed for Weight Pull)" : "Enter distance"}
                        value={selectedRadio?.toLowerCase() === "weight pull" ? "10 metres" : editedDistance}
                        onChange={e => setEditedDistance(e.target.value)}
                        disabled={selectedRadio?.toLowerCase() === "weight pull"}
                      />
                    </div>
                  </div>
                )}

                {/* Class Type */}
                <div>
                  <Label>Class Type</Label>
                  <RadioGroup
                    defaultValue={selectedResult.class?.toLowerCase()}
                    onValueChange={handleRadioChange}
                  >
                    <div className="flex gap-x-[15px] items-center">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="speed" id="speed" />
                        <Label htmlFor="speed">Speed</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="freight" id="freight" />
                        <Label htmlFor="freight">Freight</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="snow" id="snow" />
                        <Label htmlFor="snow">Snow</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="weight pull" id="weight-pull" />
                        <Label htmlFor="weight-pull">Weight pull</Label>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                {/* Class Selection */}
                <div>
                  <Label>Class</Label>
                  {showCustomClassInput ? (
                    <div className="space-y-2">
                      <Input
                        type="text"
                        placeholder="Enter custom class"
                        value={customClass || undefined}
                        onChange={(e) => setCustomClass(e.target.value)}
                      />
                    </div>
                  ) : (
                    <SelectComponent
                      placeholder="Select class"
                      items={selectedRadio?.toLowerCase() === "weight pull" 
                        ? weightPull 
                        : (customClass && customClass !== "Single-Dog Scooter" && !getClassOptions(selectedRadio).includes(customClass)) 
                          ? [customClass, ...getClassOptions(selectedRadio)] 
                          : getClassOptions(selectedRadio)}
                      onChange={(value: string) => {
                        if (value === "Add Custom Class") {
                          setShowCustomClassInput(true);
                          setCustomClass("");
                        } else {
                          setCustomClass(value);
                        }
                      }}
                      value={customClass || undefined}
                    />
                  )}
                </div>

                {/* Updated Driver Details section */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <Label className="text-lg font-semibold">
                      Driver Details
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setEditingDriverIndex(null);
                        setShowAddDriverModal(true);
                      }}
                      className="flex items-center gap-2"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-4 h-4"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 4.5v15m7.5-7.5h-15"
                        />
                      </svg>
                      Add Driver
                    </Button>
                  </div>
                  <div className="border rounded-lg p-4 space-y-6">
                    {editedDrivers.map((driver, index) => {
                      // Check if this is a duplicate driver name (for weight pull display)
                      const duplicateCount = editedDrivers.filter(d => d.name === driver.name).length;
                      const duplicateIndex = editedDrivers.filter((d, i) => d.name === driver.name && i <= index).length;
                      
                      return (
                        <div
                          key={`driver-${index}-${driver.name}`}
                          className="relative space-y-4 p-4 bg-gray-50 rounded-lg"
                        >
                          {/* Show entry indicator for weight pull with multiple entries */}
                          {selectedResult && selectedResult.class?.toLowerCase() === "weight pull" && duplicateCount > 1 && (
                            <div className="absolute top-2 left-2 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                              Entry #{duplicateIndex} for {driver.name}
                            </div>
                          )}
                          
                          {/* Add Remove Button */}
                        <button
                          type="button"
                          onClick={() => handleRemoveDriver(index)}
                          className="absolute top-2 right-2 p-1 hover:bg-gray-200 rounded-full"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-4 h-4 text-red-600"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>

                        {/* A heated class holds one card per heat, so the same
                            musher can appear more than once — say which heat
                            this card is for. */}
                        {raceFormat === 'Heated' && driver.heat && (
                          <div>
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                              {driver.heat}
                            </span>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Driver Name</Label>
                            <Input
                              placeholder="Driver Name"
                              value={driver.name}
                              onChange={(e) =>
                                handleDriverChange(
                                  index,
                                  "name",
                                  e.target.value
                                )
                              }
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label>Race Status</Label>
                            <SelectComponent
                              placeholder="Select status"
                              items={["Started", "Did not start", "Did not finish", "Disqualified"]}
                              value={driver.raceStatus}
                              onChange={(value: string) => {
                                // Ensure value is of correct type
                                if (
                                  value === "Started" ||
                                  value === "Did not start" ||
                                  value === "Did not finish" ||
                                  value === "Disqualified"
                                ) {
                                  // Create a direct update to this specific driver only
                                  handleDriverChange(
                                    index,
                                    "raceStatus",
                                    value as "Started" | "Did not start" | "Did not finish" | "Disqualified"
                                  );
                                }
                              }}
                              className="mt-1"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Associated Dogs</Label>
                            <div className="border rounded-md p-2 max-h-[200px] overflow-y-auto">
                              {driver.dogs.length === 0 ? (
                                <p className="text-center text-gray-500 py-2 text-sm">No dogs added yet</p>
                              ) : (
                                <div className="space-y-3">
                                  {driver.dogs.map((dog: Dogs, dogIndex: number) => (
                                    <div 
                                      key={dog.id}
                                      className="relative grid grid-cols-9 gap-2 pt-2 pb-2 border-b last:border-0"
                                    >
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveDogFromDriver(index, dogIndex)}
                                        className="absolute top-1 right-1 text-red-500 hover:text-red-700"
                                        title="Remove dog"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                      </button>
                                      <div className="col-span-3">
                                        <Label className="text-xs">Name</Label>
                                        <Input
                                          value={dog.name || ""}
                                          onChange={(e) => handleDogEdit(index, dogIndex, "name", e.target.value)}
                                          className="mt-1 h-8 text-xs"
                                          placeholder="Dog name"
                                        />
                                      </div>
                                      <div className="col-span-2">
                                        <Label className="text-xs">Registration</Label>
                                        <Input
                                          value={dog.NZFSSRegistration || ""}
                                          onChange={(e) => handleDogEdit(index, dogIndex, "NZFSSRegistration", e.target.value)}
                                          className="mt-1 h-8 text-xs"
                                          placeholder="Registration"
                                        />
                                      </div>
                                      <div className="col-span-2">
                                        <Label className="text-xs">DOB</Label>
                                        <Input
                                          value={dog.dob || ""}
                                          onChange={(e) => handleDogEdit(index, dogIndex, "dob", e.target.value)}
                                          className="mt-1 h-8 text-xs"
                                          placeholder="Date of birth"
                                        />
                                      </div>
                                      <div className="col-span-2">
                                        <Label className="text-xs">Breed</Label>
                                        <Input
                                          value={dog.breed || ""}
                                          onChange={(e) => handleDogEdit(index, dogIndex, "breed", e.target.value)}
                                          className="mt-1 h-8 text-xs"
                                          placeholder="Breed"
                                        />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="mt-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleAddDogToDriver(index)}
                                className="w-full"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                </svg>
                                Add Dog
                              </Button>
                            </div>
                          </div>
                          <div>
                            <Label>{selectedRadio?.toLowerCase() === "weight pull" ? "Race Time & Weight Pull Data" : "Race Time"}</Label>
                            {selectedRadio?.toLowerCase() === "weight pull" ? (
                              <div className="mt-2 space-y-4">
                                {/* Race Time Input for Weight Pull */}
                                <div>
                                  <Label className="text-sm font-medium mb-2 block">Race Time</Label>
                                  <div className="flex items-center gap-4">
                                    {/* Hours */}
                                    <div className="flex flex-col items-center">
                                      <Input
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        maxLength={2}
                                        className="w-[55px] h-[60px] text-2xl font-medium text-center"
                                        placeholder="00"
                                        value={driver.raceTime ? driver.raceTime.split(':')[0]?.replace(/^0/, '') || '' : ''}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                          let value = e.target.value.replace(/[^0-9]/g, '');
                                          if (value.length <= 2) {
                                            const currentParts = (driver.raceTime || '00:00:00.00').split(/[:\.]/);
                                            const newTime = `${value.padStart(2, '0')}:${currentParts[1] || '00'}:${currentParts[2] || '00'}.${currentParts[3] || '00'}`;
                                            handleDriverChange(index, "raceTime", newTime);
                                          }
                                        }}
                                      />
                                      <span className="text-xs text-gray-500 mt-1">hours</span>
                                    </div>
                                    <div className="text-2xl font-bold">:</div>
                                    {/* Minutes */}
                                    <div className="flex flex-col items-center">
                                      <Input
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        maxLength={2}
                                        className="w-[55px] h-[60px] text-2xl font-medium text-center"
                                        placeholder="00"
                                        value={driver.raceTime ? driver.raceTime.split(':')[1]?.replace(/^0/, '') || '' : ''}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                          let value = e.target.value.replace(/[^0-9]/g, '');
                                          if (value.length <= 2) {
                                            const currentParts = (driver.raceTime || '00:00:00.00').split(/[:\.]/);
                                            const newTime = `${currentParts[0] || '00'}:${value.padStart(2, '0')}:${currentParts[2] || '00'}.${currentParts[3] || '00'}`;
                                            handleDriverChange(index, "raceTime", newTime);
                                          }
                                        }}
                                      />
                                      <span className="text-xs text-gray-500 mt-1">minutes</span>
                                    </div>
                                    <div className="text-2xl font-bold">:</div>
                                    {/* Seconds */}
                                    <div className="flex flex-col items-center">
                                      <Input
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        maxLength={2}
                                        className="w-[55px] h-[60px] text-2xl font-medium text-center"
                                        placeholder="00"
                                        value={driver.raceTime ? driver.raceTime.split(':')[2]?.split('.')[0]?.replace(/^0/, '') || '' : ''}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                          let value = e.target.value.replace(/[^0-9]/g, '');
                                          if (value.length <= 2) {
                                            const currentParts = (driver.raceTime || '00:00:00.00').split(/[:\.]/);
                                            const newTime = `${currentParts[0] || '00'}:${currentParts[1] || '00'}:${value.padStart(2, '0')}.${currentParts[3] || '00'}`;
                                            handleDriverChange(index, "raceTime", newTime);
                                          }
                                        }}
                                      />
                                      <span className="text-xs text-gray-500 mt-1">seconds</span>
                                    </div>
                                    <div className="text-2xl font-bold">.</div>
                                    {/* Milliseconds */}
                                    <div className="flex flex-col items-center">
                                      <Input
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        maxLength={2}
                                        className="w-[55px] h-[60px] text-2xl font-medium text-center"
                                        placeholder="00"
                                        value={driver.raceTime ? driver.raceTime.split('.')[1]?.replace(/^0/, '') || '' : ''}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                          let value = e.target.value.replace(/[^0-9]/g, '');
                                          if (value.length <= 2) {
                                            const currentParts = (driver.raceTime || '00:00:00.00').split(/[:\.]/);
                                            const newTime = `${currentParts[0] || '00'}:${currentParts[1] || '00'}:${currentParts[2] || '00'}.${value.padStart(2, '0')}`;
                                            handleDriverChange(index, "raceTime", newTime);
                                          }
                                        }}
                                      />
                                      <span className="text-xs text-gray-500 mt-1">ms</span>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Weight Data for Weight Pull */}
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label className="text-sm">Dog Weight (kg)</Label>
                                    <Input
                                      type="text"
                                      placeholder="Enter dog weight"
                                      value={driver.dogWeight || ""}
                                      onChange={(e) => {
                                        handleDriverChange(index, "dogWeight", e.target.value);
                                      }}
                                      className="mt-1"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-sm">Weight Pulled (kg)</Label>
                                    <Input
                                      type="text"
                                      placeholder="Enter weight pulled"
                                      value={driver.weightPulled || ""}
                                      onChange={(e) => {
                                        handleDriverChange(index, "weightPulled", e.target.value);
                                      }}
                                      className="mt-1"
                                    />
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-4 mt-2">
                                {/* Hours */}
                                <div className="flex flex-col items-center">
                                  <Input
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    maxLength={2}
                                    className="w-[55px] h-[60px] text-2xl font-medium text-center"
                                    placeholder="00"
                                    value={driver.raceStatus === "Started" && driver.raceTime ? driver.raceTime.split(':')[0]?.replace(/^0/, '') || '' : ''}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                      if (driver.raceStatus !== "Started") return;
                                      const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 2);
                                      const currentParts = (driver.raceTime || '00:00:00.00').split(/[:\.]/);
                                      const newTime = `${value.padStart(2, '0')}:${currentParts[1] || '00'}:${currentParts[2] || '00'}.${currentParts[3] || '00'}`;
                                      handleDriverChange(index, "raceTime", newTime);
                                    }}
                                    onKeyUp={(e) => {
                                      const input = e.currentTarget;
                                      if (input.value.length === 2 && e.key !== 'Backspace' && e.key !== 'Delete') {
                                        editTimeInputRefs.current[index]?.minutes.current?.focus();
                                      }
                                    }}
                                  />
                                  <span className="text-xs text-gray-500 mt-1">hours</span>
                                </div>

                                <div className="text-2xl font-bold">:</div>

                                {/* Minutes */}
                                <div className="flex flex-col items-center">
                                  <Input
                                    ref={editTimeInputRefs.current[index]?.minutes}
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    maxLength={2}
                                    className="w-[55px] h-[60px] text-2xl font-medium text-center"
                                    placeholder="00"
                                    value={driver.raceStatus === "Started" && driver.raceTime ? driver.raceTime.split(':')[1]?.replace(/^0/, '') || '' : ''}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                      if (driver.raceStatus !== "Started") return;
                                      const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 2);
                                      const currentParts = (driver.raceTime || '00:00:00.00').split(/[:\.]/);
                                      const newTime = `${currentParts[0] || '00'}:${value.padStart(2, '0')}:${currentParts[2] || '00'}.${currentParts[3] || '00'}`;
                                      handleDriverChange(index, "raceTime", newTime);
                                    }}
                                    onKeyUp={(e) => {
                                      const input = e.currentTarget;
                                      if (input.value.length === 2 && e.key !== 'Backspace' && e.key !== 'Delete') {
                                        editTimeInputRefs.current[index]?.seconds.current?.focus();
                                      }
                                    }}
                                  />
                                  <span className="text-xs text-gray-500 mt-1">minutes</span>
                                </div>

                                <div className="text-2xl font-bold">:</div>

                                {/* Seconds */}
                                <div className="flex flex-col items-center">
                                  <Input
                                    ref={editTimeInputRefs.current[index]?.seconds}
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    maxLength={2}
                                    className="w-[55px] h-[60px] text-2xl font-medium text-center"
                                    placeholder="00"
                                    value={driver.raceStatus === "Started" && driver.raceTime ? driver.raceTime.split(':')[2]?.split('.')[0]?.replace(/^0/, '') || '' : ''}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                      if (driver.raceStatus !== "Started") return;
                                      const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 2);
                                      const currentParts = (driver.raceTime || '00:00:00.00').split(/[:\.]/);
                                      const newTime = `${currentParts[0] || '00'}:${currentParts[1] || '00'}:${value.padStart(2, '0')}.${currentParts[3] || '00'}`;
                                      handleDriverChange(index, "raceTime", newTime);
                                    }}
                                    onKeyUp={(e) => {
                                      const input = e.currentTarget;
                                      if (input.value.length === 2 && e.key !== 'Backspace' && e.key !== 'Delete') {
                                        editTimeInputRefs.current[index]?.ms.current?.focus();
                                      }
                                    }}
                                  />
                                  <span className="text-xs text-gray-500 mt-1">seconds</span>
                                </div>

                                <div className="text-2xl font-bold">.</div>

                                {/* Milliseconds */}
                                <div className="flex flex-col items-center">
                                  <Input
                                    ref={editTimeInputRefs.current[index]?.ms}
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    maxLength={2}
                                    className="w-[55px] h-[60px] text-2xl font-medium text-center"
                                    placeholder="00"
                                    value={driver.raceStatus === "Started" && driver.raceTime ? driver.raceTime.split('.')[1]?.replace(/^0/, '') || '' : ''}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                      if (driver.raceStatus !== "Started") return;
                                      const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 2);
                                      const currentParts = (driver.raceTime || '00:00:00.00').split(/[:\.]/);
                                      const newTime = `${currentParts[0] || '00'}:${currentParts[1] || '00'}:${currentParts[2] || '00'}.${value.padStart(2, '0')}`;
                                      handleDriverChange(index, "raceTime", newTime);
                                    }}
                                  />
                                  <span className="text-xs text-gray-500 mt-1">milliseconds</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end">
                  <Button
                    type="button"
                    onClick={handleSubmitEditForm}
                    className="w-full md:w-auto"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : (
                      "Submit"
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {showAddClassForm && (
        <Dialog open={showAddClassForm} onOpenChange={handleCloseAddClassForm}>
          <DialogContent className="max-w-[900px] p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
            <DialogHeader className="p-6 pb-4">
              <DialogTitle className="text-xl font-semibold">
                Add New Class
              </DialogTitle>
            </DialogHeader>

            <div className="px-6 pb-6">
              <form className="space-y-6">
                {/* Race Format */}
                <div>
                  <Label>Race Format</Label>
                  <SelectComponent
                    placeholder="Select race format"
                    items={["Single", "Heated"]}
                    onChange={(value: string) => setRaceFormat(value)}
                    value={raceFormat}
                  />
                </div>

                {/* Class Type */}
                <div>
                  <Label>Class Type</Label>
                  <RadioGroup
                    defaultValue="speed"
                    onValueChange={setSelectedRadio}
                  >
                    <div className="flex gap-x-[15px] items-center">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="speed" id="add-speed" />
                        <Label htmlFor="add-speed">Speed</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="freight" id="add-freight" />
                        <Label htmlFor="add-freight">Freight</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="snow" id="add-snow" />
                        <Label htmlFor="add-snow">Snow</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="weight pull" id="add-weight-pull" />
                        <Label htmlFor="add-weight-pull">Weight pull</Label>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                {/* Class Selection */}
                <div>
                  <Label>Class</Label>
                  {showCustomClassInput ? (
                    <div className="space-y-2">
                      <Input
                        type="text"
                        placeholder="Enter custom class"
                        value={customClass || ""}
                        onChange={(e) => setCustomClass(e.target.value)}
                      />
                    </div>
                  ) : (
                    <SelectComponent
                      placeholder="Select class"
                      items={selectedRadio?.toLowerCase() === "weight pull" 
                        ? weightPull 
                        : (customClass && customClass !== "Single-Dog Scooter" && !getClassOptions(selectedRadio).includes(customClass)) 
                          ? [customClass, ...getClassOptions(selectedRadio)] 
                          : getClassOptions(selectedRadio)}
                      onChange={(value: string) => {
                        if (value === "Add Custom Class") {
                          setShowCustomClassInput(true);
                          setCustomClass("");
                        } else {
                          setCustomClass(value);
                        }
                      }}
                      value={customClass || ""}
                    />
                  )}
                </div>

                {/* Temperature and Distance */}
                {raceFormat === 'Heated' ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center mb-2">
                      <Label className="font-semibold">Enter Temperature and Distance for each Heat</Label>
                      <Button type="button" onClick={handleAddHeat} variant="outline" className="px-4 h-[36px]">+ Add New Heat</Button>
                    </div>
                    <div className="flex gap-4 mb-2">
                      <SelectComponent
                        placeholder="Select Heat"
                        items={heats.map(h => h.heat)}
                        onChange={handleHeatChange}
                        value={selectedHeat}
                      />
                      {heats.length > 1 && (
                        <Button onClick={() => handleRemoveHeat(selectedHeat)} variant="ghost" className="text-red-500">Remove</Button>
                      )}
                    </div>
                    <div className="p-3 bg-blue-50 rounded border border-blue-200 mb-2">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Currently editing: {selectedHeat}</span>
                      </div>
                      <p className="text-xs text-blue-700">
                        Any changes you make below will be applied to the currently selected heat.
                      </p>
                    </div>
                    {heats.map((heat, idx) => (
                      <div key={heat.heat} className={`border rounded-md p-4 mb-2 ${selectedHeat === heat.heat ? 'bg-gray-50 border-blue-300' : 'hidden'}`}>
                        <div className="flex items-center mb-2 justify-between">
                          <h4 className="font-semibold">{heat.heat}</h4>
                          {selectedHeat === heat.heat && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Currently Selected</span>}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Temperature (Should not be above 13 Degree)</Label>
                            <Input
                              type="text"
                              placeholder="Enter temperature"
                              value={heat.temperature}
                              onChange={e => handleHeatFieldChange(heat.heat, 'temperature', e.target.value)}
                            />
                          </div>
                          <div>
                            <Label>Distance {selectedRadio?.toLowerCase() === "weight pull" ? "(Fixed at 10 metres for Weight Pull)" : "(The minimum distance should be 3 or 5 km)"}</Label>
                            <Input
                              type="text"
                              placeholder="Enter distance"
                              value={selectedRadio?.toLowerCase() === "weight pull" ? "10 metres" : heat.distance}
                              onChange={e => handleHeatFieldChange(heat.heat, 'distance', e.target.value)}
                              disabled={selectedRadio?.toLowerCase() === "weight pull"}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Temperature (Should not be above 13 Degree)</Label>
                      <Input
                        type="text"
                        placeholder="Enter temperature"
                        value={editedTemperature}
                        onChange={e => setEditedTemperature(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Distance {selectedRadio?.toLowerCase() === "weight pull" ? "(Fixed at 10 metres for Weight Pull)" : "(The minimum distance should be 3 or 5 km)"}</Label>
                      <Input
                        type="text"
                        placeholder="Enter distance"
                        value={selectedRadio?.toLowerCase() === "weight pull" ? "10 metres" : editedDistance}
                        onChange={e => setEditedDistance(e.target.value)}
                        disabled={selectedRadio?.toLowerCase() === "weight pull"}
                      />
                    </div>
                  </div>
                )}

                {/* Driver Details section */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <Label className="text-lg font-semibold">
                      Driver Details
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setEditingDriverIndex(null);
                        setShowAddDriverModal(true);
                      }}
                      className="flex items-center gap-2"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-4 h-4"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 4.5v15m7.5-7.5h-15"
                        />
                      </svg>
                      Add Driver
                    </Button>
                  </div>
                  <div className="border rounded-lg p-4 space-y-6">
                    {editedDrivers.map((driver, index) => {
                      // Check if this is a duplicate driver name (for weight pull display)
                      const duplicateCount = editedDrivers.filter(d => d.name === driver.name).length;
                      const duplicateIndex = editedDrivers.filter((d, i) => d.name === driver.name && i <= index).length;
                      
                      return (
                        <div
                          key={`driver-${index}-${driver.name}`}
                          className="relative space-y-4 p-4 bg-gray-50 rounded-lg"
                        >
                          {/* Show entry indicator for weight pull with multiple entries */}
                          {selectedRadio?.toLowerCase() === "weight pull" && duplicateCount > 1 && (
                            <div className="absolute top-2 left-2 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                              Entry #{duplicateIndex} for {driver.name}
                            </div>
                          )}
                          
                          {/* Add Remove Button */}
                          <button
                            type="button"
                            onClick={() => handleRemoveDriver(index)}
                            className="absolute top-2 right-2 p-1 hover:bg-gray-200 rounded-full"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={1.5}
                              stroke="currentColor"
                              className="w-4 h-4 text-red-600"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>

                        {/* A heated class holds one card per heat, so the same
                            musher can appear more than once — say which heat
                            this card is for. */}
                        {raceFormat === 'Heated' && (
                          <div>
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                              {driver.heat || selectedHeat}
                            </span>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Driver Name</Label>
                            <Input
                              placeholder="Driver Name"
                              value={driver.name}
                              onChange={(e) =>
                                handleDriverChange(
                                  index,
                                  "name",
                                  e.target.value
                                )
                              }
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label>Race Status</Label>
                            <SelectComponent
                              placeholder="Select status"
                              items={["Started", "Did not start", "Did not finish", "Disqualified"]}
                              value={driver.raceStatus}
                              onChange={(value: string) => {
                                // Ensure value is of correct type
                                if (
                                  value === "Started" ||
                                  value === "Did not start" ||
                                  value === "Did not finish" ||
                                  value === "Disqualified"
                                ) {
                                  // Create a direct update to this specific driver only
                                  handleDriverChange(
                                    index,
                                    "raceStatus",
                                    value as "Started" | "Did not start" | "Did not finish" | "Disqualified"
                                  );
                                }
                              }}
                              className="mt-1"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Associated Dogs</Label>
                            <div className="border rounded-md p-2 max-h-[200px] overflow-y-auto">
                              {driver.dogs.length === 0 ? (
                                <p className="text-center text-gray-500 py-2 text-sm">No dogs added yet</p>
                              ) : (
                                <div className="space-y-3">
                                  {driver.dogs.map((dog: Dogs, dogIndex: number) => (
                                    <div 
                                      key={dog.id}
                                      className="relative grid grid-cols-9 gap-2 pt-2 pb-2 border-b last:border-0"
                                    >
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveDogFromDriver(index, dogIndex)}
                                        className="absolute top-1 right-1 text-red-500 hover:text-red-700"
                                        title="Remove dog"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                      </button>
                                      <div className="col-span-3">
                                        <Label className="text-xs">Name</Label>
                                        <Input
                                          value={dog.name || ""}
                                          onChange={(e) => handleDogEdit(index, dogIndex, "name", e.target.value)}
                                          className="mt-1 h-8 text-xs"
                                          placeholder="Dog name"
                                        />
                                      </div>
                                      <div className="col-span-2">
                                        <Label className="text-xs">Registration</Label>
                                        <Input
                                          value={dog.NZFSSRegistration || ""}
                                          onChange={(e) => handleDogEdit(index, dogIndex, "NZFSSRegistration", e.target.value)}
                                          className="mt-1 h-8 text-xs"
                                          placeholder="Registration"
                                        />
                                      </div>
                                      <div className="col-span-2">
                                        <Label className="text-xs">DOB</Label>
                                        <Input
                                          value={dog.dob || ""}
                                          onChange={(e) => handleDogEdit(index, dogIndex, "dob", e.target.value)}
                                          className="mt-1 h-8 text-xs"
                                          placeholder="Date of birth"
                                        />
                                      </div>
                                      <div className="col-span-2">
                                        <Label className="text-xs">Breed</Label>
                                        <Input
                                          value={dog.breed || ""}
                                          onChange={(e) => handleDogEdit(index, dogIndex, "breed", e.target.value)}
                                          className="mt-1 h-8 text-xs"
                                          placeholder="Breed"
                                        />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="mt-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleAddDogToDriver(index)}
                                className="w-full"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                </svg>
                                Add Dog
                              </Button>
                            </div>
                          </div>
                          <div>
                            <Label>{selectedRadio?.toLowerCase() === "weight pull" ? "Race Time & Weight Pull Data" : "Race Time"}</Label>
                            {selectedRadio?.toLowerCase() === "weight pull" ? (
                              <div className="mt-2 space-y-4">
                                {/* Race Time Input for Weight Pull */}
                                <div>
                                  <Label className="text-sm font-medium mb-2 block">Race Time</Label>
                                  <div className="flex items-center gap-4">
                                    {/* Hours */}
                                    <div className="flex flex-col items-center">
                                      <Input
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        maxLength={2}
                                        className="w-[55px] h-[60px] text-2xl font-medium text-center"
                                        placeholder="00"
                                        value={driver.raceTime ? driver.raceTime.split(':')[0]?.replace(/^0/, '') || '' : ''}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                          let value = e.target.value.replace(/[^0-9]/g, '');
                                          if (value.length <= 2) {
                                            const currentParts = (driver.raceTime || '00:00:00.00').split(/[:\.]/);
                                            const newTime = `${value.padStart(2, '0')}:${currentParts[1] || '00'}:${currentParts[2] || '00'}.${currentParts[3] || '00'}`;
                                            handleDriverChange(index, "raceTime", newTime);
                                          }
                                        }}
                                      />
                                      <span className="text-xs text-gray-500 mt-1">hours</span>
                                    </div>
                                    <div className="text-2xl font-bold">:</div>
                                    {/* Minutes */}
                                    <div className="flex flex-col items-center">
                                      <Input
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        maxLength={2}
                                        className="w-[55px] h-[60px] text-2xl font-medium text-center"
                                        placeholder="00"
                                        value={driver.raceTime ? driver.raceTime.split(':')[1]?.replace(/^0/, '') || '' : ''}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                          let value = e.target.value.replace(/[^0-9]/g, '');
                                          if (value.length <= 2) {
                                            const currentParts = (driver.raceTime || '00:00:00.00').split(/[:\.]/);
                                            const newTime = `${currentParts[0] || '00'}:${value.padStart(2, '0')}:${currentParts[2] || '00'}.${currentParts[3] || '00'}`;
                                            handleDriverChange(index, "raceTime", newTime);
                                          }
                                        }}
                                      />
                                      <span className="text-xs text-gray-500 mt-1">minutes</span>
                                    </div>
                                    <div className="text-2xl font-bold">:</div>
                                    {/* Seconds */}
                                    <div className="flex flex-col items-center">
                                      <Input
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        maxLength={2}
                                        className="w-[55px] h-[60px] text-2xl font-medium text-center"
                                        placeholder="00"
                                        value={driver.raceTime ? driver.raceTime.split(':')[2]?.split('.')[0]?.replace(/^0/, '') || '' : ''}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                          let value = e.target.value.replace(/[^0-9]/g, '');
                                          if (value.length <= 2) {
                                            const currentParts = (driver.raceTime || '00:00:00.00').split(/[:\.]/);
                                            const newTime = `${currentParts[0] || '00'}:${currentParts[1] || '00'}:${value.padStart(2, '0')}.${currentParts[3] || '00'}`;
                                            handleDriverChange(index, "raceTime", newTime);
                                          }
                                        }}
                                      />
                                      <span className="text-xs text-gray-500 mt-1">seconds</span>
                                    </div>
                                    <div className="text-2xl font-bold">.</div>
                                    {/* Milliseconds */}
                                    <div className="flex flex-col items-center">
                                      <Input
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        maxLength={2}
                                        className="w-[55px] h-[60px] text-2xl font-medium text-center"
                                        placeholder="00"
                                        value={driver.raceTime ? driver.raceTime.split('.')[1]?.replace(/^0/, '') || '' : ''}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                          let value = e.target.value.replace(/[^0-9]/g, '');
                                          if (value.length <= 2) {
                                            const currentParts = (driver.raceTime || '00:00:00.00').split(/[:\.]/);
                                            const newTime = `${currentParts[0] || '00'}:${currentParts[1] || '00'}:${currentParts[2] || '00'}.${value.padStart(2, '0')}`;
                                            handleDriverChange(index, "raceTime", newTime);
                                          }
                                        }}
                                      />
                                      <span className="text-xs text-gray-500 mt-1">ms</span>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Weight Data for Weight Pull */}
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label className="text-sm">Dog Weight (kg)</Label>
                                    <Input
                                      type="text"
                                      placeholder="Enter dog weight"
                                      value={driver.dogWeight || ""}
                                      onChange={(e) => {
                                        handleDriverChange(index, "dogWeight", e.target.value);
                                      }}
                                      className="mt-1"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-sm">Weight Pulled (kg)</Label>
                                    <Input
                                      type="text"
                                      placeholder="Enter weight pulled"
                                      value={driver.weightPulled || ""}
                                      onChange={(e) => {
                                        handleDriverChange(index, "weightPulled", e.target.value);
                                      }}
                                      className="mt-1"
                                    />
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-4 mt-2">
                                {/* Hours */}
                                <div className="flex flex-col items-center">
                                  <Input
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    maxLength={2}
                                    className="w-[55px] h-[60px] text-2xl font-medium text-center"
                                    placeholder="00"
                                    value={driver.raceTime ? driver.raceTime.split(':')[0]?.replace(/^0/, '') || '' : ''}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                      let value = e.target.value.replace(/[^0-9]/g, '');
                                      if (value.length <= 2) {
                                        const currentParts = (driver.raceTime || '00:00:00.00').split(/[:\.]/);
                                        const newTime = `${value}:${currentParts[1] || '00'}:${currentParts[2] || '00'}.${currentParts[3] || '00'}`;
                                        handleDriverChange(index, "raceTime", newTime);
                                        
                                        // Auto-focus to minutes input after entering 2 digits
                                        if (value.length === 2 && minutesInputRef.current) {
                                          minutesInputRef.current.focus();
                                        }
                                      }
                                    }}
                                    onKeyUp={(e) => {
                                      const input = e.currentTarget;
                                      if (input.value.length === 2 && e.key !== 'Backspace' && e.key !== 'Delete') {
                                        editTimeInputRefs.current[index]?.minutes.current?.focus();
                                      }
                                    }}
                                  />
                                  <span className="text-xs text-gray-500 mt-1">hours</span>
                                </div>

                                <div className="text-2xl font-bold">:</div>

                                {/* Minutes */}
                                <div className="flex flex-col items-center">
                                  <Input
                                    ref={minutesInputRef}
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    maxLength={2}
                                    className="w-[55px] h-[60px] text-2xl font-medium text-center"
                                    placeholder="00"
                                    value={driver.raceTime ? driver.raceTime.split(':')[1]?.replace(/^0/, '') || '' : ''}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                      let value = e.target.value.replace(/[^0-9]/g, '');
                                      if (value.length <= 2) {
                                        const currentParts = (driver.raceTime || '00:00:00.00').split(/[:\.]/);
                                        const newTime = `${currentParts[0] || '00'}:${value}:${currentParts[2] || '00'}.${currentParts[3] || '00'}`;
                                        handleDriverChange(index, "raceTime", newTime);
                                        
                                        // Only auto-focus when exactly 2 digits are entered
                                        if (value.length === 2 && secondsInputRef.current) {
                                          secondsInputRef.current.focus();
                                        }
                                      }
                                    }}
                                    onKeyDown={(e) => {
                                      if (!/[0-9]/.test(e.key) && 
                                          !['Backspace', 'Delete', 'Tab', 'Escape', 'Enter'].includes(e.key)) {
                                        e.preventDefault();
                                      }
                                    }}
                                  />
                                  <span className="text-xs text-gray-500 mt-1">minutes</span>
                                </div>

                                <div className="text-2xl font-bold">:</div>

                                {/* Seconds */}
                                <div className="flex flex-col items-center">
                                  <Input
                                    ref={secondsInputRef}
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    maxLength={2}
                                    className="w-[55px] h-[60px] text-2xl font-medium text-center"
                                    placeholder="00"
                                    value={driver.raceTime ? driver.raceTime.split(':')[2]?.split('.')[0]?.replace(/^0/, '') || '' : ''}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                      if (driver.raceStatus !== "Started") return;
                                      const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 2);
                                      const currentParts = (driver.raceTime || '00:00:00.00').split(/[:\.]/);
                                      const newTime = `${currentParts[0] || '00'}:${currentParts[1] || '00'}:${value.padStart(2, '0')}.${currentParts[3] || '00'}`;
                                      handleDriverChange(index, "raceTime", newTime);
                                    }}
                                    onKeyUp={(e) => {
                                      const input = e.currentTarget;
                                      if (input.value.length === 2 && e.key !== 'Backspace' && e.key !== 'Delete') {
                                        editTimeInputRefs.current[index]?.ms.current?.focus();
                                      }
                                    }}
                                  />
                                  <span className="text-xs text-gray-500 mt-1">seconds</span>
                                </div>

                                <div className="text-2xl font-bold">.</div>

                                {/* Milliseconds */}
                                <div className="flex flex-col items-center">
                                  <Input
                                    ref={msInputRef}
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    maxLength={2}
                                    className="w-[55px] h-[60px] text-2xl font-medium text-center"
                                    placeholder="00"
                                    value={driver.raceTime ? driver.raceTime.split('.')[1]?.replace(/^0/, '') || '' : ''}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                      if (driver.raceStatus !== "Started") return;
                                      const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 2);
                                      const currentParts = (driver.raceTime || '00:00:00.00').split(/[:\.]/);
                                      const newTime = `${currentParts[0] || '00'}:${currentParts[1] || '00'}:${currentParts[2] || '00'}.${value.padStart(2, '0')}`;
                                      handleDriverChange(index, "raceTime", newTime);
                                    }}
                                  />
                                  <span className="text-xs text-gray-500 mt-1">milliseconds</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                    {editedDrivers.length === 0 && (
                      <div className="text-center py-4 text-gray-500">
                        No drivers added. Click "Add Driver" to add one.
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-4">
                  <Button
                    variant="outline"
                    onClick={handleCloseAddClassForm}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createLoading}
                    onClick={async (e) => {
                      e.preventDefault();

                      if (!selectedRadio || !customClass) {
                        toast({
                          title: "Missing required fields",
                          description: "Please select a class type and class",
                          variant: "destructive",
                        });
                        return;
                      }

                      if (editedDrivers.length === 0) {
                        toast({
                          title: "No drivers added",
                          description: "Please add at least one driver",
                          variant: "destructive",
                        });
                        return;
                      }

                      // A musher is one entrant per class, or one per heat when
                      // heated. Two cards sharing that identity would overwrite
                      // each other on save and only one would survive, so say so
                      // here rather than silently dropping an entry.
                      const newClassContext = {
                        raceFormat: raceFormat || "Single",
                        className: selectedRadio,
                        customClass: customClass || "",
                        heats,
                        selectedHeat,
                        fallbackTemperature: editedTemperature,
                        fallbackDistance: editedDistance,
                      };

                      const collisions = findCollidingDriverCards(
                        editedDrivers.map((d) => ({ name: d.name, heat: d.heat })),
                        newClassContext
                      );

                      if (collisions.length > 0) {
                        const [first] = collisions;
                        toast({
                          title: "Duplicate entry",
                          description:
                            raceFormat === "Heated"
                              ? `${first[0].name} is entered twice in ${first[0].heat || selectedHeat}. Move one entry to another heat or remove it.`
                              : `${first[0].name} is entered twice in this class. Remove the duplicate entry.`,
                          variant: "destructive",
                        });
                        return;
                      }

                      // Create a copy of the original results for potential rollback
                      const originalResults = [...results];
                      let optimisticResults: Result[] = [];
                      let hasAppliedOptimisticUpdate = false;
                      
                      try {
                        // Apply optimistic UI updates
                        if (onResultsUpdate && results.length > 0) {
                          const eventId = results[0]?.eventId;
                          if (eventId) {
                            // Create optimistic results by adding new entries
                            optimisticResults = [...results];
                            
                            // Add optimistic entries for each driver in the new class
                            editedDrivers.forEach(driver => {
                              const driverRaceType = driver.raceStatus.toLowerCase();
                              const conditions = buildNewClassConditions(
                                { name: driver.name, heat: driver.heat },
                                newClassContext
                              );
                              const optimisticEntry: Result = {
                                _id: `temp-${uuidv4()}`, // Temporary ID for optimistic update
                                class: selectedRadio,
                                customClass: customClass || "",
                                raceFormat: raceFormat || "Single",
                                temperature: conditions.temperature,
                                distance: conditions.distance,
                                startTime: editedStartTime || "00:00:00.00",
                                name: driver.name,
                                raceTime: driver.raceStatus === "Started" ? driver.raceTime : null,
                                raceType: driverRaceType,
                                associatedDog: driver.dogs.map((dog: Dogs) => ({
                                  name: dog.name,
                                  NZFSSRegistration: dog.NZFSSRegistration || "",
                                  dob: dog.dob || "",
                                  breed: dog.breed || "",
                                  driverName: driver.name
                                })),
                                eventId: eventId,
                                // Add weight pull data if available
                                ...(driver.dogWeight ? { dogWeight: driver.dogWeight } : {}),
                                ...(driver.weightPulled ? { weightPulled: driver.weightPulled } : {}),
                              };

                              // Each card keeps the heat it was entered under —
                              // reading the selector here put every driver in
                              // whichever heat happened to be open.
                              optimisticEntry.heat = conditions.heat;
                              optimisticEntry.heatsData = conditions.heatsData.map(heat => ({
                                ...heat,
                                __typename: "HeatData"
                              }));

                              optimisticResults.push(optimisticEntry);
                            });
                            
                            // Update UI optimistically
                            console.log("Optimistically updating UI with new class data");
                            onResultsUpdate(optimisticResults);
                            hasAppliedOptimisticUpdate = true;
                            
                            // Update localStorage with optimistic data
                            const eventResultsKey = `eventResults_${eventId}`;
                            localStorage.setItem(eventResultsKey, JSON.stringify(optimisticResults));
                          }
                        }
                        
                        // Process each driver in the list
                        // For weight pull, each driver entry represents a separate competition entry
                        // For other races, each driver entry represents a team with multiple dogs
                        for (const driver of editedDrivers) {
                          console.log(`Processing driver for new class: ${driver.name} with ${driver.dogs.length} dogs (Race type: ${selectedRadio})`);
                          
                          // Get the musher data to find dog details
                          const musher = data?.getMushers?.find(
                            (m) =>
                              m.name.toLowerCase() === driver.name.toLowerCase()
                          );

                          // Create properly formatted associatedDog array
                          const associatedDog = driver.dogs.map(
                            (dog: Dogs) => {
                              // Try to find the dog in the mushers data
                              const dogDetails = musher?.dogs?.find(
                                (d: any) =>
                                  d.name.toLowerCase() === dog.name.toLowerCase()
                              );

                              return {
                                name: dog.name,
                                driverName: driver.name,
                                // The number entered on the form wins: a dog typed
                                // in by hand is not in the registry, so a name
                                // lookup alone would discard its registration.
                                NZFSSRegistration: resolveDogRegistration(dog, dogDetails),
                                dob: dog.dob || dogDetails?.dateOfBirth || "2000-01-01", // Default date if missing
                                breed: dog.breed || dogDetails?.breed || "Unknown",
                              };
                            }
                          );

                          const conditions = buildNewClassConditions(
                            { name: driver.name, heat: driver.heat },
                            newClassContext
                          );

                          // Create the input object with eventId for new class
                          const driverData: {
                            name: string;
                            raceFormat: string;
                            class: string;
                            customClass: string | null;
                            associatedDog: any[];
                            raceType: string;
                            temperature: string;
                            distance: string;
                            eventId: string | undefined;
                            raceTime?: string;
                            heat?: string;
                            heatsData?: HeatData[];
                            dogWeight?: string;
                            weightPulled?: string;
                          } = {
                            name: driver.name,
                            raceFormat: raceFormat || "Single",
                            class: selectedRadio,
                            customClass: customClass,
                            associatedDog: associatedDog,
                            raceType: driver.raceStatus.toLowerCase(), // Use the exact race status that was selected
                            temperature: conditions.temperature,
                            distance: conditions.distance,
                            eventId: results[0].eventId,
                            ...(driver.raceTime && driver.raceTime.trim() !== "" ? { raceTime: driver.raceTime } : {}),
                            // Add weight pull data if available
                            ...(driver.dogWeight ? { dogWeight: driver.dogWeight } : {}),
                            ...(driver.weightPulled ? { weightPulled: driver.weightPulled } : {}),
                          };

                          // A heated entrant's identity is musher + class + heat,
                          // so the heat has to be the one this card was entered
                          // under. Stamping the selected heat on every card made
                          // Heat 2 overwrite Heat 1 on the server.
                          //
                          // A single-format class is stamped Heat 1 rather than
                          // left blank — a row with no heat is rendered as an
                          // unnamed extra run in the results table.
                          driverData.heat = conditions.heat;
                          driverData.heatsData = conditions.heatsData;

                          console.log(
                            "Driver data for creating new class:",
                            JSON.stringify(driverData, null, 2)
                          );
                          
                          // Validate the driver data before submitting
                          const validation = validateEntrantData(driverData, false);
                          if (!validation.isValid) {
                            toast({
                              title: "Invalid data",
                              description: validation.message,
                              variant: "destructive",
                            });
                            
                            // Revert optimistic UI updates if they were applied
                            if (hasAppliedOptimisticUpdate && onResultsUpdate) {
                              onResultsUpdate(originalResults);
                              if (results[0]?.eventId) {
                                const eventResultsKey = `eventResults_${results[0].eventId}`;
                                localStorage.setItem(eventResultsKey, JSON.stringify(originalResults));
                              }
                            }
                            return;
                          }
                          
                          console.log("Submitting driver data:", driverData);
                          
                          try {
                            const finalCreateInput = debugLogMutation({
                              ...driverData,
                              // Use the helper function to safely prepare the race time
                              raceTime: prepareRaceTimeForSubmission(driverData.raceTime)
                            }, "CREATE_ENTRANT_NEW_CLASS");
                            
                            await createEntrant({
                              variables: {
                                input: sanitizeGraphQLInput(driverData),
                              },
                              refetchQueries: [
                                { 
                                  query: GET_ALL_RESULTS,
                                  variables: { 
                                    eventId: results[0].eventId 
                                  }
                                }
                              ],
                            });
                          } catch (innerError: any) {
                            console.error("Create error:", innerError);
                            if (innerError.networkError) {
                              toast({
                                title: "Network Error",
                                description: "Please check your internet connection",
                                variant: "destructive",
                              });
                              
                              // Revert optimistic UI updates if they were applied
                              if (hasAppliedOptimisticUpdate && onResultsUpdate) {
                                onResultsUpdate(originalResults);
                                if (results[0]?.eventId) {
                                  const eventResultsKey = `eventResults_${results[0].eventId}`;
                                  localStorage.setItem(eventResultsKey, JSON.stringify(originalResults));
                                }
                              }
                              return;
                            }
                            throw innerError;
                          }
                        }

                        toast({
                          title: "New class added successfully",
                          description: "New class has been added to the race",
                          variant: "default",
                        });
                        
                        // Close the add class form but keep the main modal open
                        handleCloseAddClassForm();
                        
                        // Refresh data from server to get the actual IDs
                        try {
                          const { data: freshData } = await refetchResults();
                          if (freshData?.getEntrantsByEventId && onResultsUpdate) {
                            onResultsUpdate(freshData.getEntrantsByEventId);
                            
                            // Update localStorage with fresh data
                            if (results[0]?.eventId) {
                              const eventResultsKey = `eventResults_${results[0].eventId}`;
                              localStorage.setItem(eventResultsKey, JSON.stringify(freshData.getEntrantsByEventId));
                            }
                          }
                        } catch (refreshError) {
                          console.error("Error refreshing results after add:", refreshError);
                          // Continue showing optimistic results if refresh fails
                        }
                      } catch (error) {
                        console.error("Error details:", error);
                        toast({
                          title: "Error adding new class",
                          description: `Error adding new class: ${
                            error instanceof Error
                              ? error.message
                              : "An unknown error occurred"
                          }`,
                          variant: "destructive",
                        });
                        
                        // Revert optimistic UI updates if they were applied
                        if (hasAppliedOptimisticUpdate && onResultsUpdate) {
                          onResultsUpdate(originalResults);
                          if (results[0]?.eventId) {
                            const eventResultsKey = `eventResults_${results[0].eventId}`;
                            localStorage.setItem(eventResultsKey, JSON.stringify(originalResults));
                          }
                        }
                      }
                    }}
                  >
                    Add New Class
                  </Button>
                </div>
              </form>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {showLogHistory && selectedEntrantId && (
        <LogHistoryModal
          isOpen={showLogHistory}
          onClose={() => setShowLogHistory(false)}
          entrantId={selectedEntrantId}
        />
      )}

      {/* Add Driver Modal */}
      <Dialog open={showAddDriverModal} onOpenChange={handleToggleAddDriverModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add entrants</DialogTitle>
            <DialogDescription>
              Add a new Driver
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAddDriver();
            }}
            className="max-h-[650px] h-full overflow-y-auto overflow-x-hidden"
          >
            <div className="flex flex-col gap-4 py-4 w-full ">
              <div className="flex items-center justify-between">
                <Label>Enter driver name</Label>
                {loading && (
                  <span className="text-sm text-muted-foreground animate-pulse">
                    Loading mushers...
                  </span>
                )}
              </div>

              <div className="relative">
                <Input
                  placeholder="Type to search for mushers"
                  value={driverName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange(e)}
                  onBlur={(e) => {
                    // Only hide dropdown if not clicking on a dropdown item
                    setTimeout(() => {
                      setFilteredDrivers([]);
                    }, 150);
                  }}
                  autoComplete="off"
                  className={`${filteredDrivers.length > 0 ? 'rounded-b-none' : ''}`}
                />
                
                {filteredDrivers.length > 0 && (
                  <ul className="w-full border border-t-0 bg-white max-h-[200px] overflow-y-auto rounded-b-md shadow-sm z-10 absolute">
                    {filteredDrivers.map((driver: string, index: number) => (
                      <li
                        key={index}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDriverSelect(driver);
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleDriverSelect(driver);
                        }}
                        className="hover:bg-muted p-3 cursor-pointer transition-colors border-t first:border-t-0"
                      >
                        {driver}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* No drivers found message */}
              {driverName && filteredDrivers.length === 0 && !data?.getMushers?.find(
                (m: any) => m.name.toLowerCase() === driverName.toLowerCase()
              ) && data?.getMushers && data.getMushers.length > 0 && (
                <div className="text-sm text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
                  No matching mushers found. You can still add dogs manually below.
                </div>
              )}
              
              {/* Selected musher's dogs display */}
              <div>
                {driverName && data?.getMushers?.find(
                  (m: any) => m.name.toLowerCase() === driverName.toLowerCase()
                ) && (
                  <div className="border rounded-[12px] overflow-hidden mt-4">
                    <div className="bg-[#F6F6F6] p-4 flex justify-between items-center">
                      <p className="text-[16px] font-[600]">
                        {filteredDogs.length} Dogs associated with "{driverName}"
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
                          {filteredDogs.length > 0 ? (
                            filteredDogs.map((dog: Dogs, index: number) => {
                              // Check if dog is in selectedRows
                              const isSelected = selectedRows.some((selected: Dogs) => 
                                selected.name === dog.name && 
                                selected.breed === dog.breed
                              );
                              
                              return (
                                <tr key={index} className={index !== filteredDogs.length - 1 ? "border-b" : ""}>
                                  <td className="p-2">
                                    <input 
                                      type="checkbox" 
                                      checked={isSelected}
                                      onChange={() => handleDogSelect(dog)}
                                      className="h-4 w-4 rounded border-gray-300"
                                    />
                                  </td>
                                  <td className="p-2">{dog.name}</td>
                                  <td className="p-2">{dog.NZFSSRegistration}</td>
                                  <td className="p-2">{dog.dob}</td>
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
                
                {driverName && !data?.getMushers?.find(
                  (m: any) => m.name.toLowerCase() === driverName.toLowerCase()
                ) && (
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
                                const isSelected = selectedRows.some(selected => 
                                  selected.name === dog.name && 
                                  selected.breed === dog.breed
                                );
                                
                                return (
                                  <tr key={`${dog._id || dog.id}-${index}`} className={index !== displayedOtherDogs.length - 1 ? "border-b" : ""}>
                                    <td className="p-2">
                                      <input 
                                        type="checkbox" 
                                        checked={isSelected}
                                        onChange={() => handleOtherDogSelect(dog)}
                                        className="h-4 w-4 rounded border-gray-300"
                                      />
                                    </td>
                                    <td className="p-2 font-medium">{dog.name}</td>
                                    <td className="p-2 text-sm text-gray-600">{dog.musherName}</td>
                                    <td className="p-2">{dog.nzfssNo || "-"}</td>
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
              </div>
            </div>
                  
            <div className="flex flex-col gap-4 py-2 w-full justify-start cursor-pointer">
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
              {customDogs.map((dog: Dogs, index: number) => (
                <div
                  key={index}
                  className="w-full grid grid-cols-5 h-[40px] border border-[#E6E6E6] text-[14px] font-[500] text-[#696A6A]"
                >
                  <div className="flex w-full items-center justify-center h-full border-r">
                    <input
                      className="w-full h-full pl-2 p-1 outline-none"
                      placeholder="Dog Name"
                      value={dog.name}
                      disabled
                      style={{
                        backgroundColor: "#FFFFFF"
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
                        backgroundColor: "#FFFFFF"
                      }}
                    />
                  </div>
                  <div className="flex w-full items-center justify-center h-full border-[#E6E6E6] border-r">
                    <input
                      className="w-full h-full pl-2 p-1 outline-none"
                      placeholder="DOB"
                      value={dog.dob}
                      disabled
                      style={{
                        backgroundColor: "#FFFFFF"
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
                        backgroundColor: "#FFFFFF"
                      }}
                    />
                  </div>

                  <div className="flex w-full items-center justify-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomDog(dog.id)}
                      className="w-full h-full"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}

              {showInput && (
                <div className="w-full grid grid-cols-5 h-[40px] text-[14px] font-[500] text-[#696A6A]">
                  <div className="flex w-full items-center justify-center h-full border-r border-[#E6E6E6]">
                    <input
                      className="w-full h-full pl-2 p-1 outline-none"
                      placeholder="Dog Name"
                      value={tempDogName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTempDogName(e.target.value)}
                    />
                  </div>
                  <div className="flex w-full items-center justify-center h-full border-[#E6E6E6] border-r">
                    <input
                      className="w-full h-full pl-2 p-1 outline-none"
                      placeholder="NZFSS Registration"
                      value={tempRegistration}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTempRegistration(e.target.value)}
                    />
                  </div>
                  <div className="flex w-full items-center justify-center h-full border-[#E6E6E6] border-r">
                    <input
                      type="date"
                      className="w-full h-full pl-2 p-1 outline-none"
                      value={tempDob}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTempDob(e.target.value)}
                    />
                  </div>
                  <div className="flex w-full items-center justify-center h-full border-[#E6E6E6] border-r">
                    <input
                      className="w-full h-full pl-2 p-1 outline-none"
                      placeholder="Breed"
                      value={tempBreed}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTempBreed(e.target.value)}
                    />
                  </div>
                  <div className="flex w-full items-center justify-center">
                    <button
                      type="button"
                      onClick={handleAddCustomDog}
                      className="w-full h-full"
                    >
                      Add
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="w-full mb-[32px]">
              <div className="py-[16px] flex flex-col gap-y-[15px]">
                <h3 className="font-[600] text-[1.13rem] leading-[21.6px]">
                  Select race type
                </h3>

                <div>
                  <RadioGroup
                    className="flex gap-x-[25px] items-center"
                    defaultValue="Started"
                    onValueChange={(value) => {
                      // Only update the selectedRaceStatus for new drivers being added
                      setSelectedRaceStatus(value);
                      
                      // If race status is not Started, reset time input fields as they're not needed
                      if (value !== "Started") {
                        setTimeInputState({
                          hours: "",
                          minutes: "",
                          seconds: "",
                          ms: ""
                        });
                      }
                    }}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Started" id="started" />
                      <Label className="text-[16px] font-[600] text-[#000000]">
                        Started
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Did not start" id="didnotstart" />
                      <Label className="text-[16px] font-[600] text-[#000000]">
                        Did not start
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Did not finish" id="didnotfinish" />
                      <Label className="text-[16px] font-[600] text-[#000000]">
                        Did not finish
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Disqualified" id="disqualified" />
                      <Label className="text-[16px] font-[600] text-[#000000]">
                        Disqualified
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Add race time or weight pull fields when "Started" is selected */}
                {selectedRaceStatus === "Started" && (
                  <div className="space-y-2">
                    {selectedRadio?.toLowerCase() === "weight pull" ? (
                      <div className="space-y-4">
                        {/* Race Time Input for Weight Pull */}
                        <div>
                          <Label className="font-[600] text-[16px]">Race Time</Label>
                          <div className="flex items-center gap-4 mt-2">
                            {/* Hours */}
                            <div className="flex flex-col items-center">
                              <Input
                                ref={hoursInputRef}
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={2}
                                className="w-[80px] h-[60px] text-2xl font-medium text-center"
                                placeholder="00"
                                value={timeInputState.hours}
                                onChange={(e) => {
                                  let value = e.target.value.replace(/[^0-9]/g, '');
                                  if (value.length > 2) value = value.slice(0, 2);
                                  
                                  handleTimeInputChange('race', 'hours', value);
                                  
                                  // Auto-focus to next field after entering 2 digits
                                  if (value.length === 2 && minutesInputRef.current) {
                                    minutesInputRef.current.focus();
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (!/[0-9]/.test(e.key) && 
                                      !['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                                    e.preventDefault();
                                  }
                                }}
                              />
                              <span className="text-xs text-gray-500 mt-1">hours</span>
                            </div>

                            <div className="text-2xl font-bold">:</div>

                            {/* Minutes */}
                            <div className="flex flex-col items-center">
                              <Input
                                ref={minutesInputRef}
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={2}
                                className="w-[80px] h-[60px] text-2xl font-medium text-center"
                                placeholder="00"
                                value={timeInputState.minutes}
                                onChange={(e) => {
                                  let value = e.target.value.replace(/[^0-9]/g, '');
                                  if (value.length > 2) value = value.slice(0, 2);
                                  
                                  // Validate minutes (0-59)
                                  if (value && parseInt(value) > 59) {
                                    return;
                                  }
                                  
                                  handleTimeInputChange('race', 'minutes', value);
                                  
                                  // Auto-focus to next field after entering 2 digits
                                  if (value.length === 2 && secondsInputRef.current) {
                                    secondsInputRef.current.focus();
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (!/[0-9]/.test(e.key) && 
                                      !['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                                    e.preventDefault();
                                  }
                                }}
                              />
                              <span className="text-xs text-gray-500 mt-1">minutes</span>
                            </div>

                            <div className="text-2xl font-bold">:</div>

                            {/* Seconds */}
                            <div className="flex flex-col items-center">
                              <Input
                                ref={secondsInputRef}
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={2}
                                className="w-[80px] h-[60px] text-2xl font-medium text-center"
                                placeholder="00"
                                value={timeInputState.seconds}
                                onChange={(e) => {
                                  let value = e.target.value.replace(/[^0-9]/g, '');
                                  if (value.length > 2) value = value.slice(0, 2);
                                  
                                  // Validate seconds (0-59)
                                  if (value && parseInt(value) > 59) {
                                    return;
                                  }
                                  
                                  handleTimeInputChange('race', 'seconds', value);
                                  
                                  // Auto-focus to next field after entering 2 digits
                                  if (value.length === 2 && msInputRef.current) {
                                    msInputRef.current.focus();
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (!/[0-9]/.test(e.key) && 
                                      !['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                                    e.preventDefault();
                                  }
                                }}
                              />
                              <span className="text-xs text-gray-500 mt-1">seconds</span>
                            </div>

                            <div className="text-2xl font-bold">.</div>

                            {/* Milliseconds */}
                            <div className="flex flex-col items-center">
                              <Input
                                ref={msInputRef}
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={2}
                                className="w-[80px] h-[60px] text-2xl font-medium text-center"
                                placeholder="00"
                                value={timeInputState.ms}
                                onChange={(e) => {
                                  let value = e.target.value.replace(/[^0-9]/g, '');
                                  if (value.length > 2) value = value.slice(0, 2);
                                  
                                  // Validate milliseconds (0-99)
                                  if (value && parseInt(value) > 99) {
                                    return;
                                  }
                                  
                                  handleTimeInputChange('race', 'ms', value);
                                }}
                                onKeyDown={(e) => {
                                  if (!/[0-9]/.test(e.key) && 
                                      !['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                                    e.preventDefault();
                                  }
                                }}
                              />
                              <span className="text-xs text-gray-500 mt-1">milliseconds</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Weight Data for Weight Pull */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="font-[600] text-[16px]">Dog Weight (kg)</Label>
                            <Input
                              type="text"
                              placeholder="Enter dog weight"
                              value={dogWeight}
                              onChange={(e) => setDogWeight(e.target.value)}
                              className="mt-2"
                            />
                          </div>
                          <div>
                            <Label className="font-[600] text-[16px]">Weight Pulled (kg)</Label>
                            <Input
                              type="text"
                              placeholder="Enter weight pulled"
                              value={weightPulled}
                              onChange={(e) => setWeightPulled(e.target.value)}
                              className="mt-2"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className=""> 
                        <Label className="font-[600] text-[16px]">Race Time</Label>
                        <div className="flex items-center gap-4 mt-2">
                          {/* Hours */}
                          <div className="flex flex-col items-center">
                            <Input
                              ref={hoursInputRef}
                              inputMode="numeric"
                              pattern="[0-9]*"
                              maxLength={2}
                              className="w-[80px] h-[60px] text-2xl font-medium text-center"
                              placeholder="00"
                              value={timeInputState.hours === "00" ? "" : timeInputState.hours}
                              onChange={(e) => {
                                let value = e.target.value.replace(/[^0-9]/g, '');
                                if (value.length > 2) value = value.slice(0, 2);
                                handleTimeInputChange('race', 'hours', value);
                                
                                // Auto-focus to next field after entering 2 digits
                                if (value.length === 2 && minutesInputRef.current) {
                                  minutesInputRef.current.focus();
                                }
                              }}
                              onKeyDown={(e) => {
                                if (!/[0-9]/.test(e.key) && 
                                    !['Backspace', 'Delete', 'Tab', 'Escape', 'Enter'].includes(e.key)) {
                                  e.preventDefault();
                                }
                              }}
                            />
                            <span className="text-xs text-gray-500 mt-1">hours</span>
                          </div>

                          <div className="text-2xl font-bold">:</div>

                          {/* Minutes */}
                          <div className="flex flex-col items-center">
                            <Input
                              ref={minutesInputRef}
                              inputMode="numeric"
                              pattern="[0-9]*"
                              maxLength={2}
                              className="w-[80px] h-[60px] text-2xl font-medium text-center"
                              placeholder="00"
                              value={timeInputState.minutes === "00" ? "" : timeInputState.minutes}
                              onChange={(e) => {
                                let value = e.target.value.replace(/[^0-9]/g, '');
                                if (value.length > 2) value = value.slice(0, 2);
                                handleTimeInputChange('race', 'minutes', value);
                                
                                // Auto-focus to next field after entering 2 digits
                                if (value.length === 2 && secondsInputRef.current) {
                                  secondsInputRef.current.focus();
                                }
                              }}
                              onKeyDown={(e) => {
                                if (!/[0-9]/.test(e.key) && 
                                    !['Backspace', 'Delete', 'Tab', 'Escape', 'Enter'].includes(e.key)) {
                                  e.preventDefault();
                                }
                              }}
                            />
                            <span className="text-xs text-gray-500 mt-1">minutes</span>
                          </div>

                          <div className="text-2xl font-bold">:</div>

                          {/* Seconds */}
                          <div className="flex flex-col items-center">
                            <Input
                              ref={secondsInputRef}
                              inputMode="numeric"
                              pattern="[0-9]*"
                              maxLength={2}
                              className="w-[80px] h-[60px] text-2xl font-medium text-center"
                              placeholder="00"
                              value={timeInputState.seconds === "00" ? "" : timeInputState.seconds}
                              onChange={(e) => {
                                let value = e.target.value.replace(/[^0-9]/g, '');
                                if (value.length > 2) value = value.slice(0, 2);
                                handleTimeInputChange('race', 'seconds', value);
                                
                                // Auto-focus to next field after entering 2 digits
                                if (value.length === 2 && msInputRef.current) {
                                  msInputRef.current.focus();
                                }
                              }}
                              onKeyDown={(e) => {
                                if (!/[0-9]/.test(e.key) && 
                                    !['Backspace', 'Delete', 'Tab', 'Escape', 'Enter'].includes(e.key)) {
                                  e.preventDefault();
                                }
                              }}
                            />
                            <span className="text-xs text-gray-500 mt-1">seconds</span>
                          </div>

                          <div className="text-2xl font-bold">.</div>

                          {/* Milliseconds */}
                          <div className="flex flex-col items-center">
                            <Input
                              ref={msInputRef}
                              inputMode="numeric"
                              pattern="[0-9]*"
                              maxLength={2}
                              className="w-[80px] h-[60px] text-2xl font-medium text-center"
                              placeholder="00"
                              value={timeInputState.ms === "00" ? "" : timeInputState.ms}
                              onChange={(e) => {
                                let value = e.target.value.replace(/[^0-9]/g, '');
                                if (value.length > 2) value = value.slice(0, 2);
                                handleTimeInputChange('race', 'ms', value);
                              }}
                              onKeyDown={(e) => {
                                if (!/[0-9]/.test(e.key) && 
                                    !['Backspace', 'Delete', 'Tab', 'Escape', 'Enter'].includes(e.key)) {
                                  e.preventDefault();
                                }
                              }}
                            />
                            <span className="text-xs text-gray-500 mt-1">milliseconds</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <div className="flex justify-between items-center w-full gap-x-4">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full h-[56px] font-[500] text-[18px] rounded-[16px]"
                  type="button"
                  onClick={() => handleToggleAddDriverModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  className="w-full h-[56px] font-[500] text-[18px] rounded-[16px]"
                  type="submit"
                >
                  Save
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

// Add a default export
export default ViewResultModal;
import React, { useState, useEffect, useRef } from "react";
import { Input } from "./ui/input";
import { MinusIcon } from "lucide-react";

interface StartTimeInputProps {
  onChange: (value: string) => void;
  previousValue?: string;
}

export const StartTimeInput = ({ onChange, previousValue }: StartTimeInputProps) => {
  // Initialize with empty strings instead of zeros
  const [hours, setHours] = useState<string[]>(["", ""]);
  const [minutes, setMinutes] = useState<string[]>(["", ""]);
  const [seconds, setSeconds] = useState<string[]>(["", ""]);
  const [milliseconds, setMilliseconds] = useState<string[]>(["", ""]);
  
  // Track if a field is being edited (to manage focus)
  const [editing, setEditing] = useState<boolean>(false);
  
  // Only update from previousValue if it actually has content
  useEffect(() => {
    try {
      // Make sure previousValue is a valid string before processing
      if (previousValue && typeof previousValue === 'string' && previousValue.trim() !== "") {
        // Get only the numeric values from the string
        const numericValue = previousValue.replace(/[^0-9]/g, "");
        
        // Create an array of individual characters, then pad or truncate to 8 digits
        const chars = numericValue.split("");
        
        // Safely create paddedChars with exactly 8 elements
        const paddedChars: string[] = [];
        for (let i = 0; i < 8; i++) {
          paddedChars[i] = i < chars.length ? chars[i] : "";
        }
        
        // Set the individual time sections
        setHours([paddedChars[0] || "", paddedChars[1] || ""]);
        setMinutes([paddedChars[2] || "", paddedChars[3] || ""]);
        setSeconds([paddedChars[4] || "", paddedChars[5] || ""]);
        setMilliseconds([paddedChars[6] || "", paddedChars[7] || ""]);
      }
    } catch (error) {
      console.error("Error processing previous time value:", error);
      // Reset all fields to empty on error
      setHours(["", ""]);
      setMinutes(["", ""]);
      setSeconds(["", ""]);
      setMilliseconds(["", ""]);
    }
  }, [previousValue]);
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    try {
      // Determine if any values have been entered
      const hasAnyValue = [...hours, ...minutes, ...seconds, ...milliseconds].some(v => v !== "");
      
      if (hasAnyValue) {
        // Replace empty values with "0" for the formatted time
        const formattedHours = hours.map(h => h === "" ? "0" : h);
        const formattedMinutes = minutes.map(m => m === "" ? "0" : m);
        const formattedSeconds = seconds.map(s => s === "" ? "0" : s);
        const formattedMs = milliseconds.map(ms => ms === "" ? "0" : ms);
        
        // Combine all sections with zeros for empty fields
        const formattedTime = [
          ...formattedHours,
          ...formattedMinutes,
          ...formattedSeconds,
          ...formattedMs
        ].join("");
        
        console.log("Formatted time with zeros:", formattedTime);
        onChange(formattedTime);
      } else {
        // Send empty string if no digits have been entered
        onChange("");
      }
    } catch (error) {
      console.error("Error formatting time value:", error);
      onChange("");
    }
  }, [hours, minutes, seconds, milliseconds, onChange]);

  // Function to validate time input based on section and current values
  const validateTimeInput = (
    sectionIndex: number,
    digitIndex: number,
    newDigit: string,
    currentValues: string[]
  ): boolean => {
    if (!newDigit) return true; // Allow empty values
    
    // Create a temporary array to simulate the new state
    const tempValues = [...currentValues];
    tempValues[digitIndex] = newDigit;
    
    // Convert to number for validation
    const firstDigit = tempValues[0] || "0";
    const secondDigit = tempValues[1] || "0";
    const value = parseInt(firstDigit + secondDigit);
    
    // Apply validation based on section
    switch (sectionIndex) {
      case 0: // Hours - no limit (can be any value)
        return true;
      case 1: // Minutes - max 59
        return value <= 59;
      case 2: // Seconds - max 59
        return value <= 59;
      case 3: // Milliseconds - max 99
        return value <= 99;
      default:
        return true;
    }
  };

  // Function to handle input in a specific section
  const handleSectionInput = (
    sectionIndex: number,
    digitIndex: number,
    newValue: string,
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    if (!/^\d*$/.test(newValue)) return; // Only allow numeric input
    
    // Get the absolute index for focus management
    const absoluteIndex = sectionIndex * 2 + digitIndex;
    
    // Get current values for validation
    let currentValues: string[];
    if (sectionIndex === 0) currentValues = hours;
    else if (sectionIndex === 1) currentValues = minutes;
    else if (sectionIndex === 2) currentValues = seconds;
    else currentValues = milliseconds;
    
    // We need to handle both direct input and pasted content
    if (newValue.length === 0) {
      // Handle clearing the input
      setter(prev => {
        const updated = [...prev];
        updated[digitIndex] = "";
        return updated;
      });
    } else if (newValue.length === 1) {
      // Validate the new digit
      if (!validateTimeInput(sectionIndex, digitIndex, newValue, currentValues)) {
        return; // Reject invalid input
      }
      
      // Handle single digit input - this is the most common case
      setter(prev => {
        const updated = [...prev];
        updated[digitIndex] = newValue;
        return updated;
      });
      
      // Use a small timeout to ensure the input is updated before moving focus
      setTimeout(() => {
        // Advance to next field if we're not at the end
        if (absoluteIndex < 7) {
          inputRefs.current[absoluteIndex + 1]?.focus();
        }
      }, 10);
    } else {
      // Handle multiple digits (like pasted content)
      // Only take numeric characters
      const digits = newValue.replace(/\D/g, "");
      
      setter(prev => {
        const updated = [...prev];
        // Only use up to 2 digits, with validation
        for (let i = 0; i < Math.min(digits.length, 2); i++) {
          if (digitIndex + i < 2) {
            // Validate each digit before setting
            if (validateTimeInput(sectionIndex, digitIndex + i, digits[i], updated)) {
              updated[digitIndex + i] = digits[i];
            }
          }
        }
        return updated;
      });
      
      // Calculate where to move focus next
      const nextSection = (sectionIndex + 1) % 4;
      const nextSectionStart = nextSection * 2;
      
      // Use a small timeout to ensure the state updates before moving focus
      setTimeout(() => {
        if (nextSectionStart < 8) {
          inputRefs.current[nextSectionStart]?.focus();
        }
      }, 10);
    }
  };

  // Handle focus to ensure proper selection behavior
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // Auto-select all text when field is focused
    e.target.select();
    setEditing(true);
  };
  
  // Handle blur to reset editing state
  const handleBlur = () => {
    setEditing(false);
  };

  const handleKeyDown = (sectionIndex: number, digitIndex: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Calculate absolute index in the input array
    const index = sectionIndex * 2 + digitIndex;
    
    // Get the appropriate setter function
    let currentValue: string[];
    let setter: React.Dispatch<React.SetStateAction<string[]>>;
    
    if (sectionIndex === 0) {
      currentValue = hours;
      setter = setHours;
    } else if (sectionIndex === 1) {
      currentValue = minutes;
      setter = setMinutes;
    } else if (sectionIndex === 2) {
      currentValue = seconds;
      setter = setSeconds;
    } else {
      currentValue = milliseconds;
      setter = setMilliseconds;
    }
    
    // Handle backspace
    if (e.key === "Backspace") {
      if (!currentValue[digitIndex]) {
        // If current field is empty, move to previous field
        if (index > 0) {
          const prevSectionIndex = Math.floor((index - 1) / 2);
          const prevDigitIndex = (index - 1) % 2;
          
          // Clear the previous value
          if (prevSectionIndex === 0) {
            setHours(prev => {
              const updated = [...prev];
              updated[prevDigitIndex] = "";
              return updated;
            });
          } else if (prevSectionIndex === 1) {
            setMinutes(prev => {
              const updated = [...prev];
              updated[prevDigitIndex] = "";
              return updated;
            });
          } else if (prevSectionIndex === 2) {
            setSeconds(prev => {
              const updated = [...prev];
              updated[prevDigitIndex] = "";
              return updated;
            });
          } else {
            setMilliseconds(prev => {
              const updated = [...prev];
              updated[prevDigitIndex] = "";
              return updated;
            });
          }
          
          // Focus the previous input
          inputRefs.current[index - 1]?.focus();
        }
      } else {
        // Clear current field
        setter(prev => {
          const updated = [...prev];
          updated[digitIndex] = "";
          return updated;
        });
      }
    } 
    // Special handling for numeric keys (0-9)
    else if (/^\d$/.test(e.key)) {
      // Validate the new digit before setting
      if (!validateTimeInput(sectionIndex, digitIndex, e.key, currentValue)) {
        e.preventDefault(); // Prevent invalid input
        return;
      }
      
      // Numeric input is handled by onChange, but we can improve efficiency 
      // by handling the focus shift directly for keyboard input
      setter(prev => {
        const updated = [...prev];
        updated[digitIndex] = e.key;
        return updated;
      });
      
      // Prevent the default behavior so we don't double-process this keypress
      e.preventDefault();
      
      // Move to next field after a short delay to allow state to update
      setTimeout(() => {
        if (index < 7) {
          inputRefs.current[index + 1]?.focus();
        }
      }, 10);
    }
    // Handle arrow keys for navigation
    else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } 
    else if (e.key === "ArrowRight" && index < 7) {
      inputRefs.current[index + 1]?.focus();
    }
    // Tab key is handled by the browser for native tabbing behavior
  };

  // Add section focus handlers
  const focusHours = () => inputRefs.current[0]?.focus();
  const focusMinutes = () => inputRefs.current[2]?.focus();
  const focusSeconds = () => inputRefs.current[4]?.focus();
  const focusMilliseconds = () => inputRefs.current[6]?.focus();

  return (
    <div className="flex flex-col gap-y-1">
      <div className="flex gap-x-[16px] items-center w-full">
        {/* Hours */}
        <Input
          ref={(el) => { inputRefs.current[0] = el; }}
          className="w-[52px] h-[52px] text-[16px] font-[500] text-[#1A1A1A] leading-[19.2px] text-center"
          value={hours[0]}
          placeholder="0"
          onChange={(e) => handleSectionInput(0, 0, e.target.value, setHours)}
          onKeyDown={(e) => handleKeyDown(0, 0, e)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          maxLength={1}
          inputMode="numeric"
          pattern="[0-9]*"
          aria-label="Hours first digit"
        />
        <Input
          ref={(el) => { inputRefs.current[1] = el; }}
          className="w-[52px] h-[52px] text-[16px] font-[500] text-[#1A1A1A] leading-[19.2px] text-center"
          value={hours[1]}
          placeholder="0"
          onChange={(e) => handleSectionInput(0, 1, e.target.value, setHours)}
          onKeyDown={(e) => handleKeyDown(0, 1, e)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          maxLength={1}
          inputMode="numeric"
          pattern="[0-9]*"
          aria-label="Hours second digit"
        />
        
        <MinusIcon />
        
        {/* Minutes */}
        <Input
          ref={(el) => { inputRefs.current[2] = el; }}
          className="w-[52px] h-[52px] text-[16px] font-[500] text-[#1A1A1A] leading-[19.2px] text-center"
          value={minutes[0]}
          placeholder="0"
          onChange={(e) => handleSectionInput(1, 0, e.target.value, setMinutes)}
          onKeyDown={(e) => handleKeyDown(1, 0, e)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          maxLength={1}
          inputMode="numeric"
          pattern="[0-9]*"
          aria-label="Minutes first digit"
        />
        <Input
          ref={(el) => { inputRefs.current[3] = el; }}
          className="w-[52px] h-[52px] text-[16px] font-[500] text-[#1A1A1A] leading-[19.2px] text-center"
          value={minutes[1]}
          placeholder="0"
          onChange={(e) => handleSectionInput(1, 1, e.target.value, setMinutes)}
          onKeyDown={(e) => handleKeyDown(1, 1, e)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          maxLength={1}
          inputMode="numeric"
          pattern="[0-9]*"
          aria-label="Minutes second digit"
        />
        
        <MinusIcon />
        
        {/* Seconds */}
        <Input
          ref={(el) => { inputRefs.current[4] = el; }}
          className="w-[52px] h-[52px] text-[16px] font-[500] text-[#1A1A1A] leading-[19.2px] text-center"
          value={seconds[0]}
          placeholder="0"
          onChange={(e) => handleSectionInput(2, 0, e.target.value, setSeconds)}
          onKeyDown={(e) => handleKeyDown(2, 0, e)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          maxLength={1}
          inputMode="numeric"
          pattern="[0-9]*"
          aria-label="Seconds first digit"
        />
        <Input
          ref={(el) => { inputRefs.current[5] = el; }}
          className="w-[52px] h-[52px] text-[16px] font-[500] text-[#1A1A1A] leading-[19.2px] text-center"
          value={seconds[1]}
          placeholder="0"
          onChange={(e) => handleSectionInput(2, 1, e.target.value, setSeconds)}
          onKeyDown={(e) => handleKeyDown(2, 1, e)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          maxLength={1}
          inputMode="numeric"
          pattern="[0-9]*"
          aria-label="Seconds second digit"
        />
        
        <div className="w-[4px] h-[4px] rounded-[20px] bg-[#000000]" />
        
        {/* Milliseconds */}
        <Input
          ref={(el) => { inputRefs.current[6] = el; }}
          className="w-[52px] h-[52px] text-[16px] font-[500] text-[#1A1A1A] leading-[19.2px] text-center"
          value={milliseconds[0]}
          placeholder="0"
          onChange={(e) => handleSectionInput(3, 0, e.target.value, setMilliseconds)}
          onKeyDown={(e) => handleKeyDown(3, 0, e)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          maxLength={1}
          inputMode="numeric"
          pattern="[0-9]*"
          aria-label="Milliseconds first digit"
        />
        <Input
          ref={(el) => { inputRefs.current[7] = el; }}
          className="w-[52px] h-[52px] text-[16px] font-[500] text-[#1A1A1A] leading-[19.2px] text-center"
          value={milliseconds[1]}
          placeholder="0"
          onChange={(e) => handleSectionInput(3, 1, e.target.value, setMilliseconds)}
          onKeyDown={(e) => handleKeyDown(3, 1, e)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          maxLength={1}
          inputMode="numeric"
          pattern="[0-9]*"
          aria-label="Milliseconds second digit"
        />
      </div>
      
      <div className="flex justify-between text-gray-500 text-sm mt-2">
        <span 
          className="flex-1 text-start cursor-pointer hover:text-blue-500"
          onClick={focusHours}
        >
          hours
        </span>
        <span 
          className="flex-1 text-start cursor-pointer hover:text-blue-500"
          onClick={focusMinutes}
        >
          minutes
        </span>
        <span 
          className="flex-1 text-start cursor-pointer hover:text-blue-500"
          onClick={focusSeconds}
        >
          seconds
        </span>
        <span 
          className="flex-1 text-start cursor-pointer hover:text-blue-500"
          onClick={focusMilliseconds}
        >
          milliseconds
        </span>
      </div>
    </div>
  );
};
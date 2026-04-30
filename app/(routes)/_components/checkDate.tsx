import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import React from 'react';
import { format } from 'date-fns';

// Define the CheckDate component
const CheckDate = ({ checkDate, eventDate, date, selectedDate, onValueChange  }: { checkDate: string; eventDate: string; date: boolean; selectedDate: string | undefined; onValueChange: (value: string) => void }) => {

  // Function to parse the date in 'DD-MM-YYYY' format to a Date object
  const parseDate = (dateString: string): Date | null => {
    if (!dateString) return null;
    try {
      const [year, month, day] = dateString.split("-").map(Number);
      const parsedDate = new Date(year, month - 1, day); // JavaScript months are 0-indexed
      return isNaN(parsedDate.getTime()) ? null : parsedDate;
    } catch (error) {
      console.error("Error parsing date:", error);
      return null;
    }
  };

  // Parse and format the checkDate string
  const parsedDate = parseDate(checkDate);
  if (!parsedDate) {
    console.error("Invalid date:", checkDate);
    return <div>Invalid Date</div>;
  }

  const formattedDate = format(parsedDate, "d MMM, yyyy"); // Format as '13 Aug, 2024'

  return (
    <div className="flex justify-center items-center gap-x-2">
      {/* <RadioGroup defaultValue={checkDate[0]}> */}
      <RadioGroup value={selectedDate} onValueChange={onValueChange} defaultValue={`${date ? eventDate : undefined}`}>
        <div className="flex items-center space-x-2 ">
        <RadioGroupItem 
        value={checkDate} 
        id={checkDate} 
        disabled={date}
        />
          <Label className={`font-[600] text-[1rem] ${date && eventDate === checkDate ? 'text-[#2D9D3C]' : date && eventDate !== checkDate ? 'text-[#000000]/20' : 'text-[#000000]'}`}>{formattedDate}</Label>
        </div>
      </RadioGroup>
    </div>
  );
};

export default CheckDate;

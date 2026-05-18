
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SelectDropdownProps {
  setYearPublish: React.Dispatch<React.SetStateAction<string>>;
}

function getPublishYears(): number[] {
  const startYear = 1970;
  const currentYear = new Date().getFullYear();
  const years: number[] = [];

  for (let year = startYear; year <= currentYear; year += 1)
    years.push(year);

  return years;
}

export function SelectDropdown({setYearPublish}:SelectDropdownProps) {
  const publishYears = getPublishYears();

  return (
    <Select onValueChange={setYearPublish}>
      <SelectTrigger className="w-full h-[52px]">
        <SelectValue placeholder="Select published year" />
      </SelectTrigger>
      <SelectContent className="max-h-72 overflow-y-auto bg-white">
        <SelectGroup>
          <SelectLabel>Select published year</SelectLabel>
          {
            publishYears.map((year) => (
              <SelectItem key={year} value={String(year)}>{year}</SelectItem>
            ))
          }
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

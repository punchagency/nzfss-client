
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import data from "@/utils/publishyear.json"

interface SelectDropdownProps {
  setYearPublish: React.Dispatch<React.SetStateAction<string>>;
}

export function SelectDropdown({setYearPublish}:SelectDropdownProps) {
  return (
    <Select onValueChange={setYearPublish}>
      <SelectTrigger className="w-full h-[52px]">
        <SelectValue placeholder="Select published year" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Select published year</SelectLabel>
          {
            data.map((item, i)=> (
              <SelectItem key={i} value={String(item.value)}>{item.label}</SelectItem>
            ))
          }
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

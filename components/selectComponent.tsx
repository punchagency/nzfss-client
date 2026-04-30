import React from 'react'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface selectComponentProps {
    placeholder: string;
    items: string[];
    onChange?: (value: string) => void;
    disabled?: boolean;
    value?: string;
    className?: string;
}

const SelectComponent = ({placeholder, items, disabled, onChange, value, className}: selectComponentProps) => {
  // Filter out any empty strings to prevent the error
  const filteredItems = items.filter(item => item !== '');
  
  // Force dropdown to never be disabled for class selection
  const isDisabled = false; // Override disabled prop to always be false
  
  return (
    <div className={className || ''}>
        <Select value={value || undefined} onValueChange={onChange} disabled={isDisabled}>
                <SelectTrigger className={`w-full h-[52px] rounded-[12px] ${disabled ? 'opacity-100 cursor-pointer' : ''}`}>
                  <SelectValue className='text-[#696A6A] text-[1rem]' placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {
                        filteredItems.map((item) => (
                            <SelectItem key={item} value={item}>{item}</SelectItem>
                        ))
                    }
                  </SelectGroup>
                </SelectContent>
              </Select>
    </div>
  )
}

export default SelectComponent
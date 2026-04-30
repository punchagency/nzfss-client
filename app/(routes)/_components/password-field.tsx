"use client"

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { PasswordInput } from "@/components/ui/password-input"
import { Label } from "@/components/ui/label"
import { Control } from "react-hook-form"

interface PasswordFieldProps {
  control: Control<any>
  name: string
  label: string
  placeholder?: string
  disabled?: boolean
  className?: string
}

const PasswordField = ({
  control,
  name,
  label,
  placeholder = "Enter password",
  disabled = false,
  className = ""
}: PasswordFieldProps) => {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <Label
            htmlFor={name}
            className="text-left font-[600] text-[16px] 3xl:text-[18px]"
          >
            {label}
          </Label>
          <FormControl>
            <PasswordInput
              id={name}
              placeholder={placeholder}
              className={className}
              disabled={disabled}
              {...field}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export default PasswordField 
"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface PasswordInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        type="password"
        className={cn(
          "outline-none border border-[#00000033] rounded-[12px] h-[52px] px-3 py-2 md:py-4 2xl:text-[1rem] 3xl:text-[1.125rem] w-full",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
PasswordInput.displayName = "PasswordInput"

export { PasswordInput } 
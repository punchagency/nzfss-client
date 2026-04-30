import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    if (type === "file") {
      return (
        <label className="flex justify-center items-center h-[52px] w-[120px] text-center rounded-[12px] border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors cursor-pointer">
          {/* Custom placeholder */}
          <span className="text-muted-foreground text-center ">{props.placeholder}</span>
          <input
            type="file"
            className="sr-only"
            ref={ref}
            {...props}
          />
        </label>
      );
    }

    return (
      <input
        type={type}
        className={cn(
          "flex h-[52px] w-full rounded-[12px] border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none  disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };

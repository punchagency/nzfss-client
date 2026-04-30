// AddResult.tsx
import { warningIcon } from "@/assets";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import Image from "next/image";
import React, { ChangeEvent } from "react";
import SelectComponent from "./selectComponent";
import { Input } from "./ui/input";

interface DeleteClubTriggerProps {
    open: boolean;
    onClose: () => void;
    onChange?: (value: string) => void;
    data?: any;
    description: string;
    onConfirm: () => void;
    reason?: boolean;
    items?: string[];
    customReason?: {
      value: string;
      onChange: (e: ChangeEvent<HTMLInputElement>) => void;
    };
}

const Warning = ({ 
  open, 
  onClose, 
  onChange = () => {}, 
  data, 
  description, 
  onConfirm, 
  reason, 
  items, 
  customReason
}: DeleteClubTriggerProps) => {
  return (
    <div className="flex justify-center items-center">
      <div className={`  `}>
        <AlertDialog open={open} onOpenChange={onClose}>
          <AlertDialogTrigger asChild>
            
          </AlertDialogTrigger>
          <AlertDialogContent className="">
            <AlertDialogHeader>
              <div className="flex items-center justify-center w-full">
                <Image alt="Warning icon" src={warningIcon} />
              </div>
              <AlertDialogTitle className="text-center">Warning</AlertDialogTitle>
              <AlertDialogDescription className="text-center">
              {description}
              </AlertDialogDescription>
            </AlertDialogHeader>
            {
              reason && (
                <div className="space-y-4">
                  <SelectComponent
                    placeholder="Select a Reason"
                    items={items || []}
                    onChange={onChange}
                  />
                  
                  {customReason && (
                    <Input
                      placeholder="Enter your reason"
                      value={customReason.value}
                      onChange={customReason.onChange}
                      className="w-full h-[52px] rounded-[12px]"
                    />
                  )}
                </div>
              )
            }
            
            <AlertDialogFooter className="w-full">
              <AlertDialogCancel onClick={onClose} className="w-full h-[48px]">No</AlertDialogCancel>
              <AlertDialogAction onClick={onConfirm} className="w-full h-[48px]">Yes</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default Warning;

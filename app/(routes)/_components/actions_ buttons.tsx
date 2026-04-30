import Warning from "@/components/warning";
import { useEvent } from "@/service/eventService";
import { usePathname } from "next/navigation";
import React, { useState } from "react";
import { useUser } from "@/context/user_context";
import Image from "next/image";

interface ActionIconsProps {
  icons: React.ReactNode[]; // Accept an array of icons
  eventId?: string;
  event?: any;
  onSubmit?: () => void;
}

const ActionIcons = ({ event, eventId, icons, onSubmit }: ActionIconsProps) => {
  const [modalOpenSubmit, setModalOpenSubmit] = useState(false);
  const pathname = usePathname();
  const isEventsRoute = pathname === "/events";
  const { user } = useUser();

  // Check if user has permission to edit/delete this event
  const canModifyEvent = user?.role === "ADMIN" || event?.clubId === user?._id;

  return (
    <div className="flex justify-center items-center gap-x-[16px]">
      {/* Only show edit/delete buttons if user has permission */}
      {canModifyEvent && icons.map((Icon, index) => {
        // Extract onClick handler from the icon if it exists
        const iconProps = React.isValidElement(Icon) ? Icon.props : {};
        const iconOnClick = iconProps.onClick;
        
        // Determine tooltip text based on index or icon type
        let tooltipText = "Action";
        
        // Check for edit icon based on alt text or key
        if (React.isValidElement(Icon) && 
            ((iconProps.alt && typeof iconProps.alt === 'string' && 
              (iconProps.alt.includes("Rules Icon") || iconProps.alt.includes("pen"))) || 
             iconProps.key === "edit")) {
          tooltipText = "Edit";
        }
        // Check for delete icon based on alt text or key
        else if (React.isValidElement(Icon) && 
                ((iconProps.alt && typeof iconProps.alt === 'string' && iconProps.alt.includes("trash")) || 
                 iconProps.key === "delete")) {
          tooltipText = "Delete";
        }
        // Fallback based on index (assuming first is edit, second is delete)
        else if (index === 0) {
          tooltipText = "Edit";
        } 
        else if (index === 1) {
          tooltipText = "Delete";
        }
        
        return (
          <button
            className="active:bg-gray-300 transform transition-transform duration-200 ease-in-out active:scale-95 border-[#CDCECE] hover:bg-gray-200 border h-[40px] w-[40px] rounded-[12px] flex items-center justify-center instant-anim"
            key={index}
            title={tooltipText}
            onClick={(e) => {
              e.stopPropagation(); // Prevent event bubbling
              if (iconOnClick) iconOnClick(e); // Directly call the icon's onClick handler
            }}
          >
            {React.isValidElement(Icon) 
              ? React.cloneElement(Icon, { 
                  ...iconProps, 
                  onClick: undefined, // Remove onClick from child to prevent event bubbling issues
                  className: `${iconProps.className || ''} pointer-events-none` // Prevent child from capturing clicks
                })
              : Icon
            }
          </button>
        );
      })}

      {/* Only show submit button in draft events view and if user has permission */}
      {isEventsRoute && !event?.isSubmitted && onSubmit && canModifyEvent && (
        <div className="instant-anim border rounded-[12px] w-[82px] h-[32px] active:bg-gray-300 transform transition-transform duration-200 ease-in-out active:scale-95 flex items-center justify-center">
          <button
            onClick={() => setModalOpenSubmit(true)}
            className="text-[15px] font-[600] text-[#1A1A1A]"
          >
            Submit
          </button>
        </div>
      )}

      {modalOpenSubmit && (
        <Warning
          open={modalOpenSubmit}
          onClose={() => setModalOpenSubmit(false)}
          description="Are you sure you want to submit this event?"
          onConfirm={() => {
            onSubmit?.();
            setModalOpenSubmit(false);
          }}
        />
      )}
    </div>
  );
};

export default ActionIcons;

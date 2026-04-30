import Warning from "@/components/warning";
import { CreateEventCalendarInput, useEvent } from "@/service/eventService";
import React, { useState, useEffect, ChangeEvent } from "react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@apollo/client";
import { CREATE_NOTIFICATION } from "@/graphql/mutation/notification";

interface DateButtonNzfssProps {
  eventId: string; // Correctly typed as string for the event ID
  updateEvent: (
    eventId: string,
    inputData: { NZFSSSanctioning: boolean, status: string, reason?: string }
  ) => void;
  eventName: string;
  clubId: string;
}

const DateButtonNzfss = ({ eventId, updateEvent, eventName, clubId }: DateButtonNzfssProps) => {
  const [modalOpenDecline, setModalOpenDecline] = useState(false);
  const [modalOpenApprove, setModalOpenApprove] = useState(false);
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const { toast } = useToast();
  const [createNotification] = useMutation(CREATE_NOTIFICATION);

  const { events } = useEvent();
  
  // Find the current event to check its sanctioning status
  const currentEvent = events.find((event: CreateEventCalendarInput) => event._id === eventId);
  const isSanctioned = currentEvent?.NZFSSSanctioning === true;
  const isDeclined = currentEvent?.status === "Declined" && currentEvent?.NZFSSSanctioning === false;

  const declineReasons = [
    "Conflict of dates. Major vs minor within the 200km between clubs.",
    "Unsuitable or dangerous trails. Surfaces, lengths, conditions, weather etc.",
    "Non payment of sanctioning fee.",
    "Any failure to fulfill the Sanctioning procedures and Requirements.",
    "Other"
  ];

  const handleApprove = async () => {
    try {
      // Update NZFSSSanctioning to true and status to Approve (valid enum value)
      updateEvent(eventId, { 
        NZFSSSanctioning: true, 
        status: "Approve" 
      });

      await createNotification({
        variables: {
          input: {
            title: "NZFSS Sanctioning Approved",
            message: `NZFSS sanctioning for "${eventName}" has been approved.`,
            type: "EVENT_STATUS_UPDATE",
            userId: clubId,
            eventId: eventId
          }
        }
      });
      
      toast({
        description: "Event has been sanctioned successfully."
      });
      
      setModalOpenApprove(false);
    } catch (error) {
      toast({
        description: "Failed to update sanctioning status.",
        variant: "destructive",
      });
    }
  };

  const handleDecline = async () => {
    // For "Other" option, use the custom reason
    const finalReason = selectedReason === "Other" ? customReason : selectedReason;
    
    if (!finalReason) {
      toast({
        description: "Please provide a reason for declining.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Update NZFSSSanctioning to false (Decline) with the selected reason
      updateEvent(eventId, { 
        NZFSSSanctioning: false, 
        status: "Declined", 
        reason: finalReason 
      });
      
      await createNotification({
        variables: {
          input: {
            title: "NZFSS Sanctioning Declined",
            message: `NZFSS sanctioning for "${eventName}" has been declined. Reason: ${finalReason}`,
            type: "EVENT_STATUS_UPDATE",
            userId: clubId,
            eventId: eventId
          }
        }
      });
      
      toast({
        description: "Event sanctioning has been declined."
      });
      
      setModalOpenDecline(false);
      setCustomReason(""); // Reset custom reason
      setSelectedReason(""); // Reset selected reason
    } catch (error) {
      toast({
        description: "Failed to update sanctioning status.",
        variant: "destructive",
      });
    }
  };

  // Reset custom reason when closing the modal
  const handleCloseDeclineModal = () => {
    setModalOpenDecline(false);
    setCustomReason("");
    setSelectedReason("");
  };

  // If already sanctioned or declined, show the status instead of buttons
  if (isSanctioned) {
    return (
      <div className="flex justify-center items-center">
        <button
          disabled={true}
          className="instant-anim text-[15px] font-[600] px-[16px] py-[13px] border bg-[#C3E2C7] rounded-[50px] text-[#2D9D3C] border-[#7AC484]"
        >
          Approve
        </button>
      </div>
    );
  }
  
  if (isDeclined) {
    return (
      <div className="flex justify-center items-center">
        <button
          disabled={true}
          className="instant-anim text-[15px] font-[600] px-[16px] py-[13px] border bg-red-100 rounded-[50px] text-red-600 border-red-300"
        >
          Declined
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-center gap-x-[12px] items-center">
        <button
          onClick={() => setModalOpenApprove(true)}
          className="instant-anim text-[15px] font-[600] px-[16px] py-[13px] border rounded-[12px] hover:bg-gray-200"
        >
          Approve
        </button>
        <button
          onClick={() => setModalOpenDecline(true)}
          className="instant-anim text-[15px] font-[600] px-[16px] py-[13px] border rounded-[12px] hover:bg-gray-200"
        >
          Decline
        </button>
      </div>

      {modalOpenApprove && (
        <Warning
          open={modalOpenApprove}
          onClose={() => setModalOpenApprove(false)}
          description="Are you sure you want to approve NZFSS Sanctioning?"
          onConfirm={handleApprove}
        />
      )}

      {modalOpenDecline && (
        <Warning
          open={modalOpenDecline}
          onClose={handleCloseDeclineModal}
          description="Are you sure you want to decline NZFSS Sanctioning?"
          onConfirm={handleDecline}
          reason={true}
          onChange={(value) => setSelectedReason(value)}
          items={declineReasons}
          customReason={selectedReason === "Other" ? { 
            value: customReason, 
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => setCustomReason(e.target.value) 
          } : undefined}
        />
      )}
    </>
  );
};

export default DateButtonNzfss;

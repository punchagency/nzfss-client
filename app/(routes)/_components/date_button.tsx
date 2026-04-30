// AddResult.tsx
import Warning from "@/components/warning";
import { UPDATE_EVENT } from "@/graphql/mutation/event";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@apollo/client";
import React, { useState, useEffect } from "react";
import { CreateEventCalendarInput, useEvent } from "@/service/eventService";

interface DateButtonProps {
  eventId: string;
  selectedDate: string;
  date: boolean;
  updateEvent: (
    eventId: string,
    inputData: { date: boolean; eventDate: string; status: string }
  ) => void;
}

const DateButton = ({
  eventId,
  selectedDate,
  date,
  updateEvent,
}: DateButtonProps) => {
  const [modalOpenApproveDate, setModalOpenApproveDate] = useState(false);
  const { toast } = useToast();
  const { events } = useEvent();

  // Find current event to check its sanctioning status
  const currentEvent = events.find((event: CreateEventCalendarInput) => event._id === eventId);

  // Add debugging effect to log the sanctioning status 
  useEffect(() => {
    if (currentEvent) {
      console.log("Current event:", currentEvent.eventName);
      console.log("Current sanctioning status:", currentEvent.NZFSSSanctioning);
    }
  }, [currentEvent]);

  const [updateEventCalendar] = useMutation(UPDATE_EVENT);

  const handleApprove = async () => {
    if (!selectedDate) {
      toast({
        description: "Please kindly select a date.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Keep the update data minimal - service layer will handle preserving sanctioning status
      const updateData = {
        eventDate: selectedDate,
        date: true,
        status: "Approve" // Update status to Approve when date is approved
      };

      console.log("Sending date approval update:", updateData);

      const data = await updateEventCalendar({
        variables: {
          eventId,
          input: updateData,
        },
      });

      if (data) {
        console.log("Update response:", data);
        toast({
          description: "Successfully approved event date.",
        });
        // Update local state with the same data
        updateEvent(eventId, updateData);
      }
    } catch (error) {
      console.error("Error approving date:", error);
      toast({
        description: "Failed to approve event date.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <div className="flex justify-center items-center">
        {date ? (
          <div className="text-[#2D9D3C] font-[600] text-[15px]">
            {selectedDate}
          </div>
        ) : (
          <button
            onClick={() => setModalOpenApproveDate(true)}
            className="instant-anim text-[15px] font-[600] px-[16px] py-[13px] border rounded-[12px] hover:bg-gray-200"
          >
            Approve
          </button>
        )}
      </div>

      {modalOpenApproveDate && (
        <Warning
          open={modalOpenApproveDate}
          onClose={() => setModalOpenApproveDate(false)}
          description="Are you sure you want to approve this date?"
          onConfirm={handleApprove}
        />
      )}
    </>
  );
};

export default DateButton;


import { Switch } from "@/components/ui/switch";
import Warning from "@/components/warning";
import { UPDATE_EVENT } from "@/graphql/mutation/event";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@apollo/client";
import Image from "next/image";
import React, { useState } from "react";

interface PublicButtonProps {
  eventId: string;
  eventPublic: boolean;
}

const PublicButton = ({ eventId, eventPublic }: PublicButtonProps) => {
  const [modalOpenPublic, setModalOpenPublic] = useState(false);
  const [isPublic, setIsPublic] = useState(eventPublic);

  const { toast } = useToast();

  const [updateEventCalendar, { loading, error }] = useMutation(UPDATE_EVENT);

  const handleApprove = async (newState: boolean) => {
    setIsPublic(newState);
     const data = await updateEventCalendar({
      variables: {
        eventId,
        input: {
          public: newState
        },
      },
    })

    if(!data) {
      toast({
        description: newState ? "Event has been made public." : "Event visibility is now private.",
      });
    }
    // updateEvent(eventId, { eventDate: selectedDate, date: true });
  };

  return (
    <div className="flex justify-center items-center">
      <div className={`  `}>
            <div>
            <Switch
          checked={isPublic} // Bind the checked state to isPublic
          onCheckedChange={(checked) => {
            setModalOpenPublic(true);  // Open modal to confirm the action
          }}
        />
            </div>
      </div>

      {modalOpenPublic && (
        <Warning
          open={modalOpenPublic}
          onClose={() => setModalOpenPublic(false)}
          description={`Are you sure you want to make this event ${isPublic ? "private" : "public"}?`}
          onConfirm={() => handleApprove(!isPublic)}
        />
      )}
    </div>
  );
};

export default PublicButton;

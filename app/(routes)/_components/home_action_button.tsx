import React, { useState } from "react";

interface ActionIconsProps {
  icons?: React.ReactNode[]; // Accept an array of icons
  eventId?: string;
  submit?: boolean;
  event?: any
}

interface HomeActionButtonProps {
    onDownload: () => void;
}

const HomeActionButton: React.FC<HomeActionButtonProps> = ({ onDownload }) => {

  // const { updateEvent } = useEvent();
  // const pathname = usePathname();

  // const handleSubmit = () => {
  //   // Update NZFSSSanctioning to true (Approve)
  //   updateEvent(eventId as string, { isSubmitted: true });
  // };

  return (
    <div className=" flex justify-center items-center gap-x-[16px]">
      

  
        <div className="instant-anim border border-[#00000033] rounded-[12px] w-[131px] h-[40px] flex items-center justify-center">
          <button
            onClick={onDownload}
            className="text-[15px] font-[600] text-[#000000]"
          >
            Download
          </button>
        </div>
    

      {/* {modalOpenSubmit && (
        <Warning
          open={modalOpenSubmit}
          onClose={() => setModalOpenSubmit(false)}
          description="Are you sure you want to submit this event?"
          onConfirm={handleSubmit}
        />
      )} */}
    </div>
  );
};

export default HomeActionButton;

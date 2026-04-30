"use client"
import { useTab } from '@/context/tab_context';
import { useRouter } from 'next/navigation';
import React from 'react';

const AddResult = ({ id, status, button }: {id?: string, status?: string, button: boolean }) => {
  const router = useRouter()
  const {setActiveTab} = useTab()

  const handleClick = () => {
    router.push(`/events/${id}?tab=1`);
    setActiveTab(1)
  }

  return (
    <div className='flex justify-center items-center'>
      <button
        onClick={handleClick}
        disabled={status === "Pending" || status === "Declined" || status === "Sanctioning"}
        className={`${
          status === "Pending" || status === "Declined" || status === "Sanctioning" 
            ? "bg-[#E6E6E6] border-[#CDCECE] text-[#9C9D9D] cursor-not-allowed" 
            : "bg-[#F3F3F3] border-[#CDCECE] text-[#1A1A1A] hover:bg-[#E6E6E6]"
        } text-[15px] font-[600] w-[116px] h-[36px] border rounded-[12px] transition-colors`}
      >
        {button ? 'Added' : '+ Add Result'}
      </button>
    </div>
  );
};

export default AddResult;

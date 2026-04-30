import React from 'react'

interface StatusProps {
    status: string;
}

const Status = ({status}: StatusProps) => {
  // Break long status texts into two words, one per line
  const renderStatus = () => {
    if (status === "Date Approved") {
      return (
        <>
          <div>Date</div>
          <div>Approved</div>
        </>
      );
    } else if (status === "Sanctioning Approved") {
      return (
        <>
          <div>Sanctioning</div>
          <div>Approved</div>
        </>
      );
    } else {
      return status;
    }
  };

  return (
    <div className={`
      ${status === "Pending" && "border-[#F1D3A3] bg-[#F2E7D5] text-[#F59E0B]"} 
      ${status === "Approve" && "border-[#7AC484] bg-[#C3E2C7] text-[#2D9D3C]"}
      ${status === "Date Approved" && "border-[#7AC484] bg-[#C3E2C7] text-[#2D9D3C]"}
      ${status === "Sanctioning Approved" && "border-[#65a8d9] bg-[#c2dff7] text-[#1a73b5]"}
      ${status === "Declined" && "border-[#F0B9B9] bg-[#F5DEDE] text-[#FF5353]"}
      flex flex-col justify-center items-center h-[2.5vw] min-w-[6.25vw] rounded-[2.604vw] px-[0.833vw] py-[0.417vw] border text-sm`}>
        <button className="w-full text-[0.781vw] flex flex-col items-center">
            {renderStatus()}
        </button>
    </div>
  )
}

export default Status
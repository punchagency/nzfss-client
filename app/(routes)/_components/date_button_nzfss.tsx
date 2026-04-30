  if (isSanctioned) {
    return (
      <div className="flex justify-center items-center">
        <button
          disabled={true}
          className="instant-anim text-[15px] font-[600] px-[16px] py-[13px] border bg-[#C3E2C7] rounded-[50px] text-[#2D9D3C] border-[#7AC484]"
        >
          sanctioning applied
        </button>
      </div>
    );
  } 
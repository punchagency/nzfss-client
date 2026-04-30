import React from "react";

const Logout = () => {
  const handleLogout = () => {
    window.location.href = "/logout";
  };
  
  return (
    <button 
      onClick={handleLogout}
      className="instant-anim border border-[#00000033] rounded-[16px] font-[500] pl-[16px] h-[46px] 3xl:h-[56px] text-left leading-[21.6px] text-[1rem] 3xl:text-[18px] text-[#000000] transform active:scale-95">
      Log out
    </button>
  );
};

export default Logout;

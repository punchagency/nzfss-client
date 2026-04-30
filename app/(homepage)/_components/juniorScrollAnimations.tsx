"use client"

import React, { useEffect, useState } from "react";
import Image from "next/image";
import {
  animImage7,
  image1,
  image2,
  image3,
  image4,
  image5,
} from "@/assets";

const JuniorScrollAnimations: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  
  useEffect(() => {
    const handleScroll = () => {
      const SCROLL_TRIGGER = 10;
      const currentScrollY = window.scrollY;

      // Only update isScrolled when scrolling down past the trigger point
      if (currentScrollY > lastScrollY && currentScrollY > SCROLL_TRIGGER) {
        setIsScrolled(true);
      }

      setLastScrollY(currentScrollY);
    };
  
    window.addEventListener("scroll", handleScroll);
    handleScroll();
  
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [lastScrollY]);

  return (
    <div className={`hidden xl:flex group transform ${!isScrolled && 'xl:translate-x-[6.77vw]'} hover:translate-x-0 transition-transform duration-1000`}>
      <Image
        className={`transition-all duration-1000 w-[14.792vw] h-[18.229vw] mr-[0.45vw] transform ${!isScrolled ? "translate-y-[1.5625vw] translate-x-[11.4583vw] -rotate-12 " : "translate-x-[-3.125vw]"} group-hover:translate-x-[-3.125vw] group-hover:translate-y-0 group-hover:rotate-0`}
        src={image2}
        alt="main image"
      />
      <Image
        className={`transition-all duration-1000 w-[14.792vw] -mr-[2.25vw] h-[18.229vw] transform ${!isScrolled ? "translate-x-[4.6875vw] -rotate-12" : "translate-x-[-2.6042vw]"} group-hover:translate-x-[-2.6042vw] group-hover:rotate-0`}
        src={image3}
        alt="main image"
      />
      <Image
        className={`relative z-[999] transition-all w-[14.792vw] h-[18.229vw] -mt-[1.563vw] duration-1000 transform ${!isScrolled ? "translate-x-[1.0417vw]" : "translate-x-[0.5208vw]"} group-hover:translate-x-[0.5208vw]`}
        src={image1}
        alt="main image"
      />
      <Image
        className={`relative z-[99] transition-all w-[14.792vw] h-[18.229vw] duration-1000 transform ${!isScrolled ? "translate-x-[-6.25vw] rotate-12" : "translate-x-[1.0417vw]"} group-hover:translate-x-[1.0417vw] group-hover:rotate-0`}
        src={image4}
        alt="main image"
      />
      <Image
        className={`transition-all duration-1000 w-[14.792vw] h-[18.229vw] transform relative z-[9] ${!isScrolled ? "translate-x-[-16.6667vw] translate-y-[1.5625vw] rotate-12" : "translate-x-[1.5625vw]"} group-hover:translate-x-[1.5625vw] group-hover:translate-y-0 group-hover:rotate-0`}
        src={image5}
        alt="main image"
      />
      <Image
        className={`transition-all duration-1000 w-[14.792vw] h-[18.229vw] transform relative z-[0] ${!isScrolled ? "translate-x-[-27.6042vw] translate-y-[3.125vw] rotate-12" : "translate-x-[3.3854vw]"} group-hover:translate-x-[3.3854vw] group-hover:translate-y-0 group-hover:rotate-0`}
        src={animImage7}
        alt="main image"
      />
    </div>
  );
};

export default JuniorScrollAnimations; 
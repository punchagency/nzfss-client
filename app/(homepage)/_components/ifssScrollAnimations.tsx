"use client"

import React, { useEffect, useState } from "react";
import Image from "next/image";

import IFSS1 from "@/assets/IFSS/1.png"
import IFSS2 from "@/assets/IFSS/2.png"
import IFSS3 from "@/assets/IFSS/3.png"
import IFSS4 from "@/assets/IFSS/4.png"
import IFSS5 from "@/assets/IFSS/5.png"
import IFSS6 from "@/assets/IFSS/6.png"

const IFSSScrollAnimations: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const SCROLL_TRIGGER = 10;
      const currentScrollY = window.scrollY;

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
    <>
      {/* Image container with scroll-triggered animation */}
      <div className={`group flex transform ${!isScrolled && 'xl:translate-x-[10vw]'} hover:translate-x-0 transition-transform duration-1000`}>
        <div className="hidden xl:flex w-full">
          <Image
            className={`transition-all duration-1000 w-[14.792vw] mr-[0.45vw] h-[18.229vw] transform ${!isScrolled ? "translate-y-[1.5625vw] translate-x-[11.4583vw] -rotate-12 " : "translate-x-[1.5vw]"} group-hover:translate-x-[1.5vw] group-hover:translate-y-0 group-hover:rotate-0`}
            src={IFSS1}
            alt="sled dog racing image"
          />
          <Image
            className={`transition-all duration-1000 w-[14.792vw] -mr-[2.25vw] h-[18.229vw] transform ${!isScrolled ? "translate-x-[4.6875vw] -rotate-12" : "translate-x-[2vw]"} group-hover:translate-x-[2vw] group-hover:rotate-0`}
            src={IFSS2}
            alt="sled dog racing image"
          />
          <Image
            className={`relative z-[999] transition-all  w-[14.792vw]  h-[18.229vw] -mt-[30px] duration-1000 transform ${!isScrolled ? "translate-x-[1.0417vw]" : "translate-x-[5vw]"} group-hover:translate-x-[5vw]`}
            src={IFSS3}
            alt="sled dog racing image"
          />
          <Image
            className={`relative z-[99] transition-all  w-[14.792vw]  h-[18.229vw] duration-1000 transform ${!isScrolled ? "translate-x-[-6.25vw] rotate-12" : "translate-x-[5vw]"} group-hover:translate-x-[5vw] group-hover:rotate-0`}
            src={IFSS4}
            alt="sled dog racing image"
          />
          <Image
            className={`transition-all duration-1000 transform relative w-[14.792vw]  h-[18.229vw]  z-[9] ${!isScrolled ? "translate-x-[-16.6667vw] translate-y-[1.5625vw] rotate-12" : "translate-x-[6vw]"} group-hover:translate-x-[6vw] group-hover:translate-y-0 group-hover:rotate-0`}
            src={IFSS5}
            alt="sled dog racing image"
          />
          <Image
            className={`transition-all duration-1000 transform relative z-[0] w-[14.792vw]  h-[18.229vw]  ${!isScrolled ? "translate-x-[-27.6042vw] translate-y-[3.1250vw] rotate-12" : "translate-x-[7vw]"} group-hover:translate-x-[7vw] group-hover:translate-y-0 group-hover:rotate-0`}
            src={IFSS6}
            alt="sled dog racing image"
          />
        </div>
        <div className="flex xl:hidden w-full gap-x-4 justify-center">
          <Image
            className="w-[40vw] h-[50vw] -mt-[20vw] object-cover rounded-lg"
            src={IFSS1}
            alt="sled dog racing image"
          />
          <Image
            className="w-[40vw] h-[50vw] -mt-[20vw] object-cover rounded-lg"
            src={IFSS2}
            alt="sled dog racing image"
          />
        </div>
      </div>
    </>
  );
};

export default IFSSScrollAnimations; 
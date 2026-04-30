"use client"

import React, { useEffect, useState } from "react";
import Image from "next/image";

import AnimatedImage1 from "@/assets/History/1.png"
import AnimatedImage2 from "@/assets/History/2.png"
import AnimatedImage3 from "@/assets/History/3.png"
import AnimatedImage4 from "@/assets/History/4.png"
import AnimatedImage5 from "@/assets/History/5.png"
import AnimatedImage6 from "@/assets/History/6.png"

const HistoryScrollAnimations: React.FC = () => {
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
      {/* Desktop animated images */}
      <div className={`group flex transform ${!isScrolled && 'xl:translate-x-[8vw]'} hover:translate-x-0 transition-transform duration-1000`}>
        <div className="hidden xl:flex w-full">
          <Image
            className={`transition-all duration-1000 w-[14.792vw] h-[18.229vw] mr-[0.45vw] transform ${!isScrolled ? "translate-y-[1.5625vw] translate-x-[11.4583vw] -rotate-12 " : "translate-x-[-3vw]"} group-hover:translate-x-[-3vw] group-hover:translate-y-0 group-hover:rotate-0`}
            src={AnimatedImage1}
            alt="history image"
          />
          <Image
            className={`transition-all duration-1000 w-[14.792vw] -mr-[2.25vw] h-[18.229vw] transform ${!isScrolled ? "translate-x-[4.6875vw] -rotate-12" : "translate-x-[-3vw]"} group-hover:translate-x-[-3vw] group-hover:rotate-0`}
            src={AnimatedImage2}
            alt="history image"
          />
          <Image
            className={`relative z-[999] transition-all w-[14.792vw] h-[18.229vw] -mt-[30px] duration-1000 transform ${!isScrolled ? "translate-x-[1.0417vw]" : "translate-x-[0.2vw]"} group-hover:translate-x-[0.2vw]`}
            src={AnimatedImage3}
            alt="history image"
          />
          <Image 
            className={`relative z-[99] transition-all duration-1000 w-[14.792vw] h-[18.229vw] transform ${!isScrolled ? "translate-x-[-6.25vw] rotate-12" : "translate-x-[1vw]"} group-hover:translate-x-[1vw] group-hover:rotate-0`}
            src={AnimatedImage4}
            alt="history image"
          />
          <Image
            className={`transition-all duration-1000 transform w-[14.792vw] h-[18.229vw] relative z-[9] ${!isScrolled ? "translate-x-[-16.6667vw] translate-y-[1.5625vw] rotate-12" : "translate-x-[2vw]"} group-hover:translate-x-[2vw] group-hover:translate-y-0 group-hover:rotate-0`}
            src={AnimatedImage5}
            alt="history image"
          />
          <Image
            className={`transition-all duration-1000 w-[14.792vw] h-[18.229vw] transform relative z-[0] ${!isScrolled ? "translate-x-[-27.6042vw] translate-y-[3.1250vw] rotate-12" : "translate-x-[3vw]"} group-hover:translate-x-[3vw] group-hover:translate-y-0 group-hover:rotate-0`}
            src={AnimatedImage6}
            alt="history image"
          />
        </div>
        
        {/* Mobile static images */}
        <div className="flex xl:hidden w-full gap-x-4 justify-center">
          <Image
            className="w-[40vw] h-[50vw] object-cover rounded-lg"
            src={AnimatedImage1}
            alt="history image"
          />
          <Image
            className="w-[40vw] h-[50vw] object-cover rounded-lg"
            src={AnimatedImage2}
            alt="history image"
          />
        </div>
      </div>
    </>
  );
};

export default HistoryScrollAnimations; 
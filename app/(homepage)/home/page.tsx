import { goldCycle, goldCycle2 } from "@/assets";
import Image from "next/image";
import React from "react";
import SledDog from "../_components/sledDog";
import { SwiperSlideGroup, History, VideoSection } from "../_components/clientWrapper";

function HomePage() {
  return (
    <div className="flex flex-col w-full h-full">
      <div className="flex flex-col w-full h-full items-center gap-y-[148px] bg-white">
        <div className="flex flex-col gap-y-[24px] px-[20px] sm:px-[48px]">
          <h1 className="text-[28px] sm:text-[32px] md:text-[42px] lg:text-[4.3750vw] font-[700] leading-normal sm:leading-[1.2vw] lg:leading-[5.25vw] text-center">
            Welcome to the New Zealand
            <br className="block sm:hidden" />
            <br className="hidden sm:block" />
            Federation of{" "}
            <span className="inline relative">
              {" "}
              <span className="relative z-[9]">Sled Dog</span>{" "}
              <Image
                src={goldCycle}
                alt="gold cycle"
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[0]"
              />
            </span>{" "}
            Sports
          </h1>
          <p className="text-base sm:text-[1.25vw] leading-normal sm:leading-[1.2] lg:leading-[5.25vw] mb-[2vw] -mt-[1vw] text-center">
            This is the central place for all information on dog powered sports,
            our clubs, and activities
          </p>
        </div>
        
        <VideoSection />
      </div>

      <SledDog />

      <div className="px-[20px] sm:px-[48px] relative w-full">
        <Image 
          src={goldCycle2} 
          alt="gold cycle2" 
          className="absolute top-[-55px] right-0 z-[0]"
        />   
        <div className="w-full bg-[#ECECEF] rounded-[16px] relative z-[9] py-[50px] sm:py-[96.41px] mb-[50px] sm:mb-[96.41px]">
          <div className="w-full text-center mb-8 sm:mb-[24px]">
            <h3 className="text-[24px] sm:text-[32px] md:text-[42px] lg:text-[4.3750vw] font-[700] leading-normal sm:leading-[1.2] lg:leading-[5.25vw]">
              Dog powered sport disciplines
              <br className="hidden sm:block" /> 
              in New Zealand
            </h3>
          </div>
          <div className="w-full">
            <SwiperSlideGroup />
          </div>
        </div>
      </div>

      <div className="w-full">
        <History />
      </div>
    </div>
  );
}

export default HomePage;

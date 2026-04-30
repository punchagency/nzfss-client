import {
  goldCyc,
  goldCycle5,
} from "@/assets";

import { History, HistoryScrollAnimations, HistoryActionSection } from "../_components/clientWrapper";
import Image from "next/image";
import React from "react";

import Paw from "@/assets/History/Paw.png"
import Flag from "@/assets/History/Flag.png"
import People from "@/assets/History/People.png"
import Doggo from "@/assets/History/Doggo.png"

import We1 from "@/assets/History/we1.png"
import We2 from "@/assets/History/we2.png"
import Story1 from "@/assets/History/story1.png"
import Story2 from "@/assets/History/story2.png"

function HistoryPage() {
  return (
    <div className="flex flex-col w-full h-full pb-[148px] bg-white">
      <div className="flex flex-col w-full h-full items-center gap-y-[200px] bg-white">
        <div className="flex flex-col gap-y-[104px] px-[48px]">
          <div className="flex flex-col gap-y-[24px]">
            <h1 className="text-[32px] sm:text-[42px] lg:text-[4.3750vw] font-[700] leading-[1.2] lg:leading-[5.25vw] text-center">
              Our Journey & <br /> The History of NZFSS
            </h1>

            <p className="text-[24px] font-[500] leading-[33.58px] text-center">
            Founded in 1993, the NZFSS unified sled dog racing in New Zealand, supporting both Dryland and
             <br /> snow races.Today, it continues to grow the sport and preserve its legacy.
            </p>
          </div>

          {/* Scroll-triggered animations (client-rendered) */}
          <HistoryScrollAnimations />
        </div>

        {/* Stats section (server-rendered) */}
        <div className="px-[48px] w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 h-auto w-full p-4 md:p-[56px] gap-y-6 relative">
            <div className="flex flex-col items-center gap-y-[16px]">
              <Image 
                src={Paw} 
                alt="Paw icon"
                className="w-[64px] h-[64px] md:w-[104px] md:h-[104px]"
                priority
              />
              <div className="flex flex-col items-center gap-y-[4px]">
                <p className="text-center leading-normal font-[500] text-[16px] md:text-[1.25vw] text-[#1A1A1ACC]">
                  First sled dog race held
                </p>
                <p className="text-center leading-normal font-[500] text-[16px] md:text-[1.25vw] text-[#1A1A1ACC]">
                  1985
                </p>
              </div>
            </div>

            {/* Vertical Separator 1 */}
            <div className="hidden xl:block absolute left-1/4 top-[50%] transform -translate-y-[50%] w-[1px] h-[40%] bg-[#1A1A1A33]" />

            <div className="flex flex-col items-center gap-y-[16px]">
              <Image 
                src={Flag} 
                alt="Flag icon"
                className="w-[64px] h-[64px] md:w-[104px] md:h-[104px]"
                priority
              />
              <div className="flex flex-col items-center">
                <p className="text-center leading-normal font-[500] text-[16px] md:text-[1.25vw] text-[#1A1A1ACC]">
                  NZFSS established in 1993
                  <br />
                  IFSS member since 1995
                  <br />
                  DogsNZ member since 1998
                </p>
              </div>
            </div>

            {/* Vertical Separator 2 */}
            <div className="hidden xl:block absolute left-1/2 top-[50%] transform -translate-y-[50%] w-[1px] h-[40%] bg-[#1A1A1A33]" />

            <div className="flex flex-col items-center gap-y-[16px]">
              <Image 
                src={People} 
                alt="People icon"
                className="w-[64px] h-[64px] md:w-[104px] md:h-[104px]"
                priority
              />
              <div className="flex flex-col items-center">
                <p className="text-center leading-normal font-[500] text-[16px] md:text-[1.25vw] text-[#1A1A1ACC]">
                  13 member clubs
                </p>
              </div>
            </div>

            {/* Vertical Separator 3 */}
            <div className="hidden xl:block absolute left-3/4 top-[50%] transform -translate-y-[50%] w-[1px] h-[40%] bg-[#1A1A1A33]" />

            <div className="flex flex-col items-center gap-y-[16px]">
              <Image 
                src={Doggo} 
                alt="Dog icon"
                className="w-[64px] h-[64px] md:w-[104px] md:h-[104px]"
                priority
              />
              <div className="flex flex-col items-center">
                <p className="text-center leading-normal font-[500] text-[16px] md:text-[1.25vw] text-[#1A1A1ACC]">
                  1800+ dogs participating
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Who We Are section (server-rendered) */}
        <div className="grid xl:grid-cols-2 w-full px-[48px] gap-x-[80px] gap-y-[40px]">
          <div className="w-full flex items-center">
            <div className="flex flex-col gap-y-[24px] text-start w-full -mt-40">
              <h3 className="text-[32px] sm:text-[42px] lg:text-[4.3750vw] font-[700] leading-[1.2] lg:leading-[5.25vw] text-left ">
                Who{" "}
                <span className="inline relative">
                  {" "}
                  <span className="relative z-[9]">We</span>{" "}
                  <Image
                    src={goldCycle5}
                    alt="gold cycle"
                    className="absolute top-1/2 left-[70px] transform -translate-x-1/2 -translate-y-1/2 z-[0] w-[8vw]"
                  />
                </span>{" "}
                are
              </h3>
              <p className="font-[500] sm:text-[20px] lg:text-[1.25vw] text-[#1A1A1ACC]  md:text-[1.5vw] leading-[1.4]">
              The New Zealand Federation of Sled Dog Sports represents the interests of all associated clubs and provides a framework of rules to hold accredited race events.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center w-full">
            <div className="flex gap-[2vw] w-full">
              <Image
                className="w-[48%] h-auto object-cover"
                src={We1}
                alt="NZFSS member activity"
                priority
              />
              <Image
                className="w-[48%] h-auto object-cover"
                src={We2}
                alt="NZFSS team event"
                priority
              />
            </div>
          </div>
        </div>

        {/* Our Story section (server-rendered) */}
        <div className="grid xl:grid-cols-2 w-full px-[48px] gap-x-[80px] gap-y-[40px]">
          <div className="flex items-center justify-center w-full order-2 xl:order-1">
            <div className="flex gap-[2vw] w-full">
              <Image
                className="w-[48%] h-auto object-cover"
                src={Story1}
                alt="NZFSS story moment"
                priority
              />
              <Image
                className="w-[48%] h-auto object-cover"
                src={Story2}
                alt="NZFSS historical event"
                priority
              />  
            </div>
          </div>

          <div className="w-full flex items-center order-1 xl:order-2">
            <div className="flex flex-col gap-y-[24px] text-start w-full">
              <h3 className="text-[32px] sm:text-[42px] lg:text-[4.3750vw] font-[700] leading-[1.2] lg:leading-[5.25vw] text-left -mt-32">
                Our{" "}
                <span className="inline relative">
                  {" "}
                  <span className="relative z-[9]">Story</span>{" "}
                  <Image
                    src={goldCyc}
                    alt="gold cycle"
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[0] w-[8vw]"
                  />
                </span>
              </h3 >
              <p className="font-[500] sm:text-[20px] lg:text-[1.25vw] text-[#1A1A1ACC]  md:text-[1.5vw] leading-[1.4]">
              The NZFSS enables dogs and drivers to compete in accredited events under unifying rules, offering dog and driver rankings.
              </p>
              <p className="font-[500] sm:text-[20px] lg:text-[1.25vw] text-[#1A1A1ACC]  md:text-[1.5vw] leading-[1.4]">
              NZFSS National Championships have been hosted in the past by individual clubs. More recently, this major event has been organised by the NZFSS in an effort to bringing together teams from both North and South Island.
              </p>
            </div>
          </div>
        </div>

        {/* History component (client-rendered) */}
        <History />

        {/* See Us In Action section (client-rendered) */}
        <HistoryActionSection />
      </div>
    </div>
  );
}

export default HistoryPage;
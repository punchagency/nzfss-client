import IFSSJudge from "@/assets/gabri.png"
import IFSSLogo from "@/assets/IFSS/IFSSLogo.png"
import About1 from "@/assets/IFSS/About1.png"
import About2 from "@/assets/IFSS/About2.png"
import Oceania1 from "@/assets/IFSS/Oceania1.png"
import Oceania2 from "@/assets/IFSS/Oceania2.png"

import Image from "next/image";
import React from "react";
import { IFSSScrollAnimations, IFSSActionSection } from "../_components/clientWrapper";

function IFSSPage() {
  return (
    <div className="flex flex-col w-full h-full pb-[148px]">
      <div className="flex flex-col w-full bg-white h-full items-center">
        <div className="flex flex-col gap-y-[100px] px-[48px]">
          {/* Logo placeholder */}
          <div className="w-[120px] h-[120px] mx-auto mt-[48px]">
            <Image
              src={IFSSLogo}
              alt="IFSS Logo"
              width={120}
              height={120}
              className="rounded-full"
              priority
            />
          </div>

          <h1 className="text-[32px] sm:text-[42px] lg:text-[4.375vw] font-[700] text-center -mt-16 leading-[1.2]">
            International Federation<br />of Sled dog Sports - Oceania
          </h1>

          <p className="text-[16px] sm:text-[20px] lg:text-[1.25vw] text-[#1A1A1ACC] font-[500] text-center max-w-[335px] md:max-w-none mx-auto -mt-16">
            The IFSS governs global sled dog racing, while the NZFSS is a member, enabling local
            <br />
            participation in international events.
          </p>

          {/* Scroll-triggered animations (client-rendered) */}
          <IFSSScrollAnimations />

          {/* About IFSS Section (server-rendered) */}
          <div className="grid xl:grid-cols-2 w-full px-[48px] gap-x-[80px] gap-y-[40px]">
            <div className="w-full flex items-center">
              <div className="flex flex-col gap-y-[24px] text-start w-full ">
                <h3 className="text-[32px] sm:text-[42px] lg:text-[4.3750vw] font-[700] leading-[1.2] lg:leading-[5.25vw]  text-left">
                  About{" "}
                  <span className="inline relative">
                    {" "}
                    <span className="relative z-[9]">IFSS</span>{" "}
                  </span>
                </h3>

                <div className="flex flex-col gap-y-[24px]">
                  <p className="font-[500] sm:text-[20px] lg:text-[1.25vw] md:text-[1.5vw] leading-[1.4] text-[#1A1A1ACC]">
                    The IFSS was formed in 1985 by the International Sled Dog Racing Association 
                    (ISDRA) and the European Sled Dog Racing Association (ESDRA).
                  </p>
                  
                  <p className="font-[500] sm:text-[20px] lg:text-[1.25vw] md:text-[1.5vw] leading-[1.4] text-[#1A1A1ACC]">
                    The IFSS is the global governing/sanctioning body of sled dog sports. It 
                    represents 38 national sled dog sports federations and organizations that are 
                    overseen by the board and six continental directors.
                  </p>

                  <p className="font-[500] sm:text-[20px] lg:text-[1.25vw] md:text-[1.5vw] leading-[1.4] text-[#1A1A1ACC]">
                    A major role of the IFSS is contributing to sled dog sports on snow and dryland on 
                    an educational scientific or technical level. The IFSS accredits both World 
                    Championships and the World Cup series.
                  </p>

                  <div className="flex flex-col gap-y-[16px]">
                    <p className="font-[600] sm:text-[20px] lg:text-[1.25vw] md:text-[1.5vw] leading-[1.4]">Media presence:</p>
                    <div className="flex flex-col gap-y-[8px]">
                      <a href="https://sleddogsport.net/" className="text-[#0066CC] font-[500] sm:text-[20px] lg:text-[1.25vw] md:text-[1.5vw] leading-[1.4]">
                        https://sleddogsport.net/
                      </a>
                      <a href="https://www.facebook.com/sleddog.sports" className="text-[#0066CC] font-[500] sm:text-[20px] lg:text-[1.25vw] md:text-[1.5vw] leading-[1.4]">
                        https://www.facebook.com/sleddog.sports
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center w-full">
              <div className="flex gap-[2vw] w-full">
                <Image
                  src={About1}
                  alt="IFSS event"
                  className="w-[48%] h-auto object-cover rounded-[16px]"
                  priority
                />
                <Image
                  src={About2}
                  alt="IFSS event"
                  className="w-[48%] h-auto object-cover rounded-[16px]"
                  priority
                />
              </div>
            </div>
          </div>

          {/* IFSS Oceania Section (server-rendered) */}
          <div className="grid xl:grid-cols-2 w-full px-[48px] gap-x-[80px] gap-y-[40px]">
            <div className="flex items-center justify-center w-full order-2 xl:order-1">
              <div className="flex gap-[2vw] w-full">
                <Image
                  src={Oceania1}
                  alt="IFSS Oceania event"
                  className="w-[48%] h-auto object-cover rounded-[16px]"
                  priority
                />
                <Image
                  src={Oceania2}
                  alt="IFSS Oceania event"
                  className="w-[48%] h-auto object-cover rounded-[16px]"
                  priority
                />
              </div>
            </div>

            <div className="w-full flex items-center order-1 xl:order-2">
              <div className="flex flex-col gap-y-[24px] text-start w-full">
                <h3 className="text-[32px] sm:text-[42px] lg:text-[4.3750vw] font-[700] leading-[1.2] lg:leading-[5.25vw] text-left  ">
                  IFSS{" "}
                  <span className="inline relative">
                    {" "}
                    <span className="relative z-[9]">Oceania</span>{" "}
                  </span>
                </h3>

                <p className="font-[500] sm:text-[20px] lg:text-[1.25vw] md:text-[1.5vw] leading-[1.4] text-[#1A1A1ACC]">
                  The International Federation of Sled Dog Sports Oceania represents two IFSS 
                  member federations: ASSA (Australia) and NZFSS (New Zealand).
                  <br />
                  Both member federations participate in the World Cup programme that allows 
                  competitors from both countries to compete within Oceania and globally.
                </p>

                <p className="font-[500] sm:text-[20px] lg:text-[1.25vw] md:text-[1.5vw] leading-[1.4] text-[#1A1A1ACC]">
                  IFSS Oceania is represented by the Oceania Director at the IFSS council, 
                  a bi-annual position elected by both ASSA and NZFSS. IFSS Oceania also features 
                  an athletes commission to represent our athletes in international aspects.
                </p>

                <div className="flex flex-col gap-y-[16px]">
                  <p className="font-[600] sm:text-[20px] lg:text-[1.25vw] md:text-[1.5vw] leading-[1.4]">Contact detail:</p>
                  <a href="mailto:gabriele.altermann@sledogsport.net" className="text-[#0066CC] font-[500] sm:text-[20px] lg:text-[1.25vw] md:text-[1.5vw] leading-[1.4]">
                    gabriele.altermann@sledogsport.net
                  </a>
                </div>

                <div className="flex flex-col gap-y-[16px]">
                  <p className="font-[600] sm:text-[20px] lg:text-[1.25vw] md:text-[1.5vw] leading-[1.4]">Public Facebook Page:</p>
                  <a href="https://www.facebook.com/profile.php?id=61575918950051" className="text-[#0066CC] font-[500] sm:text-[20px] lg:text-[1.25vw] md:text-[1.5vw] leading-[1.4]">
                    Facebook Page
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* See Us In Action Section (client-rendered) */}
        <IFSSActionSection />

        {/* IFSS Race Judges Section (server-rendered) */}
        <div className="w-full flex flex-col items-center gap-y-6 sm:gap-y-8 md:gap-y-12 lg:gap-y-[48px] mt-12 sm:mt-16 md:mt-20 lg:mt-[96px] px-4 sm:px-6 md:px-8 lg:px-[48px]">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[4.375vw] font-bold text-center">IFSS Race Judge</h2>
          <div className="flex flex-col items-center gap-y-4 sm:gap-y-6 lg:gap-y-[24px] w-full max-w-[800px]">
            <div className="w-full max-w-[280px] sm:max-w-[400px] md:max-w-[500px] lg:max-w-[600px] rounded-lg md:rounded-2xl lg:rounded-[16px] overflow-hidden">
              <Image
                src={IFSSJudge}
                alt="IFSS Judge"
                className="w-full h-auto object-cover"
                priority
              />
            </div>
            <h3 className="text-lg sm:text-xl md:text-2xl lg:text-[25px] font-semibold text-center">
              Gabriele Altermann
            </h3>
          </div>
        </div>
      </div>
    </div>
  );
}

export default IFSSPage;

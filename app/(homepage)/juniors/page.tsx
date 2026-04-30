import {
  animMore,
  animMore2,
  image1,
  image5,
} from "@/assets";
import Image from "next/image";
import React from "react";
import { 
  JuniorDevelopment, 
  Peewee, 
  JuniorClass, 
  DocumentPage, 
  JuniorScrollAnimations 
} from "../_components/clientWrapper";

function JuniorsPage() {
  return (
    <div className="flex flex-col w-full h-full pb-[8vw] lg:pb-[7.7vw]">
      <div className="flex flex-col w-full bg-white h-full items-center">
        <div className="flex flex-col gap-y-[50px] lg:gap-y-[5.2vw] px-[24px] sm:px-[48px] lg:px-[2.5vw]">
          <h1 className="text-[32px] sm:text-[42px] lg:text-[4.375vw] font-[700] leading-[1.2] lg:leading-[5.25vw] text-center">
            Junior Mushers
          </h1>

          {/* Image container - mobile version (server-rendered) */}
          <div className="flex justify-center gap-x-4 xl:hidden w-full px-4">
            <div className="w-[185px] h-[228px]">
              <Image
                className="w-full h-[228px] object-cover rounded-[20px]"
                src={image1}
                alt="Junior musher with dog"
                width={185}
                height={228}
                priority
              />
            </div>
            <div className="w-[185px]">
              <Image
                className="w-full h-[228px] object-fill rounded-[20px]"
                src={image5}
                alt="Junior musher activity"
                width={185}
                height={228}
                priority
              />
            </div>
          </div>
          
          {/* Desktop scroll animations (client-rendered) */}
          <JuniorScrollAnimations />

          <div className="flex flex-col w-full gap-y-[44px] lg:gap-y-[2.29vw]">
            <div className="flex w-full items-center justify-center flex-col gap-y-[24px] lg:gap-y-[1.25vw]">
              <h4 className="text-[23px] sm:text-[42px] lg:text-[2.24vw] font-[700] mt-12 lg:mt-[2.5vw] text-center">
                Two Junior Classes are offered in <br /> New Zealand
              </h4>
            </div>

            <div className="w-full flex items-center justify-center">
              {/* Mobile view with cards (server-rendered) */}
              <div className="md:hidden grid grid-cols-1 gap-[24px] max-w-[592px] w-full">
                <div className="flex flex-col rounded-[20px] bg-white p-4 border border-[#E5E7EB]">
                  <Image
                    className="w-full h-[250px] object-cover rounded-[16px]"
                    src={animMore}
                    alt="PeeWee junior musher with dogs"
                    width={592}
                    height={250}
                    priority
                  />
                  <p className="text-[20px] font-[400] mt-4 text-center">
                    PeeWee - Accompanied by an adult
                  </p>
                </div>

                <div className="flex flex-col rounded-[20px] bg-white p-4 border border-[#E5E7EB]">
                  <Image
                    className="w-full h-[250px] object-cover rounded-[16px]"
                    src={animMore2}
                    alt="Junior musher up to 16 years"
                    width={592}
                    height={250}
                    priority
                  />
                  <p className="text-[20px] font-[500] mt-4 text-center">
                    Junior up to 16 years
                  </p>
                </div>
              </div>

              {/* Desktop view with hover animation (server-rendered) */}
              <div className="hidden md:grid grid-cols-2 gap-[24px] lg:gap-[1.25vw]">
                <div className="relative group border border-[#B5B5B5] h-[88px] lg:h-[4.58vw] w-[592px] lg:w-[30.83vw] p-[16px] lg:p-[0.83vw] flex rounded-[16px] items-center gap-x-[24px] lg:gap-x-[1.25vw]">
                  <Image
                    className="absolute object-cover w-[95px] lg:w-[4.95vw] h-[56px] lg:h-[2.92vw] group-hover:w-[560px] group-hover:h-[330px] lg:group-hover:w-[29.17vw] lg:group-hover:h-[17.19vw] transition-all duration-1000 transform group-hover:translate-y-[300px] lg:group-hover:translate-y-[15.63vw] rounded-[10px]"
                    src={animMore}
                    alt="anim image"
                  />
                  <p className="absolute text-[22px] lg:text-[1.15vw] font-[400] ml-6 lg:ml-[0.31vw] transition-all duration-500 transform translate-x-[100px] lg:translate-x-[5.21vw] group-hover:translate-x-[0]">
                    PeeWee - Accompanied by an adult
                  </p>
                </div>
                <div className="relative group border border-[#B5B5B5] h-[88px] lg:h-[4.58vw] w-[592px] lg:w-[30.83vw] p-[16px] lg:p-[0.83vw] flex rounded-[16px] items-center gap-x-[24px] lg:gap-x-[1.25vw]">
                  <Image
                    className="absolute object-cover w-[95px] lg:w-[4.95vw] h-[56px] lg:h-[2.92vw] group-hover:w-[560px] group-hover:h-[330px] lg:group-hover:w-[29.17vw] lg:group-hover:h-[17.19vw] transition-all duration-1000 transform group-hover:translate-y-[300px] lg:group-hover:translate-y-[15.63vw] rounded-[10px]"
                    src={animMore2}
                    alt="anim image"
                  />
                  <p className="absolute text-[22px] lg:text-[1.15vw] font-[400] ml-6 lg:ml-[0.31vw] transition-all duration-500 transform translate-x-[100px] lg:translate-x-[5.21vw] group-hover:translate-x-[0]">
                    Junior up to 16 years
                  </p>
                </div>
              </div>
            </div>

            <div className="w-full flex justify-center items-center px-4 lg:px-[0.83vw]">
              <div className="xl:w-[1208px] xl:w-[62.92vw] w-full h-[300px] lg:h-[15.63vw] border border-[#B5B5B5] rounded-[16px] p-8 sm:p-[32px] lg:p-[1.67vw] flex flex-col items-center justify-center gap-y-[32px] lg:gap-y-[1.67vw]">
                <p className="text-[18px] sm:text-[22px] lg:text-[1.15vw] font-[400] -mt-8 lg:-mt-[0.42vw] text-center w-full lg:w-[52.08vw] leading-[1.4]">
                  Individual clubs may offer different variations for Juniors and in some cases, experienced Juniors may compete in the Adult classes where they meet the requirements laid out by the race organisers and the Race Marshal.
                </p>

                <div className="flex flex-col justify-center items-center gap-y-[16px] lg:gap-y-[0.83vw]">
                  <button className="bg-[black] text-white rounded-[50px] w-[65px] lg:w-[3.39vw] h-[24px] lg:h-[1.25vw] text-[14px] lg:text-[0.73vw] font-[600] cursor-default">
                    Note
                  </button>

                  <p className="text-[18px] lg:text-[0.94vw] text-center font-[600] text-[#000000] max-w-[900px] lg:max-w-[46.88vw]">
                    If you are a Junior musher in NZ and would like to see your picture here, send your picture with a little information about yourself to the Youth Development Officer;{" "}
                    <a 
                      href="mailto:Youth.NZFSS.NZ@gmail.com"
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      Youth.NZFSS.NZ@gmail.com
                    </a>
                    .
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Client-side components with loading states */}
        <JuniorDevelopment />
        <Peewee />
        <JuniorClass />
        <DocumentPage />
      </div>
    </div>
  );
}

export default JuniorsPage;

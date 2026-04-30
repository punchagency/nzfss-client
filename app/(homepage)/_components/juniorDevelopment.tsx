import { goldCycle4 } from '@/assets'
import Image from 'next/image'
import React from 'react'

const JuniorDevelopment = () => {
  return (
    <div className="w-full px-4 sm:px-[24px] lg:px-[2.5vw] relative pt-[120px] lg:pt-[6.25vw]">
      <div className="xl:w-[1920] xl:w-[92vw] w-full mx-auto bg-[#F8F8F8] rounded-[16px] p-8 sm:p-[48px] lg:p-[2.5vw] flex flex-col items-center gap-y-[32px] lg:gap-y-[1.67vw] relative">
        <div className="flex flex-col items-center">
          <h3 className="text-[32px] sm:text-[42px] lg:text-[4.375vw] font-[700] text-center">
          Programme
          </h3>
        </div>

        <p className="text-[18px] sm:text-[22px] lg:text-[1.15vw] font-[500] text-center max-w-[1500px] lg:max-w-[78.13vw] leading-[1.4]">
          The NZFSS offer a Junior Develop Programme for Drivers aged 11-16, developing skills and attitudes of emerging Drivers in all aspects of the Sport. Dedicated, experienced teams offer Mentoring placements and One-on-One individual lessons.
          <br className="hidden sm:block" />
          An NZFSS Internal Competition celebrates the Outstanding New Zealand Junior Musher of the Year.
        </p>

        <Image
          className="absolute bottom-[-30px] lg:bottom-[-1.56vw] right-[-30px] lg:right-[-1.56vw] w-[180px] sm:w-[240px] lg:w-[12.5vw]"
          src={goldCycle4}
          alt="decorative accent"
        />
      </div>
    </div>
  )
}

export default JuniorDevelopment

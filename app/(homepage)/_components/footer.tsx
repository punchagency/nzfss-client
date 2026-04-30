import React from 'react'
import Link from 'next/link'

const Footer = () => {
  return (
    <div className='px-[20px] sm:px-[48px] flex flex-col sm:flex-row w-full items-center justify-between h-auto sm:h-[56px] py-4 sm:py-0 gap-2 sm:gap-0 text-[12px] sm:text-[14px] text-[#4F4F4F] font-[600]'>
        <p className='text-[12px] sm:text-[0.729vw] text-center sm:text-left whitespace-normal sm:whitespace-nowrap text-[#000000B2] font-[600] leading-[14px] sm:leading-[0.875vw]'>© 2025, New Zealand Federation of Sled Dog Sports</p>
        <Link href="/login" className='text-[12px] sm:text-[0.729vw] text-[#000000B2] font-[600] hover:opacity-80 transition-opacity'>
            Login
        </Link>
    </div>
  )
}

export default Footer
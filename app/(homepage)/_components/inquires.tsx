import React, { useState } from 'react'
import gif from "@/assets/ee.gif"
/**
 * Component for handling inquiries and displaying contact options.
 *
 * @returns {JSX.Element} Rendered component.
 */
const Inquires = () => {
  const [hovered, setHovered] = useState<null | 'president' | 'secretary'>(null)
  /**
   * Handles the email action based on the email type.
   *
   * @param {"president" | "secretary"} type - The email recipient type.
   */
  const handleEmail = (type: 'president' | 'secretary'): void => {
    const email: string = type === 'president' ? 'President.NZFSS.NZ@gmail.com' : 'Secretary.NZFSS.NZ@gmail.com';
    const subject: string = type === 'president' ? 'Query for NZFSS President' : 'Query for NZFSS Secretary';
    
    // Create a simple mailto link
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}`;
  };

  return (
    <div className='px-4 sm:px-6 md:px-[2.5vw] bg-white'>
      <div className='py-10 sm:py-12 md:py-0 min-h-[300px] md:h-[30.5vw] w-full rounded-md md:rounded-[0.83vw] bg-[#000000] flex flex-col gap-y-6 sm:gap-y-8 md:gap-y-[2.5vw] items-center justify-center text-white relative'>
        <div className='flex flex-col gap-y-3 sm:gap-y-4 md:gap-y-[1.67vw] text-center px-4 md:px-0'>
          <h2 className="text-3xl sm:text-4xl md:text-[4.37vw] font-[800] leading-tight md:leading-[5.25vw] -mt-6 md:-mt-[5.2vw]">
            Got any queries?
          </h2>

          <p className="text-sm sm:text-base md:text-[1.15vw] font-[500] leading-relaxed md:leading-[1.6vw] max-w-md mx-auto">
            Still have questions? Feel free to reach out NZFSS
          </p>
        </div>
        
        <div className='flex flex-col sm:flex-row gap-4 sm:gap-x-4 md:gap-x-[0.83vw] items-center justify-center w-full px-4 md:px-0'>
          <button 
            onClick={() => handleEmail('president')}
            onMouseEnter={() => setHovered('president')}
            onMouseLeave={() => setHovered(null)}
            className='w-full sm:w-auto sm:min-w-[180px] md:w-[11.87vw] h-12 sm:h-10 md:h-[2.6vw] bg-white rounded-md md:rounded-[0.52vw] flex items-center justify-center text-black hover:bg-gray-200 transition-colors'
          >
            <div className='flex items-center justify-center'>
              {hovered === 'president' ? (
                <img src={gif.src} alt="gif" className="w-8 h-8 md:w-[2vw] md:h-[2vw] mr-2 md:mr-[0.78vw] transition-opacity duration-200" />
              ) : (
                <div className='w-1.5 h-1.5 md:w-[0.42vw] md:h-[0.42vw] rounded-full bg-[#000000] mr-2 md:mr-[0.78vw]'></div>
              )}
              <span className='text-sm sm:text-base md:text-[0.94vw] font-[500]'>President NZFSS</span>
            </div>
          </button>

          <button 
            onClick={() => handleEmail('secretary')}
            onMouseEnter={() => setHovered('secretary')}
            onMouseLeave={() => setHovered(null)}
            className='w-full sm:w-auto sm:min-w-[180px] md:w-[11.87vw] h-12 sm:h-10 md:h-[2.6vw] bg-white rounded-md md:rounded-[0.52vw] flex items-center justify-center text-black hover:bg-gray-200 transition-colors'
          >
            <div className='flex items-center justify-center'>
              {hovered === 'secretary' ? (
                <img src={gif.src} alt="gif" className="w-8 h-8 md:w-[2vw] md:h-[2vw] mr-2 md:mr-[0.78vw] transition-opacity duration-200" />
              ) : (
                <div className='w-1.5 h-1.5 md:w-[0.42vw] md:h-[0.42vw] rounded-full bg-[#000000] mr-2 md:mr-[0.78vw]'></div>
              )}
              <span className='text-sm sm:text-base md:text-[0.94vw] font-[500]'>Secretary NZFSS</span>
            </div>
          </button>
        </div>

        <div className='w-full px-4 md:px-[0.83vw] bottom-4 md:bottom-[0.83vw] absolute'>
          <div className='w-full flex flex-col gap-y-2 md:gap-y-[0.42vw]'>
       
            <div className='bg-[#FFFFFF0D] border border-[#FFFFFF1A] rounded-md md:rounded-[0.62vw] py-2 md:py-[0.62vw] px-3 md:px-[0.83vw]'>
              {/* Mobile view - limited credits */}
              <div className='md:hidden flex items-center justify-center gap-x-2 text-xs py-1'>
                <span>Suvi Mattila</span>
                <span>•</span>
                <span>Mac's Photography</span>
                <span>•</span>
                <span>Mel Renner P.</span>
              </div>

              {/* Desktop view */}
              <div className='hidden md:flex items-center gap-x-[0.42vw] text-[0.73vw] font-[400]'>
                <p className="text-xs sm:text-sm md:text-[0.83vw] flex justify-center font-[500] mr-32">Photo/Video Credit :</p>
                <p>Suvi Mattila</p>
                <div className='w-[0.21vw] h-[0.21vw] bg-white rounded-full' />
                <p>Mac&apos;s Photography</p>
                <div className='w-[0.21vw] h-[0.21vw] bg-white rounded-full' />
                <p>Mel Renner Photography</p>
                <div className='w-[0.21vw] h-[0.21vw] bg-white rounded-full' />
                <p>Brya Ingram Photography</p>
                <div className='w-[0.21vw] h-[0.21vw] bg-white rounded-full' />
                <p>RRSDRC</p>
                <div className='w-[0.21vw] h-[0.21vw] bg-white rounded-full' />
                <p>NAMC</p>
                <div className='w-[0.21vw] h-[0.21vw] bg-white rounded-full' />
                <p>SRSDC</p>
                <div className='w-[0.21vw] h-[0.21vw] bg-white rounded-full' />
                <p>Garth Haylock</p>
                <div className='w-[0.21vw] h-[0.21vw] bg-white rounded-full' />
                <p>Nalbec Racing Siberian Huskies Kennel</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Inquires
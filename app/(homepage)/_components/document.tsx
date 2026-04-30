import { arrowDown1 } from '@/assets'
import Image from 'next/image'
import React from 'react'

const DocumentPage = () => {
  return (
    <div className="w-full px-4 sm:px-[48px] lg:px-[2.5vw] relative pt-[60px] sm:pt-[120px] lg:pt-[6.25vw]">
      <div className="w-full h-full rounded-[16px] flex flex-col items-center gap-y-[24px] sm:gap-y-[48px] lg:gap-y-[2.5vw] relative z-[9]">
        <h3 className="text-[32px] sm:text-[42px] lg:text-[4.375vw] font-[700] leading-[1.2] sm:leading-[5.25vw] text-center">
          Documents
        </h3>

        <div className="w-full flex justify-center items-center">
          <div className="w-full justify-center items-center flex flex-col gap-y-[16px] sm:gap-y-[36px] lg:gap-y-[1.875vw]">
            {/* Document buttons container */}
            <div className="flex flex-col gap-y-[16px] sm:gap-y-0 sm:flex-row sm:gap-x-[36px] lg:gap-x-[1.875vw]">
              <a href="/documents/JuniorDevelopmentProgram.doc" target="_blank" rel="noopener noreferrer">
                <div className="cursor-pointer hover:bg-[#000000] hover:text-white border border-[#00000033] w-full sm:w-[353px] lg:w-[18.39vw] h-[66px] lg:h-[3.44vw] rounded-[16px] flex items-center justify-center gap-x-[24px] lg:gap-x-[1.25vw]">
                  <p className="text-[16px]  sm:text-[18px] lg:text-[0.94vw] font-[600] px-4 leading-[25.2px] truncate max-w-[200px] lg:max-w-[10.42vw]" title="Junior Development Programme">Junior Development Programme</p>
                  <Image className="w-[24px] h-[24px] lg:w-[1.25vw] lg:h-[1.25vw] object-cover flex-shrink-0" src={arrowDown1} alt="arrow down icon" />
                </div>
              </a>

              <a href="/documents/NZFSSJuniorDevelopment.doc" target="_blank" rel="noopener noreferrer">
                <div className="cursor-pointer hover:bg-[#000000] hover:text-white border border-[#00000033] w-full sm:w-[477px] lg:w-[24.84vw] h-[66px] lg:h-[3.44vw] rounded-[16px] flex items-center justify-center gap-x-[24px] lg:gap-x-[1.25vw]">
                  <p className="text-[16px] sm:text-[18px] lg:text-[0.94vw] font-[600] px-4 leading-[25.2px] truncate max-w-[200px] lg:max-w-[10.42vw]" title="NZFSS Junior Development Programme Criteria">NZFSS Junior Development Programme Criteria</p>
                  <Image className="w-[24px] h-[24px] lg:w-[1.25vw] lg:h-[1.25vw] object-cover flex-shrink-0" src={arrowDown1} alt="arrow down icon" />
                </div>
              </a>

              <a href="/documents/MentorAgreements.doc" target="_blank" rel="noopener noreferrer">
                <div className="cursor-pointer hover:bg-[#000000] hover:text-white border border-[#00000033] w-full sm:w-[270px] lg:w-[14.06vw] h-[66px] lg:h-[3.44vw] rounded-[16px] flex items-center justify-center gap-x-[24px] lg:gap-x-[1.25vw]">
                  <p className="text-[16px] sm:text-[18px] lg:text-[0.94vw] font-[600] px-4 leading-[25.2px] truncate max-w-[200px] lg:max-w-[10.42vw]" title="Mentor Agreement">Mentor Agreement</p>
                  <Image className="w-[24px] h-[24px] lg:w-[1.25vw] lg:h-[1.25vw] object-cover flex-shrink-0" src={arrowDown1} alt="arrow down icon" />
                </div>
              </a>
            </div>

            {/* Second row of document buttons */}
            <div className="flex flex-col gap-y-[16px] sm:gap-y-0 sm:flex-row sm:gap-x-[36px] lg:gap-x-[1.875vw]">
              <a href="/documents/NZFSSJrMusherRecord.docx" target="_blank" rel="noopener noreferrer">
                <div className="cursor-pointer hover:bg-[#000000] hover:text-white border border-[#00000033] w-full sm:w-[488px] lg:w-[25.42vw] h-[66px] lg:h-[3.44vw] rounded-[16px] flex items-center justify-center gap-x-[24px] lg:gap-x-[1.25vw]">
                  <p className="text-[16px] sm:text-[18px] lg:text-[0.94vw] font-[600] px-4 leading-[25.2px] truncate max-w-[200px] lg:max-w-[10.42vw]" title="NZFSS Junior Driver Record (Word Document)">NZFSS Junior Driver Record (Word Document)</p>
                  <Image className="w-[24px] h-[24px] lg:w-[1.25vw] lg:h-[1.25vw] object-cover flex-shrink-0" src={arrowDown1} alt="arrow down icon" />
                </div>
              </a>

              <a href="/documents/NZFSSJrMusherRecord.pdf" target="_blank" rel="noopener noreferrer">
                <div className="cursor-pointer hover:bg-[#000000] hover:text-white border border-[#00000033] w-full sm:w-[384px] lg:w-[20vw] h-[66px] lg:h-[3.44vw] rounded-[16px] flex items-center justify-center gap-x-[24px] lg:gap-x-[1.25vw]">
                  <p className="text-[16px] sm:text-[18px] lg:text-[0.94vw] font-[600] px-4 leading-[25.2px] truncate max-w-[200px] lg:max-w-[10.42vw]" title="NZFSS Junior Driver Record (PDF)">NZFSS Junior Driver Record (PDF)</p>
                  <Image className="w-[24px] h-[24px] lg:w-[1.25vw] lg:h-[1.25vw] object-cover flex-shrink-0" src={arrowDown1} alt="arrow down icon" />
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DocumentPage
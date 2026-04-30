"use client";

import peewee1 from "@/assets/peewee/peewee1.png";
import peewee2 from "@/assets/peewee/peewee2.jpeg";
import peewee3 from "@/assets/peewee/peewee3.jpeg";
import peewee4 from "@/assets/peewee/peewee4.jpeg";
import peewee5 from "@/assets/peewee/peewee5.jpeg";
import peewee6 from "@/assets/peewee/peewee6.jpeg";
import peewee7 from "@/assets/peewee/peewee7.jpeg";
import peewee8 from "@/assets/peewee/peewee8.jpeg";
import peewee9 from "@/assets/peewee/peewee9.jpeg";
import leftArrow from "@/assets/leftArrow.svg";
import rightArrow from "@/assets/rightArrow.svg";
import Image from "next/image";
import React, { useState, useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { Keyboard, Navigation } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import { StaticImageData } from "next/image";

/**
 * Defines the structure for the peewee sub-images.
 */
interface PeeweeSub {
  image1: StaticImageData;
  image2: StaticImageData;
  image3: StaticImageData;
  image4: StaticImageData;
  image5: StaticImageData;
  image6: StaticImageData;
  image7: StaticImageData;
  image8: StaticImageData;
  image9: StaticImageData;
}

/**
 * Defines the structure for the main peewee item.
 */
interface Peewee {
  id: number;
  image: StaticImageData;
  peeweeSub: PeeweeSub;
}

/**
 * Peewee component that renders a grid of peewee images and displays a modal
 * with a Swiper slider for sub-images when clicked.
 *
 * @returns {JSX.Element} The Peewee component.
 */
const Peewee = (): JSX.Element => {
  // Reference to the swiper instance for controlling slides programmatically.
  const swiperRef = useRef<SwiperType | null>(null);
  // State to manage the modal visibility.
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  // State to store the currently selected peewee.
  const [selectedPeewee, setSelectedPeewee] = useState<Peewee | null>(null);
  // State to track which slide is active in the modal's swiper.
  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);
  // State to toggle between showing more or fewer peewee items.
  const [showMore, setShowMore] = useState<boolean>(false);

  // Array of peewee objects along with their associated sub-images.
  const peewees: Peewee[] = [
    {
      id: 1,
      image: peewee1,
      peeweeSub: {
        image1: peewee1,
        image2: peewee2,
        image3: peewee3,
        image4: peewee4,
        image5: peewee5,
        image6: peewee6,
        image7: peewee7,
        image8: peewee8,
        image9: peewee9,
      },
    },
    {
      id: 2,
      image: peewee2,
      peeweeSub: {
        image1: peewee2,
        image2: peewee3,
        image3: peewee4,
        image4: peewee5,
        image5: peewee6,
        image6: peewee7,
        image7: peewee8,
        image8: peewee9,
        image9: peewee1,
      },
    },
    {
      id: 3,
      image: peewee3,
      peeweeSub: {
        image1: peewee3,
        image2: peewee4,
        image3: peewee5,
        image4: peewee6,
        image5: peewee7,
        image6: peewee8,
        image7: peewee9,
        image8: peewee1,
        image9: peewee2,
      },
    },
    {
      id: 4,
      image: peewee4,
      peeweeSub: {
        image1: peewee4,
        image2: peewee5,
        image3: peewee6,
        image4: peewee7,
        image5: peewee8,
        image6: peewee9,
        image7: peewee1,
        image8: peewee2,
        image9: peewee3,
      },
    },
    {
      id: 5,
      image: peewee5,
      peeweeSub: {
        image1: peewee5,
        image2: peewee6,
        image3: peewee7,
        image4: peewee8,
        image5: peewee9,
        image6: peewee1,
        image7: peewee2,
        image8: peewee3,
        image9: peewee4,
      },
    },
    {
      id: 6,
      image: peewee6,
      peeweeSub: {
        image1: peewee6,
        image2: peewee7,
        image3: peewee8,
        image4: peewee9,
        image5: peewee1,
        image6: peewee2,
        image7: peewee3,
        image8: peewee4,
        image9: peewee5,
      },
    },
    {
      id: 7,
      image: peewee7,
      peeweeSub: {
        image1: peewee7,
        image2: peewee8,
        image3: peewee9,
        image4: peewee1,
        image5: peewee2,
        image6: peewee3,
        image7: peewee4,
        image8: peewee5,
        image9: peewee6,
      },
    },
    {
      id: 8,
      image: peewee8,
      peeweeSub: {
        image1: peewee8,
        image2: peewee9,
        image3: peewee1,
        image4: peewee2,
        image5: peewee3,
        image6: peewee4,
        image7: peewee5,
        image8: peewee6,
        image9: peewee7,
      },
    },
    {
      id: 9,
      image: peewee9,
      peeweeSub: {
        image1: peewee9,
        image2: peewee1,
        image3: peewee2,
        image4: peewee3,
        image5: peewee4,
        image6: peewee5,
        image7: peewee6,
        image8: peewee7,
        image9: peewee8,
      },
    },
  ];

  /**
   * Handles clicking on a peewee image; opens the modal and sets the selected peewee.
   *
   * @param {Peewee} peewee - The clicked peewee object.
   */
  const handleImageClick = (peewee: Peewee): void => {
    setSelectedPeewee(peewee);
    setActiveSlideIndex(0); // Reset to the first image of the peewee sub-images.
    setIsModalOpen(true);
  };

  /**
   * Closes the modal and resets the selected peewee.
   */
  const closeModal = (): void => {
    setIsModalOpen(false);
    setSelectedPeewee(null);
  };

  /**
   * Navigates to the previous slide in the swiper.
   */
  const handlePrev = (): void => {
    if (swiperRef.current !== null) {
      swiperRef.current.slidePrev();
    }
  };

  /**
   * Navigates to the next slide in the swiper.
   */
  const handleNext = (): void => {
    if (swiperRef.current !== null) {
      swiperRef.current.slideNext();
    }
  };

  /**
   * Navigates to a specific slide when a thumbnail is clicked.
   *
   * @param {number} index - The index of the slide to navigate to.
   */
  const handleThumbnailClick = (index: number): void => {
    setActiveSlideIndex(index);
    if (swiperRef.current !== null) {
      swiperRef.current.slideTo(index);
    }
  };

  /**
   * Loads more peewee items.
   */
  const handleLoadMore = (): void => {
    setShowMore(true);
  };

  // Calculate which peewee items to display:
  // show 8 initially, and all items when showMore is true.
  const displayedPeewees: Peewee[] = showMore ? peewees : peewees.slice(0, 8);

  return (
    <div className="w-full px-[48px] lg:px-[2.5vw] relative pt-[120px] lg:pt-[6.25vw]">
      <div className="w-full h-full rounded-[16px] flex flex-col items-center gap-y-[48px] lg:gap-y-[2.5vw] relative z-[9]">
        <h3 className="text-[32px] sm:text-[42px] lg:text-[4.375vw] font-[700] leading-[1.2] lg:leading-[5.25vw] text-center">
          PeeWee Classes
        </h3>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-[24px] lg:gap-[1.25vw]">
          {displayedPeewees.map((peewee: Peewee, i: number) => (
            <div className="h-[283px] lg:h-[14.74vw] rounded-[16px] overflow-hidden" key={i}>
              <Image
                className="hover:scale-110 transform transition-all duration-300 object-cover w-full h-full cursor-pointer"
                src={peewee.image}
                alt={`Peewee image ${i}`}
                onClick={() => handleImageClick(peewee)}
              />
            </div>
          ))}
        </div>

        <div>
          {!showMore ? (
            <button
              onClick={handleLoadMore}
              className="border border-[#21212133] rounded-[16px] w-[173px] lg:w-[9vw] h-[56px] lg:h-[2.92vw] hover:bg-[#000000] hover:text-white font-[500] text-[16px] lg:text-[0.83vw] text-[#212121]"
            >
              Load More
            </button>
          ) : (
            <button
              onClick={() => setShowMore(false)}
              className="border border-[#21212133] rounded-[16px] w-[173px] lg:w-[9vw] h-[56px] lg:h-[2.92vw] font-[500] text-[16px] lg:text-[0.83vw] text-[#212121]"
            >
              Load Less
            </button>
          )}
        </div>
      </div>

      {/* Modal with Swiper */}
      {isModalOpen && selectedPeewee !== null && (
        <div 
          className="fixed inset-0 flex justify-center items-center bg-black/90 z-[999] p-[48px] lg:p-[2.5vw]"
          onClick={(e) => {
            // Only close if clicking the outer container (not its children)
            if (e.target === e.currentTarget) {
              closeModal();
            }
          }}
        >
          <div className="flex flex-col gap-y-[24px] lg:gap-y-[1.25vw] w-[90%] md:w-[80%] lg:w-[64.58vw] relative">
            {/* Close Button */}
            <button
              onClick={closeModal}
              className="absolute left-1/2 transform -translate-x-1/2 top-[-48px] lg:top-[-2.5vw] text-[30px] lg:text-[1.56vw] text-white hover:text-gray-300 transition-colors"
            >
              ×
            </button>

            {/* Swiper to display peeweeSub images */}
            <Swiper
              onSwiper={(swiper: SwiperType): void => {
                swiperRef.current = swiper;
              }}
              slidesPerView={1}
              centeredSlides={false}
              slidesPerGroup={1}
              grabCursor={true}
              keyboard={{ enabled: true }}
              navigation={false}
              pagination={false}
              modules={[Keyboard, Navigation]}
              className="mySwiper w-full h-full"
              onSlideChange={(swiper): void =>
                setActiveSlideIndex(swiper.activeIndex)
              }
              speed={500}
              effect="fade"
            >
              {Object.values(selectedPeewee.peeweeSub).map(
                (image: StaticImageData, index: number) => (
                  <SwiperSlide key={index}>
                    {({ isActive }: { isActive: boolean }): JSX.Element => (
                      <div
                        className={`w-full flex justify-center transition-all duration-500 ${
                          !isActive ? "opacity-60 blur-[2px]" : ""
                        }`}
                      >
                        <Image
                          className="max-w-full max-h-[70vh] lg:max-h-[70vh] w-auto h-auto object-contain"
                          src={image}
                          alt={`Peewee Sub Image ${index}`}
                        />
                      </div>
                    )}
                  </SwiperSlide>
                )
              )}
            </Swiper>

            {/* Navigation Arrows */}
            <button
              className="absolute left-[10px] md:left-[-60px] lg:left-[-3.13vw] top-1/2 transform -translate-y-1/2 cursor-pointer p-4 lg:p-[0.83vw] text-white hover:text-gray-300 transition-colors"
              onClick={handlePrev}
            >
              <Image width={48} height={48} className="lg:w-[2.5vw] lg:h-[2.5vw]" src={leftArrow} alt="Previous" />
            </button>

            <button
              className="absolute right-[10px] md:right-[-60px] lg:right-[-3.13vw] top-1/2 transform -translate-y-1/2 cursor-pointer p-4 lg:p-[0.83vw] text-white hover:text-gray-300 transition-colors"
              onClick={handleNext}
            >
              <Image width={48} height={48} className="lg:w-[2.5vw] lg:h-[2.5vw]" src={rightArrow} alt="Next" />
            </button>

            {/* Thumbnails for Pagination */}
            <div className="flex justify-center items-center gap-[12px] lg:gap-[0.63vw] mt-6 lg:mt-[1.25vw] overflow-x-auto px-[20px] md:px-[60px] lg:px-[3.13vw]">
              {Object.values(selectedPeewee.peeweeSub)
                .slice(Math.max(0, Math.min(activeSlideIndex - 2, 4)), Math.max(5, Math.min(activeSlideIndex + 3, 9)))
                .map((image: StaticImageData, index: number) => {
                  const actualIndex = Math.max(0, Math.min(activeSlideIndex - 2, 4)) + index;
                  return (
                    <div
                      key={actualIndex}
                      className={`cursor-pointer w-[180px] lg:w-[9.38vw] h-[120px] lg:h-[6.25vw] rounded-md overflow-hidden flex-shrink-0 transition-all duration-300 ${
                        activeSlideIndex === actualIndex
                          ? "border-2 border-white"
                          : "opacity-60 blur-[1px] hover:opacity-80 hover:blur-0"
                      }`}
                      onClick={() => handleThumbnailClick(actualIndex)}
                    >
                      <Image
                        className="object-cover w-full h-full"
                        src={image}
                        alt={`Thumbnail ${actualIndex}`}
                      />
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Peewee;

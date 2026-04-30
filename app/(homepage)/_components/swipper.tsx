"use client";

import {
  leftArrow,
  rightArrow,
  slide0,
  slide1,
  slide10,
  slide11,
  slide12,
  slide2,
  slide3,
  slide4,
  slide5,
  slide6,
  slide7,
  slide8,
  slide9,
} from "@/assets";
import Image from "next/image";
import React, { useRef, useState } from "react";
// Import Swiper React components and required modules
import { Swiper, SwiperSlide } from "swiper/react";

import "swiper/css";
import "swiper/css/scrollbar";
import "swiper/css/navigation";
import "swiper/css/pagination";
import twoDogRig from "@/assets/2DR-2.jpg";

import { Keyboard, Scrollbar, Navigation, Pagination } from "swiper/modules";

// Import proper type for a Swiper instance for strict typing
import type { Swiper as SwiperType } from "swiper";
import type { StaticImageData } from "next/image";
import { from } from "@apollo/client";

interface Slide {
  imageUrl: string | StaticImageData;
  title: string;
  description: string;
}

export default function SwiperSlideGroup(): JSX.Element {
  // Strictly typed reference to the Swiper instance.
  const swiperRef = useRef<{ swiper: SwiperType } | null>(null);
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [activeRoute, setActiveRoute] = useState<number>(0);

  /**
   * Update the active slide index and its corresponding grouped route.
   *
   * @param {number} index - New active slide index.
   */
  const updateActiveRoute = (index: number): void => {
    const route: number = Math.floor(index / 3);
    setCurrentSlide(index);
    setActiveRoute(route);
    console.log("Current Index:", index, "Active Route:", route); // Debug log
  };

  /**
   * Navigate to the previous set of slides.
   */
  const handlePrev = (): void => {
    if (swiperRef.current !== null && swiperRef.current.swiper) {

      // Calculate the previous group's starting slide index
      const prevGroup = Math.max(0, activeRoute - 1);
      const slideIndex = prevGroup * 3;
      swiperRef.current.swiper.slideTo(slideIndex);
      updateActiveRoute(slideIndex);

    }
  };

  /**
   * Navigate to the next set of slides.
   */
  const handleNext = (): void => {
    if (swiperRef.current !== null && swiperRef.current.swiper) {

      // Calculate the next group's starting slide index
      const nextGroup = Math.min(totalGroups - 1, activeRoute + 1);
      const slideIndex = nextGroup * 3;
      swiperRef.current.swiper.slideTo(slideIndex);
      updateActiveRoute(slideIndex);

    }
  };

  /**
   * Handle the slide change event.
   *
   * @param {SwiperType} swiper - The active Swiper instance.
   */
  const onSlideChange = (swiper: SwiperType): void => {
    updateActiveRoute(swiper.activeIndex);
  };

  /**
   * Navigate directly to a specific slide group via dot navigation.
   *
   * @param {number} index - Dot index corresponding to a group of 3 slides.
   */
  const handleDotClick = (index: number): void => {
    if (swiperRef.current !== null && swiperRef.current.swiper) {
      const slideIndex: number = index * 3;
      swiperRef.current.swiper.slideTo(slideIndex);
      updateActiveRoute(slideIndex);
    }
  };

  // Define slides with image URL, title, and description.
  const slides: Slide[] = [
    {
      imageUrl: slide0,
      title: "Canicross",
      description:
        "In Canicross, the runner is connected via a running belt and a bungee line to the dog running in harness. This is a great way to get started and be active with your dog even in urban environments. Globally, Canicross is one of the most popular classes and in New Zealand, we are seeing an increasingly enthusiastic uptake.",
    },
    {
      imageUrl: slide1,
      title: "Bikejoring",
      description:

        "Bikejoring is a very fast and exciting class, where the dog is connected to a mountain bike, usually via an antenna to hold up the line, and the driver supports the racing dogs. Bikejoring is an ideal sport for beginner and advanced mountain bikers alike, transforming the experience of riding Grade 1 to grade 3 trails.",

    },
    {
      imageUrl: slide2,
      title: "Single Dog Sooter",
      description:
        "The Single Dog Scooter class is the highly competitive and most accessible entry class into multi-dog disciplines. The dog in harness is connected via a gangline to a Scooter. Scooters come in many forms and sizes, from kids scooter, to recreational, to competition-grade styles with larger wheels. The driver is supporting the dog at all times by pushing the scooter with their legs.",
    },
    {
      imageUrl: slide3,
      title: "Two Dog Scooter",
      description:
        "The Two Dog Scooter class is the smallest multi-dog discipline. In setup similar to the Single Dog Class, here two dogs are connected to the Scooter and pulling. The Driver supports the dogs mostly on inclines.",
    },
    {
      imageUrl: twoDogRig,
      title: "Two Dog Rig",
      description:
        "The Two Dog Rig class is a transitionary class from smaller to larger teams. Similar to the Two Dog Scooter class, two dogs are connected via a gangline to a three wheeled rig. Trails vary between scooter and rig distances, giving teams an opportunity to begin their journey towards larger, more complex dog team configurations and training for longer sprint distances.",
    },
    {
      imageUrl: slide4,
      title: "Three Dog Rig",
      description:
        "The Three Dog Rig Class features a three-wheeled rig connected to 3 dogs. In this multi-dog setup, a central gangline (towline) connects each dog via a tugline and a neckline.",
    },
    {
      imageUrl: slide5,
      title: "Four Dog Rig",
      description:
        "The Four Dog Rig Class is perhaps the fastest and most competitive rig class. With four dogs, an optimal balance is achieved between pulling power, a balanced team, and team complexity. Three wheeled rigs provide the best experience.",
    },
    {
      imageUrl: slide11,
      title: "Six Dog and Open Class",
      description:
        "Larger team sizes increase the challenge of maintaining balance and avoiding entanglements. As the dog team's power grows, the driver's role shifts from physical support to managing and directing the team. Though three-wheeled rigs are still used, four-wheeled carts provide better safety and stopping power.",
    },
    {
      imageUrl: slide7,
      title: "Freight",
      description:
        "A class exclusive to New Zealand is the Freight Class. Originally developed for the strong Malamutes, any dog breed can participate. In Freight Classes, additional weight is added to both Scooters and Rigs, to increase the towing load. While generally slower in speed, the class offers a unique experience for hard-pulling dogs.",
    },
    {
      imageUrl: slide12,
      title: "Weight pull",
      description:
        "Weight pull tests the dog's ability to pull increasingly heavy loads sustained over a short distance. This is a very technical discipline, where body size alone does not count alone towards a win. With the right training, dogs can pull loads in excess of 1,000 kg.",
    },
    {
      imageUrl: slide9,
      title: "Snow",
      description:
        "Snow races in New Zealand are currently limited to ski fields near Wanaka and Queenstown due to the terrain. Races use sleds or skies, from traditional wooden designs to modern ones with carbon fiber and steering systems. These events include dog classes from one to open, offering a classic sled dog experience.",
    },
    {
      imageUrl: slide10,
      title: "Junior",
      description:

        "Age is no barrier to Dog Powered Sports. Junior and Pee-Wee classes allow kids of almost any age to participate and enjoy the uniquebond with their dogs. Younger ages are accompanied by adults and trails are generally short in distance.",

    },
  ];

  // Calculate the total number of dot groups (each group represents 3 slides).
  const totalGroups: number = Math.ceil(slides.length / 3);

  return (
    <div className="pt-[3vw] w-full max-w-[95vw] sm:max-w-[90vw] mx-auto">
      <Swiper
        ref={swiperRef}
        slidesPerView={3}
        centeredSlides={false}
        slidesPerGroup={3}
        grabCursor={true}
        keyboard={{ enabled: true }}
        effect="slide"
        speed={800}
        spaceBetween={24}
        breakpoints={{
          // For mobile phones (< 640px)
          0: {
            slidesPerView: 1,
            slidesPerGroup: 1,
            spaceBetween: 12,
          },
          // For tablets (640px - 1024px)
          640: {
            slidesPerView: 2,
            slidesPerGroup: 2,
            spaceBetween: 20,
          },
          // For desktop (> 1024px)
          1024: {
            slidesPerView: 3,
            slidesPerGroup: 3,
            spaceBetween: 24,
          },
        }}
        scrollbar={false}
        navigation={false}
        pagination={false}
        modules={[Keyboard, Scrollbar, Navigation, Pagination]}
        className="mySwiper w-full h-full"
        onSlideChange={onSlideChange}
        watchSlidesProgress={true}
        observer={true}
        observeParents={true}
        allowTouchMove={true}
        threshold={5}
      >
        {slides.map((slide, i) => (
          <SwiperSlide key={i}>
            <div className="flex flex-col h-auto min-h-[500px] w-full sm:min-h-[600px] lg:h-[37vw]">
              <div className="relative aspect-[16/9] w-full overflow-hidden rounded-t-[12px] lg:rounded-t-[1.5vw]">
                <Image 
                  fill 
                  className="object-cover object-center w-full h-full"
                  src={slide.imageUrl} 
                  alt={slide.title}
                  sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 30vw"
                  priority={i < 3}
                  style={{ width: '100%', height: '100%' }}
                />
              </div>
              <div className="flex flex-col gap-y-3 sm:gap-y-4 lg:gap-y-[1.2vw] p-4 sm:p-5 lg:p-[1.5vw] bg-white rounded-b-[12px] lg:rounded-b-[1.5vw] flex-grow">
                <h3 className="text-[20px] sm:text-[24px] lg:text-[2vw] font-[700] leading-[1.2] lg:leading-[1.2] text-black">
                  {slide.title}
                </h3>
                <p className="text-[14px] sm:text-[16px] lg:text-[1.1vw] font-[500] leading-[1.5] lg:leading-[1.6] text-[#4F4F4F] overflow-y-auto">
                  {slide.description}
                </p>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Navigation Section */}
      <div className="flex pt-6 sm:pt-8 lg:pt-[4vw] justify-center items-center w-full">
        <div className="flex justify-center items-center gap-x-4 sm:gap-x-6 lg:gap-x-[3vw]">
          {/* Left Arrow */}
          <div
            className="cursor-pointer flex justify-center items-center w-8 h-8 sm:w-10 sm:h-10 lg:w-[2.5vw] lg:h-[2.5vw]"
            onClick={handlePrev}
          >
            <Image width={48} height={48} src={leftArrow} alt="arrow left" className="w-full h-full" />
          </div>

          {/* Dot Navigation */}
          <div className="flex justify-center items-center gap-2 sm:gap-3 lg:gap-[1vw]">
            {Array.from({ length: totalGroups }).map((_, index) => (
              <div key={index} onClick={() => handleDotClick(index)} className="cursor-pointer">
                <div
                  className={`relative w-2 h-2 sm:w-2.5 sm:h-2.5 lg:w-[0.8vw] lg:h-[0.8vw] rounded-full z-10 transition-colors duration-300 ${
                    activeRoute === index ? "bg-black" : "bg-gray-400"
                  }`}
                ></div>
              </div>
            ))}
          </div>

          {/* Right Arrow */}
          <div
            className="cursor-pointer flex justify-center items-center w-8 h-8 sm:w-10 sm:h-10 lg:w-[2.5vw] lg:h-[2.5vw]"
            onClick={handleNext}
          >
            <Image width={48} height={48} src={rightArrow} alt="arrow right" className="w-full h-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

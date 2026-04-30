"use client";

import { leftArrow, peewee1, peewee2, peewee3, peewee4, peewee5, peewee6, peewee7, peewee8, rightArrow } from "@/assets";
import Image from "next/image";
import React, { useState } from "react";

const CarouselCustom = () => {
  const slides = [
    { imageUrl: peewee1 },
    { imageUrl: peewee2 },
    { imageUrl: peewee3 },
    { imageUrl: peewee4 },
    { imageUrl: peewee5 },
    { imageUrl: peewee6 },
    { imageUrl: peewee7 },
    { imageUrl: peewee8 },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const slidesPerPage = 3;

  const totalSlides = slides.length;

  // Next Slide Logic
  const nextSlide = () => {
    const lastIndex = totalSlides - slidesPerPage;
    if (currentIndex < lastIndex) {
      setCurrentIndex((prevIndex) => prevIndex + slidesPerPage);
    }
  };

  // Previous Slide Logic
  const prevSlide = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prevIndex) => prevIndex - slidesPerPage);
    }
  };

  return (
    <div className="w-full max-w-[1726px] flex flex-col px-[48px] justify-center items-center relative">
      <div className="w-full h-full overflow-hidden">
        {/* Show 3 images at a time as a "slide" */}
        <div
          className="flex transition-transform duration-500"
          style={{

          }}
        >
          {slides.map((slide, i) => (
            <div
              key={i}
              className="w-[559px] max-w-[559px] h-[666px] bg-white rounded-[24px] shadow-lg flex flex-col"
            >
              {/* Image Section */}
              <div className="w-full h-[331px] rounded-t-[24px] overflow-hidden">
                <Image
                  className="transform duration-500 object-cover w-full h-full"
                  src={slide.imageUrl}
                  alt={`Slide ${i + 1}`}
                />
              </div>

              {/* Content Section */}
              <div className="flex-grow p-4">
                <h2 className="text-xl font-semibold">Card Title {i + 1}</h2>
                <p className="text-gray-600 mt-2">
                  This is a description for slide {i + 1}. You can place any content here.
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex pt-[64px] w-full justify-center items-center">
        <div className="flex items-center gap-x-[48px] h-[48px]!">
          {/* Left Arrow */}
          <div
            className="cursor-pointer w-[48px]! h-[48px]!"
            onClick={prevSlide}
            style={{ opacity: currentIndex === 0 ? 0.5 : 1 }}
          >
            <Image src={leftArrow} alt="arrow left" />
          </div>

          {/* Dots for pagination */}
          <div className="w-full h-full justify-center flex items-end gap-[8px]">
            {Array(Math.ceil(totalSlides / slidesPerPage)) // Create dots based on the number of sets of slides
              .fill(null)
              .map((_, index) => (
                <div key={index}>
                  <div
                    className={`${
                      Math.floor(currentIndex / slidesPerPage) === index
                        ? "bg-[#000000]"
                        : "bg-gray-400"
                    } relative w-[16px] h-[16px] rounded-full z-[99]`}
                  ></div>
                </div>
              ))}
          </div>

          {/* Right Arrow */}
          <div
            className="w-[48px]! h-[48px]! cursor-pointer"
            onClick={nextSlide}
            style={{ opacity: currentIndex >= totalSlides - slidesPerPage ? 0.5 : 1 }}
          >
            <Image src={rightArrow} alt="arrow right" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarouselCustom;

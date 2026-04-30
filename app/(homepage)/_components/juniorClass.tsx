"use client"

import prevjr1 from "@/assets/Previous & Current Juniors/1.jpeg"
import prevjr2 from "@/assets/Previous & Current Juniors/2.jpeg"
import prevjr3 from "@/assets/Previous & Current Juniors/3.jpeg"
import prevjr4 from "@/assets/Previous & Current Juniors/4.jpeg"
import prevjr5 from "@/assets/Previous & Current Juniors/5.jpeg"
import prevjr6 from "@/assets/Previous & Current Juniors/6.jpeg"
import prevjr7 from "@/assets/Previous & Current Juniors/7.jpeg"
import prevjr8 from "@/assets/Previous & Current Juniors/8.jpeg"
import prevjr9 from "@/assets/Previous & Current Juniors/9.jpeg"
import prevjr10 from "@/assets/Previous & Current Juniors/10.jpeg"
import prevjr11 from "@/assets/Previous & Current Juniors/11.jpeg"
import prevjr12 from "@/assets/Previous & Current Juniors/12.jpeg"
import prevjr13 from "@/assets/Previous & Current Juniors/13.jpeg"
import prevjr14 from "@/assets/Previous & Current Juniors/14.jpeg"
import prevjr15 from "@/assets/Previous & Current Juniors/15.jpeg"  
import prevjr16 from "@/assets/Previous & Current Juniors/16.jpeg"
import prevjr17 from "@/assets/Previous & Current Juniors/17.jpeg"
import prevjr18 from "@/assets/Previous & Current Juniors/18.jpeg"
import prevjr19 from "@/assets/Previous & Current Juniors/19.jpeg"
import prevjr20 from "@/assets/Previous & Current Juniors/20.jpeg"
import prevjr21 from "@/assets/Previous & Current Juniors/21.jpeg"  
import prevjr22 from "@/assets/Previous & Current Juniors/22.jpeg"
import prevjr23 from "@/assets/Previous & Current Juniors/23.jpeg"
import prevjr24 from "@/assets/Previous & Current Juniors/24.jpeg"
import prevjr25 from "@/assets/Previous & Current Juniors/25.jpeg"
import prevjr26 from "@/assets/Previous & Current Juniors/26.jpeg"
import prevjr27 from "@/assets/Previous & Current Juniors/27.jpeg"
import prevjr28 from "@/assets/Previous & Current Juniors/28.jpeg"
import prevjr29 from "@/assets/Previous & Current Juniors/29.jpeg"
import prevjr30 from "@/assets/Previous & Current Juniors/30.jpeg"
import prevjr31 from "@/assets/Previous & Current Juniors/31.jpeg"
import prevjr32 from "@/assets/Previous & Current Juniors/32.jpeg"
import prevjr33 from "@/assets/Previous & Current Juniors/33.jpeg"
import newspaper from "@/assets/Previous & Current Juniors/news paper.jpeg"

import ausjr1 from "@/assets/Australian Juniors (Competed in New Zealand)/1.jpeg"
import ausjr2 from "@/assets/Australian Juniors (Competed in New Zealand)/2.jpeg"
import ausjr3 from "@/assets/Australian Juniors (Competed in New Zealand)/3.jpeg"
import ausjr4 from "@/assets/Australian Juniors (Competed in New Zealand)/4.jpeg"
import ausjr5 from "@/assets/Australian Juniors (Competed in New Zealand)/5.jpeg"
import ausjr6 from "@/assets/Australian Juniors (Competed in New Zealand)/6.jpeg"
import ausjr7 from "@/assets/Australian Juniors (Competed in New Zealand)/7.jpeg"
import ausjr8 from "@/assets/Australian Juniors (Competed in New Zealand)/8.jpeg"
import ausjr9 from "@/assets/Australian Juniors (Competed in New Zealand)/9.jpeg"
import ausjr10 from "@/assets/Australian Juniors (Competed in New Zealand)/10.jpeg"
import ausjr11 from "@/assets/Australian Juniors (Competed in New Zealand)/11.jpeg"
import ausjr12 from "@/assets/Australian Juniors (Competed in New Zealand)/12.jpeg"
import ausjr13 from "@/assets/Australian Juniors (Competed in New Zealand)/13.jpeg"
import ausjr14 from "@/assets/Australian Juniors (Competed in New Zealand)/14.jpeg"
import ausjr15 from "@/assets/Australian Juniors (Competed in New Zealand)/15.jpeg"
import ausjr16 from "@/assets/Australian Juniors (Competed in New Zealand)/16.jpeg"
import ausjr17 from "@/assets/Australian Juniors (Competed in New Zealand)/17.jpeg"
import ausjr18 from "@/assets/Australian Juniors (Competed in New Zealand)/18.jpeg"

import nzjr1 from "@/assets/New Zealand Juniors (Competed in Australia)/1.jpeg"
import nzjr2 from "@/assets/New Zealand Juniors (Competed in Australia)/2.jpeg"
import nzjr3 from "@/assets/New Zealand Juniors (Competed in Australia)/3.jpeg"
import nzjr4 from "@/assets/New Zealand Juniors (Competed in Australia)/4.jpeg"
import nzjr5 from "@/assets/New Zealand Juniors (Competed in Australia)/5.jpeg"
import nzjr6 from "@/assets/New Zealand Juniors (Competed in Australia)/6.jpeg"
import nzjr7 from "@/assets/New Zealand Juniors (Competed in Australia)/7.jpeg"
import nzjr8 from "@/assets/New Zealand Juniors (Competed in Australia)/8.jpeg"
import nzjr9 from "@/assets/New Zealand Juniors (Competed in Australia)/9.jpeg"
import nzjr10 from "@/assets/New Zealand Juniors (Competed in Australia)/10.jpeg"
import nzjr11 from "@/assets/New Zealand Juniors (Competed in Australia)/11.jpeg"
import nzjr12 from "@/assets/New Zealand Juniors (Competed in Australia)/12.jpeg"
import nzjr13 from "@/assets/New Zealand Juniors (Competed in Australia)/13.jpeg"
import nzjr14 from "@/assets/New Zealand Juniors (Competed in Australia)/14.jpeg"
import nzjr15 from "@/assets/New Zealand Juniors (Competed in Australia)/15.jpeg"

import { class1, class2, class3, class4, class5, class6, class7, class8, 
jclass1, jclass2, jclass3, jclass4, jclassa, jclassb, jclassc, jclassd, jclasse, jclassg, jclassh, jclassi, jclassj, jclassk, jclassl, jclassf, ausj2, ausj3, ausj4, ausj5, ausj6, ausj7, ausj8, ausj9, ausj10, ausj11, ausj12, ausj13, ausj14, ausj15, nz1, nz3, nz4, nz7, nz8, nz9, nz10, nz11, nz12, nz13, nz14, nz6, nz5, nz2, nz17 } from "@/assets";import leftArrow from "@/assets/leftArrow.svg";
import rightArrow from "@/assets/rightArrow.svg";
import Image from "next/image";
import React, { useState, useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { Keyboard, Navigation } from "swiper/modules";
import { Swiper as SwiperType } from "swiper/types";
import { StaticImageData } from "next/image";

// Define types for the junior class images
interface JuniorSub {
  image1: StaticImageData;
  image2: StaticImageData;
  image3: StaticImageData;
  image4: StaticImageData;
  image5: StaticImageData;
}

interface JuniorImage {
  id: number;
  image: StaticImageData;
  juniorSub: JuniorSub;
}

const JuniorClass = () => {
  const [classBut, setClassBut] = useState(1);
  const [showMore, setShowMore] = useState(false); // To toggle images between 8 and more
  const swiperRef = useRef<SwiperType>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedJunior, setSelectedJunior] = useState<JuniorImage | null>(null);
  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);
  const [selectedImage, setSelectedImage] = useState<StaticImageData | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);

  const classButton = [
    {
      id: 1,
      label: "Previous and current Juniors  ",
    },
    {
      id: 2,
      label: "Australian Juniors (Competed in New Zealand)",
    },
    {
      id: 3,
      label: "New Zealand Juniors (Competed in Australia)",
    },
  ];

  const classImage: JuniorImage[] = [
    { id: 1, image: prevjr1, juniorSub: { image1: prevjr1, image2: prevjr2, image3: prevjr3, image4: prevjr4, image5: prevjr5 } },
    { id: 2, image: prevjr6, juniorSub: { image1: prevjr6, image2: prevjr7, image3: prevjr8, image4: prevjr9, image5: prevjr10 } },
    { id: 3, image: prevjr11, juniorSub: { image1: prevjr11, image2: prevjr12, image3: prevjr13, image4: prevjr14, image5: prevjr15 } },
    { id: 4, image: prevjr16, juniorSub: { image1: prevjr16, image2: prevjr17, image3: prevjr18, image4: prevjr19, image5: prevjr20 } },
    { id: 5, image: prevjr21, juniorSub: { image1: prevjr21, image2: prevjr22, image3: prevjr23, image4: prevjr24, image5: prevjr25 } },
    { id: 6, image: prevjr26, juniorSub: { image1: prevjr26, image2: prevjr27, image3: prevjr28, image4: prevjr29, image5: prevjr30 } },
    { id: 7, image: prevjr31, juniorSub: { image1: prevjr31, image2: prevjr32, image3: prevjr33, image4: newspaper, image5: prevjr1 } },
    { id: 8, image: prevjr2, juniorSub: { image1: prevjr2, image2: prevjr3, image3: prevjr4, image4: prevjr5, image5: prevjr6 } },
    { id: 9, image: prevjr3, juniorSub: { image1: prevjr3, image2: prevjr4, image3: prevjr5, image4: prevjr6, image5: prevjr7 } },
    { id: 10, image: prevjr4, juniorSub: { image1: prevjr4, image2: prevjr5, image3: prevjr6, image4: prevjr7, image5: prevjr8 } },
    { id: 11, image: prevjr5, juniorSub: { image1: prevjr5, image2: prevjr6, image3: prevjr7, image4: prevjr8, image5: prevjr9 } },
    { id: 12, image: prevjr7, juniorSub: { image1: prevjr7, image2: prevjr8, image3: prevjr9, image4: prevjr10, image5: prevjr11 } },
    { id: 13, image: prevjr8, juniorSub: { image1: prevjr8, image2: prevjr9, image3: prevjr10, image4: prevjr11, image5: prevjr12 } },
    { id: 14, image: prevjr9, juniorSub: { image1: prevjr9, image2: prevjr10, image3: prevjr11, image4: prevjr12, image5: prevjr13 } },
    { id: 15, image: prevjr10, juniorSub: { image1: prevjr10, image2: prevjr11, image3: prevjr12, image4: prevjr13, image5: prevjr14 } },
    { id: 16, image: prevjr12, juniorSub: { image1: prevjr12, image2: prevjr13, image3: prevjr14, image4: prevjr15, image5: prevjr16 } },
    { id: 17, image: prevjr13, juniorSub: { image1: prevjr13, image2: prevjr14, image3: prevjr15, image4: prevjr16, image5: prevjr17 } },
    { id: 18, image: prevjr14, juniorSub: { image1: prevjr14, image2: prevjr15, image3: prevjr16, image4: prevjr17, image5: prevjr18 } },
    { id: 19, image: prevjr15, juniorSub: { image1: prevjr15, image2: prevjr16, image3: prevjr17, image4: prevjr18, image5: prevjr19 } },
    { id: 20, image: prevjr17, juniorSub: { image1: prevjr17, image2: prevjr18, image3: prevjr19, image4: prevjr20, image5: prevjr21 } },
    { id: 21, image: prevjr18, juniorSub: { image1: prevjr18, image2: prevjr19, image3: prevjr20, image4: prevjr21, image5: prevjr22 } },
    { id: 22, image: prevjr19, juniorSub: { image1: prevjr19, image2: prevjr20, image3: prevjr21, image4: prevjr22, image5: prevjr23 } },
    { id: 23, image: prevjr20, juniorSub: { image1: prevjr20, image2: prevjr21, image3: prevjr22, image4: prevjr23, image5: prevjr24 } },
    { id: 24, image: prevjr22, juniorSub: { image1: prevjr22, image2: prevjr23, image3: prevjr24, image4: prevjr25, image5: prevjr26 } },
    { id: 25, image: prevjr23, juniorSub: { image1: prevjr23, image2: prevjr24, image3: prevjr25, image4: prevjr26, image5: prevjr27 } },
    { id: 26, image: prevjr24, juniorSub: { image1: prevjr24, image2: prevjr25, image3: prevjr26, image4: prevjr27, image5: prevjr28 } },
    { id: 27, image: prevjr25, juniorSub: { image1: prevjr25, image2: prevjr26, image3: prevjr27, image4: prevjr28, image5: prevjr29 } },
    { id: 28, image: prevjr27, juniorSub: { image1: prevjr27, image2: prevjr28, image3: prevjr29, image4: prevjr30, image5: prevjr31 } },
    { id: 29, image: prevjr28, juniorSub: { image1: prevjr28, image2: prevjr29, image3: prevjr30, image4: prevjr31, image5: prevjr32 } },
    { id: 30, image: prevjr29, juniorSub: { image1: prevjr29, image2: prevjr30, image3: prevjr31, image4: prevjr32, image5: prevjr33 } },
    { id: 31, image: prevjr30, juniorSub: { image1: prevjr30, image2: prevjr31, image3: prevjr32, image4: prevjr33, image5: newspaper } },
    { id: 32, image: prevjr32, juniorSub: { image1: prevjr32, image2: prevjr33, image3: newspaper, image4: prevjr1, image5: prevjr2 } },
    { id: 33, image: prevjr33, juniorSub: { image1: prevjr33, image2: newspaper, image3: prevjr1, image4: prevjr2, image5: prevjr3 } },
    { id: 34, image: newspaper, juniorSub: { image1: newspaper, image2: prevjr1, image3: prevjr2, image4: prevjr3, image5: prevjr4 } }
  ];

  const classImage2 = [
    { image: ausjr1 },
    { image: ausjr2 },
    { image: ausjr3 },
    { image: ausjr4 },
    { image: ausjr5 },
    { image: ausjr6 },
    { image: ausjr7 },
    { image: ausjr8 },
    { image: ausjr9 },
    { image: ausjr10 },
    { image: ausjr11 },
    { image: ausjr12 },
    { image: ausjr13 },
    { image: ausjr14 },
    { image: ausjr15 },
    { image: ausjr16 },
    { image: ausjr17 },
    { image: ausjr18 },
  ];

  const classImage3 = [
    { image: nzjr1 },
    { image: nzjr2 },
    { image: nzjr3 },
    { image: nzjr4 },
    { image: nzjr5 },
    { image: nzjr6 },
    { image: nzjr7 },
    { image: nzjr8 },
    { image: nzjr9 },
    { image: nzjr10 },
    { image: nzjr11 },
    { image: nzjr12 },
    { image: nzjr13 },
    { image: nzjr14 },
    { image: nzjr15 },
  ];

  const handleLoadMoreToggle = () => {
    setShowMore(!showMore);
  };

  const getVisibleImages = (imageArray: any[]) => {
    if (showMore) {
      return imageArray; // Show all images when showMore is true
    } else {
      return imageArray.slice(0, 12); // Show only the first 12 images
    }
  };

  // Modal control functions
  const handleImageClick = (image: StaticImageData, index: number) => {
    setSelectedImage(image);
    setCurrentImageIndex(index);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedImage(null);
  };

  const handlePrev = (): void => {
    if (swiperRef.current) {
      swiperRef.current.slidePrev();
    }
  };

  const handleNext = (): void => {
    if (swiperRef.current) {
      swiperRef.current.slideNext();
    }
  };

  const handleThumbnailClick = (index: number): void => {
    setActiveSlideIndex(index);
    setCurrentImageIndex(index);
    const images = getCurrentClassImages();
    setSelectedImage(images[index].image);
    if (swiperRef.current) {
      swiperRef.current.slideTo(index);
    }
  };

  // Function to handle next image
  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    const images = getCurrentClassImages();
    const nextIndex = (currentImageIndex + 1) % images.length;
    setCurrentImageIndex(nextIndex);
    setSelectedImage(images[nextIndex].image);
  };

  // Function to handle previous image
  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    const images = getCurrentClassImages();
    const prevIndex = (currentImageIndex - 1 + images.length) % images.length;
    setCurrentImageIndex(prevIndex);
    setSelectedImage(images[prevIndex].image);
  };

  // Helper function to get the current class images
  const getCurrentClassImages = () => {
    switch (classBut) {
      case 1:
        return classImage;
      case 2:
        return classImage2;
      case 3:
        return classImage3;
      default:
        return [];
    }
  };

  return (
    <div className="w-full px-[48px] lg:px-[2.5vw] relative pt-[120px] lg:pt-[6.25vw]">
      <div className="w-full h-full rounded-[16px] flex flex-col items-center gap-y-[48px] lg:gap-y-[2.5vw] relative z-[9]">
        <h3 className="text-[32px] sm:text-[42px] lg:text-[4.375vw] font-[700] leading-[1.2] lg:leading-[5.25vw] text-center">
          Junior Classes
        </h3>

        {/* Mobile Select Dropdown */}
        <div className="block lg:hidden w-full relative">
          <select 
            value={classBut}
            onChange={(e) => {
              setClassBut(Number(e.target.value));
              setShowMore(false);
            }}
            className="w-full h-[64px] border border-[#B5B5B5] rounded-[16px] px-4 text-[18px] font-[600] bg-white appearance-none cursor-pointer text-center"
          >
            {classButton.map((classB) => (
              <option 
                key={classB.id} 
                value={classB.id}
                className="py-2 px-4 text-[16px]"
              >
                {classB.label}
              </option>
            ))}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        {/* Desktop Button Grid */}
        <div className="hidden lg:grid grid-cols-3 w-full h-[64px] lg:h-[3.33vw] border border-[#B5B5B5] rounded-[16px] overflow-hidden">
          {classButton.map((classB) => (
            <button
              onClick={() => {
                setClassBut(classB.id);
                setShowMore(false);
              }}
              key={classB.id}
              className={`h-full w-full ${
                classB.id === classBut ? "bg-[#E6E6E6]" : ""
              } border-r border-[#B5B5B5] text-[18px] lg:text-[0.94vw] font-[600] hover:bg-[#000000] hover:text-white`}
            >
              {classB.label}
            </button>
          ))}
        </div>

        {/* Class 1 */}
        {classBut === 1 && (
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-[24px] lg:gap-[1.25vw]">
            {getVisibleImages(classImage).map((junior, i) => (
              <div className="h-[283px] lg:h-[14.74vw] rounded-[16px] overflow-hidden" key={i}>
                <Image
                  className="hover:scale-110 transform transition-all duration-300 object-cover w-full h-full cursor-pointer"
                  src={junior.image}
                  alt={`Junior image ${i}`}
                  onClick={() => handleImageClick(junior.image, i)}
                />
              </div>
            ))}
          </div>
        )}

        {/* Class 2 */}
        {classBut === 2 && (
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-[24px] lg:gap-[1.25vw]">
            {getVisibleImages(classImage2).map((peewee, i) => (
              <div className="h-[283px] lg:h-[14.74vw] rounded-[16px] overflow-hidden" key={i}>
                <Image
                  className="hover:scale-110 transform transition-all duration-300 object-cover w-full h-full cursor-pointer"
                  src={peewee.image}
                  alt={`Peewee image ${i}`}
                  onClick={() => handleImageClick(peewee.image, i)}
                />
              </div>
            ))}
          </div>
        )}

        {/* Class 3 */}
        {classBut === 3 && (
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-[24px] lg:gap-[1.25vw]">
            {getVisibleImages(classImage3).map((peewee, i) => (
              <div className="h-[283px] lg:h-[14.74vw] rounded-[16px] overflow-hidden" key={i}>
                <Image
                  className="hover:scale-110 transform transition-all duration-300 object-cover w-full h-full cursor-pointer"
                  src={peewee.image}
                  alt={`Peewee image ${i}`}
                  onClick={() => handleImageClick(peewee.image, i)}
                />
              </div>
            ))}
          </div>
        )}

        {/* Load More / Load Less Button */}
        <div>
          <button
            onClick={handleLoadMoreToggle}
            className="border border-[#21212133] rounded-[16px] w-[173px] lg:w-[9vw] h-[56px] lg:h-[2.92vw] hover:bg-[#000000] hover:text-white font-[500] text-[16px] lg:text-[0.83vw] text-[#212121]"
          >
            {showMore ? "Load Less" : "Load More"}
          </button>
        </div>
      </div>

      {/* Modal with Swiper */}
      {isModalOpen && selectedImage && (
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

            {/* Main Image Container */}
            <div className="relative w-full flex items-center justify-center">
              {/* Main Image */}
              <div className="w-full flex justify-center">
                <Image
                  src={selectedImage}
                  alt="Selected image"
                  className="max-w-full max-h-[70vh] lg:max-h-[70vh] w-auto h-auto object-contain"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>

              {/* Navigation Arrows */}
              <button
                className="absolute left-[10px] md:left-[-60px] lg:left-[-3.13vw] top-1/2 transform -translate-y-1/2 cursor-pointer p-4 lg:p-[0.83vw] text-white hover:text-gray-300 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  const images = getCurrentClassImages();
                  const prevIndex = (currentImageIndex - 1 + images.length) % images.length;
                  setCurrentImageIndex(prevIndex);
                  setSelectedImage(images[prevIndex].image);
                }}
              >
                <Image width={48} height={48} className="lg:w-[2.5vw] lg:h-[2.5vw]" src={leftArrow} alt="Previous" />
              </button>

              <button
                className="absolute right-[10px] md:right-[-60px] lg:right-[-3.13vw] top-1/2 transform -translate-y-1/2 cursor-pointer p-4 lg:p-[0.83vw] text-white hover:text-gray-300 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  const images = getCurrentClassImages();
                  const nextIndex = (currentImageIndex + 1) % images.length;
                  setCurrentImageIndex(nextIndex);
                  setSelectedImage(images[nextIndex].image);
                }}
              >
                <Image width={48} height={48} className="lg:w-[2.5vw] lg:h-[2.5vw]" src={rightArrow} alt="Next" />
              </button>
            </div>

            {/* Thumbnail Navigation - Now positioned below with more spacing */}
            <div className="w-full mt-8 lg:mt-[1.67vw]">
              <div className="flex justify-center items-center gap-[12px] lg:gap-[0.63vw] overflow-x-auto px-[20px] md:px-[60px] lg:px-[3.13vw] py-4 lg:py-[0.83vw] -mb-16 lg:-mb-[3.33vw]">
                {getCurrentClassImages()
                  .slice(
                    Math.max(0, Math.min(currentImageIndex - 2, getCurrentClassImages().length - 5)),
                    Math.max(5, Math.min(currentImageIndex + 3, getCurrentClassImages().length))
                  )
                  .map((image, index) => {
                    const actualIndex = Math.max(0, Math.min(currentImageIndex - 2, getCurrentClassImages().length - 5)) + index;
                    return (
                      <div 
                        key={actualIndex}
                        className={`cursor-pointer w-[180px] lg:w-[9.38vw] h-[120px] lg:h-[6.25vw] rounded-md overflow-hidden flex-shrink-0 transition-all duration-300 ${
                          actualIndex === currentImageIndex
                            ? "border-2 border-white"
                            : "opacity-60 blur-[1px] hover:opacity-80 hover:blur-0"
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedImage(image.image);
                          setCurrentImageIndex(actualIndex);
                        }}
                      >
                        <Image
                          src={image.image}
                          alt={`Thumbnail ${actualIndex + 1}`}
                          className="object-cover w-full h-full"
                        />
                      </div>
                    )
                  })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JuniorClass;

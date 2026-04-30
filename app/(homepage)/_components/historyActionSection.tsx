"use client"

import React, { useState } from "react";
import Image, { StaticImageData } from "next/image";

// Import slider images
import Slider1 from "@/assets/History/slider/1.jpeg"
import Slider2 from "@/assets/History/slider/2.jpeg"
import Slider3 from "@/assets/History/slider/3.jpeg"
import Slider4 from "@/assets/History/slider/4.jpeg"
import Slider5 from "@/assets/History/slider/1996-5.jpeg"
import Slider6 from "@/assets/History/slider/1996-6.jpeg"
import Slider7 from "@/assets/History/slider/1996-7.jpeg"
import Slider8 from "@/assets/History/slider/1996-8.jpeg"
import Slider9 from "@/assets/History/slider/1996-9.jpeg"
import Slider10 from "@/assets/History/slider/1998-10.jpeg"
import Slider11 from "@/assets/History/slider/1998-11.jpeg"
import Slider12 from "@/assets/History/slider/1998-12.jpeg"
import Slider13 from "@/assets/History/slider/1998-13.jpeg"
import Slider14 from "@/assets/History/slider/1998-14.jpeg"
import Slider15 from "@/assets/History/slider/1999-15.jpeg"
import Slider16 from "@/assets/History/slider/1999-16.jpeg"
import Slider17 from "@/assets/History/slider/1999-17.jpeg"
import Slider18 from "@/assets/History/slider/1999-18.jpeg"
import Slider19 from "@/assets/History/slider/1999-19.jpeg"
import Slider20 from "@/assets/History/slider/2000-20.jpeg"
import Slider21 from "@/assets/History/slider/2000-21.jpeg"
import Slider22 from "@/assets/History/slider/2000-22.jpeg"
import Slider23 from "@/assets/History/slider/2000-23.jpeg"
import Slider24 from "@/assets/History/slider/2000-24.jpeg"
import Slider25 from "@/assets/History/slider/2001-25.jpeg"
import Slider26 from "@/assets/History/slider/2001-26.jpeg"
import Slider27 from "@/assets/History/slider/2001-27.jpeg"
import Slider28 from "@/assets/History/slider/2001-28.jpeg"
import Slider29 from "@/assets/History/slider/2001-29.jpeg"
import Slider30 from "@/assets/History/slider/2002-30.jpeg"
import Slider31 from "@/assets/History/slider/2002-31.jpeg"
import Slider32 from "@/assets/History/slider/2002-32.jpeg"
import Slider33 from "@/assets/History/slider/2002-33.jpeg"
import Slider34 from "@/assets/History/slider/2002-34.jpeg"
import Slider35 from "@/assets/History/slider/2003-35.jpeg"
import Slider36 from "@/assets/History/slider/2003-36.jpeg"
import Slider37 from "@/assets/History/slider/2003-37.jpeg"
import Slider38 from "@/assets/History/slider/2003-38.jpeg"
import Slider39 from "@/assets/History/slider/2003-39.jpeg"
import Slider40 from "@/assets/History/slider/2004-40.jpeg"
import Slider41 from "@/assets/History/slider/2004-41.jpeg"
import Slider42 from "@/assets/History/slider/2004-42.jpeg"
import Slider43 from "@/assets/History/slider/2004-43.jpeg"
import Slider44 from "@/assets/History/slider/2004-44.jpeg"
import Slider45 from "@/assets/History/slider/2007-45.jpeg"
import Slider46 from "@/assets/History/slider/2007-46.jpeg"
import Slider47 from "@/assets/History/slider/2007-47.jpeg"
import Slider48 from "@/assets/History/slider/2007-48.jpeg"
import Slider49 from "@/assets/History/slider/2007-49.jpeg"
import Slider50 from "@/assets/History/slider/2009-50.jpeg"
import Slider51 from "@/assets/History/slider/2009-51.jpeg"
import Slider52 from "@/assets/History/slider/2009-52.jpeg"
import Slider53 from "@/assets/History/slider/2009-53.jpeg"
import Slider54 from "@/assets/History/slider/2009-54.jpeg"

// Import video thumbnails and arrows
import LeftArrow from "@/assets/leftArrow.svg"
import RightArrow from "@/assets/rightArrow.svg"
import Thumbnail1 from "@/assets/History/1stthumb.png"
import Thumbnail2 from "@/assets/History/2ndthumb.png"
import Thumbnail3 from "@/assets/History/3rdthumb.png"
import Thumbnail4 from "@/assets/History/4ththumb.png"
import ee from "@/assets/ee.gif"

const HistoryActionSection: React.FC = () => {
  // Add state variables for the See Us In Action section
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedImage, setSelectedImage] = useState<string | StaticImageData | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('images');
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  // Define the slider images array
  const sliderImages: StaticImageData[] = [
    Slider1, Slider2, Slider3, Slider4, Slider5, Slider6, Slider7, Slider8, Slider9, Slider10,
    Slider11, Slider12, Slider13, Slider14, Slider15, Slider16, Slider17, Slider18, Slider19, Slider20,
    Slider21, Slider22, Slider23, Slider24, Slider25, Slider26, Slider27, Slider28, Slider29, Slider30,
    Slider31, Slider32, Slider33, Slider34, Slider35, Slider36, Slider37, Slider38, Slider39, Slider40,
    Slider41, Slider42, Slider43, Slider44, Slider45, Slider46, Slider47, Slider48, Slider49, Slider50,
    Slider51, Slider52, Slider53, Slider54
  ];

  // Define the videos array (using the same videos as IFSS page)
  const actionVideos = [
    {
      video: '/videos/1st.mp4',
      thumbnail: Thumbnail1
    },
    {
      video: '/videos/2nd.mp4',
      thumbnail: Thumbnail2
    },
    {
      video: '/videos/3rd.mp4',
      thumbnail: Thumbnail3
    },
    {
      video: '/videos/4th.mp4',
      thumbnail: Thumbnail4
    } 
  ];

  const imagesPerPage = 8;
  const totalPages = Math.ceil(sliderImages.length / imagesPerPage);

  // Functions for pagination
  const handleNextPage = () => {
    setCurrentPage((prev) => (prev + 1) % totalPages);
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages);
  };

  // Functions for image lightbox
  const handleImageClick = (image: StaticImageData) => {
    setSelectedImage(image);
  };

  const handleCloseImage = () => {
    setSelectedImage(null);
  };

  const getVisibleThumbnails = () => {
    const currentIndex = sliderImages.findIndex(img => img === selectedImage);
    const start = Math.max(0, Math.min(currentIndex - 2, sliderImages.length - 5));
    return sliderImages.slice(start, start + 5);
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedImage && typeof selectedImage === 'object') {
        const currentIndex = sliderImages.indexOf(selectedImage);
        const nextIndex = (currentIndex + 1) % sliderImages.length;
        setSelectedImage(sliderImages[nextIndex]);
    }
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedImage && typeof selectedImage === 'object') {
        const currentIndex = sliderImages.indexOf(selectedImage);
        const prevIndex = (currentIndex - 1 + sliderImages.length) % sliderImages.length;
        setSelectedImage(sliderImages[prevIndex]);
        setCurrentImageIndex(prevIndex);
    }
  };

  // Functions for video lightbox
  const handleVideoClick = (video: string) => {
    setSelectedVideo(video);
  };

  const handleCloseVideo = () => {
    setSelectedVideo(null);
  };

  const getVisibleVideoThumbnails = (currentVideo: string) => {
    const currentIndex = actionVideos.findIndex(item => item.video === currentVideo);
    const start = Math.max(0, Math.min(currentIndex - 2, actionVideos.length - 5));
    return actionVideos.slice(start, start + 5);
  };

  return (
    <div className="w-full flex flex-col gap-y-[48px] px-[48px] -mt-32">
      <h2 className="text-[4.375vw] font-[700] text-center">See Us In Action</h2>
      
      {/* Tab buttons */}
      <div className="w-full flex justify-center">
        <div className="flex rounded-[15px] border border-[#E5E5E5] overflow-hidden">
          <button 
            className={`px-[48px] w-[47.5vw] py-[15px] transition-colors
              ${activeTab === 'images' 
                ? 'bg-[#F2F2F2] text-black' 
                : 'bg-white text-black hover:bg-black hover:text-white'
              } text-[16px] font-[500]`}
            onClick={() => setActiveTab('images')}
          >
            Images
          </button>
          <button 
            className={`px-[48px] w-[47.5vw] py-[8px] transition-colors
              ${activeTab === 'videos' 
                ? 'bg-[#F2F2F2] text-black' 
                : 'bg-white text-black hover:bg-black hover:text-white'
              } text-[16px] font-[500]`}
            onClick={() => setActiveTab('videos')}
          >
            Video
          </button>
        </div>
      </div>

      {/* Content Grid */}
      {activeTab === 'images' ? (
        // Image Grid
        <div className="grid grid-cols-4 gap-[24px]">
          {sliderImages
            .slice(currentPage * imagesPerPage, (currentPage + 1) * imagesPerPage)
            .map((image, index) => (
              <div 
                key={index} 
                className="aspect-w-16 aspect-h-9 rounded-[16px] overflow-hidden cursor-pointer"
                onClick={() => handleImageClick(image)}
              >
                <Image
                  src={image}
                  alt={`History image ${currentPage * imagesPerPage + index + 1}`}
                  className="w-full h-[15.313vw] object-cover"
                />
              </div>
            ))}
        </div>
      ) : (
        // Video Grid
        <div className="grid grid-cols-3 gap-[24px]">
          {actionVideos.map((item, index) => (
            <div 
              key={index} 
              className="aspect-w-16 aspect-h-9 rounded-[16px] overflow-hidden cursor-pointer relative group"
              onClick={() => handleVideoClick(item.video)}
            >
              {/* Add a semi-transparent overlay to hide the embedded play button */}
              <div className="absolute inset-0 bg-black bg-opacity-20 z-10"></div>
              <Image
                src={item.thumbnail}
                alt={`Video thumbnail ${index + 1}`}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              {/* Play Button Overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center z-20">
                <div className="w-14 h-14 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <svg 
                    width="48" 
                    height="48" 
                    viewBox="0 0 48 48" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                    className="transform transition-transform duration-300 group-hover:scale-110"
                  >
                    <path 
                      d="M20 31.4019L32 24L20 16.5981L20 31.4019Z" 
                      fill="white" 
                      stroke="white" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Video Lightbox */}
      {selectedVideo && (
        <div 
          className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center"
          onClick={handleCloseVideo}
        >
          <button 
            className="absolute top-4 text-white text-4xl font-bold z-50 cursor-pointer"
            onClick={handleCloseVideo}
          >
            ×
          </button>

          <div className="relative w-full h-full flex items-center justify-center">
            {/* Left Arrow */}
            <button 
              className="absolute left-48 text-white text-4xl font-bold z-50 w-12 h-12 flex items-center justify-center cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                const currentIndex = actionVideos.findIndex(item => item.video === selectedVideo);
                const prevIndex = (currentIndex - 1 + actionVideos.length) % actionVideos.length;
                setSelectedVideo(actionVideos[prevIndex].video);
              }}
            >
              <Image src={LeftArrow} alt="Previous" />
            </button>

            {/* Main Video - Updated height */}
            <div className="max-w-[80vw] h-[75vh]" onClick={(e) => e.stopPropagation()}>
              <video 
                src={selectedVideo}
                className="w-full h-full -mt-4"
                controls
                autoPlay
              />
            </div>

            {/* Right Arrow */}
            <button 
              className="absolute right-48 text-white text-4xl font-bold z-50 w-12 h-12 flex items-center justify-center cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                const currentIndex = actionVideos.findIndex(item => item.video === selectedVideo);
                const nextIndex = (currentIndex + 1) % actionVideos.length;
                setSelectedVideo(actionVideos[nextIndex].video);
              }}
            >
              <Image src={RightArrow} alt="Next" />
            </button>
          </div>

          {/* Thumbnail Navigation */}
          <div className="absolute bottom-8 flex justify-center gap-x-2 p-2">
            {getVisibleVideoThumbnails(selectedVideo).map((item, index) => (
              <div 
                key={index}
                className={`w-24 h-16 cursor-pointer transition-all duration-300 ${
                  item.video === selectedVideo ? 'border-2 border-white' : ''
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedVideo(item.video);
                }}
              >
                <Image
                  src={item.thumbnail}
                  alt={`Video thumbnail ${index + 1}`}
                  className={`w-full h-full object-cover transition-all duration-300 ${
                    item.video !== selectedVideo ? 'blur-[2px] hover:blur-none' : ''
                  }`}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Image Lightbox */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col items-center justify-center"
          onClick={handleCloseImage}
        >
          <div className="relative w-full h-full flex flex-col items-center pt-16">
            {/* Close button - centered above image */}
            <button 
              className="absolute top-2 left-1/2 transform -translate-x-1/2 text-white text-4xl font-bold z-50 cursor-pointer w-12 h-12 bg-black bg-opacity-50 rounded-full flex items-center justify-center hover:bg-opacity-70"
              onClick={handleCloseImage}
            >
              ×
            </button>

            <div className="relative w-full flex-1 flex items-center justify-center mt-8">
              {/* Main Image container with relative positioning */}
              <div 
                className="relative max-w-[90vw] md:max-w-[80vw] h-[60vh] flex items-center justify-center image-container" 
                onClick={(e) => e.stopPropagation()}
              >
                {/* Left Arrow */}
                <button 
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-white z-[100] w-10 h-10 flex items-center justify-center cursor-pointer bg-black bg-opacity-50 rounded-full hover:bg-opacity-70"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrevImage(e);
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15 18L9 12L15 6" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>

                {/* Main Image */}
                <Image
                  src={selectedImage}
                  alt="Selected image"
                  className="max-h-full max-w-full object-contain"
                  onClick={(e) => e.stopPropagation()}
                />

                {/* Right Arrow */}
                <button 
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-white z-[100] w-10 h-10 flex items-center justify-center cursor-pointer bg-black bg-opacity-50 rounded-full hover:bg-opacity-70"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNextImage(e);
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 18L15 12L9 6" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Thumbnails row */}
            {sliderImages.length > 1 && (
              <div 
                className="w-full flex justify-center overflow-x-auto px-4 py-4 mt-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex space-x-4 max-w-full">
                  {getVisibleThumbnails().map((image, index) => {
                    const isActive = image === selectedImage;
                    return (
                      <div 
                        key={index}
                        className={`h-20 w-20 flex-shrink-0 cursor-pointer rounded-md overflow-hidden transition-all ${
                          isActive ? 'border-2 border-white scale-110 z-10' : 'opacity-70 hover:opacity-100'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedImage(image);
                        }}
                      >
                        <Image 
                          src={image} 
                          alt={`Thumbnail ${index + 1}`}
                          className={`w-full h-full object-cover transition-all ${!isActive ? 'blur-sm' : ''}`}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation Dots - only show for images */}
      {activeTab === 'images' && (
        <div className="flex justify-center items-center gap-x-[8px]">
          <button 
            onClick={handlePrevPage}
            className="w-[32px] h-[32px] flex items-center justify-center "
          >
            <Image src={LeftArrow} alt="Previous" />
          </button>
          {[...Array(totalPages)].map((_, index) => (
            <div
              key={index}
              className={`w-[8px] h-[8px] rounded-full ${
                currentPage === index ? 'bg-black' : 'bg-[#D9D9D9]'
              }`}
            ></div>
          ))}
          <button 
            onClick={handleNextPage}
            className="w-[32px] h-[32px] flex items-center justify-center"
          >
             <Image src={RightArrow} alt="Previous" />
          </button>
        </div>
      )}
    </div>
  );
};

export default HistoryActionSection; 
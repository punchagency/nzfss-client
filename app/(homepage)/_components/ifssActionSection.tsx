"use client"

import React, { useState } from "react";
import Image, { StaticImageData } from "next/image";

// Import action images and videos
import IFSSAction1 from "@/assets/IFSS/See us in action/1.jpeg"
import IFSSAction3 from "@/assets/IFSS/See us in action/3.jpeg"
import IFSSAction4 from "@/assets/IFSS/See us in action/4.jpeg"
import IFSSAction5 from "@/assets/IFSS/See us in action/5.jpeg"
import IFSSAction6 from "@/assets/IFSS/See us in action/6.jpeg" 
import IFSSAction7 from "@/assets/IFSS/See us in action/7.jpeg"
import IFSSAction8 from "@/assets/IFSS/See us in action/8.jpeg"
import IFSSAction9 from "@/assets/IFSS/See us in action/9.jpeg"
import IFSSAction10 from "@/assets/IFSS/See us in action/10.jpeg"
import IFSSAction11 from "@/assets/IFSS/See us in action/11.jpeg"
import IFSSAction12 from "@/assets/IFSS/See us in action/12.jpeg"
import IFSSAction13 from "@/assets/IFSS/See us in action/13.jpeg"
import IFSSAction14 from "@/assets/IFSS/See us in action/14.jpeg"
import IFSSAction15 from "@/assets/IFSS/See us in action/15.jpeg"
import IFSSAction16 from "@/assets/IFSS/See us in action/16.jpeg"
import IFSSAction17 from "@/assets/IFSS/See us in action/17.jpeg"
import IFSSAction18 from "@/assets/IFSS/See us in action/18.jpeg"
import IFSSAction19 from "@/assets/IFSS/See us in action/19.jpeg"
import IFSSAction20 from "@/assets/IFSS/See us in action/20.jpeg"
import IFSSAction21 from "@/assets/IFSS/See us in action/21.jpeg"
import LeftArrow from "@/assets/leftArrow.svg"
import RightArrow from "@/assets/rightArrow.svg"

import Thumbnail1 from "@/assets/IFSS/See us in action/Vidoes/1.png"
import Thumbnail2 from "@/assets/IFSS/See us in action/Vidoes/2.png"
import Thumbnail3 from "@/assets/IFSS/See us in action/Vidoes/3.png"

const IFSSActionSection: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedImage, setSelectedImage] = useState<string | StaticImageData | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('images');
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  const actionImages: StaticImageData[] = [
    IFSSAction1, IFSSAction3, IFSSAction4, IFSSAction5, IFSSAction6, IFSSAction7, IFSSAction8,
    IFSSAction9, IFSSAction10, IFSSAction11, IFSSAction12, IFSSAction13, IFSSAction14, IFSSAction15,
    IFSSAction16, IFSSAction17, IFSSAction18, IFSSAction19, IFSSAction20, IFSSAction21
  ];

  const actionVideos = [
    {
      video: '/videos/01.mp4',
      thumbnail: Thumbnail1
    },
    {
      video: '/videos/02.mp4',
      thumbnail: Thumbnail2
    },
    {
      video: '/videos/03.mp4',
      thumbnail: Thumbnail3
    }
  ];

  const imagesPerPage = 8;
  const totalPages = Math.ceil(actionImages.length / imagesPerPage);

  const handleNextPage = () => {
    setCurrentPage((prev) => (prev + 1) % totalPages);
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages);
  };

  const handleImageClick = (image: StaticImageData) => {
    setSelectedImage(image);
  };

  const handleCloseImage = () => {
    setSelectedImage(null);
  };

  const getVisibleThumbnails = () => {
    const currentIndex = actionImages.findIndex(img => img === selectedImage);
    const start = Math.max(0, Math.min(currentIndex - 2, actionImages.length - 5));
    return actionImages.slice(start, start + 5);
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedImage && typeof selectedImage === 'object') {
        const currentIndex = actionImages.indexOf(selectedImage);
        const nextIndex = (currentIndex + 1) % actionImages.length;
        setSelectedImage(actionImages[nextIndex]);
    }
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedImage && typeof selectedImage === 'object') {
        const currentIndex = actionImages.indexOf(selectedImage);
        const prevIndex = (currentIndex - 1 + actionImages.length) % actionImages.length;
        setSelectedImage(actionImages[prevIndex]);
        setCurrentImageIndex(prevIndex);
    }
  };

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
    <div className="w-full flex flex-col gap-y-[48px] mt-[96px] px-[48px]">
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
        // Existing Image Grid
        <div className="grid grid-cols-4 gap-[24px]">
          {actionImages
            .slice(currentPage * imagesPerPage, (currentPage + 1) * imagesPerPage)
            .map((image, index) => (
              <div 
                key={index} 
                className="aspect-w-16 aspect-h-9 rounded-[16px] overflow-hidden cursor-pointer"
                onClick={() => handleImageClick(image)}
              >
                <Image
                  src={image}
                  alt={`IFSS action ${currentPage * imagesPerPage + index + 1}`}
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
            {actionImages.length > 1 && (
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

export default IFSSActionSection; 
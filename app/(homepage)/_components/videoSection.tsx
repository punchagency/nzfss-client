"use client"

import React, { useRef, useState, useEffect } from "react";

const VideoSection: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [hasPlayed, setHasPlayed] = useState<boolean>(false);

  useEffect((): (() => void) | void => {
    const playVideo = (): void => {
      if (videoRef.current && videoRef.current.paused) {
        videoRef
          .current
          .play()
          .then(() => {
            setHasPlayed(true);
          })
          .catch((error: Error) => {
            console.error("Error attempting to play video:", error);
          });
      }
    };

    const pauseVideo = (): void => {
      if (videoRef.current && !videoRef.current.paused) {
        videoRef.current.pause();
      }
    };

    // Make sure video is initially paused
    if (videoRef.current) {
      videoRef.current.pause();
    }

    const observer: IntersectionObserver = new IntersectionObserver(
      (entries: IntersectionObserverEntry[]) => {
        entries.forEach((entry: IntersectionObserverEntry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            playVideo();
          } else {
            setIsVisible(false);
            pauseVideo();
          }
        });
      },
      {
        threshold: 0.3, // Require 30% of the video to be visible before playing
        rootMargin: "0px",
      }
    );

    if (videoRef.current) {
      observer.observe(videoRef.current);
    }

    return () => {
      if (videoRef.current) {
        observer.unobserve(videoRef.current);
      }
    };
  }, []);

  return (
    <div className="-mt-16 relative"> 
      <video 
        ref={videoRef}
        src="/videos/bd.mp4" 
        muted 
        loop 
        playsInline
        preload="metadata"
        className={`w-full sm:w-[95vw] h-auto sm:h-[55.208vw] sm:-mt-[5vw] sm:mb-[2vw] rounded-[0.75rem] sm:rounded-[1.25vw] bg-transparent object-cover 
          transition-all duration-1000 ease-out origin-center
          ${isVisible 
            ? "opacity-100 scale-100 translate-y-0" 
            : "opacity-0 scale-95 translate-y-10"
          }`}
        poster="/images/video-poster.jpg"
      />
      {!hasPlayed && !isVisible && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
          <div className="animate-bounce bg-white p-2 w-10 h-10 ring-1 ring-slate-200 shadow-lg rounded-full flex items-center justify-center mb-3 mx-auto">
            <svg className="w-6 h-6 text-[#1A1A1A]" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
            </svg>
          </div>
          <span className="text-sm text-white drop-shadow-md bg-black/30 px-3 py-1 rounded-full">
            Scroll to play video
          </span>
        </div>
      )}
    </div>
  );
};

export default VideoSection; 
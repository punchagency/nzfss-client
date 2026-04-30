"use client"

import { historyMain1, historyMain2, historyMain3, historyMain4, side1, side2, side3, side4 } from '@/assets'
import Image from 'next/image'
import React, { useState, useRef, useEffect } from 'react'

const History = () => {
  const [activeTab, setActiveTab] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number | null>(null);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const [isVisible, setIsVisible] = useState(false);
  
  // Simplified history content
  const tabs = [
    {
      id: 1,
      image: historyMain1,
      sideImage: side1,
      title: 'The Beginning (1970s-1980)',
      content: 'In 1977, the first Siberian Husky was imported into New Zealand from Britain by Charline Wasson, followed by another import from the USA in 1978. 1979 saw the first litter of Siberian Huskies in New Zealand. Those ten Siberian Huskies formed the foundation of Sled Dog Sports in New Zealand and the following years saw an expansion in further import, breeding, and new kennels.',
      subContent: 'By 1983, over 40 Siberian Huskies were registered in New Zealand, many of them running in harness and participating in other activities. Alongside establishing Siberian Huskies, clubs sprang to life, the first ones being the Siberian Husky Club and the Southern Regions Sled Dog Club in 1983. In 1985 the first dry land sled dog race was held. Other dogs breeds such a Alaskan Malamutes, Samoyeds, Pointers and others soon joined.',
    },
    {
      id: 2,
      image: historyMain2,
      sideImage: side2,
      title: 'The Early Years (1990-2000)',
      content: 'In the late 1980s and early 1990s, most of the clubs still active today were founded and an increasing number of sled dog racing and weight pull events emerged. In 1991/1992 the first Sled Dog Symposium was held, disseminating new knowledge from local teams and international guest speakers. ',
      subContent: 'The growing diversity of races offered under varying rule sets led to the formation of the New Zealand Federation of Sled Dog Sports in 1993 which was fully established by 1995. In the same year, the NZFSS became a full member of the International Federation of Sled Dog Sports (IFSS), while it took until 1998 to be recognized by the New Zealand Kennel Club Council.',
    },
    {
      id: 3,
      image: historyMain3,
      sideImage: side3,
      title: 'Growing Dog Powered Sports (2000-2020)',
      content: 'After the birth of the NZFSS, the sport continued to grow with clubs holding large events with well over a hundred competitors. Events on Snow and on Dryland became varied with distance offered from short sprint to 100km. Other disciplines also experienced a growing interest, such as weight pull and freight. ',
      subContent: 'The increasing popularity overseas led to the development of professional sprint equipment both on dryland and on snow, offering modern and safe designs and materials for sleds, scooters, and 3- and 4-wheeled rigs.',
      subContent2: 'By 2018, interest in international events had renewed and IFSS Worldcup events on dryland are developed and hosted. New Zealand teams prominently feature both in Oceania and Globally across all dryland classes.',
    },
    {
      id: 4,
      image: historyMain4,
      sideImage: side4,
      title: 'Present Days (2020-)',
      content: 'With Climate Change becoming more noticeable, races have to adapt to warmer temperatures and higher humidity. In combination with lifestyle changes, less larger teams compete but the smaller classes, in particular one and two dog Scooter, Canicross, and Bikejoring experience a growing interest and represent the majority of entrants.',
      subContent: 'Non-arctic breeds are more suited to the warmer climate, bringing a greater variety to races. The IFSS Worldcup series continues to be held with more clubs and teams showing interest in representing New Zealand in Oceania and Globally',
    },
  ];

  // Track viewport size
  useEffect(() => {
    const updateViewportSize = () => {
      setViewportSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    
    // Initial call
    updateViewportSize();
    
    // Add event listener
    window.addEventListener('resize', updateViewportSize);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', updateViewportSize);
    };
  }, []);

  // Calculate content height on mount and resize
  useEffect(() => {
    const updateContentHeight = () => {
      const activeContent = document.getElementById(`history-content-${activeTab}`);
      if (activeContent) {
        setContentHeight(activeContent.scrollHeight);
      }
    };

    updateContentHeight();
    window.addEventListener('resize', updateContentHeight);
    
    return () => {
      window.removeEventListener('resize', updateContentHeight);
    };
  }, [activeTab]);

  // Intersection Observer to detect when component is visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting && entry.intersectionRatio >= 0.5);
      },
      {
        threshold: 0.8,
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, []);

  // Manual scroll handling
  const handleScroll = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && activeTab > 0) {
      setActiveTab(prevTab => prevTab - 1);
    } else if (direction === 'next' && activeTab < tabs.length - 1) {
      setActiveTab(prevTab => prevTab + 1);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        handleScroll('next');
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        handleScroll('prev');
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab]);

  // Add wheel event listener to the container
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isVisible) return;

    let lastScrollTime = 0;
    const scrollCooldown = 1000; // increased to 1000ms
    let consecutiveScrolls = 0;
    const scrollThreshold = 3; 
    
    const handleWheel = (e: WheelEvent) => {
      const now = Date.now();
      if (now - lastScrollTime < scrollCooldown) return;
      
      // For the last tab scrolling down, require multiple consecutive scrolls
      if (activeTab === tabs.length - 1 && e.deltaY > 0) {
        consecutiveScrolls++;
        
        // Only allow natural scroll after threshold consecutive scrolls
        if (consecutiveScrolls >= scrollThreshold) {
          consecutiveScrolls = 0; // Reset counter
          return; // Allow natural scroll
        }
      } else if (activeTab === 0 && e.deltaY < 0) {
        // For first tab scrolling up, allow natural scroll immediately
        return;
      } else {
        // Reset consecutive scrolls when not at the boundary conditions
        consecutiveScrolls = 0;
      }
      
      // For tab navigation, prevent the default scroll
      e.preventDefault();
      lastScrollTime = now;
      
      if (e.deltaY > 0) {
        handleScroll('next');
      } else {
        handleScroll('prev');
      }
    };
    
    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [activeTab, isVisible]);

  // Get transition amount based on viewport height
  const getTransitionValue = (indexDiff: number) => {
    // Smaller transition on smaller screens
    const baseValue = viewportSize.height < 768 ? 4 : 6;
    return `${indexDiff * baseValue}vh`;
  };

  return (
    <div 
      ref={containerRef} 
      className="w-full flex justify-center items-center flex-col gap-y-[24px] py-[48px] px-[16px] md:px-[48px]"
    >
      <div className="flex flex-col gap-y-[16px] md:gap-y-[24px]">
        <h3 className="text-[36px] md:text-[3.5vw] lg:text-[4vw] font-[700] leading-[1.1] md:leading-[1.1] text-center">
          Our History
        </h3>
        <p className="text-center text-[#1A1A1A] text-[18px] md:text-[1.25vw] font-[500] md:font-[600] max-w-[335px] md:max-w-[70vw] mx-auto">
          NZFSS transformed small local races into a unified, nationwide sport, driving the growth of sled dog racing and fostering community across New Zealand.
        </p>
      </div>

      {/* Content container */}
      <div 
        className="w-full relative mt-8 md:overflow-hidden"
        style={{ 
          height: viewportSize.width < 768 ? 'auto' : (contentHeight ? `${contentHeight}px` : 'auto'),
          minHeight: viewportSize.width < 768 ? 'auto' : '350px',
          maxHeight: viewportSize.width < 768 ? 'none' : '70vh',
          transition: 'height 0.3s ease-in-out',
          overflow: viewportSize.width < 768 ? 'visible' : 'hidden'
        }}
      >
        {tabs.map((tabContent, index) => (
          <div
            id={`history-content-${index}`}
            key={`history-section-${index}`}
            className="w-full md:absolute md:inset-0"
            style={{
              opacity: viewportSize.width < 768 ? 1 : (activeTab === index ? 1 : 0),
              transform: viewportSize.width < 768 ? 'none' : `translateY(${getTransitionValue(index - activeTab)})`,
              zIndex: viewportSize.width < 768 ? 'auto' : (activeTab === index ? 10 : 0),
              pointerEvents: viewportSize.width < 768 ? 'auto' : (activeTab === index ? 'auto' : 'none'),
              transition: viewportSize.width < 768 ? 'none' : 'opacity 0.8s ease, transform 0.8s ease',
              position: viewportSize.width < 768 ? 'static' : (activeTab === index ? 'relative' : 'absolute'),
              height: 'auto',
              display: viewportSize.width < 768 ? 'block' : (activeTab === index ? 'block' : 'block')
            }}
          >
            <div className="w-full flex flex-col md:flex-row md:items-start md:justify-between gap-x-[2vw]">
              {/* Mobile Layout */}
              <div className="block md:hidden px-4 mb-8">
                <h3 className="text-[25px] font-[700] leading-[1.1] mb-[12px]">
                  {tabContent.title}
                </h3>
                <div className="relative w-full aspect-square mb-[16px] rounded-[8px] overflow-hidden">
                  <Image 
                    className="object-cover" 
                    src={tabContent.image} 
                    alt={`${tabContent.title} image`}
                    fill
                    priority={index === 0}
                  />
                </div>
                <div className="pr-2">
                  <p className="text-[18px] leading-[1.3] font-[500] text-[#1A1A1A] mb-[12px]">
                    {tabContent.content}
                  </p>
                  <p className="text-[18px] leading-[1.3] font-[500] text-[#1A1A1A] mb-[12px]">
                    {tabContent.subContent}
                  </p>
                  {tabContent.subContent2 && (
                    <p className="text-[18px] leading-[1.3] font-[500] text-[#1A1A1A]">
                      {tabContent.subContent2}
                    </p>
                  )}
                </div>
              </div>

              {/* Desktop Layout */}
              <div className="hidden md:flex items-start gap-x-[2vw] w-full">
                <div className="flex items-start gap-x-[1vw] flex-1">
                  <div className="relative group">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-transparent transition-colors duration-300 group-hover:bg-gray-200" />
                    <Image 
                      className="w-auto" 
                      src={tabContent.sideImage} 
                      alt={`${tabContent.title} side image`}
                      priority={index === 0}
                    />
                  </div>
                  <div className="flex flex-col gap-y-[12px] md:gap-y-[16px] pr-4">
                    <h3 className="pl-[2vw] border-[#000000] font-[700] text-[1.7vw] md:text-[2vw] leading-[1.1] pt-2">
                      {tabContent.title}
                    </h3>
                    <p className="pl-[2vw] w-full max-w-[38vw] text-[1vw] md:text-[1.1vw] leading-[1.3] font-[500] text-[#1A1A1A]">
                      {tabContent.content}
                    </p>
                    <p className="pl-[2vw] w-full max-w-[38vw] text-[1vw] md:text-[1.1vw] leading-[1.3] font-[500] text-[#1A1A1A]">
                      {tabContent.subContent}
                    </p>
                    {tabContent.subContent2 && (
                      <p className="pl-[2vw] w-full max-w-[38vw] text-[1vw] md:text-[1.1vw] leading-[1.3] font-[500] text-[#1A1A1A]">
                        {tabContent.subContent2}
                      </p>
                    )}
                  </div>
                </div>
                <div className="w-[47.5vw] relative h-[32vw] rounded-[1.25vw] overflow-hidden ml-auto">
                  <Image 
                    className="object-contain" 
                    src={tabContent.image} 
                    alt={`${tabContent.title} main image`}
                    fill
                    priority={index === 0}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Removed pagination dots */}
    </div>
  )
}

export default History
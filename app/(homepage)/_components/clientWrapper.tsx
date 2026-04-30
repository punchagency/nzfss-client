"use client"

import dynamic from 'next/dynamic';

// Dynamic imports for client-heavy components with SSR disabled
export const SwiperSlideGroup = dynamic(() => import("./swipper"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] bg-gray-200 animate-pulse rounded-lg flex items-center justify-center">
      <div className="text-gray-500">Loading sports disciplines...</div>
    </div>
  )
});

export const History = dynamic(() => import("./history"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[600px] bg-gray-100 animate-pulse rounded-lg mx-4 flex items-center justify-center">
      <div className="text-gray-500">Loading history...</div>
    </div>
  )
});

export const VideoSection = dynamic(() => import("./videoSection"), {
  ssr: false,
  loading: () => (
    <div className="-mt-16 relative"> 
      <video 
        src="/videos/bd.mp4" 
        muted 
        loop 
        playsInline
        controls
        preload="metadata"
        className="w-full sm:w-[95vw] h-auto sm:h-[55.208vw] sm:-mt-[5vw] sm:mb-[2vw] rounded-[0.75rem] sm:rounded-[1.25vw] bg-transparent object-cover"
        poster="/images/video-poster.jpg"
      />
    </div>
  )
});

// Junior page components
export const JuniorDevelopment = dynamic(() => import("./juniorDevelopment"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] bg-gray-100 animate-pulse rounded-lg flex items-center justify-center">
      <div className="text-gray-500">Loading junior development...</div>
    </div>
  )
});

export const Peewee = dynamic(() => import("./peewee"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[500px] bg-gray-100 animate-pulse rounded-lg flex items-center justify-center">
      <div className="text-gray-500">Loading PeeWee section...</div>
    </div>
  )
});

export const JuniorClass = dynamic(() => import("./juniorClass"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[600px] bg-gray-100 animate-pulse rounded-lg flex items-center justify-center">
      <div className="text-gray-500">Loading junior class...</div>
    </div>
  )
});

export const DocumentPage = dynamic(() => import("./document"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[300px] bg-gray-100 animate-pulse rounded-lg flex items-center justify-center">
      <div className="text-gray-500">Loading documents...</div>
    </div>
  )
});

// Scroll animation component for juniors page
export const JuniorScrollAnimations = dynamic(() => import("./juniorScrollAnimations"), {
  ssr: false,
  loading: () => (
    <div className="hidden xl:flex gap-x-[0.45vw]">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="w-[14.792vw] h-[18.229vw] bg-gray-200 animate-pulse rounded-lg" />
      ))}
    </div>
  )
});

// Event Calendar components
export const EventCalendarContent = dynamic(() => import("./eventCalendarContent"), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col w-full h-full pb-[148px] bg-white min-h-screen">
      {/* Filters skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 px-8 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex flex-col gap-2">
            <div className="h-6 bg-gray-200 animate-pulse rounded w-24"></div>
            <div className="h-12 bg-gray-200 animate-pulse rounded-lg"></div>
          </div>
        ))}
      </div>
      
      {/* Events grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-6 px-8">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-64 bg-gray-200 animate-pulse rounded-lg"></div>
        ))}
      </div>
    </div>
  )
});

// History page components
export const HistoryScrollAnimations = dynamic(() => import("./historyScrollAnimations"), {
  ssr: false,
  loading: () => (
    <div className="hidden xl:flex gap-x-[0.45vw]">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="w-[14.792vw] h-[18.229vw] bg-gray-200 animate-pulse rounded-lg" />
      ))}
    </div>
  )
});

export const HistoryActionSection = dynamic(() => import("./historyActionSection"), {
  ssr: false,
  loading: () => (
    <div className="w-full flex flex-col gap-y-[48px] px-[48px]">
      <div className="h-16 bg-gray-200 animate-pulse rounded-lg"></div>
      <div className="h-12 bg-gray-200 animate-pulse rounded-lg w-96 mx-auto"></div>
      <div className="grid grid-cols-4 gap-[24px]">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="h-[15.313vw] bg-gray-200 animate-pulse rounded-lg"></div>
        ))}
      </div>
    </div>
  )
});

// IFSS page components
export const IFSSScrollAnimations = dynamic(() => import("./ifssScrollAnimations"), {
  ssr: false,
  loading: () => (
    <div className="hidden xl:flex gap-x-[0.45vw]">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="w-[14.792vw] h-[18.229vw] bg-gray-200 animate-pulse rounded-lg" />
      ))}
    </div>
  )
});

export const IFSSActionSection = dynamic(() => import("./ifssActionSection"), {
  ssr: false,
  loading: () => (
    <div className="w-full flex flex-col gap-y-[48px] mt-[96px]">
      <div className="h-16 bg-gray-200 animate-pulse rounded-lg"></div>
      <div className="h-12 bg-gray-200 animate-pulse rounded-lg w-96 mx-auto"></div>
      <div className="grid grid-cols-4 gap-[24px]">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="h-[15.313vw] bg-gray-200 animate-pulse rounded-lg"></div>
        ))}
      </div>
    </div>
  )
}); 
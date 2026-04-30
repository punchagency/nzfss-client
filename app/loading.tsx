'use client';

export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f3f3f3]">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-black"></div>
      <p className="mt-4 text-gray-600">Loading...</p>
    </div>
  );
} 
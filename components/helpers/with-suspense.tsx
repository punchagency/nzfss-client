"use client";

import { ReactNode, Suspense } from "react";

/**
 * Wraps any component that uses useSearchParams in a Suspense boundary
 * to prevent Next.js warnings about missing Suspense boundaries.
 * 
 * @param Component The component to wrap
 * @param fallback Optional fallback UI to show while component is loading
 * @returns The wrapped component with Suspense
 */
export function withSuspense<P extends object>(
  Component: React.ComponentType<P>,
  fallback: ReactNode = null
) {
  return function WithSuspense(props: P) {
    return (
      <Suspense fallback={fallback}>
        <Component {...props} />
      </Suspense>
    );
  };
}

/**
 * Default loading fallback that can be used with the withSuspense HOC
 * when wrapping search-related components.
 */
export function SearchLoadingFallback() {
  return (
    <div className="h-[48px] w-full border rounded-[16px] px-4 flex gap-x-[8px] items-center">
      <div className="animate-pulse bg-gray-200 h-6 w-full rounded"></div>
    </div>
  );
} 
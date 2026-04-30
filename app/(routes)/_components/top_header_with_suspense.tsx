"use client";

import { Suspense } from "react";
import TopHeader from "./top_header";
import { withSuspense, SearchLoadingFallback } from "@/components/helpers/with-suspense";

/**
 * A version of TopHeader wrapped in a Suspense boundary to handle useSearchParams safely
 */
interface TopHeaderProps {
  placeholder: string;
}

/**
 * TopHeader component wrapped with Suspense
 * Use this component instead of TopHeader directly when rendering in a client component
 */
const TopHeaderWithSuspense: React.FC<TopHeaderProps> = ({ placeholder }) => {
  return (
    <Suspense fallback={<SearchLoadingFallback />}>
      <TopHeader 
        placeholder={placeholder}
      />
    </Suspense>
  );
};

export default TopHeaderWithSuspense;

/**
 * Alternative implementation using the withSuspense HOC
 */
export const EnhancedTopHeader = withSuspense(TopHeader, <SearchLoadingFallback />); 
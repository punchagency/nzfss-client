"use client";

import { useEffect, useRef } from 'react';

interface AutoRefreshOnStuckProps {
  /**
   * Time in milliseconds to wait before mandatory refresh (default: 1000ms)
   */
  refreshDelay?: number;
  /**
   * Whether to enable debug logging
   */
  debug?: boolean;
}

/**
 * Component that automatically refreshes the page once after a delay
 * Should be placed in layout or page components that might get stuck after auth redirect
 */
export function AutoRefreshOnStuck({
  refreshDelay = 1000,
  debug = false
}: AutoRefreshOnStuckProps) {
  const hasRefreshed = useRef(false);

  useEffect(() => {
    // Only run this refresh once per page load
    if (hasRefreshed.current) return;
    
    const log = debug ? console.log : () => {};
    
    log("AutoRefreshOnStuck: Setting up mandatory refresh");

    // Check if this page was already refreshed to prevent infinite loops
    const wasRefreshed = sessionStorage.getItem('page_was_refreshed');
    const currentPath = window.location.pathname + window.location.search;
    
    if (wasRefreshed === currentPath) {
      log("AutoRefreshOnStuck: Page was already refreshed, skipping");
      // Clean up the flag after successful load
      try {
        sessionStorage.removeItem('page_was_refreshed');
        sessionStorage.removeItem('pending_redirect');
      } catch (e) {}
      return;
    }

    // Mark that we're about to refresh and set a flag
    hasRefreshed.current = true;

    const refreshTimer = setTimeout(() => {
      log("AutoRefreshOnStuck: Executing mandatory refresh");
      
      try {
        // Mark that we've refreshed this page to prevent infinite loops
        sessionStorage.setItem('page_was_refreshed', currentPath);
        
        // Clear any pending redirect info since we're handling it
        sessionStorage.removeItem('pending_redirect');
      } catch (e) {
        log("AutoRefreshOnStuck: Error setting refresh flag:", e);
      }
      
      // Force a hard refresh
      window.location.reload();
    }, refreshDelay);

    // Cleanup function
    return () => {
      clearTimeout(refreshTimer);
    };
  }, [refreshDelay, debug]);

  // This component doesn't render anything
  return null;
}

export default AutoRefreshOnStuck; 
"use client"

import React from 'react'
import Header from './header'
import { usePathname, useSearchParams } from 'next/navigation';
import { withSuspense } from "@/components/helpers/with-suspense";

const NavbarContent = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isAddingResult = searchParams.get("adding_result") === "true";
  
  let headerProps;

  // Helper to check if pathname includes a specific route
  const isRoute = (route: string) => pathname === route || pathname === `/dashboard${route}` || pathname.endsWith(route);
  const isDashboardFormsRoute = pathname === '/dashboard/forms' || pathname.includes('/dashboard/forms');
  const isClubPage = pathname === '/' || pathname === '/dashboard' || pathname === '/dashboard/';

  if (isClubPage) {
    headerProps = {
      header: 'Club',
      sub: 'Information and management of NZFSS Clubs.',
      btn: '+ Add a Club',
    };
  } else if (isRoute('/yearbook') || pathname.includes('/dashboard/yearbook')) {
    headerProps = {
      header: 'Year book',
      sub: 'Management of the NZFSS Yearbook. Expected file format is PDF for all yearbooks.',
      btn: 'Upload New ',
    };
  } else if (isRoute('/forms') || isDashboardFormsRoute) {
    headerProps = {
      header: 'Forms',
      sub: 'Management of NZFSS Forms and Applications.',
      btn: 'Upload New ',
    };
  } else if (isRoute('/rules') || pathname.includes('/dashboard/rules')) {
    headerProps = {
      header: 'Rules',
      sub: 'Management of NZFSS Rules.',
      btn: '+ Add New Rule',
    };
  } else if (isRoute('/calendar') || pathname.includes('/dashboard/calendar') || pathname === '/calendar') {
    headerProps = {
      header: 'Calendar',
      sub: 'NZFSS Race Calendar Management. Clubs propose events in the "Event Information" and manage events through the "Draft Calendar"',
      btn: '+ Add New Event',
    };
  } else if (isRoute('/events')) {
    if (isAddingResult) {
      headerProps = {
        header: 'Results',
        sub: 'Add and manage race results for NZFSS events.',
        btn: '+ Add New Race Event',
      };
    } else {
      headerProps = {
        header: 'Events',
        sub: 'Management of Club Events. Prepare Events in the Draft tab and submit to NZFSS. Monitor and add Race Results in the Submitted tab.',
        btn: '+ Add New Race Event',
      };
    }
  } else if (pathname.startsWith("/events/")) {
    headerProps = {
      header: 'Add Result',
      sub: '',
      btn: 'Saved',
    };
  } else {
    headerProps = {
      header: '',
      sub: '',
      btn: '',
    };
  }

  return (
    <div className='bg-[#F3F3F3] mx-6 rounded-t-[24px]'>
        <Header
        {...headerProps}
        />
    </div>
  )
}

// Create a suspense-wrapped version of the component
const NavbarWithSuspense = withSuspense(NavbarContent, 
  <div className="h-16 bg-gray-100 animate-pulse" />
);

// Export the wrapped version
export default NavbarWithSuspense;
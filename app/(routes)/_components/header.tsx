"use client";

import { usePathname } from "next/navigation";
import ClubTrigger from "./triggers/club_trigger";
import YourbookTrigger from "./triggers/yourbook_trigger";
import FormTrigger from "./triggers/form_trigger";
import RulesTrigger from "./triggers/rules_trigger";
import CalenderTrigger from "./triggers/calender_trigger";
import ContactTrigger from "./triggers/contact_trigger";
import Image from "next/image";
import { arrowLeft } from "@/assets";

interface HeaderProps {
  header: string;
  sub: string;
  btn: string;
}

const Header = ({ header, sub, btn }: HeaderProps) => {
  const pathname = usePathname();
  
  // Helper to check if pathname includes a specific route
  const isRoute = (route: string) => pathname === route || pathname === `/dashboard${route}` || pathname.endsWith(route);
  const isClubPage = pathname === '/' || pathname === '/dashboard' || pathname === '/dashboard/';
  
  return (
    <div className="p-4 md:p-6 flex justify-between items-center min-h-[110px] leading-normal">
      <div className="flex flex-col">
        <h3 className="font-[700] text-[1.458vw] mb-2 mt-2 flex items-center">
          {pathname.startsWith("/events/") && (
            <Image 
              src={arrowLeft}
              alt="arrow icon"
              className="mr-2 w-5 h-5"
            />
          )}
          {header}
        </h3>
        <p className="font-medium text-[0.938vw] text-[#4F4F4F]">
          {sub}
        </p>
      </div>

      {isClubPage && <ClubTrigger btn={btn} />}
      {(isRoute('/yearbook') || pathname.includes('/dashboard/yearbook')) && <YourbookTrigger btn={btn} />}
      {(isRoute('/forms') || pathname.includes('/dashboard/forms')) && <FormTrigger btn={btn} />}
      {(isRoute('/rules') || pathname.includes('/dashboard/rules')) && <RulesTrigger btn={btn} />}
      {(isRoute('/calendar') || pathname.includes('/dashboard/calendar') || pathname.startsWith("/calendar/")) && <CalenderTrigger btn={btn} />}
      {(isRoute('/events') || pathname.startsWith("/events/")) && <CalenderTrigger btn={btn} />}
      {isRoute('/contact') && <ContactTrigger btn={btn} />}
    </div>
  );
};

export default Header;

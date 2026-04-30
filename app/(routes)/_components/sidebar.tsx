"use client";

import { logo } from "@/assets";
import Image from "next/image";
import SidebarRoutes from "./sidebar/page";
import Title from "./title";
import Link from "next/link";

export const Sidebar = () => {
  return (
    <div className="h-full flex overflow-hidden">
      <div className="h-full flex flex-col w-[20vw] min-w-[180px] max-w-[300px] sm:w-[18vw] md:w-[16vw]">
        <div className="flex-1 overflow-y-auto sm:overflow-y-auto md:overflow-y-visible lg:overflow-y-visible xl:overflow-y-visible 2xl:overflow-y-visible sidebar-scrollbar pr-1 overflow-x-hidden">
          <div className="px-[0.8vw] py-[0.2vw] flex flex-col min-h-0 w-full">
            {/* side button  */}
            <div className="flex flex-col gap-y-[0.4vw]">
              <div className="flex-shrink-0 pt-6 pb-2">
                <Link href={"/home"}>
                  <Image
                    width={42}
                    height={42}
                    className="object-contain w-[3vw] h-[3vw] min-w-[30px] min-h-[30px] sm:w-[2.5vw] sm:h-[2.5vw]"
                    src={logo}
                    alt="Logo"
                    priority
                  />
                </Link>
              </div>

              <Title />

              <div className="flex flex-col w-full mt-[0.2vw]">
                <SidebarRoutes />
              </div>
            </div>
          </div>
        </div>

        {/* Logout button  */}
        <div className="flex-shrink-0 px-[0.8vw] pb-4 pt-2 mt-0">
          <Link 
            href="/login" 
            className="instant-anim block w-[87%] h-[3vw] flex items-center justify-center   max-w-[1000px] ml-0 px-3 py-3 border border-[#00000055] rounded-[16px] font-medium text-center text-[0.8rem] sm:text-sm text-[#000000] hover:bg-black hover:text-white shadow-sm hover:shadow-md transition-shadow whitespace-nowrap overflow-hidden text-ellipsis"
          >
            Log Out
          </Link>
        </div>
      </div>
      <div className="flex-grow"></div>
    </div>
  );
};

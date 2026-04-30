"use client";

import React, { useEffect, useState } from "react";
import { Sidebar } from "@/app/(routes)/_components/sidebar";
import Navbar from "../_components/navbar"; 
import TopHeader from "../_components/top_header"; 
import Tab from "../_components/tab"; 
import { usePathname, useRouter } from "next/navigation";
import TabContextProvider from "@/context/tab_context";
import { useUser } from "@/context/user_context";
import tabs from "@/utils/admin_tab.json";


const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const { user } = useUser();
 
  const pathname = usePathname();
  const isCalendar = pathname === "/dashboard/calendar";

  const [searchQuery, setSearchQuery] = useState("");
  console.log(searchQuery,"searchQuery")

  useEffect(() => {
    // Only perform the redirection logic once the component has mounted
    if (user && user.role === "CLUB") {
      router.push("/events");
    }
  }, [user, router]);
  
  return (
    <TabContextProvider>
      <div className="h-full">
        <div className=" md:pl-[284px] w-full z-50">
          <TopHeader 
            placeholder="Search..."
          />
          <Navbar />
          {isCalendar && <Tab tabs={tabs} />}
        </div>
        <div className="hidden md:flex h-full  flex-col fixed inset-y-0 z-50">
          <Sidebar />
        </div>

        <main className="flex-1 md:pl-[285px] " data-testid="main-content">{children}</main>
      </div>
    </TabContextProvider>
  );
};

export default DashboardLayout;

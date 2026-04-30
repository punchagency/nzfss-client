import React from "react";
import routesClub from '@/utils/sidebarRoutes.json'
import routesEvent from '@/utils/sidebarEventRoutes.json'
import SidebarItem from "./sidebar_item";
import { usePathname } from "next/navigation";

interface Route {
  id: string;
  label: string;
  href: string;
}

const SidebarRoutes = () => {
  const pathname = usePathname();
  const routes: Route[] = pathname === "/events" || pathname.startsWith("/events/")
    ? (routesEvent as Route[])
    : (routesClub as Route[]);

  return (
    <div className="h-full flex flex-col md:gap-y-[10px] 2xl:gap-y-[16px] 3xl:gap-y-[32px]">
        {
            routes.map((route: Route) => (
                <SidebarItem
                key={route.id}
                id={route.id}
                label={route.label}
                href={route.href}
                />
            ))
        }
    </div>
    
  );
};

export default SidebarRoutes;
